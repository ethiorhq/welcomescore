export type Check = {
  label: string;
  passed: boolean;
  points: number;
  maxPoints?: number;
};

export type GoodFirstIssue = {
  title: string;
  url: string;
};

export type ScoreResult = {
  repo: string;
  score: number;
  grade: string;
  checks: Check[];
  defaultBranch: string;
  starsCount: number;
  forksCount: number;
  primaryLanguage: string;
  hasReadme: boolean;
  hasLicense: boolean;
  isEligibleForLeaderboard: boolean;
  goodFirstIssueCount: number;
  goodFirstIssues: GoodFirstIssue[];
};

type GitHubRepository = {
  license: unknown | null;
  pushed_at: string | null;
  default_branch: string;
  stargazers_count: number | null;
  forks_count: number | null;
  language: string | null;
};

type GitHubFile = {
  name: string;
};

type GitHubReadme = {
  content?: string;
  encoding?: string;
};

type GitHubIssue = {
  title: string;
  html_url: string;
};

type GitHubIssueSearch = {
  total_count?: number;
  items?: GitHubIssue[];
};

export type ScoreRepoErrorCode =
  | "not-found"
  | "rate-limit"
  | "upstream-error";

export class ScoreRepoError extends Error {
  constructor(
    public readonly code: ScoreRepoErrorCode,
    public readonly status: number,
  ) {
    super(code);
    this.name = "ScoreRepoError";
  }
}

const GITHUB_API = "https://api.github.com";
const CACHE_OPTIONS = { next: { revalidate: 300 } };
const repositorySegment = /^[A-Za-z0-9_.-]+$/;

export async function scoreRepo(
  owner: string,
  repo: string,
): Promise<ScoreResult> {
  const apiPath = `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
  const repositoryResponse = await githubFetch(`${GITHUB_API}${apiPath}`);

  if (repositoryResponse.status === 404) {
    throw new ScoreRepoError("not-found", 404);
  }

  if (isRateLimited(repositoryResponse)) {
    throw new ScoreRepoError("rate-limit", 429);
  }

  if (!repositoryResponse.ok) {
    throw new ScoreRepoError("upstream-error", 502);
  }

  const repository = (await repositoryResponse.json()) as GitHubRepository;
  const issueQuery = [
    `repo:${owner}/${repo}`,
    "is:issue",
    "is:open",
    'label:"good first issue","good-first-issue","help wanted","beginner friendly"',
  ].join(" ");
  const issueSearchUrl = new URL(`${GITHUB_API}/search/issues`);
  issueSearchUrl.searchParams.set("q", issueQuery);

  const [contentsResponse, readmeResponse, issuesResponse] = await Promise.all([
    githubFetch(`${GITHUB_API}${apiPath}/contents/`),
    githubFetch(`${GITHUB_API}${apiPath}/readme`),
    githubFetch(issueSearchUrl.toString()),
  ]);

  if ([contentsResponse, readmeResponse, issuesResponse].some(isRateLimited)) {
    throw new ScoreRepoError("rate-limit", 429);
  }

  if (
    !isAllowedOptionalResponse(contentsResponse) ||
    !isAllowedOptionalResponse(readmeResponse) ||
    !issuesResponse.ok
  ) {
    throw new ScoreRepoError("upstream-error", 502);
  }

  const files = contentsResponse.ok
    ? ((await contentsResponse.json()) as GitHubFile[])
    : [];
  const readme = readmeResponse.ok
    ? ((await readmeResponse.json()) as GitHubReadme)
    : null;
  const issueSearch = (await issuesResponse.json()) as GitHubIssueSearch;

  const fileNames = new Set(files.map((file) => file.name.toLowerCase()));
  const hasContributingGuide = fileNames.has("contributing.md");
  const hasCodeOfConduct = fileNames.has("code_of_conduct.md");
  const hasReadme = fileNames.has("readme.md");
  const hasReadmeSetup = readme ? readmeHasSetupSection(readme) : false;
  const hasLicense = repository.license !== null;
  const starsCount = Math.max(0, repository.stargazers_count ?? 0);
  const forksCount = Math.max(0, repository.forks_count ?? 0);
  const primaryLanguage = repository.language ?? "Unknown";
  const beginnerIssueCount = Math.max(0, issueSearch.total_count ?? 0);
  const goodFirstIssues = (issueSearch.items ?? []).slice(0, 5).map((issue) => ({
    title: issue.title,
    url: issue.html_url,
  }));
  const beginnerIssuePoints = Math.round(
    (Math.min(beginnerIssueCount, 10) / 10) * 25,
  );
  const isRecentlyActive = wasPushedWithinThreeMonths(repository.pushed_at);

  const checks: Check[] = [
    {
      label: "CONTRIBUTING.md",
      passed: hasContributingGuide,
      points: hasContributingGuide ? 20 : 0,
    },
    {
      label: "CODE_OF_CONDUCT.md",
      passed: hasCodeOfConduct,
      points: hasCodeOfConduct ? 15 : 0,
    },
    {
      label: "README setup section",
      passed: hasReadmeSetup,
      points: hasReadmeSetup ? 15 : 0,
    },
    {
      label: "LICENSE",
      passed: hasLicense,
      points: hasLicense ? 10 : 0,
    },
    {
      label: "Good-first-issue labels",
      passed: beginnerIssuePoints > 0,
      points: beginnerIssuePoints,
      maxPoints: 25,
    },
    {
      label: "Recently active",
      passed: isRecentlyActive,
      points: isRecentlyActive ? 15 : 0,
    },
  ];

  const score = checks.reduce((total, check) => total + check.points, 0);
  const isEligibleForLeaderboard =
    score >= 75 &&
    (starsCount >= 5 || forksCount >= 2) &&
    hasReadme &&
    hasLicense;

  return {
    repo: `${owner}/${repo}`,
    score,
    grade: gradeForScore(score),
    checks,
    defaultBranch: repository.default_branch,
    starsCount,
    forksCount,
    primaryLanguage,
    hasReadme,
    hasLicense,
    isEligibleForLeaderboard,
    goodFirstIssueCount: beginnerIssueCount,
    goodFirstIssues,
  };
}

export function parseRepository(value: string) {
  const trimmed = value.trim();
  const shorthandMatch = trimmed.match(/^([^/]+)\/([^/]+)$/);

  if (
    shorthandMatch &&
    repositorySegment.test(shorthandMatch[1]) &&
    repositorySegment.test(shorthandMatch[2])
  ) {
    return { owner: shorthandMatch[1], repo: shorthandMatch[2] };
  }

  try {
    const url = new URL(trimmed);
    const segments = url.pathname.split("/").filter(Boolean);

    if (
      (url.protocol === "https:" || url.protocol === "http:") &&
      (url.hostname === "github.com" || url.hostname === "www.github.com") &&
      segments.length === 2 &&
      repositorySegment.test(segments[0]) &&
      repositorySegment.test(segments[1])
    ) {
      return { owner: segments[0], repo: segments[1].replace(/\.git$/, "") };
    }
  } catch {
    return null;
  }

  return null;
}

function githubFetch(url: string) {
  const headers = new Headers({
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  });

  if (process.env.GITHUB_TOKEN) {
    headers.set("Authorization", `Bearer ${process.env.GITHUB_TOKEN}`);
  }

  return fetch(url, { headers, ...CACHE_OPTIONS });
}

function isRateLimited(response: Response) {
  return response.status === 403 || response.status === 429;
}

function isAllowedOptionalResponse(response: Response) {
  return response.ok || response.status === 404;
}

function readmeHasSetupSection(readme: GitHubReadme) {
  if (!readme.content || readme.encoding !== "base64") {
    return false;
  }

  const content = decodeBase64(readme.content.replace(/\s/g, ""));

  return /^#{1,6}\s+.*(?:install|setup|getting started|quick start)/im.test(
    content,
  );
}

function decodeBase64(value: string) {
  const binary = atob(value);
  const bytes = Uint8Array.from(binary, (character) =>
    character.charCodeAt(0),
  );

  return new TextDecoder().decode(bytes);
}

function wasPushedWithinThreeMonths(pushedAt: string | null) {
  if (!pushedAt) {
    return false;
  }

  const pushedDate = new Date(pushedAt);
  const threshold = new Date();
  threshold.setMonth(threshold.getMonth() - 3);

  return !Number.isNaN(pushedDate.getTime()) && pushedDate >= threshold;
}

function gradeForScore(score: number) {
  if (score >= 90) return "A";
  if (score >= 75) return "B";
  if (score >= 60) return "C";
  if (score >= 40) return "D";
  return "F";
}

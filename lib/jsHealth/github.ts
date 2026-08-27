import { parseRepository, ScoreRepoError } from "@/lib/scoreRepo";
import type { JsHealthSnapshot } from "./types";

const GITHUB_API = "https://api.github.com";
const CACHE_OPTIONS = { next: { revalidate: 300 } };
const WORKFLOW_LIMIT = 12;
const WORKFLOW_CONTENT_LIMIT = 64_000;

type GitHubRepository = {
  default_branch?: string;
  name?: string;
};

type GitHubTree = {
  tree?: Array<{ path?: string; type?: string }>;
};

type GitHubContent = {
  content?: string;
  encoding?: string;
};

type GitHubLabel = {
  name?: string;
};

export async function readGitHubJsHealthSnapshot(reference: string): Promise<JsHealthSnapshot> {
  const parsed = parseRepository(reference);
  if (!parsed) {
    throw new ScoreRepoError("not-found", 404);
  }
  const repository = `${parsed.owner}/${parsed.repo}`;
  const basePath = `${GITHUB_API}/repos/${encodeURIComponent(parsed.owner)}/${encodeURIComponent(parsed.repo)}`;
  const repositoryResponse = await githubFetch(basePath);
  if (repositoryResponse.status === 404) {
    throw new ScoreRepoError("not-found", 404);
  }
  if (isRateLimited(repositoryResponse)) {
    throw new ScoreRepoError("rate-limit", 429);
  }
  if (!repositoryResponse.ok) {
    throw new ScoreRepoError("upstream-error", 502);
  }

  const repositoryPayload = await repositoryResponse.json() as GitHubRepository;
  const branch = repositoryPayload.default_branch || "main";
  const [treeResponse, packageResponse, labelsResponse] = await Promise.all([
    githubFetch(`${basePath}/git/trees/${encodeURIComponent(branch)}?recursive=1`),
    githubFetch(`${basePath}/contents/package.json?ref=${encodeURIComponent(branch)}`),
    githubFetch(`${basePath}/labels?per_page=100`),
  ]);
  if ([treeResponse, packageResponse, labelsResponse].some(isRateLimited)) {
    throw new ScoreRepoError("rate-limit", 429);
  }
  if (!treeResponse.ok || !isOptionalPublicResponse(packageResponse) || !isOptionalPublicResponse(labelsResponse)) {
    throw new ScoreRepoError("upstream-error", 502);
  }

  const tree = await treeResponse.json() as GitHubTree;
  const paths = (tree.tree ?? [])
    .filter((entry) => entry.type === "blob" && typeof entry.path === "string")
    .map((entry) => entry.path!);
  const workflowPaths = paths
    .filter((entry) => entry.toLowerCase().startsWith(".github/workflows/") && /\.ya?ml$/i.test(entry))
    .slice(0, WORKFLOW_LIMIT);
  const [packageJson, workflowContent, labels] = await Promise.all([
    decodePackageJson(packageResponse),
    readWorkflowContent(basePath, branch, workflowPaths),
    readLabels(labelsResponse),
  ]);

  return {
    subject: {
      kind: "github",
      name: repositoryPayload.name || repository,
      repository,
    },
    packageJson,
    paths,
    workflowNames: workflowPaths,
    workflowContent,
    hasStarterIssueLabel: labels
      ? labels.some((label) => /^(good first issue|good-first-issue|beginner friendly)$/i.test(label))
      : null,
  };
}

async function decodePackageJson(response: Response) {
  if (!response.ok) {
    return null;
  }
  const payload = await response.json() as GitHubContent;
  if (!payload.content || payload.encoding !== "base64") {
    return null;
  }
  try {
    const decoded = decodeBase64(payload.content);
    const parsed = JSON.parse(decoded) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed as Record<string, unknown>
      : null;
  } catch {
    return null;
  }
}

async function readWorkflowContent(basePath: string, branch: string, workflowPaths: string[]) {
  const content = await Promise.all(workflowPaths.map(async (workflowPath) => {
    const response = await githubFetch(`${basePath}/contents/${workflowPath.split("/").map(encodeURIComponent).join("/")}?ref=${encodeURIComponent(branch)}`);
    if (!response.ok) {
      return "";
    }
    const payload = await response.json() as GitHubContent;
    if (!payload.content || payload.encoding !== "base64") {
      return "";
    }
    return decodeBase64(payload.content).slice(0, WORKFLOW_CONTENT_LIMIT);
  }));
  return content;
}

async function readLabels(response: Response) {
  if (!response.ok) {
    return null;
  }
  const payload = await response.json() as GitHubLabel[];
  return payload.map((label) => label.name).filter((name): name is string => typeof name === "string");
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

function decodeBase64(value: string) {
  return Buffer.from(value.replace(/\n/g, ""), "base64").toString("utf8");
}

function isRateLimited(response: Response) {
  return response.status === 403 || response.status === 429;
}

function isOptionalPublicResponse(response: Response) {
  return response.ok || response.status === 404;
}

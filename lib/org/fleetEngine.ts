/**
 * Multi-Repo Fleet Cockpit Engine for GitHub Organizations
 * Part of ETHIOR WelcomeScore - All-in-One DevOps & DevEx Intelligence
 */

export interface RepoFleetSummary {
  name: string;
  fullName: string;
  description: string | null;
  starsCount: number;
  forksCount: number;
  language: string | null;
  score: number;
  grade: "A+" | "A" | "B" | "C" | "D" | "F";
  lastPushedAt: string | null;
  isStale: boolean;
  missingKeyFiles: string[];
}

export interface OrgFleetReport {
  orgName: string;
  totalRepos: number;
  fleetAverageScore: number;
  fleetGrade: "A+" | "A" | "B" | "C" | "D" | "F";
  gradeDistribution: Record<"A+" | "A" | "B" | "C" | "D" | "F", number>;
  totalStars: number;
  totalForks: number;
  staleRepoCount: number;
  topPerformers: RepoFleetSummary[];
  criticalAttentionRequired: RepoFleetSummary[];
  repos: RepoFleetSummary[];
}

export interface RawOrgRepoInput {
  name: string;
  full_name: string;
  description?: string | null;
  stargazers_count?: number;
  forks_count?: number;
  language?: string | null;
  pushed_at?: string | null;
  has_issues?: boolean;
  open_issues_count?: number;
  license?: { spdx_id?: string } | null;
}

/**
 * Calculates a quick baseline score for an org repository based on public signals
 */
export function estimateRepoScore(repo: RawOrgRepoInput): {
  score: number;
  grade: "A+" | "A" | "B" | "C" | "D" | "F";
  isStale: boolean;
  missingFiles: string[];
} {
  let score = 30; // base score
  const missingFiles: string[] = [];

  // License presence
  if (repo.license && repo.license.spdx_id) {
    score += 25;
  } else {
    missingFiles.push("LICENSE");
  }

  // Description & metadata presence
  if (repo.description && repo.description.trim().length > 10) {
    score += 15;
  }

  // Community adoption signals
  const stars = repo.stargazers_count ?? 0;
  if (stars >= 50) {
    score += 15;
  } else if (stars >= 5) {
    score += 10;
  }

  // Recent maintenance signals
  let isStale = false;
  if (repo.pushed_at) {
    const pushedDate = new Date(repo.pushed_at);
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    if (!isNaN(pushedDate.getTime()) && pushedDate >= threeMonthsAgo) {
      score += 15;
    } else {
      isStale = true;
    }
  } else {
    isStale = true;
  }

  const finalScore = Math.min(100, Math.max(0, score));

  const grade: "A+" | "A" | "B" | "C" | "D" | "F" =
    finalScore >= 95
      ? "A+"
      : finalScore >= 85
        ? "A"
        : finalScore >= 75
          ? "B"
          : finalScore >= 60
            ? "C"
            : finalScore >= 45
              ? "D"
              : "F";

  return {
    score: finalScore,
    grade,
    isStale,
    missingFiles,
  };
}

/**
 * Aggregates a fleet of organization repositories into an OrgFleetReport
 */
export function aggregateOrgFleet(
  orgName: string,
  rawRepos: RawOrgRepoInput[],
): OrgFleetReport {
  if (rawRepos.length === 0) {
    return {
      orgName,
      totalRepos: 0,
      fleetAverageScore: 0,
      fleetGrade: "F",
      gradeDistribution: { "A+": 0, A: 0, B: 0, C: 0, D: 0, F: 0 },
      totalStars: 0,
      totalForks: 0,
      staleRepoCount: 0,
      topPerformers: [],
      criticalAttentionRequired: [],
      repos: [],
    };
  }

  const gradeDist: Record<"A+" | "A" | "B" | "C" | "D" | "F", number> = {
    "A+": 0,
    A: 0,
    B: 0,
    C: 0,
    D: 0,
    F: 0,
  };

  let totalScore = 0;
  let totalStars = 0;
  let totalForks = 0;
  let staleCount = 0;

  const fleetSummaries: RepoFleetSummary[] = rawRepos.map((repo) => {
    const est = estimateRepoScore(repo);
    gradeDist[est.grade]++;
    totalScore += est.score;
    totalStars += repo.stargazers_count ?? 0;
    totalForks += repo.forks_count ?? 0;
    if (est.isStale) staleCount++;

    return {
      name: repo.name,
      fullName: repo.full_name || `${orgName}/${repo.name}`,
      description: repo.description || null,
      starsCount: repo.stargazers_count ?? 0,
      forksCount: repo.forks_count ?? 0,
      language: repo.language || null,
      score: est.score,
      grade: est.grade,
      lastPushedAt: repo.pushed_at || null,
      isStale: est.isStale,
      missingKeyFiles: est.missingFiles,
    };
  });

  const fleetAvg = Math.round(totalScore / fleetSummaries.length);
  const fleetGrade: OrgFleetReport["fleetGrade"] =
    fleetAvg >= 95
      ? "A+"
      : fleetAvg >= 85
        ? "A"
        : fleetAvg >= 75
          ? "B"
          : fleetAvg >= 60
            ? "C"
            : fleetAvg >= 45
              ? "D"
              : "F";

  // Sort by stars descending for top performers
  const sortedByStars = [...fleetSummaries].sort((a, b) => b.starsCount - a.starsCount);
  const topPerformers = sortedByStars.slice(0, 5);

  // Sort by score ascending for critical attention
  const criticalAttentionRequired = [...fleetSummaries]
    .filter((r) => r.score < 70)
    .sort((a, b) => a.score - b.score)
    .slice(0, 5);

  return {
    orgName,
    totalRepos: fleetSummaries.length,
    fleetAverageScore: fleetAvg,
    fleetGrade,
    gradeDistribution: gradeDist,
    totalStars,
    totalForks,
    staleRepoCount: staleCount,
    topPerformers,
    criticalAttentionRequired,
    repos: fleetSummaries,
  };
}

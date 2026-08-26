import { ScoreResult } from "@/lib/scoreRepo";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_KEY;
const LEADERBOARD_TABLE = "repo_evaluations";
const FRESH_DAYS = 7;
const STALE_DAYS = 30;

export type EvaluationFreshness = "fresh" | "stale" | "expired";

export type LeaderboardEntry = {
  id: string;
  repoOwner: string;
  repoName: string;
  repoPath: string;
  score: number;
  grade: string;
  primaryLanguage: string;
  starsCount: number;
  forksCount: number;
  roastText: string | null;
  isEligibleForLeaderboard: boolean;
  evaluatedAt: string;
  updatedAt: string;
  freshness: EvaluationFreshness;
};

type RepoEvaluationRow = {
  id: string;
  repo_owner: string;
  repo_name: string;
  repo_path: string;
  score: number;
  grade: string;
  primary_language: string | null;
  stars_count: number;
  forks_count: number;
  roast_text: string | null;
  is_eligible_for_leaderboard: boolean;
  evaluated_at: string;
  updated_at: string;
};

type EvaluationMetrics = {
  starsCount: number;
  forksCount: number;
  primaryLanguage: string;
  hasReadme: boolean;
  hasLicense: boolean;
};

export function isLeaderboardStoreConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_SERVICE_KEY);
}

export function leaderboardFreshness(updatedAt: string): EvaluationFreshness {
  const ageInDays = (Date.now() - new Date(updatedAt).getTime()) / 86_400_000;

  if (!Number.isFinite(ageInDays) || ageInDays > STALE_DAYS) {
    return "expired";
  }

  return ageInDays > FRESH_DAYS ? "stale" : "fresh";
}

export function isEligibleForLeaderboard(
  result: ScoreResult,
  metrics: EvaluationMetrics,
) {
  return (
    result.score >= 75 &&
    (metrics.starsCount >= 5 || metrics.forksCount >= 2) &&
    metrics.hasReadme &&
    metrics.hasLicense
  );
}

export async function persistEvaluation(
  result: ScoreResult,
  metrics: EvaluationMetrics,
) {
  if (!isLeaderboardStoreConfigured()) {
    return null;
  }

  const [repoOwner, repoName] = result.repo.split("/");
  const isEligible = isEligibleForLeaderboard(result, metrics);
  const payload = {
    repo_owner: repoOwner,
    repo_name: repoName,
    repo_path: result.repo,
    score: result.score,
    grade: result.grade,
    primary_language: metrics.primaryLanguage || "Unknown",
    stars_count: metrics.starsCount,
    forks_count: metrics.forksCount,
    roast_text: buildCommunityRoast(result, metrics),
    is_eligible_for_leaderboard: isEligible,
    evaluated_at: new Date().toISOString(),
  };

  const response = await supabaseRequest(
    `/rest/v1/${LEADERBOARD_TABLE}?on_conflict=repo_path`,
    {
      method: "POST",
      headers: {
        Prefer: "resolution=merge-duplicates,return=representation",
      },
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    throw new Error(`Leaderboard upsert failed with status ${response.status}`);
  }

  const rows = (await response.json()) as RepoEvaluationRow[];
  return rows[0] ? toLeaderboardEntry(rows[0]) : null;
}

export async function getLeaderboardEntry(repoPath: string) {
  if (!isLeaderboardStoreConfigured()) {
    return null;
  }

  const query = new URLSearchParams({
    select:
      "id,repo_owner,repo_name,repo_path,score,grade,primary_language,stars_count,forks_count,roast_text,is_eligible_for_leaderboard,evaluated_at,updated_at",
    repo_path: `eq.${repoPath}`,
    is_eligible_for_leaderboard: "eq.true",
    limit: "1",
  });
  const response = await supabaseRequest(
    `/rest/v1/${LEADERBOARD_TABLE}?${query.toString()}`,
  );

  if (!response.ok) {
    throw new Error(`Leaderboard entry lookup failed with status ${response.status}`);
  }

  const rows = (await response.json()) as RepoEvaluationRow[];
  return rows[0] ? toLeaderboardEntry(rows[0]) : null;
}

export async function getLeaderboard(limit = 50) {
  if (!isLeaderboardStoreConfigured()) {
    return [] as LeaderboardEntry[];
  }

  const cappedLimit = Math.min(Math.max(limit, 1), 50);
  const query = new URLSearchParams({
    select:
      "id,repo_owner,repo_name,repo_path,score,grade,primary_language,stars_count,forks_count,roast_text,is_eligible_for_leaderboard,evaluated_at,updated_at",
    is_eligible_for_leaderboard: "eq.true",
    order: "score.desc,stars_count.desc,updated_at.desc",
    limit: String(cappedLimit),
  });
  const response = await supabaseRequest(
    `/rest/v1/${LEADERBOARD_TABLE}?${query.toString()}`,
  );

  if (!response.ok) {
    throw new Error(`Leaderboard query failed with status ${response.status}`);
  }

  const rows = (await response.json()) as RepoEvaluationRow[];
  return rows.map(toLeaderboardEntry);
}

function buildCommunityRoast(result: ScoreResult, metrics: EvaluationMetrics) {
  const socialProof = `${formatCount(metrics.starsCount)} stars and ${formatCount(
    metrics.forksCount,
  )} forks`;

  if (result.score >= 90) {
    return `This project makes its contributor welcome sign impossible to miss. Its ${socialProof} back up a genuinely polished community setup.`;
  }

  if (result.score >= 75) {
    return `The contributor path is solid enough to earn a real invitation, not just a polite nod. With ${socialProof}, this repository has the social proof to match.`;
  }

  return `The foundations are visible, but the first-contributor journey still has a few potholes. The scan recorded ${socialProof}, so a small documentation pass could make a meaningful difference.`;
}

function formatCount(value: number) {
  return new Intl.NumberFormat("en-US", {
    notation: value >= 1000 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(value);
}

function toLeaderboardEntry(row: RepoEvaluationRow): LeaderboardEntry {
  return {
    id: row.id,
    repoOwner: row.repo_owner,
    repoName: row.repo_name,
    repoPath: row.repo_path,
    score: row.score,
    grade: row.grade,
    primaryLanguage: row.primary_language || "Unknown",
    starsCount: row.stars_count,
    forksCount: row.forks_count,
    roastText: row.roast_text,
    isEligibleForLeaderboard: row.is_eligible_for_leaderboard,
    evaluatedAt: row.evaluated_at,
    updatedAt: row.updated_at,
    freshness: leaderboardFreshness(row.updated_at),
  };
}

async function supabaseRequest(path: string, init: RequestInit = {}) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    throw new Error("Supabase leaderboard configuration is unavailable");
  }

  const headers = new Headers(init.headers);
  headers.set("apikey", SUPABASE_SERVICE_KEY);
  headers.set("Authorization", `Bearer ${SUPABASE_SERVICE_KEY}`);
  headers.set("Content-Type", "application/json");

  return fetch(`${SUPABASE_URL}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });
}

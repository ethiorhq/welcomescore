import type { Check, ScoreResult } from "@/lib/scoreRepo";

export const ALGOFOX_REVIEW_SCHEMA_VERSION = 1 as const;

export type AlgofoxReviewMode = "motivation" | "tough-love" | "celebration";
export type AlgofoxReviewState = "review" | "failed" | "jumping" | "waving";
export type ReviewProvider = "groq" | "gemini" | "rule-engine";

export type ReviewFocusCheck = {
  label: string;
  points: number;
  maxPoints: number;
};

export type TrustedReviewContext = {
  schemaVersion: typeof ALGOFOX_REVIEW_SCHEMA_VERSION;
  repo: string;
  score: number;
  grade: string;
  primaryLanguage: string;
  hasReadme: boolean;
  hasLicense: boolean;
  goodFirstIssueCount: number;
  checks: Array<{
    label: string;
    passed: boolean;
    points: number;
    maxPoints: number;
  }>;
  focusChecks: ReviewFocusCheck[];
};

export type AlgofoxReview = {
  schemaVersion: typeof ALGOFOX_REVIEW_SCHEMA_VERSION;
  mode: AlgofoxReviewMode;
  spriteState: AlgofoxReviewState;
  headline: string;
  roastText: string;
  motivationText: string;
  focusChecks: string[];
  provider: ReviewProvider;
};

const CHECK_PRIORITY = [
  "LICENSE",
  "README setup section",
  "CONTRIBUTING.md",
  "CODE_OF_CONDUCT.md",
  "Good-first-issue labels",
  "Recently active",
];

export function createTrustedReviewContext(result: ScoreResult): TrustedReviewContext {
  const checks = result.checks.map((check) => toNormalizedCheck(check));
  const focusChecks = checks
    .filter((check) => !check.passed || check.points < check.maxPoints)
    .sort((left, right) => {
      const leftPriority = CHECK_PRIORITY.indexOf(left.label);
      const rightPriority = CHECK_PRIORITY.indexOf(right.label);
      const normalizedLeft = leftPriority === -1 ? CHECK_PRIORITY.length : leftPriority;
      const normalizedRight = rightPriority === -1 ? CHECK_PRIORITY.length : rightPriority;
      return normalizedLeft - normalizedRight || left.points - right.points;
    })
    .slice(0, 2)
    .map(({ label, points, maxPoints }) => ({ label, points, maxPoints }));

  return {
    schemaVersion: ALGOFOX_REVIEW_SCHEMA_VERSION,
    repo: result.repo.toLowerCase(),
    score: result.score,
    grade: result.grade,
    primaryLanguage: result.primaryLanguage || "Unknown",
    hasReadme: result.hasReadme,
    hasLicense: result.hasLicense,
    goodFirstIssueCount: result.goodFirstIssueCount,
    checks,
    focusChecks,
  };
}

export function validateAlgofoxReview(value: unknown, context: TrustedReviewContext): AlgofoxReview | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Partial<AlgofoxReview>;
  const validModes: AlgofoxReviewMode[] = ["motivation", "tough-love", "celebration"];
  const validStates: AlgofoxReviewState[] = ["review", "failed", "jumping", "waving"];
  const validProviders: ReviewProvider[] = ["groq", "gemini", "rule-engine"];
  const allowedFocusChecks = new Set(context.focusChecks.map((check) => check.label));

  if (
    candidate.schemaVersion !== ALGOFOX_REVIEW_SCHEMA_VERSION ||
    !validModes.includes(candidate.mode as AlgofoxReviewMode) ||
    !validStates.includes(candidate.spriteState as AlgofoxReviewState) ||
    !validProviders.includes(candidate.provider as ReviewProvider) ||
    !isBoundedText(candidate.headline, 80) ||
    !isBoundedText(candidate.roastText, 220) ||
    !isBoundedText(candidate.motivationText, 180) ||
    !Array.isArray(candidate.focusChecks) ||
    candidate.focusChecks.length > 2 ||
    candidate.focusChecks.some(
      (check) => typeof check !== "string" || !allowedFocusChecks.has(check),
    )
  ) {
    return null;
  }

  return {
    schemaVersion: ALGOFOX_REVIEW_SCHEMA_VERSION,
    mode: candidate.mode as AlgofoxReviewMode,
    spriteState: candidate.spriteState as AlgofoxReviewState,
    headline: candidate.headline.trim(),
    roastText: candidate.roastText.trim(),
    motivationText: candidate.motivationText.trim(),
    focusChecks: [...candidate.focusChecks],
    provider: candidate.provider as ReviewProvider,
  };
}

function toNormalizedCheck(check: Check) {
  return {
    label: check.label,
    passed: check.passed,
    points: check.points,
    maxPoints: check.maxPoints ?? standardMaximum(check.label),
  };
}

function standardMaximum(label: string) {
  const maximums: Record<string, number> = {
    "CONTRIBUTING.md": 20,
    "CODE_OF_CONDUCT.md": 15,
    "README setup section": 15,
    LICENSE: 10,
    "Good-first-issue labels": 25,
    "Recently active": 15,
  };
  return maximums[label] ?? 0;
}

function isBoundedText(value: unknown, maxLength: number): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.trim().length <= maxLength;
}

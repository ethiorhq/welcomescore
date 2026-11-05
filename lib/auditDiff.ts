/**
 * Deterministic audit diff: what changed between two audits of one repository.
 *
 * Pure module: no database access, no network access, no side effects, no
 * new dependencies. It compares two `ScoreResult` values — the only place
 * per-check pass/fail state is knowable — and returns the score delta, the
 * grade change, and the per-check changes, each with a real GitHub evidence
 * URL.
 *
 * What it deliberately does NOT do:
 * - It never invents previous-check data. When `previous` is null (a first
 *   audit) the delta is null and the summary says so; there is no fake
 *   baseline.
 * - A check counts as "changed" only when its pass/fail state flips, the
 *   same definition `lib/improvement/diff.ts` uses for `ChangedSignal`.
 *   The good-first-issue check awards graded points (0–25), so its points
 *   can move without a flip; such a move changes the score delta but is
 *   not listed as a changed check, and the summary omits the per-check
 *   list rather than attributing the move to a check that did not flip.
 *
 * Evidence URLs reuse the mapping already used by the report schema
 * (`lib/report/schema.ts`) and the score card (`app/components/ScoreCard.tsx`),
 * so a diff never links somewhere the audit itself does not:
 * - CONTRIBUTING.md / CODE_OF_CONDUCT.md / LICENSE / README setup section:
 *   `https://github.com/{repo}/blob/{branch}/{file}`
 * - Good-first-issue labels: the same open-issue label search URL the
 *   score card uses.
 * - Recently active: `https://github.com/{repo}/commits/{branch}` — the
 *   push history the check observes. (The repository pulse page is an
 *   activity overview, not the evidence the check reads.)
 * - Any label not in the six known checks: the repository page itself.
 * `import type` only: this module has no runtime dependency on
 * `lib/scoreRepo.ts`, so it is safe to import from client components.
 */
import type { Check, ScoreResult } from "./scoreRepo";

export type AuditDiffCheck = {
  label: string;
  beforePassed: boolean;
  afterPassed: boolean;
  pointsDelta: number;
  evidenceUrl: string;
};

export type AuditDiff = {
  scoreDelta: number | null;
  gradeChange: { from: string; to: string } | null;
  changedChecks: AuditDiffCheck[];
  summary: string;
  isFirstAudit: boolean;
};

export const FIRST_AUDIT_SUMMARY = "First audit — no previous score to compare.";

export function evidenceUrlForCheck(
  label: string,
  repo: string,
  defaultBranch: string,
): string {
  const base = `https://github.com/${repo}`;
  const branch = defaultBranch || "main";
  switch (label) {
    case "CONTRIBUTING.md":
      return `${base}/blob/${branch}/CONTRIBUTING.md`;
    case "CODE_OF_CONDUCT.md":
      return `${base}/blob/${branch}/CODE_OF_CONDUCT.md`;
    case "README setup section":
      return `${base}/blob/${branch}/README.md`;
    case "LICENSE":
      return `${base}/blob/${branch}/LICENSE`;
    case "Good-first-issue labels":
      return `${base}/issues?q=is%3Aopen+is%3Aissue+label%3A%22good+first+issue%22`;
    case "Recently active":
      return `${base}/commits/${branch}`;
    default:
      return base;
  }
}

function signedPoints(pointsDelta: number): string {
  return pointsDelta >= 0 ? `+${pointsDelta}` : `${pointsDelta}`;
}

export function computeAuditDiff(
  current: ScoreResult,
  previous: ScoreResult | null,
): AuditDiff {
  if (!previous) {
    return {
      scoreDelta: null,
      gradeChange: null,
      changedChecks: [],
      summary: FIRST_AUDIT_SUMMARY,
      isFirstAudit: true,
    };
  }

  const scoreDelta = current.score - previous.score;
  const gradeChange =
    current.grade !== previous.grade
      ? { from: previous.grade, to: current.grade }
      : null;

  const previousByLabel = new Map<string, Check>(
    previous.checks.map((check) => [check.label, check]),
  );

  const changedChecks: AuditDiffCheck[] = [];
  for (const check of current.checks) {
    const before = previousByLabel.get(check.label);
    const beforePassed = before ? before.passed : false;
    const beforePoints = before ? before.points : 0;
    if (beforePassed === check.passed) {
      continue;
    }
    changedChecks.push({
      label: check.label,
      beforePassed,
      afterPassed: check.passed,
      pointsDelta: check.points - beforePoints,
      evidenceUrl: evidenceUrlForCheck(
        check.label,
        current.repo,
        current.defaultBranch,
      ),
    });
  }

  const summary = buildSummary(current, previous, scoreDelta, gradeChange, changedChecks);

  return {
    scoreDelta,
    gradeChange,
    changedChecks,
    summary,
    isFirstAudit: false,
  };
}

function buildSummary(
  current: ScoreResult,
  previous: ScoreResult,
  scoreDelta: number,
  gradeChange: { from: string; to: string } | null,
  changedChecks: AuditDiffCheck[],
): string {
  const gradePart = gradeChange
    ? `, grade ${gradeChange.from} → ${gradeChange.to}`
    : "";
  const base = `score ${previous.score} → ${current.score}${gradePart}`;

  if (scoreDelta === 0 && changedChecks.length === 0) {
    return `No change since the previous audit — ${base}.`;
  }

  const direction = scoreDelta > 0 ? "Improved" : "Regressed";
  const headline = `${direction} by ${Math.abs(scoreDelta)} points since the previous audit (${previous.score} → ${current.score}${gradePart})`;

  if (changedChecks.length === 0) {
    return `${headline}.`;
  }

  const details = changedChecks
    .map(
      (check) =>
        `${check.label} ${check.afterPassed ? "added" : "removed"} (${signedPoints(check.pointsDelta)})`,
    )
    .join(", ");
  return `${headline}: ${details}.`;
}

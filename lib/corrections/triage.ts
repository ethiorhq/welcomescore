import type { CorrectionStatus, StoredCorrection } from "./types";

export type TriageDecision = {
  status: Exclude<CorrectionStatus, "needs-review">;
  triageNotes: string;
  createsRegressionTest?: boolean;
  scoringRuleChange?: string;
};

export function canTransitionStatus(
  current: CorrectionStatus,
  next: CorrectionStatus,
): boolean {
  if (current === next) return true;
  if (current === "needs-review") return true;
  // Resolved or rejected can be re-opened to needs-review upon new maintainer evidence
  if (next === "needs-review") return true;
  return false;
}

export function applyTriageDecision(
  correction: StoredCorrection,
  decision: TriageDecision,
): StoredCorrection {
  if (!canTransitionStatus(correction.status, decision.status)) {
    throw new Error(
      `Invalid triage transition from ${correction.status} to ${decision.status}`,
    );
  }

  const notes = [
    correction.triageNotes,
    `[${new Date().toISOString()}] ${decision.status.toUpperCase()}: ${decision.triageNotes}`,
    decision.scoringRuleChange
      ? `Rule Change: ${decision.scoringRuleChange}`
      : null,
  ]
    .filter(Boolean)
    .join("\n");

  return {
    ...correction,
    status: decision.status,
    triageNotes: notes,
    updatedAt: new Date().toISOString(),
  };
}

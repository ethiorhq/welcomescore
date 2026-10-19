export type CorrectionReasonCategory =
  | "external_location"
  | "custom_license"
  | "external_ci"
  | "monorepo_structure"
  | "stale_status"
  | "other";

export const CORRECTION_REASON_CATEGORIES: readonly CorrectionReasonCategory[] = [
  "external_location",
  "custom_license",
  "external_ci",
  "monorepo_structure",
  "stale_status",
  "other",
] as const;

export type CorrectionStatus =
  | "needs-review"
  | "resolved"
  | "rejected"
  | "duplicate";

export type CorrectionSubmission = {
  repo: string;
  evidenceId: string;
  reason: CorrectionReasonCategory;
  explanation: string;
  sourceUrl?: string;
};

export type StoredCorrection = {
  id: string;
  repo: string;
  evidenceId: string;
  reason: CorrectionReasonCategory;
  explanation: string;
  sourceUrl?: string;
  status: CorrectionStatus;
  triageNotes?: string;
  createdAt: string;
  updatedAt: string;
};

export function isCorrectionReasonCategory(
  value: unknown,
): value is CorrectionReasonCategory {
  return (
    typeof value === "string" &&
    CORRECTION_REASON_CATEGORIES.includes(value as CorrectionReasonCategory)
  );
}

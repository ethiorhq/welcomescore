import type { ReportSchemaVersion } from "./version";

export type RepositoryRef = {
  owner: string;
  name: string;
  fullName: string;
  defaultBranch: string;
  source: "github";
};

export type EvidenceStatus = "pass" | "partial" | "missing" | "unknown";

export type EvidenceConfidence = "high" | "medium" | "low";

export type EvidenceItem = {
  id: string;
  category: string;
  label: string;
  status: EvidenceStatus;
  points: number;
  maxPoints: number;
  explanation: string;
  sourceUrl?: string;
  sourcePath?: string;
  observedAt: string;
  confidence: EvidenceConfidence;
  limitations?: string[];
};

export type EffortBand = "small" | "medium" | "large";

export type PatchPlanSafety = "low-risk" | "review-required";

export type NextUsefulMove = {
  id: string;
  title: string;
  whyItMatters: string;
  evidenceIds: string[];
  effort: EffortBand;
  expectedOutcome: string;
  acceptanceCriteria: string[];
  suggestedFiles?: string[];
  issueDraft?: {
    title: string;
    body: string;
    labels: string[];
  };
  patchPlan?: {
    files: string[];
    operations: string[];
    safety: PatchPlanSafety;
  };
  limitations?: string[];
};

export type GoodFirstIssueItem = {
  title: string;
  url: string;
};

export type ReportCoverage = {
  observed: number;
  possible: number;
  percentage: number;
};

export type ReportPublicLinks = {
  report: string;
  badge: string;
  repository: string;
};

export type WelcomeScoreReport = {
  schemaVersion: ReportSchemaVersion;
  toolVersion: string;
  repository: RepositoryRef;
  analyzedAt: string;
  analyzedCommit?: string;
  score: number;
  grade: string;
  coverage: ReportCoverage;
  checks: EvidenceItem[];
  nextUsefulMove: NextUsefulMove | null;
  goodFirstIssues: GoodFirstIssueItem[];
  limitations: string[];
  publicLinks: ReportPublicLinks;
  detectedStacks?: string[];
  stackReports?: Record<string, unknown>;
};

export type ReportValidationResult =
  | { valid: true; report: WelcomeScoreReport }
  | { valid: false; errors: string[] };

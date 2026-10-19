import {
  CURRENT_TOOL_VERSION,
  isSupportedReportSchemaVersion,
  REPORT_SCHEMA_VERSION,
} from "./version";
import type {
  EffortBand,
  EvidenceConfidence,
  EvidenceItem,
  EvidenceStatus,
  NextUsefulMove,
  PatchPlanSafety,
  ReportCoverage,
  ReportValidationResult,
  RepositoryRef,
  WelcomeScoreReport,
} from "./types";
import type { Check, GoodFirstIssue, ScoreResult } from "../scoreRepo";
import { resolveNextUsefulMove, type MoveEvidence } from "../nextUsefulMove";
import { actionArtifactById } from "../actionArtifacts";
import { SITE_URL } from "../site";

const VALID_EVIDENCE_STATUSES = new Set<EvidenceStatus>([
  "pass",
  "partial",
  "missing",
  "unknown",
]);

const VALID_CONFIDENCE_LEVELS = new Set<EvidenceConfidence>([
  "high",
  "medium",
  "low",
]);

const VALID_EFFORT_BANDS = new Set<EffortBand>(["small", "medium", "large"]);

const VALID_PATCH_SAFETIES = new Set<PatchPlanSafety>([
  "low-risk",
  "review-required",
]);

export class ReportValidationError extends Error {
  constructor(public readonly errors: string[]) {
    super(`WelcomeScore report validation failed: ${errors.join("; ")}`);
    this.name = "ReportValidationError";
  }
}

export function validateReport(input: unknown): ReportValidationResult {
  const errors: string[] = [];

  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { valid: false, errors: ["Report payload must be an object."] };
  }

  const raw = input as Record<string, unknown>;

  if (!isSupportedReportSchemaVersion(raw.schemaVersion)) {
    errors.push(
      `Unsupported or missing schemaVersion: expected "${REPORT_SCHEMA_VERSION}", received "${String(
        raw.schemaVersion,
      )}"`,
    );
  }

  if (typeof raw.toolVersion !== "string" || !raw.toolVersion.trim()) {
    errors.push("toolVersion must be a non-empty string.");
  }

  if (!raw.repository || typeof raw.repository !== "object") {
    errors.push("repository must be an object.");
  } else {
    const repo = raw.repository as Record<string, unknown>;
    if (typeof repo.owner !== "string" || !repo.owner.trim()) {
      errors.push("repository.owner must be a non-empty string.");
    }
    if (typeof repo.name !== "string" || !repo.name.trim()) {
      errors.push("repository.name must be a non-empty string.");
    }
    if (typeof repo.fullName !== "string" || !repo.fullName.trim()) {
      errors.push("repository.fullName must be a non-empty string.");
    }
    if (typeof repo.defaultBranch !== "string" || !repo.defaultBranch.trim()) {
      errors.push("repository.defaultBranch must be a non-empty string.");
    }
    if (repo.source !== "github") {
      errors.push('repository.source must be "github".');
    }
  }

  if (
    typeof raw.analyzedAt !== "string" ||
    Number.isNaN(Date.parse(raw.analyzedAt))
  ) {
    errors.push("analyzedAt must be a valid ISO timestamp string.");
  }

  if (
    raw.analyzedCommit !== undefined &&
    (typeof raw.analyzedCommit !== "string" || !raw.analyzedCommit.trim())
  ) {
    errors.push("analyzedCommit must be a non-empty string when provided.");
  }

  if (
    typeof raw.score !== "number" ||
    !Number.isFinite(raw.score) ||
    raw.score < 0 ||
    raw.score > 100
  ) {
    errors.push("score must be a finite number between 0 and 100.");
  }

  if (typeof raw.grade !== "string" || !raw.grade.trim()) {
    errors.push("grade must be a non-empty string.");
  }

  if (!raw.coverage || typeof raw.coverage !== "object") {
    errors.push("coverage must be an object.");
  } else {
    const coverage = raw.coverage as Record<string, unknown>;
    if (
      typeof coverage.observed !== "number" ||
      coverage.observed < 0 ||
      typeof coverage.possible !== "number" ||
      coverage.possible < 0 ||
      typeof coverage.percentage !== "number" ||
      coverage.percentage < 0 ||
      coverage.percentage > 100
    ) {
      errors.push(
        "coverage must specify non-negative numbers with percentage in [0, 100].",
      );
    }
  }

  if (!Array.isArray(raw.checks)) {
    errors.push("checks must be an array of evidence items.");
  } else {
    raw.checks.forEach((item, index) => {
      validateEvidenceItem(item, `checks[${index}]`, errors);
    });
  }

  if (raw.nextUsefulMove !== null) {
    if (!raw.nextUsefulMove || typeof raw.nextUsefulMove !== "object") {
      errors.push("nextUsefulMove must be an object or null.");
    } else {
      validateNextUsefulMove(raw.nextUsefulMove, "nextUsefulMove", errors);
    }
  }

  if (!Array.isArray(raw.goodFirstIssues)) {
    errors.push("goodFirstIssues must be an array.");
  } else {
    raw.goodFirstIssues.forEach((issue, index) => {
      if (
        !issue ||
        typeof issue !== "object" ||
        typeof (issue as Record<string, unknown>).title !== "string" ||
        typeof (issue as Record<string, unknown>).url !== "string"
      ) {
        errors.push(
          `goodFirstIssues[${index}] must have title and url strings.`,
        );
      }
    });
  }

  if (
    !Array.isArray(raw.limitations) ||
    raw.limitations.some((limitation) => typeof limitation !== "string")
  ) {
    errors.push("limitations must be an array of strings.");
  }

  if (!raw.publicLinks || typeof raw.publicLinks !== "object") {
    errors.push("publicLinks must be an object.");
  } else {
    const links = raw.publicLinks as Record<string, unknown>;
    if (
      typeof links.report !== "string" ||
      typeof links.badge !== "string" ||
      typeof links.repository !== "string"
    ) {
      errors.push(
        "publicLinks must include report, badge, and repository URL strings.",
      );
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true, report: input as WelcomeScoreReport };
}

function validateEvidenceItem(
  item: unknown,
  path: string,
  errors: string[],
): void {
  if (!item || typeof item !== "object") {
    errors.push(`${path} must be an object.`);
    return;
  }
  const raw = item as Record<string, unknown>;

  if (typeof raw.id !== "string" || !raw.id.trim()) {
    errors.push(`${path}.id must be a non-empty string.`);
  }
  if (typeof raw.category !== "string" || !raw.category.trim()) {
    errors.push(`${path}.category must be a non-empty string.`);
  }
  if (typeof raw.label !== "string" || !raw.label.trim()) {
    errors.push(`${path}.label must be a non-empty string.`);
  }
  if (
    typeof raw.status !== "string" ||
    !VALID_EVIDENCE_STATUSES.has(raw.status as EvidenceStatus)
  ) {
    errors.push(
      `${path}.status must be "pass", "partial", "missing", or "unknown".`,
    );
  }
  if (
    typeof raw.points !== "number" ||
    !Number.isFinite(raw.points) ||
    raw.points < 0
  ) {
    errors.push(`${path}.points must be a non-negative number.`);
  }
  if (
    typeof raw.maxPoints !== "number" ||
    !Number.isFinite(raw.maxPoints) ||
    raw.maxPoints <= 0
  ) {
    errors.push(`${path}.maxPoints must be a positive number.`);
  }
  if (
    typeof raw.points === "number" &&
    typeof raw.maxPoints === "number" &&
    raw.points > raw.maxPoints
  ) {
    errors.push(`${path}.points cannot exceed maxPoints.`);
  }
  if (typeof raw.explanation !== "string") {
    errors.push(`${path}.explanation must be a string.`);
  }
  if (
    typeof raw.confidence !== "string" ||
    !VALID_CONFIDENCE_LEVELS.has(raw.confidence as EvidenceConfidence)
  ) {
    errors.push(`${path}.confidence must be "high", "medium", or "low".`);
  }
  if (
    raw.sourceUrl !== undefined &&
    (typeof raw.sourceUrl !== "string" || !raw.sourceUrl.trim())
  ) {
    errors.push(`${path}.sourceUrl must be a non-empty string if provided.`);
  }
  if (
    raw.sourcePath !== undefined &&
    (typeof raw.sourcePath !== "string" || !raw.sourcePath.trim())
  ) {
    errors.push(`${path}.sourcePath must be a non-empty string if provided.`);
  }
  if (
    raw.limitations !== undefined &&
    (!Array.isArray(raw.limitations) ||
      raw.limitations.some((limitation) => typeof limitation !== "string"))
  ) {
    errors.push(`${path}.limitations must be an array of strings if provided.`);
  }
}

function validateNextUsefulMove(
  move: unknown,
  path: string,
  errors: string[],
): void {
  const raw = move as Record<string, unknown>;

  if (typeof raw.id !== "string" || !raw.id.trim()) {
    errors.push(`${path}.id must be a non-empty string.`);
  }
  if (typeof raw.title !== "string" || !raw.title.trim()) {
    errors.push(`${path}.title must be a non-empty string.`);
  }
  if (typeof raw.whyItMatters !== "string" || !raw.whyItMatters.trim()) {
    errors.push(`${path}.whyItMatters must be a non-empty string.`);
  }
  if (
    !Array.isArray(raw.evidenceIds) ||
    raw.evidenceIds.some((id) => typeof id !== "string")
  ) {
    errors.push(`${path}.evidenceIds must be an array of string IDs.`);
  }
  if (
    typeof raw.effort !== "string" ||
    !VALID_EFFORT_BANDS.has(raw.effort as EffortBand)
  ) {
    errors.push(`${path}.effort must be "small", "medium", or "large".`);
  }
  if (typeof raw.expectedOutcome !== "string" || !raw.expectedOutcome.trim()) {
    errors.push(`${path}.expectedOutcome must be a non-empty string.`);
  }
  if (
    !Array.isArray(raw.acceptanceCriteria) ||
    raw.acceptanceCriteria.some((criterion) => typeof criterion !== "string")
  ) {
    errors.push(`${path}.acceptanceCriteria must be an array of strings.`);
  }
  if (
    raw.suggestedFiles !== undefined &&
    (!Array.isArray(raw.suggestedFiles) ||
      raw.suggestedFiles.some((file) => typeof file !== "string"))
  ) {
    errors.push(`${path}.suggestedFiles must be an array of strings.`);
  }

  if (raw.issueDraft !== undefined) {
    if (!raw.issueDraft || typeof raw.issueDraft !== "object") {
      errors.push(`${path}.issueDraft must be an object if provided.`);
    } else {
      const draft = raw.issueDraft as Record<string, unknown>;
      if (typeof draft.title !== "string" || !draft.title.trim()) {
        errors.push(`${path}.issueDraft.title must be a string.`);
      }
      if (typeof draft.body !== "string" || !draft.body.trim()) {
        errors.push(`${path}.issueDraft.body must be a string.`);
      }
      if (
        !Array.isArray(draft.labels) ||
        draft.labels.some((label) => typeof label !== "string")
      ) {
        errors.push(`${path}.issueDraft.labels must be an array of strings.`);
      }
    }
  }

  if (raw.patchPlan !== undefined) {
    if (!raw.patchPlan || typeof raw.patchPlan !== "object") {
      errors.push(`${path}.patchPlan must be an object if provided.`);
    } else {
      const plan = raw.patchPlan as Record<string, unknown>;
      if (
        !Array.isArray(plan.files) ||
        plan.files.some((file) => typeof file !== "string")
      ) {
        errors.push(`${path}.patchPlan.files must be an array of strings.`);
      }
      if (
        !Array.isArray(plan.operations) ||
        plan.operations.some((op) => typeof op !== "string")
      ) {
        errors.push(`${path}.patchPlan.operations must be an array of strings.`);
      }
      if (
        typeof plan.safety !== "string" ||
        !VALID_PATCH_SAFETIES.has(plan.safety as PatchPlanSafety)
      ) {
        errors.push(
          `${path}.patchPlan.safety must be "low-risk" or "review-required".`,
        );
      }
    }
  }
}

export function assertValidReport(input: unknown): WelcomeScoreReport {
  const result = validateReport(input);
  if (!result.valid) {
    throw new ReportValidationError(result.errors);
  }
  return result.report;
}

export type CreateReportOptions = {
  analyzedCommit?: string;
  siteBaseUrl?: string;
  analyzedAt?: string;
};

export function createReportFromAudit(
  result: ScoreResult,
  options: CreateReportOptions = {},
): WelcomeScoreReport {
  const [owner, name] = result.repo.split("/");
  const fullName = result.repo;
  const repositoryRef: RepositoryRef = {
    owner: owner || "",
    name: name || "",
    fullName,
    defaultBranch: result.defaultBranch || "main",
    source: "github",
  };

  const analyzedAt = options.analyzedAt || new Date().toISOString();
  const repoBaseUrl = `https://github.com/${fullName}`;

  const checks: EvidenceItem[] = result.checks.map((check: Check) => {
    const id = slugifyCheckLabel(check.label);
    const category = categorizeCheck(check.label);
    const maxPoints = check.maxPoints ?? defaultMaxPointsForCheck(check.label);
    const status: EvidenceStatus = check.passed
      ? "pass"
      : check.points > 0
        ? "partial"
        : "missing";

    return {
      id,
      category,
      label: check.label,
      status,
      points: check.points,
      maxPoints,
      explanation: describeCheckObservation(check, result),
      sourceUrl: sourceUrlForCheck(check.label, repoBaseUrl, result),
      sourcePath: sourcePathForCheck(check.label),
      observedAt: analyzedAt,
      confidence: "high" as const,
      limitations: [
        "Observed from public GitHub repository API responses at audit time.",
      ],
    };
  });

  const observed = checks.filter((check) => check.status !== "unknown").length;
  const possible = checks.length;
  const coverage: ReportCoverage = {
    observed,
    possible,
    percentage: possible > 0 ? Math.round((observed / possible) * 100) : 100,
  };

  const movePlan = resolveNextUsefulMove(result);
  const nextUsefulMove = transformNextUsefulMove(movePlan.primary);

  const siteUrl = (options.siteBaseUrl || SITE_URL).replace(/\/$/, "");

  const report: WelcomeScoreReport = {
    schemaVersion: REPORT_SCHEMA_VERSION,
    toolVersion: CURRENT_TOOL_VERSION,
    repository: repositoryRef,
    analyzedAt,
    ...(options.analyzedCommit ? { analyzedCommit: options.analyzedCommit } : {}),
    score: result.score,
    grade: result.grade,
    coverage,
    checks,
    nextUsefulMove,
    goodFirstIssues: result.goodFirstIssues.map((issue: GoodFirstIssue) => ({
      title: issue.title,
      url: issue.url,
    })),
    limitations: [
      "This is a deterministic metadata and community readiness audit, not a security assessment, legal certification, code-quality audit, or endorsement.",
      "Checks are derived from public GitHub repository signals, conventional file paths, and public issue labels.",
      "A missing signal reflects observed repository structure and may be intentional for the project's scope.",
    ],
    publicLinks: {
      report: `${siteUrl}/report/${owner}/${name}`,
      badge: `${siteUrl}/api/badge?repo=${encodeURIComponent(fullName)}`,
      repository: repoBaseUrl,
    },
  };

  return assertValidReport(report);
}

function slugifyCheckLabel(label: string): string {
  switch (label) {
    case "CONTRIBUTING.md":
      return "contributing-guide";
    case "CODE_OF_CONDUCT.md":
      return "code-of-conduct";
    case "README setup section":
      return "readme-setup";
    case "LICENSE":
      return "license";
    case "Good-first-issue labels":
      return "starter-issues";
    case "Recently active":
      return "recent-activity";
    default:
      return label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }
}

function categorizeCheck(label: string): string {
  switch (label) {
    case "CONTRIBUTING.md":
    case "README setup section":
      return "documentation";
    case "CODE_OF_CONDUCT.md":
    case "LICENSE":
      return "governance";
    case "Good-first-issue labels":
      return "contributor-path";
    case "Recently active":
      return "activity";
    default:
      return "general";
  }
}

function defaultMaxPointsForCheck(label: string): number {
  switch (label) {
    case "CONTRIBUTING.md":
      return 20;
    case "CODE_OF_CONDUCT.md":
      return 15;
    case "README setup section":
      return 15;
    case "LICENSE":
      return 10;
    case "Good-first-issue labels":
      return 25;
    case "Recently active":
      return 15;
    default:
      return 10;
  }
}

function describeCheckObservation(
  check: ScoreResult["checks"][number],
  result: ScoreResult,
): string {
  if (check.passed) {
    switch (check.label) {
      case "CONTRIBUTING.md":
        return "CONTRIBUTING.md was detected in the repository root.";
      case "CODE_OF_CONDUCT.md":
        return "CODE_OF_CONDUCT.md was detected in the repository root.";
      case "README setup section":
        return "README.md contains an install, setup, or getting started heading.";
      case "LICENSE":
        return "A recognized SPDX license or conventional LICENSE file was found.";
      case "Good-first-issue labels":
        return `${result.goodFirstIssueCount} beginner-friendly starter issues were observed.`;
      case "Recently active":
        return "A commit was pushed to the default branch within the last 3 months.";
      default:
        return `${check.label} passed successfully.`;
    }
  }

  switch (check.label) {
    case "CONTRIBUTING.md":
      return "No CONTRIBUTING.md file was observed in the repository root.";
    case "CODE_OF_CONDUCT.md":
      return "No CODE_OF_CONDUCT.md file was observed in the repository root.";
    case "README setup section":
      return "README.md was found, but no install or setup section heading was detected.";
    case "LICENSE":
      return "No recognized license file or GitHub SPDX license catalog entry was detected.";
    case "Good-first-issue labels":
      return "No open issues with good-first-issue, beginner-friendly, or help-wanted labels were found.";
    case "Recently active":
      return "No public commits have been pushed within the last 3 months.";
    default:
      return `${check.label} was not observed in this audit.`;
  }
}

function sourceUrlForCheck(
  label: string,
  repoBaseUrl: string,
  result: ScoreResult,
): string | undefined {
  switch (label) {
    case "CONTRIBUTING.md":
      return `${repoBaseUrl}/blob/${result.defaultBranch}/CONTRIBUTING.md`;
    case "CODE_OF_CONDUCT.md":
      return `${repoBaseUrl}/blob/${result.defaultBranch}/CODE_OF_CONDUCT.md`;
    case "README setup section":
      return `${repoBaseUrl}/blob/${result.defaultBranch}/README.md`;
    case "LICENSE":
      return `${repoBaseUrl}/blob/${result.defaultBranch}/LICENSE`;
    case "Good-first-issue labels":
      return `${repoBaseUrl}/issues?q=is%3Aopen+is%3Aissue+label%3A%22good+first+issue%22`;
    case "Recently active":
      return `${repoBaseUrl}/commits/${result.defaultBranch}`;
    default:
      return repoBaseUrl;
  }
}

function sourcePathForCheck(label: string): string | undefined {
  switch (label) {
    case "CONTRIBUTING.md":
      return "CONTRIBUTING.md";
    case "CODE_OF_CONDUCT.md":
      return "CODE_OF_CONDUCT.md";
    case "README setup section":
      return "README.md";
    case "LICENSE":
      return "LICENSE";
    default:
      return undefined;
  }
}

function transformNextUsefulMove(
  move: ReturnType<typeof resolveNextUsefulMove>["primary"],
): NextUsefulMove {
  const effortBand: EffortBand =
    move.estimatedEffort === "10–15 min"
      ? "small"
      : move.estimatedEffort === "15–30 min"
        ? "medium"
        : "large";

  const suggestedFiles: string[] = [];
  let patchPlan: NextUsefulMove["patchPlan"] = undefined;
  let issueDraft: NextUsefulMove["issueDraft"] = undefined;

  switch (move.id) {
    case "readme-setup": {
      suggestedFiles.push("README.md");
      const artifact = actionArtifactById("readme-setup-outline");
      issueDraft = {
        title: "docs: Add local setup instructions to README",
        body: `## Problem\nNew contributors cannot easily get started without documented prerequisites and setup steps.\n\n### Suggested outline\n\`\`\`markdown\n${artifact?.content ?? ""}\n\`\`\`\n\n### Acceptance criteria\n- [ ] Prerequisites (Node version, package manager) documented\n- [ ] Verified local install and start commands tested\n- [ ] No private secrets or credentials required`,
        labels: ["documentation", "good first issue"],
      };
      patchPlan = {
        files: ["README.md"],
        operations: ["Append or integrate a verified ## Setup section"],
        safety: "review-required",
      };
      break;
    }
    case "contributing-guide": {
      suggestedFiles.push("CONTRIBUTING.md");
      const artifact = actionArtifactById("contributing-guide");
      issueDraft = {
        title: "docs: Add CONTRIBUTING.md contributor guide",
        body: `## Summary\nProvide a visible contributor guide explaining local development, workflow, and PR expectations.\n\n### Draft\n\`\`\`markdown\n${artifact?.content ?? ""}\n\`\`\`\n\n### Acceptance criteria\n- [ ] CONTRIBUTING.md added to repository root\n- [ ] Local test and lint instructions specified\n- [ ] Clear PR guidelines for first-time contributors`,
        labels: ["documentation"],
      };
      patchPlan = {
        files: ["CONTRIBUTING.md"],
        operations: ["Create CONTRIBUTING.md from reviewed starter template"],
        safety: "low-risk",
      };
      break;
    }
    case "code-of-conduct": {
      suggestedFiles.push("CODE_OF_CONDUCT.md");
      const artifact = actionArtifactById("code-of-conduct");
      issueDraft = {
        title: "docs: Add CODE_OF_CONDUCT.md",
        body: `## Summary\nEstablish clear community participation expectations and a designated reporting email.\n\n### Draft\n\`\`\`markdown\n${artifact?.content ?? ""}\n\`\`\`\n\n### Acceptance criteria\n- [ ] CODE_OF_CONDUCT.md added to repository root\n- [ ] Valid reporting email configured`,
        labels: ["governance"],
      };
      patchPlan = {
        files: ["CODE_OF_CONDUCT.md"],
        operations: ["Create CODE_OF_CONDUCT.md with monitored contact route"],
        safety: "low-risk",
      };
      break;
    }
    case "license": {
      suggestedFiles.push("LICENSE");
      issueDraft = {
        title: "docs: Clarify repository LICENSE",
        body: "Clarify the project license so contributors and users understand published reuse terms before investing time.",
        labels: ["governance"],
      };
      patchPlan = {
        files: ["LICENSE"],
        operations: ["Publish a reviewed open-source license file in the root"],
        safety: "review-required",
      };
      break;
    }
    case "starter-issue":
    case "starter-issue-quality": {
      const artifact = actionArtifactById("starter-issue-brief");
      issueDraft = {
        title: "chore: Scope a good-first-issue for new contributors",
        body: `## Starter Task Brief\n${artifact?.content ?? ""}`,
        labels: ["good first issue"],
      };
      break;
    }
    case "maintenance-clarity": {
      suggestedFiles.push("README.md");
      const artifact = actionArtifactById("maintenance-status-note");
      issueDraft = {
        title: "docs: Add maintenance status note",
        body: `Provide transparency around current active and quiet areas of the repository.\n\n\`\`\`markdown\n${artifact?.content ?? ""}\n\`\`\``,
        labels: ["documentation"],
      };
      break;
    }
    default:
      break;
  }

  const evidenceIds: string[] = move.evidence.map((ev: MoveEvidence) =>
    slugifyCheckLabel(ev.label),
  );

  return {
    id: move.id,
    title: move.title,
    whyItMatters: move.whyItMatters,
    evidenceIds,
    effort: effortBand,
    expectedOutcome: move.completionDefinition,
    acceptanceCriteria: [
      move.completionDefinition,
      `Guardrail: ${move.guardrail}`,
    ],
    suggestedFiles: suggestedFiles.length > 0 ? suggestedFiles : undefined,
    issueDraft,
    patchPlan,
    limitations: [
      "Generated from deterministic audit evidence; review all drafts before opening issues or applying patches.",
    ],
  };
}

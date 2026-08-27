import type { ScoreResult } from "@/lib/scoreRepo";
import { SITE_URL } from "@/lib/site";
import {
  resolveNextUsefulMove,
  type MoveDefinition,
  type MoveEvidence,
  type MoveId,
} from "@/lib/nextUsefulMove";

export const RETURN_WORKSPACE_STORAGE_PREFIX = "welcomescore:return-workspace:v1:";
export const RETURN_WORKSPACE_INDEX_KEY = "welcomescore:return-workspace-index:v1";
export const RETURN_HANDOFF_KEY = "welcomescore:return-handoff:v1";
export const MAX_RETURN_NOTE_LENGTH = 280;

export type ReturnIntent =
  | "after-a-meaningful-change"
  | "after-a-merge"
  | "when-i-have-time"
  | "not-set";

export type PrivateWorkState = "planned" | "in-progress" | "ready-for-fresh-audit";

export type AuditSignalSnapshot = {
  version: 1;
  repo: string;
  auditedAt: string;
  score: number;
  grade: string;
  passedCheckLabels: string[];
  goodFirstIssueCount: number;
  activeMoveIds: MoveId[];
};

export type SavedMoveSnapshot = Pick<
  MoveDefinition,
  | "id"
  | "title"
  | "summary"
  | "whyItMatters"
  | "completionDefinition"
  | "guardrail"
  | "estimatedEffort"
  | "guide"
  | "artifact"
  | "externalAction"
  | "evidence"
>;

export type LocalReturnWorkspace = {
  version: 1;
  repo: string;
  activeMoveId: MoveId;
  savedMove?: SavedMoveSnapshot;
  workState: PrivateWorkState;
  returnIntent: ReturnIntent;
  note?: string;
  firstSavedAt: string;
  lastTouchedAt: string;
  lastKnownAudit?: AuditSignalSnapshot;
  lastReviewedAt?: string;
  dismissedAuditNoticeAt?: string;
};

export type ReturnEvidenceState =
  | "no-saved-plan"
  | "private-plan-no-new-audit"
  | "saved-action-still-observed"
  | "saved-action-no-longer-observed"
  | "current-priority-changed"
  | "all-current-signals-visible";

export type ReturnPlanView = {
  primary: SavedMoveSnapshot;
  applicableMoveIds: MoveId[];
};

export type ReturnWorkspaceView = {
  workspace: LocalReturnWorkspace;
  currentPlan: ReturnPlanView;
  evidenceState: Exclude<ReturnEvidenceState, "no-saved-plan">;
  evidenceSummary: string;
  nextSafeActionLabel: string;
  mayStartFreshAudit: boolean;
};

export type ReturnWorkspaceIndexEntry = {
  repo: string;
  lastTouchedAt: string;
};

export type ReturnHandoff = {
  version: 1;
  repo: string;
  requestedAt: string;
  expiresAt: string;
};

const validWorkStates = new Set<PrivateWorkState>([
  "planned",
  "in-progress",
  "ready-for-fresh-audit",
]);

const validReturnIntents = new Set<ReturnIntent>([
  "after-a-meaningful-change",
  "after-a-merge",
  "when-i-have-time",
  "not-set",
]);

const validMoveIds = new Set<MoveId>([
  "readme-setup",
  "contributing-guide",
  "code-of-conduct",
  "license",
  "starter-issue",
  "starter-issue-quality",
  "maintenance-clarity",
  "maintain-the-path",
]);

export function normalizeReturnRepository(repo: string) {
  return repo.trim().toLowerCase();
}

export function returnWorkspaceStorageKey(repo: string) {
  return `${RETURN_WORKSPACE_STORAGE_PREFIX}${normalizeReturnRepository(repo)}`;
}

export function buildAuditSignalSnapshot(
  result: ScoreResult,
  plan = resolveNextUsefulMove(result),
  auditedAt = new Date().toISOString(),
): AuditSignalSnapshot {
  return {
    version: 1,
    repo: normalizeReturnRepository(result.repo),
    auditedAt,
    score: result.score,
    grade: result.grade,
    passedCheckLabels: result.checks.filter((check) => check.passed).map((check) => check.label),
    goodFirstIssueCount: result.goodFirstIssueCount,
    activeMoveIds: plan.applicableMoveIds,
  };
}

function isSavedMoveSnapshot(value: unknown, expectedMoveId: MoveId): value is SavedMoveSnapshot {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<SavedMoveSnapshot>;
  return (
    candidate.id === expectedMoveId &&
    typeof candidate.title === "string" &&
    typeof candidate.summary === "string" &&
    typeof candidate.whyItMatters === "string" &&
    typeof candidate.completionDefinition === "string" &&
    typeof candidate.guardrail === "string" &&
    typeof candidate.estimatedEffort === "string" &&
    Boolean(candidate.guide && candidate.guide.kind === "guide" && candidate.guide.href.startsWith("/guides/")) &&
    Array.isArray(candidate.evidence) &&
    candidate.evidence.every(
      (evidence) =>
        evidence &&
        typeof evidence === "object" &&
        typeof (evidence as MoveEvidence).label === "string" &&
        typeof (evidence as MoveEvidence).observed === "string",
    ) &&
    (candidate.artifact === undefined ||
      (candidate.artifact.kind === "artifact" && typeof candidate.artifact.artifactId === "string")) &&
    (candidate.externalAction === undefined ||
      (candidate.externalAction.kind === "external" && candidate.externalAction.href.startsWith("https://")))
  );
}

export function isLocalReturnWorkspace(value: unknown, repo?: string): value is LocalReturnWorkspace {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<LocalReturnWorkspace>;
  const expectedRepo = repo ? normalizeReturnRepository(repo) : undefined;

  return (
    candidate.version === 1 &&
    typeof candidate.repo === "string" &&
    (!expectedRepo || candidate.repo === expectedRepo) &&
    typeof candidate.activeMoveId === "string" &&
    validMoveIds.has(candidate.activeMoveId as MoveId) &&
    (candidate.savedMove === undefined || isSavedMoveSnapshot(candidate.savedMove, candidate.activeMoveId as MoveId)) &&
    typeof candidate.workState === "string" &&
    validWorkStates.has(candidate.workState as PrivateWorkState) &&
    typeof candidate.returnIntent === "string" &&
    validReturnIntents.has(candidate.returnIntent as ReturnIntent) &&
    typeof candidate.firstSavedAt === "string" &&
    typeof candidate.lastTouchedAt === "string" &&
    (candidate.note === undefined ||
      (typeof candidate.note === "string" && candidate.note.length <= MAX_RETURN_NOTE_LENGTH))
  );
}

export function isReturnWorkspaceIndex(value: unknown): value is ReturnWorkspaceIndexEntry[] {
  return (
    Array.isArray(value) &&
    value.every(
      (entry) =>
        entry &&
        typeof entry === "object" &&
        typeof (entry as ReturnWorkspaceIndexEntry).repo === "string" &&
        typeof (entry as ReturnWorkspaceIndexEntry).lastTouchedAt === "string",
    )
  );
}

export function isReturnHandoff(value: unknown, repo?: string): value is ReturnHandoff {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<ReturnHandoff>;
  return (
    candidate.version === 1 &&
    typeof candidate.repo === "string" &&
    (!repo || candidate.repo === normalizeReturnRepository(repo)) &&
    typeof candidate.requestedAt === "string" &&
    typeof candidate.expiresAt === "string"
  );
}

export function resolveReturnWorkspace(
  workspace: LocalReturnWorkspace,
  currentPlan: ReturnPlanView,
  hasFreshAudit = false,
): ReturnWorkspaceView {
  let evidenceState: ReturnWorkspaceView["evidenceState"] = "private-plan-no-new-audit";
  let evidenceSummary = "This is your private plan. WelcomeScore has not checked for changes.";
  let nextSafeActionLabel = "Start a fresh audit when you are ready";

  if (hasFreshAudit && currentPlan.primary.id === "maintain-the-path") {
    evidenceState = "all-current-signals-visible";
    evidenceSummary =
      "Current public contributor signals are visible. Review them when the project changes.";
    nextSafeActionLabel = "Review the current contributor path";
  } else if (hasFreshAudit && !currentPlan.applicableMoveIds.includes(workspace.activeMoveId)) {
    evidenceState = "saved-action-no-longer-observed";
    evidenceSummary =
      "The latest audit no longer shows the saved action’s signal. Review the current evidence before treating work as complete.";
    nextSafeActionLabel = "Review the current evidence";
  } else if (hasFreshAudit && currentPlan.primary.id !== workspace.activeMoveId) {
    evidenceState = "current-priority-changed";
    evidenceSummary =
      "Your saved work remains relevant; the newest audit places another action first.";
    nextSafeActionLabel = "Review the current first action";
  } else if (hasFreshAudit) {
    evidenceState = "saved-action-still-observed";
    evidenceSummary =
      "The latest audit still shows this contributor signal. Continue only if the work is still useful.";
    nextSafeActionLabel = "Continue this private plan";
  }

  return {
    workspace,
    currentPlan,
    evidenceState,
    evidenceSummary,
    nextSafeActionLabel,
    mayStartFreshAudit: true,
  };
}

export function returnIntentLabel(intent: ReturnIntent) {
  switch (intent) {
    case "after-a-meaningful-change":
      return "Review after I make a meaningful change";
    case "after-a-merge":
      return "Review after a relevant merge";
    case "when-i-have-time":
      return "Keep this for when I have time";
    default:
      return "No return timing saved";
  }
}

export function workStateLabel(state: PrivateWorkState) {
  switch (state) {
    case "in-progress":
      return "In progress privately";
    case "ready-for-fresh-audit":
      return "Ready for a fresh audit";
    default:
      return "Planned privately";
  }
}

export function getReturnBrief(workspace: LocalReturnWorkspace, plan?: ReturnPlanView) {
  const move =
    workspace.savedMove ??
    plan?.primary ?? {
      title: workspace.activeMoveId,
      evidence: [],
      guide: { href: "/guides/improve-repository-welcomescore" as const },
    };

  return [
    "WelcomeScore private contributor plan",
    `Repository: ${workspace.repo}`,
    `Chosen action: ${move.title}`,
    `Why: ${move.evidence.length > 0 ? move.evidence.map((evidence) => `${evidence.label} — ${evidence.observed}`).join("; ") : "Review the saved contributor action against the latest public repository context."}`,
    `Next review intent: ${returnIntentLabel(workspace.returnIntent)}`,
    `Guide: ${SITE_URL}${move.guide.href}`,
    "Reminder: This is a private plan, not proof that the work is complete.",
  ].join("\n");
}

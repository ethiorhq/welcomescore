import { describe, expect, it } from "vitest";
import { resolveNextUsefulMove } from "@/lib/nextUsefulMove";
import {
  buildAuditSignalSnapshot,
  getReturnBrief,
  isLocalReturnWorkspace,
  isReturnWorkspaceIndex,
  resolveReturnWorkspace,
  type LocalReturnWorkspace,
} from "@/lib/returnWithPurpose";
import type { ScoreResult } from "@/lib/scoreRepo";

function makeResult(overrides: Partial<ScoreResult> = {}): ScoreResult {
  return {
    repo: "owner/repo",
    score: 75,
    grade: "B",
    checks: [
      { label: "CONTRIBUTING.md", passed: true, points: 20 },
      { label: "CODE_OF_CONDUCT.md", passed: true, points: 15 },
      { label: "README setup section", passed: false, points: 0, maxPoints: 15 },
      { label: "LICENSE", passed: true, points: 10 },
      { label: "Good-first-issue labels", passed: true, points: 25, maxPoints: 25 },
      { label: "Recently active", passed: true, points: 15 },
    ],
    defaultBranch: "main",
    primaryLanguage: "TypeScript",
    goodFirstIssues: [],
    goodFirstIssueCount: 10,
    starsCount: 0,
    forksCount: 0,
    hasReadme: true,
    hasLicense: true,
    isEligibleForLeaderboard: false,
    ...overrides,
  };
}

function makeWorkspace(result = makeResult()): LocalReturnWorkspace {
  const plan = resolveNextUsefulMove(result);
  return {
    version: 1,
    repo: "owner/repo",
    activeMoveId: plan.primary.id,
    savedMove: plan.primary,
    workState: "planned",
    returnIntent: "after-a-meaningful-change",
    firstSavedAt: "2026-08-27T00:00:00.000Z",
    lastTouchedAt: "2026-08-27T00:00:00.000Z",
    lastKnownAudit: buildAuditSignalSnapshot(result, plan, "2026-08-27T00:00:00.000Z"),
  };
}

describe("Return With Purpose evidence ledger", () => {
  it("does not imply a check when only a private plan exists", () => {
    const result = makeResult();
    const view = resolveReturnWorkspace(makeWorkspace(result), resolveNextUsefulMove(result));

    expect(view.evidenceState).toBe("private-plan-no-new-audit");
    expect(view.evidenceSummary).toContain("has not checked for changes");
  });

  it("states that a saved action remains observed after a fresh audit", () => {
    const result = makeResult();
    const view = resolveReturnWorkspace(makeWorkspace(result), resolveNextUsefulMove(result), true);

    expect(view.evidenceState).toBe("saved-action-still-observed");
    expect(view.evidenceSummary).toContain("still shows");
  });

  it("asks for review rather than claiming completion when a saved action disappears", () => {
    const savedResult = makeResult();
    const changedResult = makeResult({
      checks: [
        { label: "CONTRIBUTING.md", passed: true, points: 20 },
        { label: "CODE_OF_CONDUCT.md", passed: true, points: 15 },
        { label: "README setup section", passed: true, points: 15 },
        { label: "LICENSE", passed: true, points: 10 },
        { label: "Good-first-issue labels", passed: true, points: 25, maxPoints: 25 },
        { label: "Recently active", passed: true, points: 15 },
      ],
      score: 100,
      grade: "A",
    });
    const view = resolveReturnWorkspace(makeWorkspace(savedResult), resolveNextUsefulMove(changedResult), true);

    expect(view.evidenceState).toBe("all-current-signals-visible");
    expect(view.evidenceSummary).toContain("Review");
    expect(view.evidenceSummary.toLowerCase()).not.toContain("completed");
  });

  it("explains when current priorities change without invalidating saved work", () => {
    const savedResult = makeResult({
      checks: [
        { label: "CONTRIBUTING.md", passed: false, points: 0, maxPoints: 20 },
        { label: "CODE_OF_CONDUCT.md", passed: true, points: 15 },
        { label: "README setup section", passed: true, points: 15 },
        { label: "LICENSE", passed: true, points: 10 },
        { label: "Good-first-issue labels", passed: true, points: 25, maxPoints: 25 },
        { label: "Recently active", passed: true, points: 15 },
      ],
    });
    const changedResult = makeResult({
      checks: [
        { label: "CONTRIBUTING.md", passed: false, points: 0, maxPoints: 20 },
        { label: "CODE_OF_CONDUCT.md", passed: true, points: 15 },
        { label: "README setup section", passed: false, points: 0, maxPoints: 15 },
        { label: "LICENSE", passed: true, points: 10 },
        { label: "Good-first-issue labels", passed: true, points: 25, maxPoints: 25 },
        { label: "Recently active", passed: true, points: 15 },
      ],
    });
    const view = resolveReturnWorkspace(makeWorkspace(savedResult), resolveNextUsefulMove(changedResult), true);

    expect(view.evidenceState).toBe("current-priority-changed");
    expect(view.evidenceSummary).toContain("remains relevant");
  });

  it("keeps the private return brief factual and non-certifying", () => {
    const result = makeResult();
    const brief = getReturnBrief(makeWorkspace(result), resolveNextUsefulMove(result));

    expect(brief).toContain("private plan, not proof that the work is complete");
    expect(brief).not.toContain("score increase");
  });

  it("rejects malformed local workspace values and accepts a valid index", () => {
    expect(isLocalReturnWorkspace({ repo: "owner/repo" })).toBe(false);
    expect(isReturnWorkspaceIndex([{ repo: "owner/repo", lastTouchedAt: "2026-08-27T00:00:00.000Z" }])).toBe(true);
  });
});

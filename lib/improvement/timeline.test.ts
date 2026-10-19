import { describe, it, expect, beforeEach } from "vitest";
import {
  calculateImprovementEvent,
  calculateImprovementFromPreviousEvent,
} from "./diff";
import {
  recordImprovementEvent,
  getRepoTimeline,
  deleteRepoTimeline,
  clearInMemoryTimelineStore,
} from "./timeline";
import { validReportFixture } from "../report/fixtures";
import type { WelcomeScoreReport } from "../report/types";

describe("Improvement Timeline Engine", () => {
  beforeEach(() => {
    clearInMemoryTimelineStore();
  });

  it("calculates initial baseline improvement event when no previous report exists", () => {
    const event = calculateImprovementEvent(validReportFixture, null);

    expect(event.repo).toBe("ethiorhq/welcomescore");
    expect(event.newScore).toBe(85);
    expect(event.previousScore).toBeNull();
    expect(event.scoreDelta).toBeNull();
    expect(event.previousGrade).toBeNull();
    expect(event.newGrade).toBe("B");
    expect(event.changedSignals).toHaveLength(0);
    expect(event.completedMoves).toHaveLength(0);
    expect(event.remainingMoveId).toBe("starter-issue-quality");
  });

  it("calculates score delta and changed signals when comparing two reports", () => {
    const previousReport: WelcomeScoreReport = {
      ...validReportFixture,
      score: 75,
      grade: "C",
      checks: validReportFixture.checks.map((chk) =>
        chk.id === "contributing-guide"
          ? { ...chk, status: "fail", points: 0 }
          : chk,
      ),

      nextUsefulMove: {
        id: "contributing-guide",
        title: "Add a focused CONTRIBUTING.md guide",
        evidenceIds: ["contributing-guide"],
        whyItMatters: "Helps contributors get started.",
        smallestSafeNextStep: "Draft a basic guide.",
        expectedOutcome: "Clearer PRs.",
        effortBand: "medium",
        acceptanceCriteria: ["CONTRIBUTING.md exists in repository root"],
        suggestedFiles: ["CONTRIBUTING.md"],
        limitations: ["Deterministic public audit"],
      },
    };

    const currentReport: WelcomeScoreReport = {
      ...validReportFixture,
      score: 85,
      grade: "B",
      nextUsefulMove: {
        id: "issue-templates",
        title: "Add issue templates",
        evidenceIds: ["issue-templates"],
        whyItMatters: "Templates organize incoming issues.",
        smallestSafeNextStep: "Add bug_report.md template.",
        expectedOutcome: "Standardized bugs.",
        effortBand: "low",
        acceptanceCriteria: [".github/ISSUE_TEMPLATE exists"],
        suggestedFiles: [".github/ISSUE_TEMPLATE/bug_report.md"],
        limitations: ["Deterministic public audit"],
      },
    };

    const event = calculateImprovementEvent(currentReport, previousReport);

    expect(event.newScore).toBe(85);
    expect(event.previousScore).toBe(75);
    expect(event.scoreDelta).toBe(10);
    expect(event.previousGrade).toBe("C");
    expect(event.newGrade).toBe("B");
    expect(event.changedSignals).toHaveLength(1);
    expect(event.changedSignals[0].id).toBe("contributing-guide");
    expect(event.changedSignals[0].beforePassed).toBe(false);
    expect(event.changedSignals[0].afterPassed).toBe(true);
    expect(event.changedSignals[0].pointsDelta).toBe(20);
    expect(event.completedMoves).toContain("contributing-guide");
    expect(event.remainingMoveId).toBe("issue-templates");
  });

  it("calculates improvement from previous event summary", () => {
    const prevEvent = {
      id: "evt-prev-1",
      repo: "ethiorhq/welcomescore",
      analyzedAt: "2026-10-18T00:00:00Z",
      previousScore: null,
      newScore: 65,
      scoreDelta: null,
      previousGrade: null,
      newGrade: "D",
      changedSignals: [],
      completedMoves: [],
      remainingMoveId: "readme-setup",
    };

    const currentReport: WelcomeScoreReport = {
      ...validReportFixture,
      score: 85,
      grade: "B",
      nextUsefulMove: {
        id: "contributing-guide",
        title: "Add contributing guide",
        evidenceIds: ["contributing-guide"],
        whyItMatters: "Guide onboarding.",
        smallestSafeNextStep: "Draft guide.",
        expectedOutcome: "Better PRs.",
        effortBand: "medium",
        acceptanceCriteria: ["CONTRIBUTING.md exists"],
        suggestedFiles: ["CONTRIBUTING.md"],
        limitations: ["Deterministic audit"],
      },
    };

    const diff = calculateImprovementFromPreviousEvent(currentReport, prevEvent);

    expect(diff.previousScore).toBe(65);
    expect(diff.newScore).toBe(85);
    expect(diff.scoreDelta).toBe(20);
    expect(diff.completedMoves).toContain("readme-setup");
    expect(diff.remainingMoveId).toBe("contributing-guide");
  });

  it("stores and retrieves timeline events in chronological order", async () => {
    const event1 = calculateImprovementEvent(validReportFixture, null, "evt-1");
    await recordImprovementEvent(event1);

    const timeline = await getRepoTimeline("ethiorhq/welcomescore");
    expect(timeline).toHaveLength(1);
    expect(timeline[0].id).toBe("evt-1");

    // Add second event
    const event2 = {
      ...event1,
      id: "evt-2",
      analyzedAt: new Date(Date.now() + 1000).toISOString(),
      previousScore: 85,
      newScore: 90,
      scoreDelta: 5,
    };
    await recordImprovementEvent(event2);

    const updatedTimeline = await getRepoTimeline("ethiorhq/welcomescore");
    expect(updatedTimeline).toHaveLength(2);
    // Newest first
    expect(updatedTimeline[0].id).toBe("evt-2");
    expect(updatedTimeline[1].id).toBe("evt-1");
  });

  it("supports deletion for maintainer privacy (right to be forgotten)", async () => {
    const event = calculateImprovementEvent(validReportFixture, null, "evt-privacy");
    await recordImprovementEvent(event);

    let timeline = await getRepoTimeline("ethiorhq/welcomescore");
    expect(timeline.length).toBeGreaterThan(0);

    const deleted = await deleteRepoTimeline("ethiorhq/welcomescore");
    expect(deleted).toBe(true);

    timeline = await getRepoTimeline("ethiorhq/welcomescore");
    expect(timeline).toHaveLength(0);
  });
});


import { describe, expect, it } from "vitest";
import { resolveNextUsefulMove } from "@/lib/nextUsefulMove";
import type { Check, ScoreResult } from "@/lib/scoreRepo";

const CHECK_LABELS = [
  "CONTRIBUTING.md",
  "CODE_OF_CONDUCT.md",
  "README setup section",
  "LICENSE",
  "Good-first-issue labels",
  "Recently active",
] as const;

function makeChecks(overrides: Partial<Record<(typeof CHECK_LABELS)[number], boolean>> = {}): Check[] {
  return CHECK_LABELS.map((label) => ({
    label,
    passed: overrides[label] ?? true,
    points: overrides[label] === false ? 0 : 10,
  }));
}

function makeResult({
  checks = makeChecks(),
  goodFirstIssueCount = 10,
}: {
  checks?: Check[];
  goodFirstIssueCount?: number;
} = {}): ScoreResult {
  return {
    repo: "ethiorhq/welcomescore",
    score: 100,
    grade: "A",
    checks,
    defaultBranch: "main",
    starsCount: 0,
    forksCount: 0,
    primaryLanguage: "TypeScript",
    hasReadme: true,
    hasLicense: true,
    isEligibleForLeaderboard: false,
    goodFirstIssueCount,
    goodFirstIssues: [],
  };
}

describe("resolveNextUsefulMove", () => {
  it.each([
    {
      name: "starts with the setup path when several contributor foundations are absent",
      result: makeResult({
        checks: makeChecks({
          "README setup section": false,
          "CONTRIBUTING.md": false,
          "CODE_OF_CONDUCT.md": false,
          LICENSE: false,
          "Recently active": false,
        }),
        goodFirstIssueCount: 0,
      }),
      primary: "readme-setup",
      secondary: ["contributing-guide", "code-of-conduct"],
    },
    {
      name: "selects contribution expectations when that is the only missing foundation signal",
      result: makeResult({ checks: makeChecks({ "CONTRIBUTING.md": false }) }),
      primary: "contributing-guide",
      secondary: [],
    },
    {
      name: "selects one honest starter issue when no public newcomer issues are observed",
      result: makeResult({ goodFirstIssueCount: 0 }),
      primary: "starter-issue",
      secondary: [],
    },
    {
      name: "selects issue quality review for a developing set of starter issues",
      result: makeResult({ goodFirstIssueCount: 4 }),
      primary: "starter-issue-quality",
      secondary: [],
    },
    {
      name: "uses maintenance clarity without recommending cosmetic commits",
      result: makeResult({ checks: makeChecks({ "Recently active": false }) }),
      primary: "maintenance-clarity",
      secondary: [],
    },
    {
      name: "uses maintenance of the path only when all observed signals are satisfied",
      result: makeResult(),
      primary: "maintain-the-path",
      secondary: [],
    },
  ])("$name", ({ result, primary, secondary }) => {
    const plan = resolveNextUsefulMove(result);

    expect(plan.primary.id).toBe(primary);
    expect(plan.secondary.map((move) => move.id)).toEqual(secondary);
    expect(plan.applicableMoveIds).toContain(primary);
    expect(plan.generatedFrom).toBe("current-audit-result");
  });

  it("uses exact observed evidence and keeps the starter-issue quality message free of quota language", () => {
    const plan = resolveNextUsefulMove(makeResult({ goodFirstIssueCount: 4 }));

    expect(plan.primary.evidence).toEqual([
      {
        label: "Open newcomer issues",
        observed: "4 currently found in this audit",
      },
    ]);
    expect(plan.primary.completionDefinition.toLowerCase()).not.toContain("reach 10");
    expect(plan.primary.guardrail.toLowerCase()).toContain("remove stale tasks");
  });

  it("does not invent missing-check failures when a future result omits an expected label", () => {
    const result = makeResult({
      checks: makeChecks().filter((check) => check.label !== "README setup section"),
      goodFirstIssueCount: 10,
    });

    const plan = resolveNextUsefulMove(result);

    expect(plan.primary.id).toBe("maintain-the-path");
  });
});

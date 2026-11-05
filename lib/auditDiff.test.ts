import { describe, expect, it } from "vitest";
import {
  computeAuditDiff,
  evidenceUrlForCheck,
  FIRST_AUDIT_SUMMARY,
  type AuditDiff,
} from "./auditDiff";
import type { Check, ScoreResult } from "./scoreRepo";

type CheckSpec = {
  label: string;
  passed: boolean;
  points: number;
  maxPoints?: number;
};

function makeResult(
  score: number,
  grade: string,
  specs: CheckSpec[],
): ScoreResult {
  const checks: Check[] = specs.map((spec) => ({
    label: spec.label,
    passed: spec.passed,
    points: spec.points,
    maxPoints: spec.maxPoints,
  }));
  return {
    repo: "ethiorhq/welcomescore",
    score,
    grade,
    checks,
    defaultBranch: "main",
    starsCount: 2,
    forksCount: 0,
    primaryLanguage: "TypeScript",
    hasReadme: true,
    hasLicense: true,
    isEligibleForLeaderboard: false,
    goodFirstIssueCount: 0,
    goodFirstIssues: [],
  };
}

const ALL_PASSING: CheckSpec[] = [
  { label: "CONTRIBUTING.md", passed: true, points: 20, maxPoints: 20 },
  { label: "CODE_OF_CONDUCT.md", passed: true, points: 15, maxPoints: 15 },
  { label: "README setup section", passed: true, points: 15, maxPoints: 15 },
  { label: "LICENSE", passed: true, points: 10, maxPoints: 10 },
  { label: "Good-first-issue labels", passed: true, points: 25, maxPoints: 25 },
  { label: "Recently active", passed: true, points: 15, maxPoints: 15 },
];

function withCheck(specs: CheckSpec[], label: string, patch: Partial<CheckSpec>): CheckSpec[] {
  return specs.map((spec) => (spec.label === label ? { ...spec, ...patch } : spec));
}

describe("computeAuditDiff", () => {
  it("returns a null delta and the first-audit summary when there is no previous audit", () => {
    const diff = computeAuditDiff(makeResult(85, "B", ALL_PASSING), null);

    expect(diff.isFirstAudit).toBe(true);
    expect(diff.scoreDelta).toBeNull();
    expect(diff.gradeChange).toBeNull();
    expect(diff.changedChecks).toEqual([]);
    expect(diff.summary).toBe(FIRST_AUDIT_SUMMARY);
  });

  it.each([
    {
      name: "improved by 20 when CONTRIBUTING.md is added",
      prevScore: 65,
      prevGrade: "C",
      prevSpecs: withCheck(
        withCheck(ALL_PASSING, "CONTRIBUTING.md", { passed: false, points: 0 }),
        "CODE_OF_CONDUCT.md",
        { passed: false, points: 0 },
      ),
      nextScore: 85,
      nextGrade: "B",
      nextSpecs: withCheck(ALL_PASSING, "CODE_OF_CONDUCT.md", { passed: false, points: 0 }),
      expectedDelta: 20,
      expectedGradeChange: { from: "C", to: "B" },
      expectedChanged: [
        {
          label: "CONTRIBUTING.md",
          beforePassed: false,
          afterPassed: true,
          pointsDelta: 20,
          evidenceUrl: "https://github.com/ethiorhq/welcomescore/blob/main/CONTRIBUTING.md",
        },
      ],
      summaryContains: ["Improved by 20 points", "65 → 85", "grade C → B", "CONTRIBUTING.md added (+20)"],
    },
    {
      name: "regressed by 15 when the README setup section is removed",
      prevScore: 100,
      prevGrade: "A",
      prevSpecs: ALL_PASSING,
      nextScore: 85,
      nextGrade: "B",
      nextSpecs: withCheck(ALL_PASSING, "README setup section", { passed: false, points: 0 }),
      expectedDelta: -15,
      expectedGradeChange: { from: "A", to: "B" },
      expectedChanged: [
        {
          label: "README setup section",
          beforePassed: true,
          afterPassed: false,
          pointsDelta: -15,
          evidenceUrl: "https://github.com/ethiorhq/welcomescore/blob/main/README.md",
        },
      ],
      summaryContains: ["Regressed by 15 points", "100 → 85", "README setup section removed (-15)"],
    },
    {
      name: "unchanged when nothing flips",
      prevScore: 78,
      prevGrade: "B",
      prevSpecs: withCheck(ALL_PASSING, "Good-first-issue labels", { points: 3, maxPoints: 25 }),
      nextScore: 78,
      nextGrade: "B",
      nextSpecs: withCheck(ALL_PASSING, "Good-first-issue labels", { points: 3, maxPoints: 25 }),
      expectedDelta: 0,
      expectedGradeChange: null,
      expectedChanged: [],
      summaryContains: ["No change since the previous audit", "score 78 → 78"],
    },
    {
      name: "grade change B to A from graded starter-issue points, with no pass/fail flip",
      prevScore: 88,
      prevGrade: "B",
      prevSpecs: withCheck(ALL_PASSING, "Good-first-issue labels", { points: 13, maxPoints: 25 }),
      nextScore: 90,
      nextGrade: "A",
      nextSpecs: withCheck(ALL_PASSING, "Good-first-issue labels", { points: 15, maxPoints: 25 }),
      expectedDelta: 2,
      expectedGradeChange: { from: "B", to: "A" },
      expectedChanged: [],
      summaryContains: ["Improved by 2 points", "88 → 90", "grade B → A"],
    },
    {
      name: "graded flip on good-first-issue labels uses actual points, not the 25 maximum",
      prevScore: 80,
      prevGrade: "B",
      prevSpecs: withCheck(ALL_PASSING, "Good-first-issue labels", { points: 5, maxPoints: 25 }),
      nextScore: 75,
      nextGrade: "B",
      nextSpecs: withCheck(ALL_PASSING, "Good-first-issue labels", { passed: false, points: 0, maxPoints: 25 }),
      expectedDelta: -5,
      expectedGradeChange: null,
      expectedChanged: [
        {
          label: "Good-first-issue labels",
          beforePassed: true,
          afterPassed: false,
          pointsDelta: -5,
          evidenceUrl:
            "https://github.com/ethiorhq/welcomescore/issues?q=is%3Aopen+is%3Aissue+label%3A%22good+first+issue%22",
        },
      ],
      summaryContains: ["Regressed by 5 points", "Good-first-issue labels removed (-5)"],
    },
  ])(
    "$name",
    ({
      prevScore,
      prevGrade,
      prevSpecs,
      nextScore,
      nextGrade,
      nextSpecs,
      expectedDelta,
      expectedGradeChange,
      expectedChanged,
      summaryContains,
    }) => {
      const diff: AuditDiff = computeAuditDiff(
        makeResult(nextScore, nextGrade, nextSpecs),
        makeResult(prevScore, prevGrade, prevSpecs),
      );

      expect(diff.isFirstAudit).toBe(false);
      expect(diff.scoreDelta).toBe(expectedDelta);
      expect(diff.gradeChange).toEqual(expectedGradeChange);
      expect(diff.changedChecks).toEqual(expectedChanged);
      for (const fragment of summaryContains) {
        expect(diff.summary).toContain(fragment);
      }
    },
  );

  it.each([
    ["CONTRIBUTING.md", "https://github.com/ethiorhq/welcomescore/blob/main/CONTRIBUTING.md"],
    ["CODE_OF_CONDUCT.md", "https://github.com/ethiorhq/welcomescore/blob/main/CODE_OF_CONDUCT.md"],
    ["README setup section", "https://github.com/ethiorhq/welcomescore/blob/main/README.md"],
    ["LICENSE", "https://github.com/ethiorhq/welcomescore/blob/main/LICENSE"],
    [
      "Good-first-issue labels",
      "https://github.com/ethiorhq/welcomescore/issues?q=is%3Aopen+is%3Aissue+label%3A%22good+first+issue%22",
    ],
    ["Recently active", "https://github.com/ethiorhq/welcomescore/commits/main"],
    ["Unknown check", "https://github.com/ethiorhq/welcomescore"],
  ])("evidence URL for %s is %s", (label, expectedUrl) => {
    expect(evidenceUrlForCheck(label, "ethiorhq/welcomescore", "main")).toBe(expectedUrl);
  });

  it("uses the repository default branch in file evidence URLs", () => {
    expect(evidenceUrlForCheck("LICENSE", "owner/repo", "develop")).toBe(
      "https://github.com/owner/repo/blob/develop/LICENSE",
    );
  });
});

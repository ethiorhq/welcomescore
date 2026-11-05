import { describe, expect, it } from "vitest";
import { formatCheckedAt, relativeCheckedAt } from "./checkedAt";
import type { ScoreResult } from "./scoreRepo";

const NOW = new Date("2026-11-06T12:00:00.000Z");

describe("formatCheckedAt", () => {
  it.each([
    ["2026-11-06T02:26:00.000Z", /Nov 6, 2026/],
    ["2026-01-15T09:05:00.000Z", /Jan 15, 2026/],
  ])("formats %s as a local-time-friendly string", (iso, pattern) => {
    const formatted = formatCheckedAt(iso);
    expect(formatted).toMatch(pattern);
    // Hour and minute are always shown, matching ReportFreshness.tsx.
    expect(formatted).toMatch(/\d{1,2}:\d{2}/);
  });

  it.each(["", "not-a-date", "2026-13-01T00:00:00.000Z"])(
    "returns an empty string for invalid input %s",
    (iso) => {
      expect(formatCheckedAt(iso)).toBe("");
    },
  );

  it("returns an empty string for missing input", () => {
    expect(formatCheckedAt(undefined)).toBe("");
    expect(formatCheckedAt(null)).toBe("");
  });
});

describe("relativeCheckedAt", () => {
  it.each([
    ["2026-11-06T12:00:00.000Z", "just now"],
    ["2026-11-06T11:59:30.000Z", "just now"],
    ["2026-11-06T11:59:00.000Z", "1 minute ago"],
    ["2026-11-06T11:55:00.000Z", "5 minutes ago"],
    ["2026-11-06T11:01:00.000Z", "59 minutes ago"],
    ["2026-11-06T11:00:00.000Z", "1 hour ago"],
    ["2026-11-06T07:00:00.000Z", "5 hours ago"],
    // A future timestamp never renders a negative duration.
    ["2026-11-06T12:30:00.000Z", "just now"],
  ])("renders %s as %s relative to the pinned clock", (iso, expected) => {
    expect(relativeCheckedAt(iso, NOW)).toBe(expected);
  });

  it.each(["", "not-a-date", "2026-13-01T00:00:00.000Z"])(
    "returns null for invalid input %s",
    (iso) => {
      expect(relativeCheckedAt(iso, NOW)).toBeNull();
    },
  );

  it("returns null for missing input", () => {
    expect(relativeCheckedAt(undefined, NOW)).toBeNull();
    expect(relativeCheckedAt(null, NOW)).toBeNull();
  });
});

describe("ScoreResult checkedAt shape", () => {
  it("carries a valid ISO 8601 checkedAt generated at audit time", () => {
    // scoreRepo() itself cannot be exercised here without live GitHub
    // requests, so this test pins the type shape every scoreRepo() caller
    // must satisfy: checkedAt is a valid ISO string, not a display string.
    const checkedAt = new Date("2026-11-06T02:26:00.000Z").toISOString();
    const result: ScoreResult = {
      repo: "ethiorhq/welcomescore",
      score: 85,
      grade: "A",
      checks: [],
      defaultBranch: "main",
      starsCount: 0,
      forksCount: 0,
      primaryLanguage: "TypeScript",
      hasReadme: true,
      hasLicense: true,
      isEligibleForLeaderboard: false,
      goodFirstIssueCount: 0,
      goodFirstIssues: [],
      checkedAt,
    };
    expect(new Date(result.checkedAt).toISOString()).toBe(checkedAt);
    expect(formatCheckedAt(result.checkedAt)).toMatch(/Nov 6, 2026/);
    expect(relativeCheckedAt(result.checkedAt, NOW)).toBe("9 hours ago");
  });
});

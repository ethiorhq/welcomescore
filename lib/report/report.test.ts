import { describe, expect, it } from "vitest";
import {
  assertValidReport,
  createReportFromAudit,
  ReportValidationError,
  validateReport,
} from "./schema";
import {
  futureSchemaReportFixture,
  malformedReportFixture,
  minimalValidReportFixture,
  unknownEvidenceReportFixture,
  validReportFixture,
} from "./fixtures";
import {
  safeParseReportJson,
  serializeReportToJson,
  serializeReportToMarkdown,
} from "./serialize";
import { isSupportedReportSchemaVersion, REPORT_SCHEMA_VERSION } from "./version";
import type { ScoreResult } from "@/lib/scoreRepo";

describe("Report schema and validation", () => {
  it("validates a complete, valid WelcomeScore report fixture", () => {
    const result = validateReport(validReportFixture);
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.report.schemaVersion).toBe("1.0");
      expect(result.report.repository.fullName).toBe("ethiorhq/welcomescore");
      expect(result.report.score).toBe(85);
      expect(result.report.nextUsefulMove?.id).toBe("starter-issue-quality");
    }
  });

  it("validates a minimal report omitting optional fields", () => {
    const result = validateReport(minimalValidReportFixture);
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.report.analyzedCommit).toBeUndefined();
      expect(result.report.nextUsefulMove).toBeNull();
      expect(result.report.goodFirstIssues).toEqual([]);
    }
  });

  it("accepts unknown evidence statuses and low confidence levels", () => {
    const result = validateReport(unknownEvidenceReportFixture);
    expect(result.valid).toBe(true);
    if (result.valid) {
      const unknownCheck = result.report.checks.find((c) => c.status === "unknown");
      expect(unknownCheck).toBeDefined();
      expect(unknownCheck?.confidence).toBe("low");
    }
  });

  it("rejects future schema versions", () => {
    const result = validateReport(futureSchemaReportFixture);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.some((err) => err.includes("schemaVersion"))).toBe(true);
    }
  });

  it("rejects malformed report data with descriptive error list", () => {
    const result = validateReport(malformedReportFixture);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some((err) => err.includes("score"))).toBe(true);
      expect(result.errors.some((err) => err.includes("toolVersion"))).toBe(true);
    }
  });

  it("rejects invalid check points that exceed maxPoints", () => {
    const invalidCheckReport = {
      ...validReportFixture,
      checks: [
        {
          ...validReportFixture.checks[0],
          points: 50,
          maxPoints: 20,
        },
      ],
    };
    const result = validateReport(invalidCheckReport);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.some((err) => err.includes("cannot exceed maxPoints"))).toBe(true);
    }
  });

  it("assertValidReport throws ReportValidationError for invalid inputs", () => {
    expect(() => assertValidReport(null)).toThrow(ReportValidationError);
    expect(() => assertValidReport({ invalid: true })).toThrow(ReportValidationError);
  });

  it("isSupportedReportSchemaVersion correctly guards supported versions", () => {
    expect(isSupportedReportSchemaVersion(REPORT_SCHEMA_VERSION)).toBe(true);
    expect(isSupportedReportSchemaVersion("2.0")).toBe(false);
    expect(isSupportedReportSchemaVersion(undefined)).toBe(false);
  });
});

describe("Report serialization", () => {
  it("serializes to JSON and safely roundtrips back through validation", () => {
    const json = serializeReportToJson(validReportFixture);
    expect(typeof json).toBe("string");
    expect(json.endsWith("\n")).toBe(true);

    const parsed = safeParseReportJson(json);
    expect(parsed.repository.fullName).toBe("ethiorhq/welcomescore");
    expect(parsed.score).toBe(85);
    expect(parsed.checks.length).toBe(6);
  });

  it("safeParseReportJson throws on invalid JSON syntax", () => {
    expect(() => safeParseReportJson("{ invalid json")).toThrow(/Malformed JSON/);
  });

  it("serializes to a clean, markdown document with all required sections", () => {
    const markdown = serializeReportToMarkdown(validReportFixture);
    expect(markdown).toContain("# WelcomeScore Audit Report: ethiorhq/welcomescore");
    expect(markdown).toContain("| **Score** | **85/100** |");
    expect(markdown).toContain("## Next Useful Move");
    expect(markdown).toContain("Keep starter issues clear and current");
    expect(markdown).toContain("## Evidence Breakdown");
    expect(markdown).toContain("CONTRIBUTING.md");
    expect(markdown).toContain("CODE_OF_CONDUCT.md");
    expect(markdown).toContain("README setup section");
    expect(markdown).toContain("## Starter Issues for New Contributors");
    expect(markdown).toContain("## Limitations & Privacy");
    expect(markdown).toContain("https://welcomescore.vercel.app/report/ethiorhq/welcomescore");
  });
});

describe("createReportFromAudit adapter", () => {
  it("adapts a deterministic ScoreResult into a valid WelcomeScoreReport", () => {
    const mockScoreResult: ScoreResult = {
      repo: "ethiorhq/welcomescore",
      score: 75,
      grade: "B",
      defaultBranch: "main",
      starsCount: 42,
      forksCount: 8,
      primaryLanguage: "TypeScript",
      hasReadme: true,
      hasLicense: true,
      isEligibleForLeaderboard: true,
      goodFirstIssueCount: 2,
      goodFirstIssues: [
        {
          title: "docs: update setup section in README",
          url: "https://github.com/ethiorhq/welcomescore/issues/1",
        },
      ],
      checks: [
        { label: "CONTRIBUTING.md", passed: true, points: 20 },
        { label: "CODE_OF_CONDUCT.md", passed: false, points: 0 },
        { label: "README setup section", passed: true, points: 15 },
        { label: "LICENSE", passed: true, points: 10 },
        { label: "Good-first-issue labels", passed: true, points: 15, maxPoints: 25 },
        { label: "Recently active", passed: true, points: 15 },
      ],
    };

    const report = createReportFromAudit(mockScoreResult, {
      analyzedCommit: "abc1234def5678",
      analyzedAt: "2026-10-20T02:00:00.000Z",
    });

    expect(report.schemaVersion).toBe("1.0");
    expect(report.repository.fullName).toBe("ethiorhq/welcomescore");
    expect(report.repository.owner).toBe("ethiorhq");
    expect(report.repository.name).toBe("welcomescore");
    expect(report.score).toBe(75);
    expect(report.grade).toBe("B");
    expect(report.analyzedCommit).toBe("abc1234def5678");
    expect(report.checks.length).toBe(6);

    const conductCheck = report.checks.find((c) => c.label === "CODE_OF_CONDUCT.md");
    expect(conductCheck?.status).toBe("missing");
    expect(conductCheck?.points).toBe(0);

    expect(report.nextUsefulMove).toBeDefined();
    expect(report.nextUsefulMove?.id).toBe("code-of-conduct");
    expect(report.nextUsefulMove?.patchPlan?.files).toContain("CODE_OF_CONDUCT.md");
    expect(report.coverage.percentage).toBe(100);

    // Verify it passes strict schema validation
    const validation = validateReport(report);
    expect(validation.valid).toBe(true);
  });
});

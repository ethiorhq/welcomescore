import { describe, expect, it, beforeEach } from "vitest";
import {
  resetRateLimitsForTesting,
  sanitizeCorrectionText,
  submitCorrection,
  validateCorrectionSubmission,
} from "./repository";
import { applyTriageDecision, canTransitionStatus } from "./triage";
import type { StoredCorrection } from "./types";

describe("Correction input validation and sanitization", () => {
  it("validates a complete, valid submission", () => {
    const input = {
      repo: "ethiorhq/welcomescore",
      evidenceId: "license",
      reason: "custom_license",
      explanation: "Our license is an OSI-approved proprietary source-available license.",
      sourceUrl: "https://github.com/ethiorhq/welcomescore/blob/main/LICENSE",
    };

    const result = validateCorrectionSubmission(input);
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.data.repo).toBe("ethiorhq/welcomescore");
      expect(result.data.reason).toBe("custom_license");
    }
  });

  it("validates a submission without an optional sourceUrl", () => {
    const input = {
      repo: "owner/repo",
      evidenceId: "readme-setup",
      reason: "external_location",
      explanation: "Setup documentation is hosted on docs.example.com/getting-started",
    };

    const result = validateCorrectionSubmission(input);
    expect(result.valid).toBe(true);
  });

  it("rejects invalid repository formats", () => {
    const result = validateCorrectionSubmission({
      repo: "invalid-format",
      evidenceId: "readme-setup",
      reason: "other",
      explanation: "Valid length explanation for tests.",
    });
    expect(result.valid).toBe(false);
  });

  it("rejects unknown reason categories", () => {
    const result = validateCorrectionSubmission({
      repo: "owner/repo",
      evidenceId: "readme-setup",
      reason: "not_a_valid_category",
      explanation: "Valid length explanation for tests.",
    });
    expect(result.valid).toBe(false);
  });

  it("rejects too short explanations (<10 chars)", () => {
    const result = validateCorrectionSubmission({
      repo: "owner/repo",
      evidenceId: "readme-setup",
      reason: "other",
      explanation: "Too short",
    });
    expect(result.valid).toBe(false);
  });

  it("rejects invalid source URLs", () => {
    const result = validateCorrectionSubmission({
      repo: "owner/repo",
      evidenceId: "readme-setup",
      reason: "other",
      explanation: "Valid length explanation for tests.",
      sourceUrl: "not-a-valid-url",
    });
    expect(result.valid).toBe(false);
  });

  it("sanitizes HTML tags and control characters", () => {
    const dirty = "Explanation with <script>alert('xss')</script> and \u0000bad chars.";
    const clean = sanitizeCorrectionText(dirty);
    expect(clean).not.toContain("<script>");
    expect(clean).not.toContain("</script>");
    expect(clean).not.toContain("\u0000");
  });
});

describe("Correction submission and rate limiting", () => {
  beforeEach(() => {
    resetRateLimitsForTesting();
  });

  it("accepts a valid submission and returns submitted status", async () => {
    const result = await submitCorrection(
      {
        repo: "owner/repo",
        evidenceId: "contributing-guide",
        reason: "external_location",
        explanation: "Located in .github/CONTRIBUTING.md",
      },
      "client-1",
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.status).toBe("submitted");
      expect(result.correctionId).toBeDefined();
    }
  });

  it("detects and flags duplicate open submissions for the same check", async () => {
    const submission = {
      repo: "owner/repo",
      evidenceId: "contributing-guide",
      reason: "external_location" as const,
      explanation: "Located in .github/CONTRIBUTING.md",
    };

    const first = await submitCorrection(submission, "client-2");
    expect(first.success).toBe(true);

    const second = await submitCorrection(submission, "client-2");
    expect(second.success).toBe(true);
    if (second.success) {
      expect(second.status).toBe("duplicate");
    }
  });

  it("enforces rate limits after exceeding threshold", async () => {
    const client = "spammer-network";
    for (let i = 0; i < 5; i++) {
      await submitCorrection(
        {
          repo: "owner/repo",
          evidenceId: `check-${i}`,
          reason: "other",
          explanation: `Valid explanation number ${i} for test.`,
        },
        client,
      );
    }

    const blocked = await submitCorrection(
      {
        repo: "owner/repo",
        evidenceId: "check-overflow",
        reason: "other",
        explanation: "This should be blocked by rate limiting.",
      },
      client,
    );

    expect(blocked.success).toBe(false);
    if (!blocked.success) {
      expect(blocked.code).toBe("RATE_LIMITED");
      expect(blocked.retryAfterSeconds).toBeDefined();
    }
  });
});

describe("Correction triage and review boundaries", () => {
  const baseCorrection: StoredCorrection = {
    id: "test-uuid",
    repo: "owner/repo",
    evidenceId: "license",
    reason: "custom_license",
    explanation: "Custom license in COPYING.md",
    status: "needs-review",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  it("allows transitions from needs-review to resolved with audit notes", () => {
    expect(canTransitionStatus("needs-review", "resolved")).toBe(true);

    const updated = applyTriageDecision(baseCorrection, {
      status: "resolved",
      triageNotes: "Verified COPYING.md is an approved license variant.",
      scoringRuleChange: "Added COPYING.md to conventional license detection.",
    });

    expect(updated.status).toBe("resolved");
    expect(updated.triageNotes).toContain("RESOLVED");
    expect(updated.triageNotes).toContain("COPYING.md");
  });

  it("allows transition to rejected with clear maintainer rationale", () => {
    const updated = applyTriageDecision(baseCorrection, {
      status: "rejected",
      triageNotes: "File could not be found at published branch.",
    });

    expect(updated.status).toBe("rejected");
    expect(updated.triageNotes).toContain("REJECTED");
  });
});

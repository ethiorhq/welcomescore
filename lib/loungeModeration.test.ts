import { describe, expect, it } from "vitest";
import { fallbackModerationAssessment, shouldAutoHide, validateLoungeModerationCandidate } from "@/lib/loungeModeration";

describe("Lounge moderation safety boundary", () => {
  it("permits automatic hiding only for a high-confidence serious violation", () => {
    const assessment = validateLoungeModerationCandidate(JSON.stringify({
      decision: "hide",
      category: "unsafe_link",
      confidence: "high",
      rationale: "The message contains a clear deceptive download link.",
    }), "groq", "test-model");

    expect(assessment?.decision).toBe("hide");
    expect(shouldAutoHide(assessment)).toBe(true);
  });

  it("downgrades low-confidence or non-serious hide requests to private review", () => {
    const assessment = validateLoungeModerationCandidate(JSON.stringify({
      decision: "hide",
      category: "spam",
      confidence: "medium",
      rationale: "The content appears promotional but the intent is uncertain.",
    }), "gemini", "test-model");

    expect(assessment).toMatchObject({
      decision: "needs_review",
      category: "spam",
      confidence: "medium",
    });
    expect(shouldAutoHide(assessment)).toBe(false);
  });

  it("keeps the deterministic fallback as a private-review decision", () => {
    expect(fallbackModerationAssessment()).toMatchObject({
      decision: "needs_review",
      provider: "deterministic",
      confidence: "low",
    });
  });

  it("rejects malformed provider JSON instead of making a moderation decision", () => {
    expect(validateLoungeModerationCandidate('{"decision":"hide"}', "groq", "test-model")).toBeNull();
  });
});

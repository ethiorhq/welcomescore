import { afterEach, describe, expect, it, vi } from "vitest";
import { issueLoungeHumanProof, verifyLoungeHumanProof } from "@/lib/loungeVerification";

const originalSecret = process.env.LOUNGE_CONTEXT_SIGNING_SECRET;
const sessionHash = "temporary-session-hash-123456789";

afterEach(() => {
  process.env.LOUNGE_CONTEXT_SIGNING_SECRET = originalSecret;
  vi.useRealTimers();
});

describe("Lounge human verification proof", () => {
  it("accepts a signed proof only after a brief human interaction interval", () => {
    process.env.LOUNGE_CONTEXT_SIGNING_SECRET = "test-only-context-secret-with-sufficient-length";
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-28T10:00:00.000Z"));
    const proof = issueLoungeHumanProof(sessionHash);

    expect(verifyLoungeHumanProof(proof, sessionHash)).toBe(false);
    vi.setSystemTime(new Date("2026-08-28T10:00:02.000Z"));
    expect(verifyLoungeHumanProof(proof, sessionHash)).toBe(true);
  });

  it("rejects a proof for a different anonymous session", () => {
    process.env.LOUNGE_CONTEXT_SIGNING_SECRET = "test-only-context-secret-with-sufficient-length";
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-28T10:00:00.000Z"));
    const proof = issueLoungeHumanProof(sessionHash);

    vi.setSystemTime(new Date("2026-08-28T10:00:02.000Z"));
    expect(verifyLoungeHumanProof(proof, "different-session-hash-123456789")).toBe(false);
  });

  it("rejects expired and tampered proofs", () => {
    process.env.LOUNGE_CONTEXT_SIGNING_SECRET = "test-only-context-secret-with-sufficient-length";
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-28T10:00:00.000Z"));
    const proof = issueLoungeHumanProof(sessionHash);

    vi.setSystemTime(new Date("2026-08-28T10:16:00.000Z"));
    expect(verifyLoungeHumanProof(proof, sessionHash)).toBe(false);
    expect(verifyLoungeHumanProof(`${proof}tampered`, sessionHash)).toBe(false);
  });
});

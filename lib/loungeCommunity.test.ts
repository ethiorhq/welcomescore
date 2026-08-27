import { afterEach, describe, expect, it } from "vitest";
import { createPreparedContext, isValidCommunityContext, readPreparedContext } from "@/lib/loungeCommunity";

const originalSecret = process.env.LOUNGE_CONTEXT_SIGNING_SECRET;

afterEach(() => {
  process.env.LOUNGE_CONTEXT_SIGNING_SECRET = originalSecret;
});

describe("verified Lounge context", () => {
  it("creates and reads a signed fresh audit context", () => {
    process.env.LOUNGE_CONTEXT_SIGNING_SECRET = "test-only-context-secret";
    const prepared = createPreparedContext({
      kind: "audit",
      repo: "ethiorhq/welcomescore",
      score: 100,
      grade: "A",
      checkedAt: "2026-08-27T12:00:00.000Z",
      auditPath: "/check/ethiorhq/welcomescore",
      source: "fresh-user-requested",
      focus: "readme-setup",
    });

    expect(prepared).not.toBeNull();
    expect(readPreparedContext(prepared?.token)).toMatchObject({
      kind: "audit",
      repo: "ethiorhq/welcomescore",
      score: 100,
      focus: "readme-setup",
    });
  });

  it("rejects a token if its public payload was changed", () => {
    process.env.LOUNGE_CONTEXT_SIGNING_SECRET = "test-only-context-secret";
    const prepared = createPreparedContext({
      kind: "audit",
      repo: "ethiorhq/welcomescore",
      score: 75,
      grade: "B",
      checkedAt: "2026-08-27T12:00:00.000Z",
      auditPath: "/check/ethiorhq/welcomescore",
      source: "fresh-user-requested",
    });
    const [version, payload, signature] = prepared!.token.split(".");
    const editedPayload = Buffer.from(
      JSON.stringify({
        ...JSON.parse(Buffer.from(payload, "base64url").toString("utf8")),
        context: {
          ...JSON.parse(Buffer.from(payload, "base64url").toString("utf8")).context,
          score: 100,
        },
      }),
      "utf8",
    ).toString("base64url");

    expect(readPreparedContext(`${version}.${editedPayload}.${signature}`)).toBeNull();
  });

  it("rejects invalid context shapes and accepts dated Hall context", () => {
    expect(isValidCommunityContext({ kind: "audit", repo: "bad repo", score: 50 })).toBe(false);
    expect(isValidCommunityContext({
      kind: "hall",
      evaluationId: "entry-id",
      repo: "ethiorhq/welcomescore",
      score: 100,
      grade: "A",
      evaluatedAt: "2026-08-27T12:00:00.000Z",
      freshness: "stale",
      auditPath: "/check/ethiorhq/welcomescore",
      source: "existing-hall-listing",
    })).toBe(true);
  });

  it("does not issue a token while the server-only signing secret is unavailable", () => {
    delete process.env.LOUNGE_CONTEXT_SIGNING_SECRET;
    expect(createPreparedContext({
      kind: "audit",
      repo: "ethiorhq/welcomescore",
      score: 100,
      grade: "A",
      checkedAt: "2026-08-27T12:00:00.000Z",
      auditPath: "/check/ethiorhq/welcomescore",
      source: "fresh-user-requested",
    })).toBeNull();
  });
});

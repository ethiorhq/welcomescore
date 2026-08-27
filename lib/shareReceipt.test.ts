import { describe, expect, it } from "vitest";
import type { ScoreResult } from "@/lib/scoreRepo";
import {
  buildVerifiedAuditReceiptPayload,
  createShareReceiptToken,
  verifyShareReceiptToken,
} from "@/lib/shareReceipt";
import { getShareCaption, isAllowedShareCaption } from "@/lib/shareTypes";

const TEST_SECRET = "test-secret-value-with-at-least-thirty-two-characters";
const issuedAt = new Date("2026-08-27T00:00:00.000Z");

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
      { label: "Good-first-issue labels", passed: true, points: 15, maxPoints: 25 },
      { label: "Recently active", passed: true, points: 15 },
    ],
    defaultBranch: "main",
    primaryLanguage: "TypeScript",
    goodFirstIssues: [],
    goodFirstIssueCount: 6,
    starsCount: 0,
    forksCount: 0,
    hasReadme: true,
    hasLicense: true,
    isEligibleForLeaderboard: false,
    ...overrides,
  };
}

describe("Share With Purpose receipts", () => {
  it("uses only explicitly selected, currently passed public signals", () => {
    const receipt = buildVerifiedAuditReceiptPayload(
      makeResult(),
      ["CONTRIBUTING.md", "README setup section", "Good-first-issue labels"],
      issuedAt,
    );

    expect(receipt.passedCheckLabels).toEqual([
      "CONTRIBUTING.md",
      "Good-first-issue labels",
    ]);
    expect(receipt.goodFirstIssueCount).toBe(6);
    expect(receipt).not.toHaveProperty("goodFirstIssues");
    expect(receipt).not.toHaveProperty("starsCount");
    expect(receipt.expiresAt).toBe("2026-09-17T00:00:00.000Z");
  });

  it("omits optional signals when a person chooses no optional evidence", () => {
    const receipt = buildVerifiedAuditReceiptPayload(makeResult(), [], issuedAt);

    expect(receipt.passedCheckLabels).toEqual([]);
    expect(receipt.goodFirstIssueCount).toBe(0);
  });

  it("signs and verifies the exact allowlisted receipt payload", async () => {
    const payload = buildVerifiedAuditReceiptPayload(
      makeResult(),
      ["CONTRIBUTING.md", "LICENSE"],
      issuedAt,
    );
    const token = await createShareReceiptToken(payload, TEST_SECRET);
    const verified = await verifyShareReceiptToken(token, TEST_SECRET, issuedAt);

    expect(verified).toEqual(payload);
  });

  it("rejects a token whose signed payload has been changed", async () => {
    const payload = buildVerifiedAuditReceiptPayload(makeResult(), [], issuedAt);
    const token = await createShareReceiptToken(payload, TEST_SECRET);
    const [payloadPart, signaturePart] = token.split(".");
    const tampered = `${payloadPart.slice(0, -1)}${payloadPart.endsWith("A") ? "B" : "A"}.${signaturePart}`;

    await expect(verifyShareReceiptToken(tampered, TEST_SECRET, issuedAt)).rejects.toMatchObject({
      code: "invalid-receipt",
    });
  });

  it("does not render an expired receipt as current evidence", async () => {
    const payload = buildVerifiedAuditReceiptPayload(makeResult(), [], issuedAt);
    const token = await createShareReceiptToken(payload, TEST_SECRET);

    await expect(
      verifyShareReceiptToken(token, TEST_SECRET, new Date("2026-09-17T00:00:00.000Z")),
    ).rejects.toMatchObject({
      code: "expired-receipt",
    });
  });

  it("blocks manipulation and certification wording from sharing controls", () => {
    expect(isAllowedShareCaption("Please star this repo and follow for updates.")).toBe(false);
    expect(isAllowedShareCaption("This project is officially approved and security-verified.")).toBe(false);
    expect(isAllowedShareCaption("Could a newcomer review the public setup path?")).toBe(true);
  });

  it("keeps generated sharing copy factual and non-promotional", () => {
    const caption = getShareCaption({
      intent: "request-setup-feedback",
      repo: "owner/repo",
      receiptUrl: "https://welcomescore.vercel.app/share/receipt/example",
      issuedAt: issuedAt.toISOString(),
    });

    expect(caption).toContain("dated public snapshot");
    expect(caption).toContain("not a quality or security certification");
    expect(caption.toLowerCase()).not.toContain("star this");
    expect(caption.toLowerCase()).not.toContain("fork this");
  });
});

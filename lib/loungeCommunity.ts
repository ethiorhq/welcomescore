import { createHmac, randomUUID, timingSafeEqual } from "crypto";
import { isLoungeFocus } from "@/lib/loungeTypes";
import type { LoungeCommunityContext, LoungePreparedContext } from "@/lib/loungeTypes";

export type { LoungeCommunityContext, LoungePreparedContext } from "@/lib/loungeTypes";

type ContextTokenPayload = {
  context: LoungeCommunityContext;
  exp: number;
  nonce: string;
};

const TOKEN_VERSION = "v1";
const TOKEN_TTL_MS = 10 * 60 * 1000;
const repositoryPath = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;

export function createPreparedContext(context: LoungeCommunityContext): LoungePreparedContext | null {
  const secret = process.env.LOUNGE_CONTEXT_SIGNING_SECRET;
  if (!secret) {
    return null;
  }

  const payload: ContextTokenPayload = {
    context,
    exp: Date.now() + TOKEN_TTL_MS,
    nonce: randomUUID(),
  };
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signature = sign(encodedPayload, secret);

  return {
    token: `${TOKEN_VERSION}.${encodedPayload}.${signature}`,
    context,
    expiresAt: new Date(payload.exp).toISOString(),
  };
}

export function readPreparedContext(token: unknown): LoungeCommunityContext | null {
  const secret = process.env.LOUNGE_CONTEXT_SIGNING_SECRET;
  if (!secret || typeof token !== "string") {
    return null;
  }

  const [version, encodedPayload, signature, extra] = token.split(".");
  if (version !== TOKEN_VERSION || !encodedPayload || !signature || extra) {
    return null;
  }

  const expected = sign(encodedPayload, secret);
  if (!signaturesMatch(signature, expected)) {
    return null;
  }

  try {
    const rawPayload = JSON.parse(fromBase64Url(encodedPayload)) as Partial<ContextTokenPayload>;
    if (!rawPayload || typeof rawPayload.exp !== "number" || rawPayload.exp <= Date.now()) {
      return null;
    }

    return isValidCommunityContext(rawPayload.context) ? rawPayload.context : null;
  } catch {
    return null;
  }
}

export function isValidCommunityContext(value: unknown): value is LoungeCommunityContext {
  if (!value || typeof value !== "object") {
    return false;
  }

  const context = value as Record<string, unknown>;
  const score = Number(context.score);
  const baseIsValid = repositoryPath.test(String(context.repo ?? ""))
    && Number.isInteger(score)
    && score >= 0
    && score <= 100
    && typeof context.grade === "string"
    && context.grade.length >= 1
    && context.grade.length <= 4
    && typeof context.auditPath === "string"
    && context.auditPath.startsWith("/check/");

  if (!baseIsValid) {
    return false;
  }

  if (context.kind === "audit") {
    return context.source === "fresh-user-requested"
      && typeof context.checkedAt === "string"
      && (!context.focus || isLoungeFocus(context.focus));
  }

  if (context.kind === "hall") {
    return context.source === "existing-hall-listing"
      && typeof context.evaluationId === "string"
      && typeof context.evaluatedAt === "string"
      && (context.freshness === "fresh" || context.freshness === "stale" || context.freshness === "expired");
  }

  return false;
}

function sign(value: string, secret: string) {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

function signaturesMatch(actual: string, expected: string) {
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}

function toBase64Url(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function fromBase64Url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

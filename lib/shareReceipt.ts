import type { ScoreResult } from "@/lib/scoreRepo";
import { parseRepository } from "@/lib/scoreRepo";
import {
  isShareableCheckLabel,
  type ShareableCheckLabel,
  type VerifiedAuditReceiptPayload,
} from "@/lib/shareTypes";

const RECEIPT_VERSION = 1;
const RECEIPT_LIFETIME_MS = 21 * 24 * 60 * 60 * 1000;
const MAX_TOKEN_LENGTH = 2_048;
const encoder = new TextEncoder();
const decoder = new TextDecoder();

export const SHARE_RECEIPT_UNAVAILABLE = "receipt-unavailable";
export const SHARE_RECEIPT_INVALID = "invalid-receipt";
export const SHARE_RECEIPT_EXPIRED = "expired-receipt";

export type ShareReceiptErrorCode =
  | typeof SHARE_RECEIPT_UNAVAILABLE
  | typeof SHARE_RECEIPT_INVALID
  | typeof SHARE_RECEIPT_EXPIRED;

export class ShareReceiptError extends Error {
  constructor(public readonly code: ShareReceiptErrorCode) {
    super(code);
    this.name = "ShareReceiptError";
  }
}

export function isShareReceiptConfigured() {
  return Boolean(process.env.SHARE_RECEIPT_SIGNING_SECRET?.trim());
}

export function buildVerifiedAuditReceiptPayload(
  result: ScoreResult,
  selectedLabels: readonly ShareableCheckLabel[] = [],
  now = new Date(),
): VerifiedAuditReceiptPayload {
  const issuedAt = now.toISOString();
  const expiresAt = new Date(now.getTime() + RECEIPT_LIFETIME_MS).toISOString();
  const selected = new Set(selectedLabels);
  const passedCheckLabels = result.checks
    .filter((check) => check.passed && selected.has(check.label as ShareableCheckLabel))
    .map((check) => check.label)
    .filter(isShareableCheckLabel);

  return {
    version: RECEIPT_VERSION,
    repo: result.repo,
    issuedAt,
    expiresAt,
    score: result.score,
    grade: result.grade,
    passedCheckLabels,
    goodFirstIssueCount: selected.has("Good-first-issue labels")
      ? Math.max(0, result.goodFirstIssueCount)
      : 0,
    defaultBranch: result.defaultBranch,
    source: "explicit-fresh-audit",
  };
}

export async function createShareReceiptToken(
  payload: VerifiedAuditReceiptPayload,
  secret = getSigningSecret(),
) {
  const payloadPart = base64UrlEncode(encoder.encode(JSON.stringify(payload)));
  const signature = await sign(payloadPart, secret);

  return `${payloadPart}.${base64UrlEncode(signature)}`;
}

export async function verifyShareReceiptToken(
  token: string,
  secret = getSigningSecret(),
  now = new Date(),
): Promise<VerifiedAuditReceiptPayload> {
  if (typeof token !== "string" || token.length === 0 || token.length > MAX_TOKEN_LENGTH) {
    throw new ShareReceiptError(SHARE_RECEIPT_INVALID);
  }

  const [payloadPart, signaturePart, unexpectedPart] = token.split(".");
  if (
    !payloadPart ||
    !signaturePart ||
    unexpectedPart ||
    !isBase64Url(payloadPart) ||
    !isBase64Url(signaturePart)
  ) {
    throw new ShareReceiptError(SHARE_RECEIPT_INVALID);
  }

  const isValid = await verify(payloadPart, base64UrlDecode(signaturePart), secret);
  if (!isValid) {
    throw new ShareReceiptError(SHARE_RECEIPT_INVALID);
  }

  let candidate: unknown;
  try {
    candidate = JSON.parse(decoder.decode(base64UrlDecode(payloadPart)));
  } catch {
    throw new ShareReceiptError(SHARE_RECEIPT_INVALID);
  }

  const payload = parseReceiptPayload(candidate);
  if (new Date(payload.expiresAt).getTime() <= now.getTime()) {
    throw new ShareReceiptError(SHARE_RECEIPT_EXPIRED);
  }

  return payload;
}

export function getReceiptCacheControl(payload: VerifiedAuditReceiptPayload, now = new Date()) {
  const secondsUntilExpiry = Math.max(
    0,
    Math.floor((new Date(payload.expiresAt).getTime() - now.getTime()) / 1_000),
  );

  return `public, max-age=0, s-maxage=${Math.min(secondsUntilExpiry, 300)}, stale-while-revalidate=0`;
}

function getSigningSecret() {
  const secret = process.env.SHARE_RECEIPT_SIGNING_SECRET?.trim();
  if (!secret || secret.length < 32) {
    throw new ShareReceiptError(SHARE_RECEIPT_UNAVAILABLE);
  }

  return secret;
}

async function sign(value: string, secret: string) {
  const key = await getHmacKey(secret, ["sign"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(value)));
}

async function verify(value: string, signature: Uint8Array, secret: string) {
  const key = await getHmacKey(secret, ["verify"]);
  const signatureBuffer = signature.buffer.slice(
    signature.byteOffset,
    signature.byteOffset + signature.byteLength,
  ) as ArrayBuffer;

  return crypto.subtle.verify("HMAC", key, signatureBuffer, encoder.encode(value));
}

async function getHmacKey(secret: string, usages: KeyUsage[]) {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { hash: "SHA-256", name: "HMAC" },
    false,
    usages,
  );
}

function parseReceiptPayload(value: unknown): VerifiedAuditReceiptPayload {
  if (!isRecord(value)) {
    throw new ShareReceiptError(SHARE_RECEIPT_INVALID);
  }

  const parsedRepository = parseRepository(stringValue(value.repo));
  const issuedAt = validIsoDate(value.issuedAt);
  const expiresAt = validIsoDate(value.expiresAt);
  const score = numberValue(value.score);
  const grade = stringValue(value.grade);
  const defaultBranch = stringValue(value.defaultBranch);
  const passedCheckLabels = Array.isArray(value.passedCheckLabels)
    ? value.passedCheckLabels.filter(isShareableCheckLabel)
    : [];
  const hasOnlyValidLabels =
    Array.isArray(value.passedCheckLabels) &&
    passedCheckLabels.length === value.passedCheckLabels.length;
  const goodFirstIssueCount = numberValue(value.goodFirstIssueCount);

  if (
    value.version !== RECEIPT_VERSION ||
    value.source !== "explicit-fresh-audit" ||
    !parsedRepository ||
    `${parsedRepository.owner}/${parsedRepository.repo}` !== value.repo ||
    !issuedAt ||
    !expiresAt ||
    new Date(expiresAt).getTime() - new Date(issuedAt).getTime() !== RECEIPT_LIFETIME_MS ||
    !Number.isInteger(score) ||
    score < 0 ||
    score > 100 ||
    !/^[A-F]$/.test(grade) ||
    defaultBranch.length === 0 ||
    defaultBranch.length > 256 ||
    !hasOnlyValidLabels ||
    passedCheckLabels.length > 6 ||
    !Number.isInteger(goodFirstIssueCount) ||
    goodFirstIssueCount < 0 ||
    goodFirstIssueCount > 100_000
  ) {
    throw new ShareReceiptError(SHARE_RECEIPT_INVALID);
  }

  return {
    version: RECEIPT_VERSION,
    repo: value.repo,
    issuedAt,
    expiresAt,
    score,
    grade,
    passedCheckLabels,
    goodFirstIssueCount,
    defaultBranch,
    source: "explicit-fresh-audit",
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

function numberValue(value: unknown) {
  return typeof value === "number" ? value : Number.NaN;
}

function validIsoDate(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date.toISOString() === value ? value : "";
}

function base64UrlEncode(bytes: Uint8Array) {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlDecode(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(`${normalized}${padding}`);

  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function isBase64Url(value: string) {
  return /^[A-Za-z0-9_-]+$/.test(value);
}

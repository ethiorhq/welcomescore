import { createHmac, randomUUID, timingSafeEqual } from "crypto";

const PROOF_TTL_MS = 15 * 60 * 1000;
const MIN_INTERACTION_MS = 1_500;
const PROOF_VERSION = "v1";

export type LoungeTurnstileAction = "lounge_message" | "lounge_report";

type TurnstileResponse = {
  success?: boolean;
  hostname?: string;
  action?: string;
  "error-codes"?: string[];
};

export function issueLoungeHumanProof(sessionHash: string) {
  const issuedAt = Date.now();
  const nonce = randomUUID();
  const payload = `${PROOF_VERSION}.${issuedAt}.${nonce}.${sessionHash}`;
  return `${Buffer.from(payload, "utf8").toString("base64url")}.${sign(payload, proofSecret())}`;
}

export function verifyLoungeHumanProof(value: unknown, expectedSessionHash: string) {
  if (typeof value !== "string" || value.length > 700) {
    return false;
  }
  const [encodedPayload, signature, ...extra] = value.split(".");
  if (!encodedPayload || !signature || extra.length > 0) {
    return false;
  }

  let payload: string;
  try {
    payload = Buffer.from(encodedPayload, "base64url").toString("utf8");
  } catch {
    return false;
  }

  const expectedSignature = sign(payload, proofSecret());
  if (!safeEqual(signature, expectedSignature)) {
    return false;
  }

  const [version, issuedAtText, nonce, sessionHash, ...rest] = payload.split(".");
  const issuedAt = Number(issuedAtText);
  if (
    version !== PROOF_VERSION
    || rest.length > 0
    || !nonce
    || !Number.isFinite(issuedAt)
    || sessionHash !== expectedSessionHash
    || issuedAt > Date.now() + 30_000
    || Date.now() - issuedAt > PROOF_TTL_MS
    || Date.now() - issuedAt < MIN_INTERACTION_MS
  ) {
    return false;
  }

  return true;
}

export function deriveLoungeNetworkBucket(request: Request) {
  const networkValue = readNetworkValue(request);
  return createHmac("sha256", abuseSalt()).update(networkValue).digest("base64url");
}

export function loungeRequestHost(request: Request) {
  try {
    return new URL(request.url).hostname.toLowerCase();
  } catch {
    return "";
  }
}

export function isTurnstileEnabled() {
  return Boolean(
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim()
      && process.env.TURNSTILE_SECRET_KEY?.trim()
      && allowedTurnstileHosts().length > 0,
  );
}

export async function verifyTurnstileToken(input: {
  token: unknown;
  action: LoungeTurnstileAction;
  request: Request;
}) {
  if (!isTurnstileEnabled()) {
    return { enabled: false, valid: true } as const;
  }
  if (typeof input.token !== "string" || input.token.length < 1 || input.token.length > 2_048) {
    return { enabled: true, valid: false, reason: "missing" } as const;
  }

  const body = new FormData();
  body.set("secret", process.env.TURNSTILE_SECRET_KEY!.trim());
  body.set("response", input.token);
  body.set("idempotency_key", randomUUID());

  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body,
      signal: AbortSignal.timeout(8_000),
      cache: "no-store",
    });
    const result = (await response.json()) as TurnstileResponse;
    const allowedHosts = allowedTurnstileHosts();
    const hostname = result.hostname?.toLowerCase() ?? "";
    const expectedRequestHost = loungeRequestHost(input.request);
    const valid = response.ok
      && result.success === true
      && result.action === input.action
      && allowedHosts.includes(hostname)
      && (expectedRequestHost === "" || allowedHosts.includes(expectedRequestHost));

    if (!valid) {
      console.warn("Lounge Turnstile verification failed", {
        status: response.status,
        action: input.action,
        hostname: hostname || "unavailable",
        codes: result["error-codes"] ?? [],
      });
    }
    return { enabled: true, valid, reason: valid ? undefined : "rejected" } as const;
  } catch (error) {
    console.warn("Lounge Turnstile verification failed", {
      action: input.action,
      failure: error instanceof Error ? error.name : "unknown",
    });
    return { enabled: true, valid: false, reason: "unavailable" } as const;
  }
}

function proofSecret() {
  const value = process.env.LOUNGE_CONTEXT_SIGNING_SECRET?.trim();
  if (!value || value.length < 24) {
    throw new Error("LOUNGE_CONTEXT_SIGNING_SECRET is required for Lounge verification.");
  }
  return value;
}

function abuseSalt() {
  return process.env.LOUNGE_ABUSE_SALT?.trim() || proofSecret();
}

function allowedTurnstileHosts() {
  return (process.env.TURNSTILE_ALLOWED_HOSTNAMES ?? "")
    .split(",")
    .map((host) => host.trim().toLowerCase())
    .filter((host) => /^[a-z0-9.-]+$/.test(host));
}

function readNetworkValue(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const candidate = request.headers.get("cf-connecting-ip")?.trim()
    || request.headers.get("x-real-ip")?.trim()
    || forwarded
    || request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim();
  return candidate || "unknown-network";
}

function sign(value: string, secret: string) {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

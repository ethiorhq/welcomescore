import type { AlgofoxReview, TrustedReviewContext } from "@/lib/review/types";
import type { VariantHistory } from "@/lib/variation";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_KEY;

type CacheRow = {
  payload: unknown;
  expires_at: string;
};

export type ReviewCacheEntry = {
  review: unknown;
  variationHistory: VariantHistory;
  expiresAt: string;
};

type StoredReviewPayload = {
  review: unknown;
  variationHistory?: VariantHistory;
};

function isConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_SERVICE_KEY);
}

export async function readReviewCache(contextHash: string): Promise<ReviewCacheEntry | null> {
  if (!isConfigured()) {
    return null;
  }

  try {
    const query = new URLSearchParams({
      select: "payload,expires_at",
      context_hash: `eq.${contextHash}`,
      expires_at: `gt.${new Date().toISOString()}`,
      limit: "1",
    });
    const response = await request(`/rest/v1/review_cache?${query.toString()}`);
    if (!response.ok) {
      return null;
    }

    const rows = (await response.json()) as CacheRow[];
    const row = rows[0];
    if (!row) {
      return null;
    }

    return {
      review: readStoredReview(row.payload).review,
      variationHistory: readStoredReview(row.payload).variationHistory,
      expiresAt: row.expires_at,
    };
  } catch {
    return null;
  }
}

export async function writeReviewCache(
  context: TrustedReviewContext,
  contextHash: string,
  review: AlgofoxReview,
  variationHistory: VariantHistory = {},
  expiresAt?: string,
) {
  if (!isConfigured()) {
    return false;
  }

  const ttlHours = review.provider === "rule-engine" ? 24 : 24 * 7;
  const nextExpiresAt = expiresAt ?? new Date(Date.now() + ttlHours * 60 * 60 * 1000).toISOString();

  try {
    const response = await request("/rest/v1/review_cache?on_conflict=context_hash", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({
        repo_path: context.repo,
        context_hash: contextHash,
        review_version: context.schemaVersion,
        score: context.score,
        // New rows retain variation history beside the review in the private
        // existing payload. Older rows remain readable as their raw review.
        payload: { review, variationHistory },
        provider_used: review.provider,
        expires_at: nextExpiresAt,
      }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function consumeReviewRateLimit(bucket: string) {
  if (!isConfigured()) {
    return true;
  }

  try {
    const response = await request("/rest/v1/rpc/consume_review_rate_limit", {
      method: "POST",
      body: JSON.stringify({
        p_bucket: bucket,
        p_limit: 12,
        p_window_seconds: 60 * 60,
      }),
    });
    return response.ok && (await response.json()) === true;
  } catch {
    // A cache or rate-limit-table outage should not make a deterministic review unavailable.
    return true;
  }
}

function readStoredReview(payload: unknown): Required<Pick<StoredReviewPayload, "review" | "variationHistory">> {
  if (!payload || typeof payload !== "object" || Array.isArray(payload) || !("review" in payload)) {
    return { review: payload, variationHistory: {} };
  }

  const stored = payload as StoredReviewPayload;
  return {
    review: stored.review,
    variationHistory: isVariantHistory(stored.variationHistory) ? stored.variationHistory : {},
  };
}

function isVariantHistory(value: unknown): value is VariantHistory {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  return Object.values(value as Record<string, unknown>).every(
    (index) => typeof index === "number" && Number.isInteger(index) && index >= 0,
  );
}

async function request(path: string, init: RequestInit = {}) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    throw new Error("Algofox review cache is not configured");
  }

  const headers = new Headers(init.headers);
  headers.set("apikey", SUPABASE_SERVICE_KEY);
  headers.set("Authorization", `Bearer ${SUPABASE_SERVICE_KEY}`);
  headers.set("Content-Type", "application/json");

  return fetch(`${SUPABASE_URL}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });
}

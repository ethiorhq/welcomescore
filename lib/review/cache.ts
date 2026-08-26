import "server-only";

import type { AlgofoxReview, TrustedReviewContext } from "@/lib/review/types";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_KEY;

type CacheRow = {
  payload: unknown;
};

function isConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_SERVICE_KEY);
}

export async function readReviewCache(contextHash: string) {
  if (!isConfigured()) {
    return null;
  }

  try {
    const query = new URLSearchParams({
      select: "payload",
      context_hash: `eq.${contextHash}`,
      expires_at: `gt.${new Date().toISOString()}`,
      limit: "1",
    });
    const response = await request(`/rest/v1/review_cache?${query.toString()}`);
    if (!response.ok) {
      return null;
    }

    const rows = (await response.json()) as CacheRow[];
    return rows[0]?.payload ?? null;
  } catch {
    return null;
  }
}

export async function writeReviewCache(
  context: TrustedReviewContext,
  contextHash: string,
  review: AlgofoxReview,
) {
  if (!isConfigured()) {
    return false;
  }

  const ttlHours = review.provider === "rule-engine" ? 24 : 24 * 7;
  const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000).toISOString();

  try {
    const response = await request("/rest/v1/review_cache?on_conflict=context_hash", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({
        repo_path: context.repo,
        context_hash: contextHash,
        review_version: context.schemaVersion,
        score: context.score,
        payload: review,
        provider_used: review.provider,
        expires_at: expiresAt,
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

import "server-only";
import { randomUUID } from "node:crypto";
import type { StoredSubscriber, SubscriberResult } from "./types";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.SUPABASE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const SUBSCRIBERS_TABLE = "subscribers";

// Rate limiting: 10 attempts per IP per 10 minutes
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const ipRateLimitBuckets = new Map<string, { count: number; windowStart: number }>();

// In-memory subscriber storage for testing and offline/local development
const memorySubscribers = new Map<string, StoredSubscriber>();

export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_KEY);
}

export function checkRateLimit(clientIp: string): { allowed: boolean; retryAfterSeconds?: number } {
  const now = Date.now();
  const bucket = ipRateLimitBuckets.get(clientIp);

  if (!bucket || now - bucket.windowStart > RATE_LIMIT_WINDOW_MS) {
    ipRateLimitBuckets.set(clientIp, { count: 1, windowStart: now });
    return { allowed: true };
  }

  if (bucket.count >= RATE_LIMIT_MAX) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((bucket.windowStart + RATE_LIMIT_WINDOW_MS - now) / 1000),
    );
    return { allowed: false, retryAfterSeconds };
  }

  bucket.count += 1;
  return { allowed: true };
}

export async function subscribeEmail(
  email: string,
  source = "welcomescore_app",
  clientIp = "unknown-client",
): Promise<SubscriberResult> {
  // 1. Rate limiting
  const rateLimit = checkRateLimit(clientIp);
  if (!rateLimit.allowed) {
    return {
      success: false,
      error: "Too many subscription attempts. Please wait a few minutes before trying again.",
      code: "RATE_LIMITED",
      retryAfterSeconds: rateLimit.retryAfterSeconds,
    };
  }

  // 2. If Supabase is configured, persist to PostgreSQL
  if (isSupabaseConfigured()) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/${SUBSCRIBERS_TABLE}`, {
        method: "POST",
        headers: {
          apikey: SUPABASE_KEY!,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify({ email, source }),
        cache: "no-store",
      });

      if (response.ok) {
        const rows = (await response.json().catch(() => [])) as Array<{ id?: string }>;
        return {
          success: true,
          message: "You're on the list! Thank you for supporting WelcomeScore.",
          isExisting: false,
          id: rows[0]?.id,
        };
      }

      // Check for duplicate conflict (PostgreSQL 23505 unique_violation or HTTP 409)
      const errorBody = await response.text();
      if (
        response.status === 409 ||
        errorBody.includes("23505") ||
        errorBody.toLowerCase().includes("duplicate key") ||
        errorBody.toLowerCase().includes("unique constraint")
      ) {
        return {
          success: true,
          message: "You're already on the list! Thank you for supporting WelcomeScore.",
          isExisting: true,
        };
      }

      // Check if table migration is pending in Supabase (relation doesn't exist)
      if (
        response.status === 404 ||
        errorBody.includes("PGRST205") ||
        errorBody.toLowerCase().includes("does not exist") ||
        errorBody.toLowerCase().includes("could not find the table")
      ) {
        console.warn(
          "[WelcomeScore Subscribers] Table 'subscribers' is pending migration in Supabase. Storing in memory fallback. Please run supabase/migrations/20261020_subscribers.sql in your Supabase SQL Editor.",
        );
        const isExisting = memorySubscribers.has(email);
        if (!isExisting) {
          memorySubscribers.set(email, {
            id: randomUUID(),
            email,
            source,
            createdAt: new Date().toISOString(),
          });
        }
        return {
          success: true,
          message: "You're on the list! Thank you for supporting WelcomeScore.",
          isExisting,
        };
      }

      console.error("[WelcomeScore Subscribers] Supabase error:", response.status, errorBody);
      return {
        success: false,
        error: "Subscription service encountered an error. Please try again shortly.",
        code: "SUPABASE_ERROR",
      };
    } catch (err) {
      console.error("[WelcomeScore Subscribers] Fetch error:", err);
      // Network or unexpected issue connecting to Supabase: fall back to memory
    }
  }

  // 3. Fallback in-memory storage (offline, testing, or dev without Supabase keys)
  const isExisting = memorySubscribers.has(email);
  if (!isExisting) {
    const subscriber: StoredSubscriber = {
      id: randomUUID(),
      email,
      source,
      createdAt: new Date().toISOString(),
    };
    memorySubscribers.set(email, subscriber);
  }

  return {
    success: true,
    message: isExisting
      ? "You're already on the list! Thank you for supporting WelcomeScore."
      : "You're on the list! Thank you for supporting WelcomeScore.",
    isExisting,
  };
}

export function getMemorySubscribersCount(): number {
  return memorySubscribers.size;
}

export function resetMemorySubscribers(): void {
  memorySubscribers.clear();
  ipRateLimitBuckets.clear();
}

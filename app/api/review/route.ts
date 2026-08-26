import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  consumeReviewRateLimit,
  readReviewCache,
  writeReviewCache,
} from "@/lib/review/cache";
import { reviewContextHash } from "@/lib/review/context";
import { generateDeterministicReview } from "@/lib/review/deterministic";
import { generateProviderReview } from "@/lib/review/providers";
import { createTrustedReviewContext, validateAlgofoxReview } from "@/lib/review/types";
import { parseRepository, scoreRepo, ScoreRepoError } from "@/lib/scoreRepo";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { repo?: unknown } | null;
  const repository = parseRepository(typeof body?.repo === "string" ? body.repo : "");

  if (!repository) {
    return response({ error: "invalid-format" }, 400);
  }

  const rateLimitSalt = process.env.ALGOFOX_REVIEW_RATE_LIMIT_SALT;
  if (rateLimitSalt) {
    const bucket = rateLimitBucket(request, rateLimitSalt);
    const allowed = await consumeReviewRateLimit(bucket);
    if (!allowed) {
      return response({ error: "rate-limit" }, 429);
    }
  }

  try {
    const result = await scoreRepo(repository.owner, repository.repo);
    const context = createTrustedReviewContext(result);
    const contextHash = reviewContextHash(context);
    const cached = await readReviewCache(contextHash);
    const cachedReview = validateAlgofoxReview(cached, context);

    const hasConfiguredProvider = Boolean(process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY);
    const shouldUpgradeDeterministicCache =
      cachedReview?.provider === "rule-engine" && hasConfiguredProvider;

    if (cachedReview && !shouldUpgradeDeterministicCache) {
      return response({ review: cachedReview, cache: "hit" });
    }

    const providerReview = await generateProviderReview(context);
    const review = providerReview ?? cachedReview ?? generateDeterministicReview(context);

    if (providerReview || !cachedReview) {
      await writeReviewCache(context, contextHash, review);
    }

    return response({
      review,
      cache: providerReview && cachedReview ? "upgraded" : cachedReview ? "hit" : "miss",
    });
  } catch (error) {
    if (error instanceof ScoreRepoError) {
      return response({ error: error.code }, error.status);
    }

    console.error("Unable to generate Algofox review", error);
    return response({ error: "upstream-error" }, 502);
  }
}

function response(payload: Record<string, unknown>, status = 200) {
  return NextResponse.json(payload, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function rateLimitBucket(request: NextRequest, salt: string) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const client = forwarded || request.headers.get("x-real-ip") || "unknown";
  return createHash("sha256").update(`${salt}:${client}`).digest("hex");
}

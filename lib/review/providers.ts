import "server-only";

import { reviewProviderPrompt } from "@/lib/review/context";
import {
  ALGOFOX_REVIEW_SCHEMA_VERSION,
  validateAlgofoxReview,
  type AlgofoxReview,
  type ReviewProvider,
  type TrustedReviewContext,
} from "@/lib/review/types";

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    schemaVersion: { type: "integer", enum: [ALGOFOX_REVIEW_SCHEMA_VERSION] },
    mode: { type: "string", enum: ["motivation", "tough-love", "celebration"] },
    spriteState: { type: "string", enum: ["review", "failed", "jumping", "waving"] },
    headline: { type: "string" },
    roastText: { type: "string" },
    motivationText: { type: "string" },
    focusChecks: { type: "array", items: { type: "string" }, maxItems: 2 },
  },
  required: [
    "schemaVersion",
    "mode",
    "spriteState",
    "headline",
    "roastText",
    "motivationText",
    "focusChecks",
  ],
  additionalProperties: false,
} as const;

export async function generateProviderReview(context: TrustedReviewContext) {
  const groqReview = await generateGroqReview(context);
  if (groqReview) {
    return groqReview;
  }

  return generateGeminiReview(context);
}

async function generateGroqReview(context: TrustedReviewContext) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.info("Algofox Groq review provider is not configured");
    return null;
  }

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.GROQ_REVIEW_MODEL ?? "openai/gpt-oss-20b",
        messages: [
          {
            role: "system",
            content: "Generate a safe, evidence-bound Algofox review using the supplied JSON schema.",
          },
          { role: "user", content: reviewProviderPrompt(context) },
        ],
        // JSON Object Mode avoids provider-side schema compatibility failures. The response
        // is still parsed and fully validated against the local, evidence-bound contract below.
        response_format: { type: "json_object" },
        temperature: 0.5,
        max_tokens: 250,
      }),
      signal: AbortSignal.timeout(6_000),
    });

    if (!response.ok) {
      console.warn("Algofox Groq review provider returned an error", {
        status: response.status,
        model: process.env.GROQ_REVIEW_MODEL ?? "openai/gpt-oss-20b",
      });
      return null;
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string | null } }>;
    };
    const content = payload.choices?.[0]?.message?.content;
    const review = validateProviderCandidate(content, context, "groq");
    if (!review) {
      console.warn("Algofox Groq review provider returned an invalid response");
    }
    return review;
  } catch (error) {
    console.warn("Algofox Groq review provider request failed", {
      error: error instanceof Error ? error.name : "unknown",
    });
    return null;
  }
}

async function generateGeminiReview(context: TrustedReviewContext) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.info("Algofox Gemini review provider is not configured");
    return null;
  }

  for (const model of geminiModelCandidates()) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
        {
          method: "POST",
          headers: {
            "x-goog-api-key": apiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: reviewProviderPrompt(context) }] }],
            generationConfig: {
              responseMimeType: "application/json",
              responseJsonSchema: RESPONSE_SCHEMA,
              temperature: 0.5,
              maxOutputTokens: 250,
            },
          }),
          signal: AbortSignal.timeout(2_500),
        },
      );

      if (!response.ok) {
        console.warn("Algofox Gemini review provider returned an error", {
          status: response.status,
          model,
        });
        if (response.status === 404) {
          continue;
        }
        return null;
      }

      const payload = (await response.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };
      const review = validateProviderCandidate(
        payload.candidates?.[0]?.content?.parts?.[0]?.text,
        context,
        "gemini",
      );
      if (!review) {
        console.warn("Algofox Gemini review provider returned an invalid response", { model });
      }
      return review;
    } catch (error) {
      console.warn("Algofox Gemini review provider request failed", {
        error: error instanceof Error ? error.name : "unknown",
        model,
      });
    }
  }

  return null;
}

function geminiModelCandidates() {
  const configured = process.env.GEMINI_REVIEW_MODEL?.trim().replace(/^models\//, "");
  return Array.from(
    new Set([configured, "gemini-3.7-flash", "gemini-2.5-flash"].filter(Boolean)),
  ) as string[];
}

function validateProviderCandidate(
  serialized: string | null | undefined,
  context: TrustedReviewContext,
  provider: ReviewProvider,
): AlgofoxReview | null {
  if (!serialized) {
    return null;
  }

  try {
    const parsed = JSON.parse(serialized) as Omit<AlgofoxReview, "provider">;
    return validateAlgofoxReview({ ...parsed, provider }, context);
  } catch {
    return null;
  }
}

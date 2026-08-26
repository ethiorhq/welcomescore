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
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "algofox_review",
            strict: true,
            schema: RESPONSE_SCHEMA,
          },
        },
        temperature: 0.5,
        max_tokens: 250,
      }),
      signal: AbortSignal.timeout(1_800),
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string | null } }>;
    };
    const content = payload.choices?.[0]?.message?.content;
    return validateProviderCandidate(content, context, "groq");
  } catch {
    return null;
  }
}

async function generateGeminiReview(context: TrustedReviewContext) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }

  try {
    const model = process.env.GEMINI_REVIEW_MODEL ?? "gemini-2.5-flash";
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
      return null;
    }

    const payload = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    return validateProviderCandidate(
      payload.candidates?.[0]?.content?.parts?.[0]?.text,
      context,
      "gemini",
    );
  } catch {
    return null;
  }
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

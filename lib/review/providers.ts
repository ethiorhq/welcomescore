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

const GROQ_DEFAULT_MODEL = "openai/gpt-oss-20b";
const GEMINI_DEFAULT_MODEL = "gemini-3.7-flash";
const PROVIDER_ERROR_BODY_LIMIT = 1_200;

export async function generateProviderReview(context: TrustedReviewContext) {
  const groqReview = await generateGroqReview(context);
  if (groqReview) {
    return groqReview;
  }

  return generateGeminiReview(context);
}

async function generateGroqReview(context: TrustedReviewContext) {
  const apiKey = process.env.GROQ_API_KEY;
  const model = process.env.GROQ_REVIEW_MODEL?.trim() || GROQ_DEFAULT_MODEL;
  if (!apiKey) {
    logProviderAttempt("groq", model, "not_configured");
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
        model,
        messages: [
          {
            role: "system",
            // Groq JSON Object Mode requires the literal word JSON in the prompt.
            content: "Generate one safe, evidence-bound Algofox review. Return only a valid JSON object.",
          },
          { role: "user", content: reviewProviderPrompt(context) },
        ],
        // JSON Object Mode is paired with explicit JSON instructions above and in reviewProviderPrompt.
        // Local validation remains the enforcement boundary for the trusted review contract.
        response_format: { type: "json_object" },
        temperature: 0.5,
        max_tokens: 250,
      }),
      signal: AbortSignal.timeout(6_000),
    });

    if (!response.ok) {
      logProviderAttempt("groq", model, "http_error", response.status, await readDiagnosticBody(response));
      return null;
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string | null } }>;
    };
    const review = validateProviderCandidate(payload.choices?.[0]?.message?.content, context, "groq");
    logProviderAttempt("groq", model, review ? "validated" : "invalid_response", response.status);
    return review;
  } catch (error) {
    logProviderAttempt("groq", model, "request_failed", undefined, errorName(error));
    return null;
  }
}

async function generateGeminiReview(context: TrustedReviewContext) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    logProviderAttempt("gemini", process.env.GEMINI_REVIEW_MODEL?.trim() || GEMINI_DEFAULT_MODEL, "not_configured");
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
        logProviderAttempt("gemini", model, "http_error", response.status, await readDiagnosticBody(response));
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
      logProviderAttempt("gemini", model, review ? "validated" : "invalid_response", response.status);
      return review;
    } catch (error) {
      logProviderAttempt("gemini", model, "request_failed", undefined, errorName(error));
    }
  }

  return null;
}

function geminiModelCandidates() {
  const configured = process.env.GEMINI_REVIEW_MODEL?.trim().replace(/^models\//, "");
  return Array.from(new Set([configured, GEMINI_DEFAULT_MODEL, "gemini-2.5-flash"].filter(Boolean))) as string[];
}

async function readDiagnosticBody(response: Response) {
  try {
    return summarizeDiagnostic(await response.text());
  } catch {
    return "unavailable";
  }
}

function summarizeDiagnostic(value: string) {
  const compact = value.replace(/\s+/g, " ").trim();
  return compact.length > PROVIDER_ERROR_BODY_LIMIT
    ? `${compact.slice(0, PROVIDER_ERROR_BODY_LIMIT)}…`
    : compact || "empty";
}

function errorName(error: unknown) {
  return error instanceof Error ? error.name : "unknown";
}

function logProviderAttempt(
  provider: "groq" | "gemini",
  model: string,
  outcome: "not_configured" | "http_error" | "validated" | "invalid_response" | "request_failed",
  status?: number,
  detail?: string,
) {
  const payload = { provider, model, outcome, ...(status ? { status } : {}), ...(detail ? { detail } : {}) };
  if (outcome === "validated") {
    console.info("Algofox review provider attempt", payload);
    return;
  }

  console.warn("Algofox review provider attempt", payload);
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

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

// Groq strict JSON Schema accepts the same trusted fields but keeps cardinality
// enforcement in our local validator, where it is independently guaranteed.
const GROQ_RESPONSE_SCHEMA = {
  ...RESPONSE_SCHEMA,
  properties: {
    ...RESPONSE_SCHEMA.properties,
    focusChecks: { type: "array", items: { type: "string" } },
  },
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
        // GPT-OSS guidance recommends placing instructions in the user message.
        // reviewProviderPrompt already requires an evidence-bound JSON object.
        messages: [{ role: "user", content: reviewProviderPrompt(context) }],
        // GPT-OSS 20B/120B supports strict JSON Schema. This prevents the
        // json_validate_failed response that occurred in JSON Object Mode.
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "algofox_review",
            strict: true,
            schema: GROQ_RESPONSE_SCHEMA,
          },
        },
        temperature: 0.5,
        // GPT-OSS completion tokens cover both reasoning and visible JSON. Its
        // documented default is 1024; 250 exhausted generation before it could
        // finish and validate the strict JSON object.
        max_completion_tokens: 1024,
        reasoning_effort: "low",
        include_reasoning: false,
      }),
      signal: AbortSignal.timeout(8_000),
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
      const response = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
        method: "POST",
        headers: {
          "x-goog-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          input: reviewProviderPrompt(context),
          system_instruction:
            "You are Algofox, a concise constructive open-source reviewer. Return only valid JSON matching the requested schema.",
          // Review calls are one-shot. Avoid Gemini-side interaction retention.
          store: false,
          response_format: {
            type: "text",
            mime_type: "application/json",
            schema: RESPONSE_SCHEMA,
          },
          generation_config: {
            temperature: 0.5,
            max_output_tokens: 250,
            thinking_level: "low",
          },
        }),
        signal: AbortSignal.timeout(8_000),
      });

      if (!response.ok) {
        logProviderAttempt("gemini", model, "http_error", response.status, await readDiagnosticBody(response));
        if (response.status === 404) {
          continue;
        }
        return null;
      }

      const payload = (await response.json()) as GeminiInteractionResponse;
      const review = validateProviderCandidate(getGeminiOutputText(payload), context, "gemini");
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
  // Gemini 2.5 Flash returns 404 for newly created projects; 3.6 Flash is the
  // documented stable fallback when the requested latest Flash model is unavailable.
  return Array.from(new Set([configured, GEMINI_DEFAULT_MODEL, "gemini-3.6-flash"].filter(Boolean))) as string[];
}

type GeminiInteractionResponse = {
  steps?: Array<{
    type?: string;
    content?: Array<{ type?: string; text?: string }>;
  }>;
};

function getGeminiOutputText(payload: GeminiInteractionResponse) {
  const text = payload.steps
    ?.filter((step) => step.type === "model_output")
    .flatMap((step) => step.content ?? [])
    .filter((content) => content.type === "text" && typeof content.text === "string")
    .map((content) => content.text ?? "")
    .join("\n");

  return text || undefined;
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

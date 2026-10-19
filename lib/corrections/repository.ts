import { randomUUID, createHash } from "crypto";
import {
  isCorrectionReasonCategory,
  type CorrectionSubmission,
  type StoredCorrection,
} from "./types";
import { parseRepository } from "@/lib/scoreRepo";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_KEY;

// In-memory fallback cache for test environments and offline verification
const memoryCorrections = new Map<string, StoredCorrection>();
const rateLimitBuckets = new Map<string, { count: number; windowStart: number }>();

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 3600 * 1000; // 1 hour

export type SubmitCorrectionResult =
  | { success: true; correctionId: string; status: "submitted" | "duplicate" }
  | { success: false; error: string; code: string; retryAfterSeconds?: number };

export function sanitizeCorrectionText(value: string): string {
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/<\/?[a-zA-Z][^>]*>/g, "")
    .trim();
}

export function validateCorrectionSubmission(
  input: unknown,
): { valid: true; data: CorrectionSubmission } | { valid: false; error: string } {
  if (!input || typeof input !== "object") {
    return { valid: false, error: "Correction payload must be an object." };
  }

  const raw = input as Record<string, unknown>;

  if (typeof raw.repo !== "string" || !parseRepository(raw.repo)) {
    return {
      valid: false,
      error: "Enter a valid repository as owner/repo.",
    };
  }

  if (typeof raw.evidenceId !== "string" || !raw.evidenceId.trim()) {
    return { valid: false, error: "evidenceId must be a non-empty identifier." };
  }

  if (!isCorrectionReasonCategory(raw.reason)) {
    return {
      valid: false,
      error: `reason must be one of: external_location, custom_license, external_ci, monorepo_structure, stale_status, other.`,
    };
  }

  if (typeof raw.explanation !== "string") {
    return { valid: false, error: "explanation must be text." };
  }

  const sanitizedExplanation = sanitizeCorrectionText(raw.explanation);
  if (sanitizedExplanation.length < 10) {
    return {
      valid: false,
      error: "Please provide a more detailed explanation (minimum 10 characters).",
    };
  }
  if (sanitizedExplanation.length > 500) {
    return {
      valid: false,
      error: "Explanation must not exceed 500 characters.",
    };
  }

  let sanitizedUrl: string | undefined = undefined;
  if (raw.sourceUrl !== undefined && raw.sourceUrl !== null && raw.sourceUrl !== "") {
    if (typeof raw.sourceUrl !== "string") {
      return { valid: false, error: "sourceUrl must be a URL string." };
    }
    const trimmed = raw.sourceUrl.trim();
    try {
      const parsedUrl = new URL(trimmed);
      if (parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "http:") {
        return { valid: false, error: "sourceUrl must be an HTTP or HTTPS link." };
      }
      sanitizedUrl = parsedUrl.toString();
    } catch {
      return { valid: false, error: "sourceUrl must be a valid URL." };
    }
  }

  return {
    valid: true,
    data: {
      repo: raw.repo.trim(),
      evidenceId: raw.evidenceId.trim(),
      reason: raw.reason,
      explanation: sanitizedExplanation,
      sourceUrl: sanitizedUrl,
    },
  };
}

export function checkCorrectionRateLimit(clientIdentifier: string): boolean {
  const now = Date.now();
  const bucketKey = createHash("sha256").update(clientIdentifier).digest("hex");
  const existing = rateLimitBuckets.get(bucketKey);

  if (!existing || now - existing.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitBuckets.set(bucketKey, { count: 1, windowStart: now });
    return true;
  }

  if (existing.count >= RATE_LIMIT_MAX) {
    return false;
  }

  existing.count += 1;
  return true;
}

export function resetRateLimitsForTesting() {
  rateLimitBuckets.clear();
  memoryCorrections.clear();
}

export async function submitCorrection(
  submission: CorrectionSubmission,
  clientIdentifier = "anonymous",
): Promise<SubmitCorrectionResult> {
  if (!checkCorrectionRateLimit(clientIdentifier)) {
    return {
      success: false,
      code: "RATE_LIMITED",
      error: "Too many correction submissions from this network. Try again later.",
      retryAfterSeconds: 3600,
    };
  }

  const now = new Date().toISOString();
  const id = randomUUID();

  // Check for duplicate pending submission for same repo + evidenceId + reason
  const duplicateKey = `${submission.repo}:${submission.evidenceId}:${submission.reason}`;
  const existing = Array.from(memoryCorrections.values()).find(
    (c) =>
      c.repo === submission.repo &&
      c.evidenceId === submission.evidenceId &&
      c.reason === submission.reason &&
      c.status === "needs-review",
  );

  if (existing) {
    return {
      success: true,
      correctionId: existing.id,
      status: "duplicate",
    };
  }

  // Attempt Supabase insert if configured
  if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/report_corrections`, {
        method: "POST",
        headers: {
          apikey: SUPABASE_SERVICE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify({
          id,
          repo_path: submission.repo,
          evidence_id: submission.evidenceId,
          reason_category: submission.reason,
          explanation: submission.explanation,
          source_url: submission.sourceUrl ?? null,
          status: "needs-review",
          created_at: now,
          updated_at: now,
        }),
      });

      if (response.ok) {
        return { success: true, correctionId: id, status: "submitted" };
      }
    } catch {
      // Fall through to memory fallback
    }
  }

  // Memory fallback storage
  const record: StoredCorrection = {
    id,
    repo: submission.repo,
    evidenceId: submission.evidenceId,
    reason: submission.reason,
    explanation: submission.explanation,
    sourceUrl: submission.sourceUrl,
    status: "needs-review",
    createdAt: now,
    updatedAt: now,
  };

  memoryCorrections.set(duplicateKey, record);

  return {
    success: true,
    correctionId: id,
    status: "submitted",
  };
}

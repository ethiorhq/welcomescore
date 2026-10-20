import type { SubscriberSubmission } from "./types";

// RFC 5322 compliant email pattern for standard web forms
const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export type ValidationResult =
  | { valid: true; data: Required<Pick<SubscriberSubmission, "email" | "source">> }
  | { valid: false; error: string; code: string };

export function validateSubscriberSubmission(input: unknown): ValidationResult {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return {
      valid: false,
      error: "Subscriber payload must be an object.",
      code: "INVALID_PAYLOAD",
    };
  }

  const raw = input as Record<string, unknown>;

  // 1. Honeypot check: If the hidden honeypot field is filled, reject silently or flag
  if (typeof raw.hp === "string" && raw.hp.trim().length > 0) {
    return {
      valid: false,
      error: "Spam submission detected.",
      code: "BOT_DETECTED",
    };
  }

  // 2. Email format validation
  if (typeof raw.email !== "string") {
    return {
      valid: false,
      error: "Email is required.",
      code: "MISSING_EMAIL",
    };
  }

  const trimmed = raw.email.trim();

  if (!trimmed) {
    return {
      valid: false,
      error: "Email address cannot be empty.",
      code: "EMPTY_EMAIL",
    };
  }

  if (trimmed.length > 254) {
    return {
      valid: false,
      error: "Email address exceeds the 254-character maximum.",
      code: "EMAIL_TOO_LONG",
    };
  }

  if (!EMAIL_REGEX.test(trimmed)) {
    return {
      valid: false,
      error: "Please enter a valid email address (e.g. developer@example.com).",
      code: "INVALID_EMAIL_FORMAT",
    };
  }

  // 3. Source normalization
  let source = "welcomescore_app";
  if (typeof raw.source === "string" && raw.source.trim().length > 0) {
    source = raw.source
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "_")
      .slice(0, 50);
  }

  return {
    valid: true,
    data: {
      email: trimmed.toLowerCase(),
      source,
    },
  };
}

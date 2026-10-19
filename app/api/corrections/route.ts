import { NextRequest, NextResponse } from "next/server";
import {
  submitCorrection,
  validateCorrectionSubmission,
} from "@/lib/corrections/repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: { code: "INVALID_JSON", message: "Invalid JSON in request body." },
      },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const validation = validateCorrectionSubmission(body);
  if (!validation.valid) {
    return NextResponse.json(
      {
        ok: false,
        error: { code: "VALIDATION_ERROR", message: validation.error },
      },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const clientIdentifier =
    forwarded || request.headers.get("x-real-ip") || "unknown-client";

  const result = await submitCorrection(validation.data, clientIdentifier);

  if (!result.success) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: result.code,
          message: result.error,
          ...(result.retryAfterSeconds
            ? { retryAfterSeconds: result.retryAfterSeconds }
            : {}),
        },
      },
      {
        status: result.code === "RATE_LIMITED" ? 429 : 500,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }

  return NextResponse.json(
    {
      ok: true,
      status: result.status,
      message:
        result.status === "duplicate"
          ? "A similar correction report for this evidence item is already under maintainer review."
          : "Your correction has been submitted for maintainer review. Thank you for keeping WelcomeScore accurate.",
    },
    { status: 201, headers: { "Cache-Control": "no-store" } },
  );
}

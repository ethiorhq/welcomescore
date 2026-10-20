import { NextRequest, NextResponse } from "next/server";
import { validateSubscriberSubmission } from "@/lib/subscribers/validation";
import { subscribeEmail } from "@/lib/subscribers/repository";

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

  const validation = validateSubscriberSubmission(body);
  if (!validation.valid) {
    return NextResponse.json(
      {
        ok: false,
        error: { code: validation.code, message: validation.error },
      },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const clientIp = forwarded || request.headers.get("x-real-ip") || "unknown-client";

  const result = await subscribeEmail(
    validation.data.email,
    validation.data.source,
    clientIp,
  );

  if (!result.success) {
    const status = result.code === "RATE_LIMITED" ? 429 : 500;
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: result.code,
          message: result.error,
          ...(result.retryAfterSeconds ? { retryAfterSeconds: result.retryAfterSeconds } : {}),
        },
      },
      { status, headers: { "Cache-Control": "no-store" } },
    );
  }

  return NextResponse.json(
    {
      ok: true,
      message: result.message,
      isExisting: result.isExisting ?? false,
    },
    {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    },
  );
}

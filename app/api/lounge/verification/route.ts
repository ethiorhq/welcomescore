import { NextResponse } from "next/server";
import { issueLoungeHumanProof, isTurnstileEnabled } from "@/lib/loungeVerification";

export const dynamic = "force-dynamic";

const SESSION_HASH_PATTERN = /^[A-Za-z0-9_-]{16,128}$/;

export async function POST(request: Request) {
  try {
    const body = await request.json() as { sessionHash?: unknown };
    if (typeof body.sessionHash !== "string" || !SESSION_HASH_PATTERN.test(body.sessionHash)) {
      return NextResponse.json({ error: "Your temporary Lounge identity is not ready yet." }, { status: 400, headers: { "Cache-Control": "no-store" } });
    }

    return NextResponse.json({
      proof: issueLoungeHumanProof(body.sessionHash),
      turnstile: {
        enabled: isTurnstileEnabled() && Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim()),
        siteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() || null,
      },
    }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Unable to prepare visitor verification right now." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}

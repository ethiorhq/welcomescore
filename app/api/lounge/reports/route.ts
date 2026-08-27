import { NextResponse } from "next/server";
import { createLoungeReport } from "@/lib/loungeGateway";
import { loungeErrorResponse, readJson } from "@/app/api/lounge/shared";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await readJson(request);
    const outcome = await createLoungeReport({
      sessionHash: body.sessionHash,
      messageId: body.messageId,
      reason: body.reason,
      detail: body.detail,
      verificationProof: body.verificationProof,
      turnstileToken: body.turnstileToken,
      website: body.website,
      request,
    });
    return NextResponse.json({
      autoHidden: outcome.autoHidden,
      reviewState: outcome.reviewState,
    }, {
      status: 201,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return loungeErrorResponse(error);
  }
}

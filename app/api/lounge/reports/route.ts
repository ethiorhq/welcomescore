import { NextResponse } from "next/server";
import { createLoungeReport } from "@/lib/loungeGateway";
import { loungeErrorResponse, readJson } from "@/app/api/lounge/shared";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await readJson(request);
    await createLoungeReport({
      sessionHash: body.sessionHash,
      messageId: body.messageId,
      reason: body.reason,
      detail: body.detail,
    });
    return new NextResponse(null, {
      status: 204,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return loungeErrorResponse(error);
  }
}

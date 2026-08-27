import { NextResponse } from "next/server";
import { createLoungeReaction } from "@/lib/loungeGateway";
import { loungeErrorResponse, readJson } from "@/app/api/lounge/shared";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await readJson(request);
    const reaction = await createLoungeReaction({
      sessionHash: body.sessionHash,
      messageId: body.messageId,
      reaction: body.reaction,
    });
    return NextResponse.json({ reaction }, {
      status: 201,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return loungeErrorResponse(error);
  }
}

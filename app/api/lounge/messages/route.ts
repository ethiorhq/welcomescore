import { NextResponse } from "next/server";
import { createLoungeMessage } from "@/lib/loungeGateway";
import { loungeErrorResponse, readJson } from "@/app/api/lounge/shared";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await readJson(request);
    const message = await createLoungeMessage({
      sessionHash: body.sessionHash,
      devHandle: body.devHandle,
      avatarSeed: body.avatarSeed,
      content: body.content,
      topic: body.topic,
      clientRequestId: body.clientRequestId,
      contextToken: body.contextToken,
      replyTo: body.replyTo,
    });
    return NextResponse.json({ message }, {
      status: 201,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return loungeErrorResponse(error);
  }
}

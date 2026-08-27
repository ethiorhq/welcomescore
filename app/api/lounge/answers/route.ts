import { NextResponse } from "next/server";
import { clearLoungeAnswerMark, setLoungeAnswerMark } from "@/lib/loungeGateway";
import { loungeErrorResponse, readJson } from "@/app/api/lounge/shared";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await readJson(request);
    const answerMark = await setLoungeAnswerMark({
      sessionHash: body.sessionHash,
      questionMessageId: body.questionMessageId,
      answerMessageId: body.answerMessageId,
    });
    return NextResponse.json({ answerMark }, {
      status: 201,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return loungeErrorResponse(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await readJson(request);
    await clearLoungeAnswerMark({
      sessionHash: body.sessionHash,
      questionMessageId: body.questionMessageId,
    });
    return new NextResponse(null, {
      status: 204,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return loungeErrorResponse(error);
  }
}

import { NextResponse } from "next/server";
import { prepareAuditContext } from "@/lib/loungeGateway";
import { ScoreRepoError } from "@/lib/scoreRepo";
import { loungeErrorResponse, readJson } from "@/app/api/lounge/shared";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await readJson(request);
    const prepared = await prepareAuditContext({
      sessionHash: body.sessionHash,
      repo: body.repo,
      focus: body.focus,
    });
    return NextResponse.json(prepared, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    if (error instanceof ScoreRepoError) {
      const message = error.code === "not-found"
        ? "That repository could not be found. No Lounge message was posted."
        : error.code === "rate-limit"
          ? "Repository checks are busy right now. Please try again shortly. No Lounge message was posted."
          : "The fresh audit could not be prepared right now. No Lounge message was posted.";
      return NextResponse.json({ error: message }, { status: error.status });
    }
    return loungeErrorResponse(error);
  }
}

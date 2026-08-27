import { NextResponse } from "next/server";
import { prepareHallContext } from "@/lib/loungeGateway";
import { loungeErrorResponse, readJson } from "@/app/api/lounge/shared";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await readJson(request);
    const prepared = await prepareHallContext({
      sessionHash: body.sessionHash,
      repo: body.repo,
    });
    return NextResponse.json(prepared, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return loungeErrorResponse(error);
  }
}

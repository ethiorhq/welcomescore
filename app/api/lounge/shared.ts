import { NextResponse } from "next/server";
import { LoungeGatewayError } from "@/lib/loungeGateway";

export async function readJson(request: Request) {
  try {
    return await request.json() as Record<string, unknown>;
  } catch {
    throw new LoungeGatewayError(400, "That Lounge action could not be read. Please try again.");
  }
}

export function loungeErrorResponse(error: unknown) {
  if (error instanceof LoungeGatewayError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  console.error("Lounge gateway request failed", {
    name: error instanceof Error ? error.name : "unknown",
  });
  return NextResponse.json(
    { error: "The Lounge is temporarily unavailable. No message or community action was created." },
    { status: 503 },
  );
}

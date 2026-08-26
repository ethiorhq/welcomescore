import { NextRequest, NextResponse } from "next/server";
import { getLeaderboardEntry } from "@/lib/leaderboard";
import { parseRepository } from "@/lib/scoreRepo";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const repository = parseRepository(
    request.nextUrl.searchParams.get("repo") ?? "",
  );

  if (!repository) {
    return NextResponse.json({ error: "invalid-format" }, { status: 400 });
  }

  try {
    const entry = await getLeaderboardEntry(
      `${repository.owner}/${repository.repo}`,
    );
    return NextResponse.json(
      { listed: Boolean(entry), entry },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Unable to look up Hall of Fame entry", error);
    return NextResponse.json({ error: "lookup-unavailable" }, { status: 502 });
  }
}

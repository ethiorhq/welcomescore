import { NextRequest, NextResponse } from "next/server";
import { getRepoTimeline } from "@/lib/improvement/timeline";

export const dynamic = "force-dynamic";

const REPO_REGEX = /^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const repo = searchParams.get("repo");

  if (!repo || !REPO_REGEX.test(repo.trim())) {
    return NextResponse.json(
      { error: "Invalid repository parameter. Must be in owner/repo format." },
      { status: 400 },
    );
  }

  const limitParam = searchParams.get("limit");
  const limit = limitParam ? Math.min(Math.max(parseInt(limitParam, 10) || 20, 1), 50) : 20;

  try {
    const events = await getRepoTimeline(repo, limit);

    return NextResponse.json(
      {
        repo: repo.trim().toLowerCase(),
        events,
        totalEvents: events.length,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300",
        },
      },
    );
  } catch (error) {
    console.error("Error retrieving improvement timeline:", error);
    return NextResponse.json(
      { error: "Failed to retrieve improvement timeline." },
      { status: 500 },
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { evaluateJsHealth, readGitHubJsHealthSnapshot } from "@/lib/jsHealth";
import { ScoreRepoError } from "@/lib/scoreRepo";

export const runtime = "nodejs";
export const revalidate = 300;

export async function GET(request: NextRequest) {
  const repo = request.nextUrl.searchParams.get("repo")?.trim();
  if (!repo) {
    return NextResponse.json({ error: "missing-repository" }, { status: 400 });
  }

  try {
    const report = evaluateJsHealth(await readGitHubJsHealthSnapshot(repo));
    return NextResponse.json(report, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    if (error instanceof ScoreRepoError) {
      return NextResponse.json({ error: error.code }, { status: error.status });
    }
    return NextResponse.json({ error: "upstream-error" }, { status: 502 });
  }
}

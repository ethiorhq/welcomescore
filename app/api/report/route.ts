import { NextRequest, NextResponse } from "next/server";
import { parseRepository, scoreRepo, ScoreRepoError } from "@/lib/scoreRepo";
import { createReportFromAudit } from "@/lib/report/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const repoParam = request.nextUrl.searchParams.get("repo")?.trim() ?? "";
  const parsed = parseRepository(repoParam);

  if (!parsed) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "INVALID_REPOSITORY",
          message: "Enter a valid repository as owner/repo or a GitHub URL.",
        },
      },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const fresh = request.nextUrl.searchParams.get("fresh") === "true";

  try {
    const scoreResult = await scoreRepo(parsed.owner, parsed.repo, { fresh });
    const siteUrl = request.nextUrl.origin;
    const report = createReportFromAudit(scoreResult, { siteBaseUrl: siteUrl });

    return NextResponse.json(
      {
        ok: true,
        report,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=86400",
        },
      },
    );
  } catch (error) {
    if (error instanceof ScoreRepoError) {
      if (error.code === "rate-limit") {
        return NextResponse.json(
          {
            ok: false,
            error: {
              code: "RATE_LIMITED",
              message: "Too many checks right now — try again in a few minutes",
              retryAfterSeconds: 120,
            },
          },
          { status: 429, headers: { "Cache-Control": "no-store" } },
        );
      }

      if (error.code === "not-found") {
        return NextResponse.json(
          {
            ok: false,
            error: {
              code: "NOT_FOUND",
              message: "Repository not found on GitHub.",
            },
          },
          { status: 404, headers: { "Cache-Control": "no-store" } },
        );
      }

      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "UPSTREAM_ERROR",
            message: "GitHub API request failed.",
          },
        },
        { status: 502, headers: { "Cache-Control": "no-store" } },
      );
    }

    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred while analyzing the repository.",
        },
      },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}

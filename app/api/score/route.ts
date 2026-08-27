import { NextRequest, NextResponse } from "next/server";
import {
  parseRepository,
  scoreRepo,
  ScoreRepoError,
} from "@/lib/scoreRepo";

export const dynamic = "force-dynamic";

const noStore = {
  headers: {
    "Cache-Control": "no-store, max-age=0",
  },
};

export async function GET(request: NextRequest) {
  const parsedRepository = parseRepository(
    request.nextUrl.searchParams.get("repo") ?? "",
  );
  if (!parsedRepository) {
    return NextResponse.json({ error: "invalid-format" }, { status: 400, ...noStore });
  }

  try {
    // This route serves direct, deliberate audits. Keep its GitHub reads fresh;
    // shareable badge rendering retains its own separately bounded cache.
    const result = await scoreRepo(parsedRepository.owner, parsedRepository.repo, {
      fresh: true,
    });
    return NextResponse.json(result, noStore);
  } catch (error) {
    if (error instanceof ScoreRepoError) {
      return NextResponse.json(
        { error: error.code },
        { status: error.status, ...noStore },
      );
    }

    return NextResponse.json({ error: "upstream-error" }, { status: 502, ...noStore });
  }
}

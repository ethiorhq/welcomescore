import { NextRequest, NextResponse } from "next/server";
import {
  parseRepository,
  scoreRepo,
  ScoreRepoError,
} from "@/lib/scoreRepo";

export async function GET(request: NextRequest) {
  const parsedRepository = parseRepository(
    request.nextUrl.searchParams.get("repo") ?? "",
  );

  if (!parsedRepository) {
    return NextResponse.json({ error: "invalid-format" }, { status: 400 });
  }

  try {
    const result = await scoreRepo(parsedRepository.owner, parsedRepository.repo);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ScoreRepoError) {
      return NextResponse.json(
        { error: error.code },
        { status: error.status },
      );
    }

    return NextResponse.json({ error: "upstream-error" }, { status: 502 });
  }
}

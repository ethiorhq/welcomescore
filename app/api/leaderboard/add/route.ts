import { NextRequest, NextResponse } from "next/server";
import { persistEvaluation } from "@/lib/leaderboard";
import {
  parseRepository,
  scoreRepo,
  ScoreRepoError,
} from "@/lib/scoreRepo";

export async function POST(request: NextRequest) {
  const repository = parseRepository(
    request.nextUrl.searchParams.get("repo") ?? "",
  );

  if (!repository) {
    return NextResponse.json({ error: "invalid-format" }, { status: 400 });
  }

  try {
    const result = await scoreRepo(repository.owner, repository.repo);

    if (!result.isEligibleForLeaderboard) {
      return NextResponse.json({ error: "not-eligible", result }, { status: 422 });
    }

    const evaluation = await persistEvaluation(result, {
      starsCount: result.starsCount,
      forksCount: result.forksCount,
      primaryLanguage: result.primaryLanguage,
      hasReadme: result.hasReadme,
      hasLicense: result.hasLicense,
    });

    return NextResponse.json({ result, evaluation });
  } catch (error) {
    if (error instanceof ScoreRepoError) {
      return NextResponse.json(
        { error: error.code },
        { status: error.status },
      );
    }

    console.error("Unable to add eligible repository to leaderboard", error);
    return NextResponse.json({ error: "upstream-error" }, { status: 502 });
  }
}

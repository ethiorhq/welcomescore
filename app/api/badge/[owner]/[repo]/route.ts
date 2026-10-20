import {
  badgeResponse,
  createBadgeSvg,
  createErrorBadgeSvg,
  normalizeBadgeStyle,
} from "@/lib/badgeEngine";
import { parseRepository, scoreRepo } from "@/lib/scoreRepo";
import { getGitHubStackEvaluation } from "@/lib/stacks/github";
import { STACK_DEFINITIONS, type StackId } from "@/lib/stacks/types";

export const runtime = "nodejs";
export const revalidate = 300;

export async function GET(
  request: Request,
  { params }: { params: { owner: string; repo: string } },
) {
  const repository = parseRepository(`${params.owner}/${params.repo}`);
  if (!repository) {
    return badgeResponse(createErrorBadgeSvg(), 400);
  }

  const { searchParams } = new URL(request.url);
  const style = normalizeBadgeStyle(searchParams.get("style"));
  const stack = searchParams.get("stack")?.toLowerCase();

  try {
    if (stack && (stack === "nextjs" || stack === "react" || stack === "monorepo")) {
      const stackEval = await getGitHubStackEvaluation(repository.owner, repository.repo);
      const stackReport = stackEval.stackReports[stack];
      if (stackReport) {
        const def = STACK_DEFINITIONS[stack as StackId];
        return badgeResponse(
          createBadgeSvg(
            {
              repo: repository.repo,
              score: stackReport.score,
              grade: stackReport.grade,
              label: def?.badgeLabel || stack,
              color: def?.color,
            },
            style,
          ),
        );
      }
    }

    const result = await scoreRepo(repository.owner, repository.repo);
    return badgeResponse(createBadgeSvg(result, style));
  } catch {
    return badgeResponse(createErrorBadgeSvg(), 404);
  }
}

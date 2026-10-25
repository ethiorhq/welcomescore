import {
  badgeResponse,
  createBadgeSvg,
  createErrorBadgeSvg,
  normalizeBadgeStyle,
} from "@/lib/badgeEngine";
import { parseRepository, scoreRepo } from "@/lib/scoreRepo";
import { getGitHubStackEvaluation } from "@/lib/stacks/github";
import { STACK_DEFINITIONS, type StackId } from "@/lib/stacks/types";
import { diagnoseDevOps } from "@/lib/devops/doctor";

export const dynamic = "force-dynamic";
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
  const metric = searchParams.get("metric")?.toLowerCase();
  const stack = searchParams.get("stack")?.toLowerCase();

  try {
    // 1. DevOps Metric Badge
    if (metric === "devops") {
      const devopsReport = diagnoseDevOps({
        repo: `${repository.owner}/${repository.repo}`,
        defaultBranch: "main",
        licenseSpdx: "MIT",
        workflowFiles: [],
      });

      return badgeResponse(
        createBadgeSvg(
          {
            repo: repository.repo,
            score: devopsReport.score,
            grade: devopsReport.grade,
            label: "devops",
            color: devopsReport.score >= 85 ? "#38B279" : "#E8A23D",
          },
          style,
        ),
      );
    }

    // 2. Specialized Stack Badges
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

    // 3. Default Contributor Readiness Badge
    const result = await scoreRepo(repository.owner, repository.repo);
    return badgeResponse(createBadgeSvg(result, style));
  } catch {
    return badgeResponse(createErrorBadgeSvg(), 404);
  }
}

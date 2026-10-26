import { Metadata } from "next";
import { notFound } from "next/navigation";
import { scoreRepo, ScoreRepoError } from "@/lib/scoreRepo";
import { createReportFromAudit } from "@/lib/report/schema";
import { getGitHubStackEvaluation } from "@/lib/stacks/github";
import { pageMetadata } from "@/lib/seo";
import { getRepoTimeline, recordImprovementEvent } from "@/lib/improvement/timeline";
import { calculateImprovementFromPreviousEvent } from "@/lib/improvement/diff";
import { generateAuditReportLd, stringifyJsonLd } from "@/lib/schemaLd";
import PublicReportView from "./PublicReportView";

export const runtime = "nodejs";
export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: { owner: string; repo: string };
}): Promise<Metadata> {
  const repo = `${params.owner}/${params.repo}`;
  const metadata = pageMetadata({
    title: `${repo} Contributor Readiness Audit & Health Report | WelcomeScore`,
    description: `Comprehensive open source contributor onboarding audit and Next Useful Move for ${repo}. Evaluates documentation, Code of Conduct, good first issues, and license compliance.`,
    path: `/report/${params.owner}/${params.repo}`,
  });

  return {
    ...metadata,
    keywords: [
      repo,
      params.owner,
      params.repo,
      "ETHIOR WelcomeScore",
      `${repo} contributor readiness`,
      `${repo} good first issues`,
      `${repo} open source health check`,
      "CONTRIBUTING.md validator",
      "repository onboarding audit",
      "open source maintainer report",
    ],
  };
}

export default async function PublicReportPage({
  params,
}: {
  params: { owner: string; repo: string };
}) {
  let report;
  try {
    const [scoreResult, stackEval] = await Promise.all([
      scoreRepo(params.owner, params.repo),
      getGitHubStackEvaluation(params.owner, params.repo),
    ]);
    report = createReportFromAudit(scoreResult, {
      detectedStacks: stackEval.detectedStacks,
      stackReports: stackEval.stackReports,
    });
  } catch (error) {
    if (error instanceof ScoreRepoError && error.code === "not-found") {
      notFound();
    }
    // Re-throw or handle
    throw error;
  }

  const repo = `${params.owner}/${params.repo}`.toLowerCase();
  let timelineEvents = await getRepoTimeline(repo, 10);

  if (timelineEvents.length === 0) {
    const initialEvent = calculateImprovementFromPreviousEvent(report, null);
    await recordImprovementEvent(initialEvent);
    timelineEvents = [initialEvent];
  }

  const jsonLd = generateAuditReportLd(params.owner, params.repo, report);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: stringifyJsonLd(jsonLd) }}
      />
      <PublicReportView initialReport={report} initialTimeline={timelineEvents} />
    </>
  );
}


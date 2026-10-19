import { Metadata } from "next";
import { notFound } from "next/navigation";
import { scoreRepo, ScoreRepoError } from "@/lib/scoreRepo";
import { createReportFromAudit } from "@/lib/report/schema";
import { pageMetadata } from "@/lib/seo";
import { getRepoTimeline, recordImprovementEvent } from "@/lib/improvement/timeline";
import { calculateImprovementFromPreviousEvent } from "@/lib/improvement/diff";
import PublicReportView from "./PublicReportView";

export const runtime = "nodejs";
export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: { owner: string; repo: string };
}): Promise<Metadata> {
  const repo = `${params.owner}/${params.repo}`;
  return pageMetadata({
    title: `${repo} — WelcomeScore Public Report`,
    description: `Evidence-based contributor readiness report and Next Useful Move for ${repo} on WelcomeScore.`,
    path: `/report/${params.owner}/${params.repo}`,
  });
}

export default async function PublicReportPage({
  params,
}: {
  params: { owner: string; repo: string };
}) {
  let report;
  try {
    const scoreResult = await scoreRepo(params.owner, params.repo);
    report = createReportFromAudit(scoreResult);
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

  return <PublicReportView initialReport={report} initialTimeline={timelineEvents} />;
}


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
import { GITHUB_DATA_CACHE_SECONDS } from "@/lib/auditFreshness";

import ReportErrorNotice from "./ReportErrorNotice";

export const runtime = "nodejs";
export const revalidate = GITHUB_DATA_CACHE_SECONDS;

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
    if (error instanceof ScoreRepoError) {
      if (error.code === "not-found") {
        notFound();
      }
      return (
        <ReportErrorNotice
          owner={params.owner}
          repo={params.repo}
          errorType={error.code}
          message={error.message}
        />
      );
    }
    return (
      <ReportErrorNotice
        owner={params.owner}
        repo={params.repo}
        errorType="generic"
      />
    );
  }

  const repo = `${params.owner}/${params.repo}`.toLowerCase();
  let timelineEvents = await getRepoTimeline(repo, 10);

  if (timelineEvents.length === 0) {
    const initialEvent = calculateImprovementFromPreviousEvent(report, null);
    await recordImprovementEvent(initialEvent);
    timelineEvents = [initialEvent];
  } else {
    // The timeline previously never advanced past the first audit: no new
    // event was recorded on repeat visits, so the latest event kept a null
    // delta forever. Record a new event when this audit's score differs
    // from the latest recorded one, so the score delta and grade change
    // actually move. When the score is unchanged, record nothing — the
    // latest event already describes the current state, and recording an
    // "unchanged" event on every page view would flood the timeline.
    // The new event is prepended, never replacing earlier events, so any
    // per-check changes recorded on earlier events stay visible.
    // Note: per-check changes for this transition are not derivable here —
    // only the previous event summary is available, not the previous
    // report (see `calculateImprovementFromPreviousEvent`). The new event
    // therefore carries the score/grade delta; its changedSignals is empty
    // by design, not because nothing changed.
    const latestEvent = timelineEvents[0];
    if (latestEvent.newScore !== report.score) {
      const changeEvent = calculateImprovementFromPreviousEvent(report, latestEvent);
      await recordImprovementEvent(changeEvent);
      timelineEvents = [changeEvent, ...timelineEvents];
    }
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


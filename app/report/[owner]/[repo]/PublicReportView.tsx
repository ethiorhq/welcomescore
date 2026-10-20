"use client";

import Link from "next/link";
import { useState } from "react";
import type { EvidenceItem, WelcomeScoreReport } from "@/lib/report/types";
import type { ImprovementEvent } from "@/lib/improvement/types";
import EvidencePanel from "@/app/components/EvidencePanel";
import ReportFreshness from "@/app/components/ReportFreshness";
import ActionDraftModal from "@/app/components/ActionDraftModal";
import { ImprovementTimeline } from "@/app/components/ImprovementTimeline";
import SiteFooter from "@/app/components/SiteFooter";
import WelcomeScoreWordmark from "@/app/components/WelcomeScoreWordmark";
import StackSelector from "@/app/components/report/StackSelector";
import StackEvidencePanel from "@/app/components/report/StackEvidencePanel";
import SubscriberBanner from "@/app/components/subscribers/SubscriberBanner";
import GitHubStarBadge from "@/app/components/GitHubStarBadge";
import type { StackReport } from "@/lib/stacks/types";

export default function PublicReportView({
  initialReport,
  initialTimeline = [],
}: {
  initialReport: WelcomeScoreReport;
  initialTimeline?: ImprovementEvent[];
}) {
  const [report, setReport] = useState<WelcomeScoreReport>(initialReport);
  const [timeline, setTimeline] = useState<ImprovementEvent[]>(initialTimeline);
  const [isRechecking, setIsRechecking] = useState(false);
  const [isDraftModalOpen, setIsDraftModalOpen] = useState(false);
  const [reportingCheck, setReportingCheck] = useState<EvidenceItem | null>(null);
  const [cliCopied, setCliCopied] = useState(false);
  const [actionCopied, setActionCopied] = useState(false);
  const [badgeCopied, setBadgeCopied] = useState(false);
  const [activeStack, setActiveStack] = useState<string>("core");

  const repo = report.repository.fullName;
  const stackReports = report.stackReports as Record<string, StackReport> | undefined;
  const currentStackReport = activeStack !== "core" && stackReports ? stackReports[activeStack] : null;

  const currentScore = currentStackReport ? currentStackReport.score : report.score;
  const currentGrade = currentStackReport ? currentStackReport.grade : report.grade;
  const currentCategory = currentStackReport ? currentStackReport.stackName : "Public Repository Audit";

  const badgeMarkdown = currentStackReport
    ? `[![${currentStackReport.stackName}](${report.publicLinks.badge}&stack=${activeStack})](${report.publicLinks.report}?stack=${activeStack})`
    : `[![WelcomeScore](${report.publicLinks.badge})](${report.publicLinks.report})`;
  const cliSnippet = `npx @ethiorhq/welcomescore`;
  const actionSnippet = `- uses: ethiorhq/welcomescore-action@v1\n  with:\n    threshold: 80`;

  async function handleRecheck() {
    setIsRechecking(true);
    try {
      const res = await fetch(`/api/report?repo=${encodeURIComponent(repo)}&fresh=true`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (data.ok && data.report) {
        setReport(data.report);
      }

      // Refresh timeline events
      const tlRes = await fetch(`/api/timeline?repo=${encodeURIComponent(repo)}`, {
        cache: "no-store",
      });
      if (tlRes.ok) {
        const tlData = await tlRes.json();
        if (Array.isArray(tlData.events)) {
          setTimeline(tlData.events);
        }
      }
    } finally {
      setIsRechecking(false);
    }
  }


  async function copyToClipboard(text: string, setter: (val: boolean) => void) {
    try {
      await navigator.clipboard.writeText(text);
      setter(true);
      setTimeout(() => setter(false), 2000);
    } catch {
      // Fallback
    }
  }

  return (
    <div className="min-h-screen bg-base text-text selection:bg-accent/30 selection:text-text">
      {/* Top Navigation */}
      <header className="border-b border-muted/20 bg-surface/50 backdrop-blur-md sticky top-0 z-40 safe-top">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-2 group">
            <WelcomeScoreWordmark />
          </Link>

          <div className="flex items-center gap-2.5 sm:gap-4">
            <nav aria-label="Breadcrumb navigation" className="hidden sm:flex items-center gap-2 font-mono text-xs text-muted">
              <Link href="/" className="hover:text-text transition">
                ← Audits
              </Link>
              <span aria-hidden="true" className="text-muted/40">/</span>
              <span className="text-text font-medium truncate max-w-[140px] md:max-w-[220px]">
                {repo}
              </span>
            </nav>
            <div className="hidden sm:block h-4 w-px bg-muted/20" aria-hidden="true" />
            <GitHubStarBadge />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 space-y-8">
        {/* Freshness Banner */}
        <ReportFreshness
          analyzedAt={report.analyzedAt}
          onRecheck={handleRecheck}
          isRechecking={isRechecking}
        />

        {/* Stack Selection Tabs */}
        {stackReports && Object.keys(stackReports).length > 0 && (
          <StackSelector
            activeStack={activeStack}
            onSelectStack={setActiveStack}
            coreScore={report.score}
            coreGrade={report.grade}
            stackReports={stackReports}
          />
        )}

        {/* Repository Header & Score Card */}
        <section
          aria-labelledby="repo-header-heading"
          className="rounded-2xl border border-muted/25 bg-surface p-6 sm:p-8 shadow-xl space-y-6"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <span className="font-mono text-xs uppercase tracking-wider text-accent font-semibold">
                {currentCategory}
              </span>
              <h1 id="repo-header-heading" className="font-mono text-2xl sm:text-3xl font-bold text-text break-all">
                {repo}
              </h1>
              <div className="flex flex-wrap items-center gap-3 font-mono text-xs text-muted">
                <a
                  href={report.publicLinks.repository}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-link hover:text-accent transition underline underline-offset-4"
                >
                  GitHub Repository ↗
                </a>
                <span>·</span>
                <span>Default branch: <strong className="text-text">{report.repository.defaultBranch}</strong></span>
                {report.analyzedCommit && (
                  <>
                    <span>·</span>
                    <span>Commit: <code className="text-text">{report.analyzedCommit.slice(0, 7)}</code></span>
                  </>
                )}
              </div>
            </div>

            {/* Score & Grade Display */}
            <div className="flex items-baseline gap-3 rounded-xl border border-muted/25 bg-base/60 px-6 py-4">
              <span className="font-mono text-5xl sm:text-6xl font-bold tracking-tight text-accent">
                {currentScore}
              </span>
              <div className="flex flex-col">
                <span className="font-mono text-xs uppercase tracking-wider text-muted">
                  Score / 100
                </span>
                <span className="font-mono text-2xl font-bold text-accent">
                  Grade {currentGrade}
                </span>
              </div>
            </div>
          </div>

          {/* Coverage Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-muted/15 pt-5 font-mono text-xs text-muted">
            <div>
              <span className="block text-[11px] uppercase tracking-wider text-muted/70">
                {currentStackReport ? "Stack Status" : "Coverage"}
              </span>
              <strong className="text-text text-sm">
                {currentStackReport ? "Active Audit" : `${report.coverage.percentage}%`}
              </strong>
            </div>
            <div>
              <span className="block text-[11px] uppercase tracking-wider text-muted/70">
                {currentStackReport ? "Checks Total" : "Observed Signals"}
              </span>
              <strong className="text-text text-sm">
                {currentStackReport
                  ? `${currentStackReport.checks.length} checks`
                  : `${report.coverage.observed}/${report.coverage.possible}`}
              </strong>
            </div>
            <div>
              <span className="block text-[11px] uppercase tracking-wider text-muted/70">Schema</span>
              <strong className="text-text text-sm">v{report.schemaVersion}</strong>
            </div>
            <div>
              <span className="block text-[11px] uppercase tracking-wider text-muted/70">Tool</span>
              <strong className="text-text text-sm">v{report.toolVersion}</strong>
            </div>
          </div>
        </section>

        {/* Stack Next Useful Move (when in stack mode) */}
        {currentStackReport && currentStackReport.nextUsefulMove && (
          <section
            aria-labelledby="stack-next-move-heading"
            className="rounded-2xl border-2 border-accent/40 bg-surface/90 p-6 sm:p-8 shadow-xl relative overflow-hidden"
          >
            <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-accent font-semibold mb-2">
              <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
              Recommended {currentStackReport.stackName} Next Move
            </div>

            <div className="space-y-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 id="stack-next-move-heading" className="font-mono text-xl sm:text-2xl font-bold text-text">
                  {currentStackReport.nextUsefulMove.title}
                </h2>
                <span className="rounded bg-accent/15 px-3 py-1 font-mono text-xs font-semibold text-accent border border-accent/30">
                  Effort: {currentStackReport.nextUsefulMove.effort}
                </span>
              </div>

              <p className="font-sans text-sm text-text/90 leading-relaxed max-w-3xl">
                {currentStackReport.nextUsefulMove.whyItMatters}
              </p>

              {currentStackReport.nextUsefulMove.acceptanceCriteria.length > 0 && (
                <div>
                  <h3 className="font-mono text-xs uppercase tracking-wider text-muted mb-2">
                    Acceptance Criteria
                  </h3>
                  <ul className="space-y-1.5 font-sans text-xs text-muted">
                    {currentStackReport.nextUsefulMove.acceptanceCriteria.map((criterion: string) => (
                      <li key={criterion} className="flex items-start gap-2">
                        <span className="text-accent" aria-hidden="true">✓</span>
                        <span>{criterion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {currentStackReport.nextUsefulMove?.remediation && (
                <div className="mt-4 border-t border-muted/15 pt-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-muted">
                      Target File: <code className="text-accent font-semibold">{currentStackReport.nextUsefulMove.remediation.targetPath}</code>
                    </span>
                    <button
                      onClick={() => copyToClipboard(currentStackReport.nextUsefulMove?.remediation?.codeSnippet || "", setCliCopied)}
                      type="button"
                      className="inline-flex items-center gap-1 rounded bg-accent/15 px-2.5 py-1 font-mono text-[11px] font-semibold text-accent border border-accent/30 hover:bg-accent/25 transition"
                    >
                      {cliCopied ? "✓ Copied" : "Copy Solution Code"}
                    </button>
                  </div>
                  <pre className="overflow-x-auto rounded-lg border border-muted/20 bg-base p-3 font-mono text-xs text-text/90 leading-relaxed">
                    <code>{currentStackReport.nextUsefulMove.remediation.codeSnippet}</code>
                  </pre>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Core Signature Feature: Next Useful Move (when in core mode) */}
        {!currentStackReport && report.nextUsefulMove && (
          <section
            aria-labelledby="next-move-heading"
            className="rounded-2xl border-2 border-accent/40 bg-surface/90 p-6 sm:p-8 shadow-xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 w-32 h-32 bg-accent/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-accent font-semibold mb-2">
              <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
              Recommended Next Useful Move
            </div>

            <div className="space-y-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 id="next-move-heading" className="font-mono text-xl sm:text-2xl font-bold text-text">
                  {report.nextUsefulMove.title}
                </h2>
                <span className="rounded bg-accent/15 px-3 py-1 font-mono text-xs font-semibold text-accent border border-accent/30">
                  Effort: {report.nextUsefulMove.effort}
                </span>
              </div>

              <p className="font-sans text-sm text-text/90 leading-relaxed max-w-3xl">
                {report.nextUsefulMove.whyItMatters}
              </p>

              <div>
                <h3 className="font-mono text-xs uppercase tracking-wider text-muted mb-2">
                  Acceptance Criteria
                </h3>
                <ul className="space-y-1.5 font-sans text-xs text-muted">
                  {report.nextUsefulMove.acceptanceCriteria.map((criterion) => (
                    <li key={criterion} className="flex items-start gap-2">
                      <span className="text-accent" aria-hidden="true">
                        ✓
                      </span>
                      <span>{criterion}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-3">
                {report.nextUsefulMove.issueDraft && (
                  <button
                    type="button"
                    onClick={() => setIsDraftModalOpen(true)}
                    className="rounded-lg border border-accent bg-accent/20 px-4 py-2 font-mono text-xs font-semibold text-accent transition hover:bg-accent/30 focus:outline-none"
                  >
                    View Ready Issue Draft →
                  </button>
                )}
                {report.nextUsefulMove.patchPlan && (
                  <button
                    type="button"
                    onClick={() => setIsDraftModalOpen(true)}
                    className="rounded-lg border border-muted/30 bg-base px-4 py-2 font-mono text-xs font-medium text-text transition hover:border-accent hover:text-accent focus:outline-none"
                  >
                    Preview Patch Plan ({report.nextUsefulMove.patchPlan.safety})
                  </button>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Evidence Breakdown: Stack or Core */}
        {currentStackReport ? (
          <StackEvidencePanel report={currentStackReport} />
        ) : (
          <EvidencePanel
            checks={report.checks}
            onReportIncorrectSignal={(check) => setReportingCheck(check)}
          />
        )}

        {/* Maintainer Improvement History Timeline */}
        <ImprovementTimeline repo={repo} events={timeline} />

        {/* Starter Issues for Newcomers */}

        {report.goodFirstIssues.length > 0 && (
          <section aria-labelledby="starter-issues-heading" className="rounded-xl border border-muted/20 bg-surface p-6 space-y-4">
            <h2 id="starter-issues-heading" className="font-mono text-lg font-bold text-text">
              Starter Issues for First-Time Contributors
            </h2>
            <div className="grid gap-2">
              {report.goodFirstIssues.map((issue) => (
                <a
                  key={issue.url}
                  href={issue.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-lg border border-muted/15 bg-base/50 p-3 text-xs font-mono text-text hover:border-accent hover:text-accent transition"
                >
                  <span className="truncate pr-4">{issue.title}</span>
                  <span className="text-muted shrink-0">Open on GitHub ↗</span>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* Maintainer Workflows & Embedding */}
        <section aria-labelledby="workflows-heading" className="rounded-xl border border-muted/20 bg-surface p-6 space-y-6">
          <h2 id="workflows-heading" className="font-mono text-lg font-bold text-text">
            Integrate Into Your Workflow
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            {/* CLI snippet */}
            <div className="space-y-2">
              <span className="font-mono text-xs uppercase tracking-wider text-muted">
                Run locally with CLI
              </span>
              <div className="relative">
                <pre className="rounded border border-muted/20 bg-base p-3 font-mono text-xs text-text overflow-x-auto">
                  {cliSnippet}
                </pre>
                <button
                  type="button"
                  onClick={() => copyToClipboard(cliSnippet, setCliCopied)}
                  className="absolute top-2 right-2 rounded border border-muted/30 bg-surface px-2 py-0.5 font-mono text-[10px] text-muted hover:text-text"
                >
                  {cliCopied ? "Copied" : "Copy"}
                </button>
              </div>
            </div>

            {/* GitHub Action snippet */}
            <div className="space-y-2">
              <span className="font-mono text-xs uppercase tracking-wider text-muted">
                Add GitHub Action
              </span>
              <div className="relative">
                <pre className="rounded border border-muted/20 bg-base p-3 font-mono text-xs text-text overflow-x-auto">
                  {actionSnippet}
                </pre>
                <button
                  type="button"
                  onClick={() => copyToClipboard(actionSnippet, setActionCopied)}
                  className="absolute top-2 right-2 rounded border border-muted/30 bg-surface px-2 py-0.5 font-mono text-[10px] text-muted hover:text-text"
                >
                  {actionCopied ? "Copied" : "Copy"}
                </button>
              </div>
            </div>

            {/* Markdown Badge snippet */}
            <div className="space-y-2">
              <span className="font-mono text-xs uppercase tracking-wider text-muted">
                README Evidence Badge
              </span>
              <div className="relative">
                <pre className="rounded border border-muted/20 bg-base p-3 font-mono text-xs text-text overflow-x-auto">
                  {badgeMarkdown}
                </pre>
                <button
                  type="button"
                  onClick={() => copyToClipboard(badgeMarkdown, setBadgeCopied)}
                  className="absolute top-2 right-2 rounded border border-muted/30 bg-surface px-2 py-0.5 font-mono text-[10px] text-muted hover:text-text"
                >
                  {badgeCopied ? "Copied" : "Copy"}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Community & ETHIOR Updates Subscription */}
        <SubscriberBanner source="welcomescore_report" />

        {/* Limitations & Ethical Boundary Disclaimer */}
        <section aria-labelledby="limits-heading" className="rounded-xl border border-muted/20 bg-surface/40 p-6 space-y-3 font-sans text-xs text-muted leading-relaxed">
          <h2 id="limits-heading" className="font-mono text-xs uppercase tracking-wider text-muted font-bold">
            Methodology & Honest Limitations
          </h2>
          <ul className="space-y-1 list-disc list-inside">
            {report.limitations.map((limit) => (
              <li key={limit}>{limit}</li>
            ))}
          </ul>
          <p className="pt-2 text-[11px] text-muted/70">
            WelcomeScore does not rank repositories for popularity, generate artificial star activity, or offer legal or security certifications.
          </p>
        </section>
      </main>

      {/* Global Footer */}
      <SiteFooter />

      {/* Action Draft Modal */}
      {report.nextUsefulMove && (
        <ActionDraftModal
          move={report.nextUsefulMove}
          isOpen={isDraftModalOpen}
          onClose={() => setIsDraftModalOpen(false)}
        />
      )}

      {/* Report Signal Quick Modal */}
      {reportingCheck && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-base/80 p-4 backdrop-blur-sm"
        >
          <div className="w-full max-w-lg rounded-xl border border-muted/30 bg-surface p-6 shadow-2xl space-y-4">
            <h3 className="font-mono text-base font-bold text-text">
              Report Signal: {reportingCheck.label}
            </h3>
            <p className="font-sans text-xs text-muted leading-relaxed">
              If {reportingCheck.label} is intentionally organized differently in this repository (e.g. documentation is hosted on an external site or custom license), report it below so our maintainer team can verify and adjust regression rules.
            </p>
            <div className="space-y-2">
              <label className="font-mono text-xs text-muted block">Observed Finding:</label>
              <div className="rounded border border-muted/20 bg-base p-2 font-mono text-xs text-text">
                {reportingCheck.explanation}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setReportingCheck(null)}
                className="rounded border border-muted/30 px-3 py-1.5 font-mono text-xs text-muted hover:text-text"
              >
                Cancel
              </button>
              <Link
                href={`/faq#report-incorrect-signal`}
                className="rounded border border-accent bg-accent/20 px-3 py-1.5 font-mono text-xs text-accent hover:bg-accent/30"
              >
                Continue to Corrections →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

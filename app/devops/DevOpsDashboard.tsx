"use client";

import { useState } from "react";
import Link from "next/link";
import WelcomeScoreWordmark from "@/app/components/WelcomeScoreWordmark";
import BackButton from "@/app/components/BackButton";
import HeaderControls from "@/app/components/HeaderControls";
import type { DevOpsDoctorReport } from "@/lib/devops/doctor";

const BENCHMARKS = [
  { name: "ethiorhq/welcomescore", label: "WelcomeScore" },
  { name: "vercel/next.js", label: "Next.js" },
  { name: "facebook/react", label: "React" },
  { name: "shadcn/ui", label: "shadcn/ui" },
  { name: "tailwindlabs/tailwindcss", label: "Tailwind CSS" },
];

export default function DevOpsDashboard({
  initialRepo,
  initialReport,
}: {
  initialRepo?: string;
  initialReport?: DevOpsDoctorReport | null;
}) {
  const [repoInput, setRepoInput] = useState(initialRepo || "");
  const [activeRepo, setActiveRepo] = useState(initialRepo || "");
  const [report, setReport] = useState<DevOpsDoctorReport | null>(initialReport || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedPatch, setCopiedPatch] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "issues" | "license" | "patch">("overview");

  async function handleAnalyze(targetRepo: string) {
    const trimmed = targetRepo.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);
    setActiveRepo(trimmed);

    try {
      const res = await fetch(`/api/devops?repo=${encodeURIComponent(trimmed)}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to analyze repository DevOps posture");
      }
      setReport(data.report);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis request failed");
      setReport(null);
    } finally {
      setLoading(false);
    }
  }

  async function copyPatch(patchText: string) {
    try {
      await navigator.clipboard.writeText(patchText);
      setCopiedPatch(true);
      setTimeout(() => setCopiedPatch(false), 2000);
    } catch {
      // ignore
    }
  }

  const directPrUrl =
    activeRepo && report?.recommendedCiPatch
      ? `https://github.com/${activeRepo}/new/main?filename=${encodeURIComponent(
          ".github/workflows/ci.yml"
        )}&value=${encodeURIComponent(report.recommendedCiPatch)}`
      : null;

  return (
    <main className="min-h-screen bg-base px-4 py-8 text-text sm:px-6 sm:py-12">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Authentic Page Header */}
        <header className="flex flex-col gap-6 border-b border-muted/20 pb-8 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-accent">
              DevOps CI/CD Pipeline Doctor
            </p>
            <h1 className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-3xl text-text sm:text-5xl">
              <WelcomeScoreWordmark badgeClassName="sm:mt-1.5" />
              <span className="font-mono font-bold tracking-tight">Pipeline Doctor</span>
            </h1>
            <p className="mt-3 max-w-2xl font-sans text-sm leading-6 text-muted sm:text-base">
              Audit GitHub Actions and workflow efficiency. Eliminate wasted billable runner minutes, plug supply chain vulnerabilities, and resolve license copyleft conflicts.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <BackButton />
            <Link
              href="/"
              className="inline-flex h-11 items-center justify-center rounded-md border border-accent/45 bg-accent/10 px-4 font-sans text-sm font-medium text-accent transition-colors duration-180 ease-out hover:bg-accent/15 active:scale-[0.98] sm:h-10"
            >
              Check a repository
            </Link>
            <HeaderControls />
          </div>
        </header>

        {/* Authentic Notice Callout */}
        <section className="rounded-lg border border-accent/25 bg-surface px-5 py-4 sm:flex sm:items-center sm:justify-between sm:gap-6">
          <p className="font-sans text-sm leading-6 text-text">
            DevOps Doctor diagnostics inspect workflow triggers, runner cache misses, unpinned actions, and license copyleft risks.
          </p>
          <span className="mt-2 inline-block shrink-0 font-mono text-xs text-muted sm:mt-0">
            Zero tokens required · Read-only audit
          </span>
        </section>

        {/* Search Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void handleAnalyze(repoInput);
          }}
          className="flex w-full flex-col gap-3 sm:flex-row"
        >
          <label className="sr-only" htmlFor="devops-repo-input">
            Repository
          </label>
          <input
            id="devops-repo-input"
            type="text"
            value={repoInput}
            onChange={(e) => setRepoInput(e.target.value)}
            placeholder="owner/repo — e.g. vercel/next.js"
            className="h-12 w-full rounded-md border border-muted/45 bg-surface px-4 font-mono text-base text-text outline-none placeholder:text-muted focus:border-accent sm:text-sm"
          />
          <button
            type="submit"
            disabled={loading || !repoInput.trim()}
            className="h-12 shrink-0 rounded-md bg-accent px-6 font-sans text-sm font-semibold text-base active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-surface disabled:text-muted"
          >
            {loading ? "Diagnosing..." : "Diagnose Pipeline"}
          </button>
        </form>

        {/* Popular Benchmarks Chips */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs uppercase tracking-wider text-muted">
            Popular benchmarks:
          </span>
          {BENCHMARKS.map((bm) => (
            <button
              key={bm.name}
              type="button"
              onClick={() => {
                setRepoInput(bm.name);
                void handleAnalyze(bm.name);
              }}
              className="rounded-md border border-muted/30 bg-surface px-3 py-1 font-mono text-xs text-muted hover:border-accent/40 hover:text-text transition"
            >
              {bm.label}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="rounded-lg border border-accent/25 bg-surface/50 p-8 text-center space-y-3 font-mono">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
            <p className="text-sm text-accent">Inspecting GitHub Actions workflows and license files for {activeRepo}...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 font-mono text-xs text-red-400">
            ⚠ {error}
          </div>
        )}

        {/* Results Container */}
        {report && !loading && (
          <div className="space-y-6">
            {/* Top Overview Card */}
            <section className="rounded-lg border border-muted/25 bg-surface p-6 sm:p-8 space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-xs uppercase tracking-wider text-accent font-semibold">
                    DevOps Diagnostic Report: {activeRepo}
                  </p>
                  <h2 className="mt-1 font-mono text-2xl sm:text-3xl font-bold text-text">
                    Pipeline Health: Grade {report.grade}
                  </h2>
                  <p className="mt-2 font-sans text-sm text-muted leading-relaxed max-w-xl">
                    {report.summary}
                  </p>
                </div>

                <div className="flex items-center gap-4 bg-base/60 border border-muted/20 rounded-md px-5 py-4">
                  <div>
                    <span className="block font-mono text-4xl sm:text-5xl font-extrabold text-accent">
                      {report.score}
                    </span>
                    <span className="font-mono text-[11px] text-muted uppercase">DevOps Score</span>
                  </div>
                  <div className="h-10 w-px bg-muted/20" />
                  <div>
                    <span className="block font-mono text-2xl sm:text-3xl font-bold text-good">
                      {report.grade}
                    </span>
                    <span className="font-mono text-[11px] text-muted uppercase">Tier</span>
                  </div>
                </div>
              </div>

              {/* Compute Waste Impact Alert */}
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-muted/15 pt-4">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-muted">Estimated Monthly Waste:</span>
                  <span className="font-mono text-xs font-bold text-accent">
                    ~{report.wastedComputeEstimate.estimatedMinutesSavedPerMonth} runner minutes/mo
                  </span>
                  <span className="rounded bg-accent/15 px-2 py-0.5 font-mono text-[10px] text-accent border border-accent/30">
                    {report.wastedComputeEstimate.efficiencyRating}
                  </span>
                </div>

                {directPrUrl && (
                  <a
                    href={directPrUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-md bg-good/20 px-3 py-1.5 font-mono text-xs font-semibold text-good border border-good/40 hover:bg-good/30 transition shadow-sm"
                  >
                    🚀 Apply 1-Click CI Optimizer PR ↗
                  </a>
                )}
              </div>
            </section>

            {/* 4 Pillars Subscores */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-lg border border-muted/20 bg-surface/50 p-4 space-y-1">
                <span className="font-mono text-[11px] text-muted uppercase tracking-wider block">Dependency Cache</span>
                <span className="font-mono text-2xl font-bold text-text">{report.metrics.cachingScore}%</span>
                <p className="font-sans text-xs text-muted">npm/pnpm/yarn cache re-use</p>
              </div>

              <div className="rounded-lg border border-muted/20 bg-surface/50 p-4 space-y-1">
                <span className="font-mono text-[11px] text-muted uppercase tracking-wider block">Supply Chain Safety</span>
                <span className="font-mono text-2xl font-bold text-text">{report.metrics.securityScore}%</span>
                <p className="font-sans text-xs text-muted">Pinned immutable actions</p>
              </div>

              <div className="rounded-lg border border-muted/20 bg-surface/50 p-4 space-y-1">
                <span className="font-mono text-[11px] text-muted uppercase tracking-wider block">Concurrency Guard</span>
                <span className="font-mono text-2xl font-bold text-text">{report.metrics.concurrencyScore}%</span>
                <p className="font-sans text-xs text-muted">Cancels obsolete builds</p>
              </div>

              <div className="rounded-lg border border-muted/20 bg-surface/50 p-4 space-y-1">
                <span className="font-mono text-[11px] text-muted uppercase tracking-wider block">License Radar</span>
                <span className="font-mono text-2xl font-bold text-text">{report.metrics.licenseScore}%</span>
                <p className="font-sans text-xs text-muted">{report.licenseCompliance.classification} ({report.licenseCompliance.licenseSpdx})</p>
              </div>
            </div>

            {/* Tabs Navigation */}
            <div className="flex flex-wrap gap-2 border-b border-muted/20 pb-3 font-mono text-xs">
              <button
                type="button"
                onClick={() => setActiveTab("overview")}
                className={
                  activeTab === "overview"
                    ? "rounded-md border border-accent bg-accent/20 px-3 py-1.5 font-semibold text-accent"
                    : "rounded-md border border-muted/30 bg-surface px-3 py-1.5 text-muted hover:border-accent/40 hover:text-text"
                }
              >
                Diagnostic Issues ({report.issues.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("license")}
                className={
                  activeTab === "license"
                    ? "rounded-md border border-accent bg-accent/20 px-3 py-1.5 font-semibold text-accent"
                    : "rounded-md border border-muted/30 bg-surface px-3 py-1.5 text-muted hover:border-accent/40 hover:text-text"
                }
              >
                License Radar ({report.licenseCompliance.licenseSpdx})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("patch")}
                className={
                  activeTab === "patch"
                    ? "rounded-md border border-accent bg-accent/20 px-3 py-1.5 font-semibold text-accent"
                    : "rounded-md border border-muted/30 bg-surface px-3 py-1.5 text-muted hover:border-accent/40 hover:text-text"
                }
              >
                Optimized CI Patch
              </button>
            </div>

            {/* Tab: Issues Breakdown */}
            {activeTab === "overview" && (
              <div className="space-y-3">
                {report.issues.length === 0 ? (
                  <div className="rounded-lg border border-good/30 bg-good/10 p-6 text-center font-mono text-xs text-good">
                    ✓ Clean bill of health! No critical DevOps or license inefficiencies detected.
                  </div>
                ) : (
                  report.issues.map((issue) => (
                    <article
                      key={issue.id}
                      className="rounded-lg border border-muted/20 bg-surface/60 p-5 space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded px-2 py-0.5 font-mono text-[10px] font-bold uppercase border ${
                              issue.severity === "critical"
                                ? "bg-red-500/15 text-red-400 border-red-500/30"
                                : issue.severity === "warning"
                                  ? "bg-accent/15 text-accent border-accent/30"
                                  : "bg-muted/15 text-muted border-muted/30"
                            }`}
                          >
                            {issue.severity}
                          </span>
                          <span className="font-mono text-xs uppercase tracking-wider text-muted">
                            {issue.category}
                          </span>
                          <h3 className="font-mono text-sm font-semibold text-text">
                            {issue.title}
                          </h3>
                        </div>
                        {issue.impactMinutesPerRun && issue.impactMinutesPerRun > 0 ? (
                          <span className="font-mono text-xs text-accent">
                            +{issue.impactMinutesPerRun} min/run waste
                          </span>
                        ) : null}
                      </div>

                      <p className="font-sans text-xs text-muted leading-relaxed">
                        {issue.description}
                      </p>

                      <div className="rounded-md border border-muted/15 bg-base/60 p-3 space-y-1.5 font-mono text-xs">
                        <span className="text-accent font-semibold block">Recommended Action:</span>
                        <p className="text-text/90 font-sans">{issue.remediation}</p>
                        {issue.suggestedPatch && (
                          <pre className="mt-2 overflow-x-auto rounded border border-muted/20 bg-base p-2 text-[11px] text-text">
                            <code>{issue.suggestedPatch}</code>
                          </pre>
                        )}
                      </div>
                    </article>
                  ))
                )}
              </div>
            )}

            {/* Tab: License Radar */}
            {activeTab === "license" && (
              <div className="rounded-lg border border-muted/20 bg-surface/60 p-6 space-y-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="font-mono text-xs uppercase text-accent font-semibold">
                      SPDX Identification: {report.licenseCompliance.licenseSpdx}
                    </span>
                    <h3 className="mt-1 font-mono text-xl font-bold text-text capitalize">
                      Classification: {report.licenseCompliance.classification} License
                    </h3>
                  </div>
                  <span
                    className={`rounded border px-3 py-1 font-mono text-xs font-bold uppercase ${
                      report.licenseCompliance.riskLevel === "low"
                        ? "bg-good/15 text-good border-good/30"
                        : report.licenseCompliance.riskLevel === "medium"
                          ? "bg-accent/15 text-accent border-accent/30"
                          : "bg-red-500/15 text-red-400 border-red-500/30"
                    }`}
                  >
                    {report.licenseCompliance.riskLevel} Risk
                  </span>
                </div>

                <p className="font-sans text-sm text-text/90 leading-relaxed">
                  {report.licenseCompliance.notes}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-muted/15 pt-4">
                  <div className="rounded-md border border-muted/20 bg-base/50 p-3">
                    <span className="font-mono text-[11px] text-muted uppercase block">Commercial Use</span>
                    <strong className={`font-mono text-sm ${report.licenseCompliance.commercialUsePermitted ? "text-good" : "text-red-400"}`}>
                      {report.licenseCompliance.commercialUsePermitted ? "✓ Permitted" : "✗ Restricted"}
                    </strong>
                  </div>
                  <div className="rounded-md border border-muted/20 bg-base/50 p-3">
                    <span className="font-mono text-[11px] text-muted uppercase block">Modification Allowed</span>
                    <strong className={`font-mono text-sm ${report.licenseCompliance.modificationAllowed ? "text-good" : "text-red-400"}`}>
                      {report.licenseCompliance.modificationAllowed ? "✓ Allowed" : "✗ Restricted"}
                    </strong>
                  </div>
                  <div className="rounded-md border border-muted/20 bg-base/50 p-3">
                    <span className="font-mono text-[11px] text-muted uppercase block">Source Disclosure</span>
                    <strong className={`font-mono text-sm ${report.licenseCompliance.disclosureRequired ? "text-accent" : "text-good"}`}>
                      {report.licenseCompliance.disclosureRequired ? "⚠ Required (Copyleft)" : "✓ Not Required"}
                    </strong>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Optimized CI Patch */}
            {activeTab === "patch" && report.recommendedCiPatch && (
              <div className="rounded-lg border border-muted/20 bg-surface/60 p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-mono text-base font-bold text-text">
                      Production-Grade GitHub Actions Workflow
                    </h3>
                    <p className="font-sans text-xs text-muted">
                      Target location: <code className="text-accent font-semibold">.github/workflows/ci.yml</code>
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => void copyPatch(report.recommendedCiPatch!)}
                      className="rounded-md border border-accent/40 bg-accent/15 px-3 py-1.5 font-mono text-xs font-semibold text-accent hover:bg-accent/25 transition cursor-pointer"
                    >
                      {copiedPatch ? "✓ Copied!" : "Copy YAML"}
                    </button>
                    {directPrUrl && (
                      <a
                        href={directPrUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-md bg-good/20 px-3 py-1.5 font-mono text-xs font-semibold text-good border border-good/40 hover:bg-good/30 transition"
                      >
                        🚀 1-Click PR on GitHub ↗
                      </a>
                    )}
                  </div>
                </div>

                <pre className="overflow-x-auto rounded-md border border-muted/25 bg-base p-4 font-mono text-xs text-text/90 leading-relaxed">
                  <code>{report.recommendedCiPatch}</code>
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

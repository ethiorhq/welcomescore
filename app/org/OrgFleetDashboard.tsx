"use client";

import { useState } from "react";
import Link from "next/link";
import WelcomeScoreWordmark from "@/app/components/WelcomeScoreWordmark";
import HeaderControls from "@/app/components/HeaderControls";
import SiteFooter from "@/app/components/SiteFooter";
import type { OrgFleetReport } from "@/lib/org/fleetEngine";

const FEATURED_ORGS = [
  { name: "vercel", label: "Vercel" },
  { name: "facebook", label: "Meta / Facebook" },
  { name: "supabase", label: "Supabase" },
  { name: "shadcn", label: "shadcn" },
  { name: "tailwindlabs", label: "Tailwind Labs" },
  { name: "ethiorhq", label: "ETHIOR" },
];

export default function OrgFleetDashboard({
  initialOrg,
  initialReport,
}: {
  initialOrg?: string;
  initialReport?: OrgFleetReport | null;
}) {
  const [orgInput, setOrgInput] = useState(initialOrg || "");
  const [report, setReport] = useState<OrgFleetReport | null>(initialReport || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterText, setFilterText] = useState("");
  const [filterOnlyAttention, setFilterOnlyAttention] = useState(false);

  async function handleSearch(targetOrg: string) {
    const clean = targetOrg.trim().replace(/^https?:\/\/github\.com\//i, "").replace(/\/$/, "");
    if (!clean) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/org/${encodeURIComponent(clean)}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to fetch organization fleet report");
      }
      setReport(data.report);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to aggregate fleet");
      setReport(null);
    } finally {
      setLoading(false);
    }
  }

  const filteredRepos = (report?.repos || []).filter((r) => {
    if (filterOnlyAttention && r.score >= 70 && !r.isStale) {
      return false;
    }
    if (filterText) {
      const q = filterText.toLowerCase();
      return (
        r.name.toLowerCase().includes(q) ||
        (r.language && r.language.toLowerCase().includes(q)) ||
        (r.description && r.description.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-base text-text selection:bg-accent/30 selection:text-text">
      {/* Header */}
      <header className="border-b border-muted/20 bg-surface/50 backdrop-blur-md sticky top-0 z-40">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-2 group">
            <WelcomeScoreWordmark />
          </Link>
          <div className="flex items-center gap-3">
            <nav className="hidden sm:flex items-center gap-3 font-mono text-xs text-muted">
              <Link href="/" className="hover:text-text transition">Audits</Link>
              <Link href="/devops" className="hover:text-text transition">DevOps Doctor</Link>
              <Link href="/org" className="text-accent font-semibold">Fleet Cockpit</Link>
              <Link href="/compare" className="hover:text-text transition">Compare</Link>
              <Link href="/lounge" className="hover:text-text transition">Dev Lounge</Link>
            </nav>
            <HeaderControls />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12 space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-3.5 py-1 font-mono text-xs text-accent">
            <span className="h-2 w-2 rounded-full bg-accent animate-ping" />
            ETHIOR Multi-Repo Fleet Cockpit
          </div>
          <h1 className="font-mono text-2xl sm:text-4xl font-extrabold tracking-tight text-text">
            Organization-Wide Contributor Readiness & Health
          </h1>
          <p className="mx-auto max-w-2xl font-sans text-sm text-muted leading-relaxed">
            Audit dozens of repositories in one cockpit. Track fleet-wide contributor readiness, identify abandoned or unlicensed codebases, and maintain organization-wide OSS excellence.
          </p>

          {/* Search Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleSearch(orgInput);
            }}
            className="mx-auto max-w-xl pt-2 flex flex-col sm:flex-row gap-2"
          >
            <input
              type="text"
              value={orgInput}
              onChange={(e) => setOrgInput(e.target.value)}
              placeholder="e.g. vercel, facebook, supabase"
              className="w-full rounded-lg border border-muted/30 bg-surface/80 px-4 py-3 font-mono text-sm text-text placeholder-muted/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
            <button
              type="submit"
              disabled={loading || !orgInput.trim()}
              className="inline-flex items-center justify-center rounded-lg bg-accent px-6 py-3 font-mono text-sm font-semibold text-base transition duration-150 hover:bg-accent/90 disabled:opacity-50 cursor-pointer shadow-lg shadow-accent/10 shrink-0"
            >
              {loading ? "Inspecting Fleet..." : "Scan Fleet"}
            </button>
          </form>

          {/* Popular Organizations */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <span className="font-mono text-xs text-muted/70">Featured Fleets:</span>
            {FEATURED_ORGS.map((org) => (
              <button
                key={org.name}
                type="button"
                onClick={() => {
                  setOrgInput(org.name);
                  void handleSearch(org.name);
                }}
                className="rounded-md border border-muted/20 bg-surface/40 px-2.5 py-1 font-mono text-xs text-muted hover:border-accent hover:text-accent transition"
              >
                {org.label}
              </button>
            ))}
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 font-mono text-xs text-red-400">
            ⚠ {error}
          </div>
        )}

        {/* Fleet Cockpit Results */}
        {report && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Top Fleet Health Banner */}
            <section className="rounded-2xl border border-muted/25 bg-surface/90 p-6 sm:p-8 shadow-xl relative overflow-hidden">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs uppercase tracking-wider text-accent font-semibold">
                      Organization Fleet Health · GitHub @{report.orgName}
                    </span>
                    <a
                      href={`https://github.com/${report.orgName}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted hover:text-accent font-mono text-xs underline"
                    >
                      GitHub Org ↗
                    </a>
                  </div>
                  <h2 className="mt-1 font-mono text-2xl sm:text-3xl font-bold text-text">
                    Fleet Index: Grade {report.fleetGrade} ({report.fleetAverageScore}/100)
                  </h2>
                  <p className="mt-2 font-sans text-sm text-muted leading-relaxed max-w-xl">
                    Across {report.totalRepos} analyzed repositories, {report.orgName} maintains an aggregate contributor readiness score of {report.fleetAverageScore}.
                  </p>
                </div>

                <div className="flex items-center gap-4 bg-base/60 border border-muted/20 rounded-xl px-5 py-4 shrink-0">
                  <div>
                    <span className="block font-mono text-4xl sm:text-5xl font-extrabold text-accent">
                      {report.fleetAverageScore}
                    </span>
                    <span className="font-mono text-[11px] text-muted uppercase">Fleet Avg</span>
                  </div>
                  <div className="h-10 w-px bg-muted/20" />
                  <div>
                    <span className="block font-mono text-2xl sm:text-3xl font-bold text-good">
                      {report.fleetGrade}
                    </span>
                    <span className="font-mono text-[11px] text-muted uppercase">Fleet Tier</span>
                  </div>
                </div>
              </div>

              {/* Aggregated Fleet Stat Tiles */}
              <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-muted/15 pt-5 font-mono text-xs">
                <div>
                  <span className="text-muted uppercase text-[11px] block">Public Repos</span>
                  <strong className="text-text text-base">{report.totalRepos}</strong>
                </div>
                <div>
                  <span className="text-muted uppercase text-[11px] block">Total Stars</span>
                  <strong className="text-text text-base">{report.totalStars.toLocaleString()}</strong>
                </div>
                <div>
                  <span className="text-muted uppercase text-[11px] block">Total Forks</span>
                  <strong className="text-text text-base">{report.totalForks.toLocaleString()}</strong>
                </div>
                <div>
                  <span className="text-muted uppercase text-[11px] block">Stale Repos (&gt;3mo)</span>
                  <strong className={`text-base ${report.staleRepoCount > 0 ? "text-accent" : "text-good"}`}>
                    {report.staleRepoCount}
                  </strong>
                </div>
              </div>

              {/* Grade Distribution Bar */}
              <div className="mt-6 space-y-2 border-t border-muted/15 pt-4">
                <div className="flex items-center justify-between font-mono text-xs text-muted">
                  <span>Fleet Grade Distribution:</span>
                  <span>
                    A+: {report.gradeDistribution["A+"]} · A: {report.gradeDistribution.A} · B: {report.gradeDistribution.B} · C: {report.gradeDistribution.C} · D: {report.gradeDistribution.D} · F: {report.gradeDistribution.F}
                  </span>
                </div>
                <div className="h-3 w-full rounded-full bg-base/80 overflow-hidden flex">
                  {report.totalRepos > 0 && (
                    <>
                      <div
                        style={{ width: `${(report.gradeDistribution["A+"] / report.totalRepos) * 100}%` }}
                        className="bg-emerald-400 h-full"
                        title={`A+: ${report.gradeDistribution["A+"]}`}
                      />
                      <div
                        style={{ width: `${(report.gradeDistribution.A / report.totalRepos) * 100}%` }}
                        className="bg-good h-full"
                        title={`A: ${report.gradeDistribution.A}`}
                      />
                      <div
                        style={{ width: `${(report.gradeDistribution.B / report.totalRepos) * 100}%` }}
                        className="bg-accent h-full"
                        title={`B: ${report.gradeDistribution.B}`}
                      />
                      <div
                        style={{ width: `${(report.gradeDistribution.C / report.totalRepos) * 100}%` }}
                        className="bg-amber-500 h-full"
                        title={`C: ${report.gradeDistribution.C}`}
                      />
                      <div
                        style={{ width: `${(report.gradeDistribution.D / report.totalRepos) * 100}%` }}
                        className="bg-orange-600 h-full"
                        title={`D: ${report.gradeDistribution.D}`}
                      />
                      <div
                        style={{ width: `${(report.gradeDistribution.F / report.totalRepos) * 100}%` }}
                        className="bg-red-500 h-full"
                        title={`F: ${report.gradeDistribution.F}`}
                      />
                    </>
                  )}
                </div>
              </div>
            </section>

            {/* Repositories Fleet Table */}
            <section className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <h3 className="font-mono text-lg font-bold text-text">
                  Fleet Repositories ({filteredRepos.length})
                </h3>

                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                    placeholder="Filter by repo name or stack..."
                    className="rounded-lg border border-muted/30 bg-surface px-3 py-1.5 font-mono text-xs text-text placeholder-muted/60 focus:border-accent focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setFilterOnlyAttention(!filterOnlyAttention)}
                    className={`rounded-lg border px-3 py-1.5 font-mono text-xs font-semibold transition ${
                      filterOnlyAttention
                        ? "border-accent bg-accent/20 text-accent"
                        : "border-muted/30 bg-surface text-muted hover:text-text"
                    }`}
                  >
                    {filterOnlyAttention ? "✓ Showing Attention Only" : "Attention Filter"}
                  </button>
                </div>
              </div>

              <div className="divide-y divide-muted/10 rounded-xl border border-muted/20 bg-surface/50 overflow-hidden">
                {filteredRepos.length === 0 ? (
                  <div className="p-8 text-center font-mono text-xs text-muted">
                    No repositories matching current filters.
                  </div>
                ) : (
                  filteredRepos.map((repo) => (
                    <article
                      key={repo.fullName}
                      className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-surface/80 transition"
                    >
                      <div className="space-y-1.5 max-w-xl">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            href={`/report/${repo.fullName}`}
                            className="font-mono text-sm font-bold text-text hover:text-accent transition underline underline-offset-2"
                          >
                            {repo.name}
                          </Link>
                          {repo.language && (
                            <span className="rounded bg-muted/15 border border-muted/25 px-2 py-0.5 font-mono text-[10px] text-muted">
                              {repo.language}
                            </span>
                          )}
                          {repo.isStale && (
                            <span className="rounded bg-orange-500/15 border border-orange-500/30 px-2 py-0.5 font-mono text-[10px] text-orange-400">
                              Stale &gt;3mo
                            </span>
                          )}
                        </div>

                        {repo.description && (
                          <p className="font-sans text-xs text-muted line-clamp-2">
                            {repo.description}
                          </p>
                        )}

                        {repo.missingKeyFiles.length > 0 && (
                          <div className="flex items-center gap-1.5 font-mono text-[11px] text-accent">
                            <span>Missing:</span>
                            {repo.missingKeyFiles.map((file) => (
                              <span key={file} className="rounded bg-accent/15 px-1.5 py-0.2 border border-accent/30">
                                {file}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        <div className="text-right font-mono text-xs">
                          <span className="text-muted block">{repo.starsCount.toLocaleString()} ★</span>
                          <span className="text-muted/70 block">{repo.forksCount} forks</span>
                        </div>

                        <div className="flex items-center gap-2 bg-base/70 border border-muted/20 rounded-lg px-3 py-2">
                          <span className="font-mono text-lg font-bold text-accent">{repo.score}</span>
                          <span className="font-mono text-sm font-bold text-good">{repo.grade}</span>
                        </div>

                        <div className="flex flex-col gap-1">
                          <Link
                            href={`/report/${repo.fullName}`}
                            className="rounded bg-accent/15 px-2.5 py-1 font-mono text-[11px] font-semibold text-accent border border-accent/30 hover:bg-accent/25 transition text-center"
                          >
                            Audit Report →
                          </Link>
                          <Link
                            href={`/devops/${repo.fullName}`}
                            className="rounded bg-base px-2.5 py-1 font-mono text-[11px] text-muted border border-muted/30 hover:border-accent hover:text-accent transition text-center"
                          >
                            DevOps Doctor
                          </Link>
                        </div>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </section>
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}

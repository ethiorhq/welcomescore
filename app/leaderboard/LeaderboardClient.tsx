"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

const SITE_URL = "https://welcomescore.vercel.app";
const BADGE_VERSION = "3";

type EvaluationFreshness = "fresh" | "stale" | "expired";

type LeaderboardEntry = {
  id: string;
  repoOwner: string;
  repoName: string;
  repoPath: string;
  score: number;
  grade: string;
  primaryLanguage: string;
  starsCount: number;
  forksCount: number;
  roastText: string | null;
  evaluatedAt: string;
  updatedAt: string;
  freshness: EvaluationFreshness;
};

type LeaderboardResponse = {
  entries: LeaderboardEntry[];
};

export default function LeaderboardClient() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [badgeEntry, setBadgeEntry] = useState<LeaderboardEntry | null>(null);
  const refreshedRepositories = useRef(new Set<string>());

  const loadLeaderboard = useCallback(async () => {
    try {
      const response = await fetch("/api/leaderboard", { cache: "no-store" });
      const data = (await response.json()) as LeaderboardResponse;
      setEntries(data.entries ?? []);
      setLoadError(!response.ok);
    } catch {
      setEntries([]);
      setLoadError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadLeaderboard();
  }, [loadLeaderboard]);

  useEffect(() => {
    const candidates = entries
      .filter((entry) => entry.freshness !== "fresh")
      .filter((entry) => !refreshedRepositories.current.has(entry.repoPath))
      .slice(0, 3);

    if (candidates.length === 0) {
      return;
    }

    candidates.forEach((entry) => refreshedRepositories.current.add(entry.repoPath));

    void Promise.all(
      candidates.map((entry) =>
        fetch(`/api/leaderboard/refresh?repo=${encodeURIComponent(entry.repoPath)}`, {
          method: "POST",
        }),
      ),
    ).then(() => {
      window.setTimeout(() => void loadLeaderboard(), 800);
    });
  }, [entries, loadLeaderboard]);

  const podium = entries.slice(0, 3);
  const tableEntries = entries.slice(3);

  return (
    <main className="min-h-screen bg-base px-4 py-8 text-text sm:px-6 sm:py-12">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-6 border-b border-muted/20 pb-8 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-accent">
              Community leaderboard
            </p>
            <h1 className="mt-3 font-mono text-3xl font-bold tracking-tight text-text sm:text-5xl">
              WelcomeScore Hall of Fame
            </h1>
            <p className="mt-3 max-w-2xl font-sans text-sm leading-6 text-muted sm:text-base">
              Repositories that make first-time contributors feel genuinely welcome.
              Rankings are earned through real contributor-health audits, not submissions.
            </p>
          </div>
          <Link
            href="/"
            className="text-link shrink-0 font-sans text-sm underline underline-offset-4"
          >
            Check a repository
          </Link>
        </header>

        <section className="mt-6 rounded-lg border border-accent/25 bg-surface px-5 py-4 sm:flex sm:items-center sm:justify-between sm:gap-6">
          <p className="font-sans text-sm leading-6 text-text">
            Is your project listed here? Grab your dynamic SVG badge to maintain
            your score position.
          </p>
          <Link
            href="/"
            className="text-link mt-2 inline-block shrink-0 font-sans text-sm underline underline-offset-4 sm:mt-0"
          >
            Audit your repository
          </Link>
        </section>

        {isLoading ? <LoadingState /> : null}
        {!isLoading && loadError ? <ErrorState /> : null}
        {!isLoading && !loadError && entries.length === 0 ? <EmptyState /> : null}

        {!isLoading && !loadError && entries.length > 0 ? (
          <>
            <section className="mt-12" aria-labelledby="podium-title">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                    Top contributors
                  </p>
                  <h2 id="podium-title" className="mt-2 font-mono text-2xl font-bold">
                    The podium
                  </h2>
                </div>
                <p className="font-sans text-xs text-muted">Ranked by score, stars, then audit recency.</p>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-3 md:items-end">
                {podium.map((entry, index) => (
                  <PodiumCard
                    key={entry.id}
                    entry={entry}
                    rank={index + 1}
                    onBadge={() => setBadgeEntry(entry)}
                  />
                ))}
              </div>
            </section>

            {tableEntries.length > 0 ? (
              <section className="mt-14" aria-labelledby="ranking-title">
                <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                  Extended ranking
                </p>
                <h2 id="ranking-title" className="mt-2 font-mono text-2xl font-bold">
                  Ranks 4–50
                </h2>
                <div className="mt-6 overflow-x-auto rounded-lg border border-muted/25 bg-surface">
                  <table className="w-full min-w-[760px] border-collapse text-left">
                    <thead className="border-b border-muted/20 font-mono text-xs uppercase tracking-wide text-muted">
                      <tr>
                        <th className="px-5 py-4 font-semibold">Rank</th>
                        <th className="px-5 py-4 font-semibold">Repository</th>
                        <th className="px-5 py-4 font-semibold">Language</th>
                        <th className="px-5 py-4 font-semibold">Community health</th>
                        <th className="px-5 py-4 font-semibold">Last audited</th>
                        <th className="px-5 py-4 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="font-sans text-sm">
                      {tableEntries.map((entry, index) => (
                        <RankingRow
                          key={entry.id}
                          entry={entry}
                          rank={index + 4}
                          onBadge={() => setBadgeEntry(entry)}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ) : null}
          </>
        ) : null}
      </div>

      {badgeEntry ? (
        <BadgeModal entry={badgeEntry} onClose={() => setBadgeEntry(null)} />
      ) : null}
    </main>
  );
}

function PodiumCard({
  entry,
  rank,
  onBadge,
}: {
  entry: LeaderboardEntry;
  rank: number;
  onBadge: () => void;
}) {
  const orderClass =
    rank === 1 ? "md:order-2" : rank === 2 ? "md:order-1" : "md:order-3";
  const cardClass =
    rank === 1
      ? "border-accent/45 bg-base/30 md:min-h-[320px]"
      : "border-muted/25 md:min-h-[276px]";
  const rankLabel = rank === 1 ? "#1" : `#${rank}`;

  return (
    <article className={`${orderClass} rounded-lg border bg-surface p-5 ${cardClass}`}>
      <div className="flex items-center justify-between gap-4">
        <span className={rank === 1 ? "font-mono text-sm font-bold text-accent" : "font-mono text-sm font-bold text-muted"}>
          {rankLabel}
        </span>
        <ScoreBadge entry={entry} />
      </div>
      <Link
        href={auditPath(entry)}
        className="text-link mt-7 block break-all font-mono text-lg font-bold underline underline-offset-4"
      >
        {entry.repoPath}
      </Link>
      <div className="mt-4 flex flex-wrap gap-2 font-mono text-xs text-muted">
        <span className="rounded-md border border-muted/30 px-2 py-1">{entry.primaryLanguage}</span>
        <span className="rounded-md border border-muted/30 px-2 py-1">★ {formatCount(entry.starsCount)}</span>
        <span className="rounded-md border border-muted/30 px-2 py-1">⑂ {formatCount(entry.forksCount)}</span>
      </div>
      {rank === 1 && entry.roastText ? (
        <p className="mt-7 font-sans text-sm leading-6 text-muted">{entry.roastText}</p>
      ) : null}
      <div className="mt-7 flex flex-wrap gap-x-4 gap-y-2 font-sans text-sm">
        <Link className="text-link underline underline-offset-4" href={auditPath(entry)}>
          View full audit
        </Link>
        <button type="button" onClick={onBadge} className="text-link underline underline-offset-4">
          Get README badge
        </button>
      </div>
    </article>
  );
}

function RankingRow({
  entry,
  rank,
  onBadge,
}: {
  entry: LeaderboardEntry;
  rank: number;
  onBadge: () => void;
}) {
  return (
    <tr className="border-b border-muted/15 last:border-b-0">
      <td className="px-5 py-4 font-mono text-muted">{rank}</td>
      <td className="px-5 py-4">
        <Link className="text-link font-mono underline underline-offset-4" href={auditPath(entry)}>
          {entry.repoPath}
        </Link>
        <p className="mt-1 font-mono text-xs text-muted">★ {formatCount(entry.starsCount)} · ⑂ {formatCount(entry.forksCount)}</p>
      </td>
      <td className="px-5 py-4 text-muted">{entry.primaryLanguage}</td>
      <td className="px-5 py-4"><ScoreBadge entry={entry} /></td>
      <td className="px-5 py-4 text-muted">{formatDate(entry.updatedAt)}</td>
      <td className="px-5 py-4">
        <div className="flex gap-3 whitespace-nowrap">
          <Link className="text-link underline underline-offset-4" href={auditPath(entry)}>
            View audit
          </Link>
          <button type="button" onClick={onBadge} className="text-link underline underline-offset-4">
            Badge
          </button>
        </div>
      </td>
    </tr>
  );
}

function ScoreBadge({ entry }: { entry: LeaderboardEntry }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-md border border-accent/40 bg-accent/10 px-2.5 py-1 font-mono text-xs font-semibold text-accent">
      {entry.score}/100 <span className="text-text">{entry.grade}</span>
    </span>
  );
}

function BadgeModal({
  entry,
  onClose,
}: {
  entry: LeaderboardEntry;
  onClose: () => void;
}) {
  const [feedback, setFeedback] = useState<"badge" | "share" | null>(null);
  const badgeUrl = `${SITE_URL}/api/badge?repo=${encodeURIComponent(entry.repoPath)}&v=${BADGE_VERSION}`;
  const auditUrl = `${SITE_URL}${auditPath(entry)}`;
  const markdown = `[![WelcomeScore](${badgeUrl})](${auditUrl})`;
  const socialText = `We scored ${entry.score}/100 on @WelcomeScore! Checked our open-source contributor health & ready-to-work setup. View audit: ${auditUrl}`;

  async function copy(value: string, type: "badge" | "share") {
    try {
      await navigator.clipboard.writeText(value);
      setFeedback(type);
      window.setTimeout(() => setFeedback(null), 1500);
    } catch {
      setFeedback(null);
    }
  }

  function shareOnX() {
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(socialText)}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  async function shareOnLinkedIn() {
    await copy(socialText, "share");
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(auditUrl)}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-base/80 p-4" onMouseDown={onClose}>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="badge-modal-title"
        className="w-full max-w-xl rounded-lg border border-muted/25 bg-surface p-5 shadow-2xl sm:p-6"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-accent">Maintain your position</p>
            <h2 id="badge-modal-title" className="mt-2 font-mono text-lg font-bold">
              {entry.repoPath}
            </h2>
          </div>
          <button type="button" className="text-link text-xl leading-none" onClick={onClose} aria-label="Close badge modal">×</button>
        </div>
        <pre className="mt-5 max-h-36 overflow-auto rounded-md border border-muted/35 bg-base/40 p-4 font-mono text-xs leading-6 text-text whitespace-pre-wrap">
          {markdown}
        </pre>
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void copy(markdown, "badge")}
            className={`h-10 rounded-md border border-muted/35 bg-base/30 px-4 font-sans text-sm font-medium ${feedback === "badge" ? "text-good" : "text-muted"}`}
          >
            {feedback === "badge" ? "Copied!" : "Copy README badge"}
          </button>
          <button type="button" onClick={shareOnX} className="text-link font-sans text-sm underline underline-offset-4">
            Share on X
          </button>
          <button type="button" onClick={() => void shareOnLinkedIn()} className={`font-sans text-sm underline underline-offset-4 ${feedback === "share" ? "text-good" : "text-link"}`}>
            {feedback === "share" ? "Post copied" : "Share on LinkedIn"}
          </button>
        </div>
      </section>
    </div>
  );
}

function LoadingState() {
  return (
    <section className="mt-12 rounded-lg border border-muted/25 bg-surface p-8 text-center">
      <p className="font-mono text-sm text-muted">Loading verified community rankings…</p>
    </section>
  );
}

function EmptyState() {
  return (
    <section className="mt-12 rounded-lg border border-muted/25 bg-surface p-8 text-center">
      <h2 className="font-mono text-xl font-bold">The Hall of Fame is warming up.</h2>
      <p className="mx-auto mt-3 max-w-xl font-sans text-sm leading-6 text-muted">
        Eligible repositories appear automatically after a public audit scores at least 75,
        has social proof, and includes both a README and license.
      </p>
      <Link href="/" className="text-link mt-5 inline-block font-sans text-sm underline underline-offset-4">
        Be among the first to check a repository
      </Link>
    </section>
  );
}

function ErrorState() {
  return (
    <section className="mt-12 rounded-lg border border-muted/25 bg-surface p-8 text-center">
      <h2 className="font-mono text-xl font-bold">Rankings are temporarily unavailable.</h2>
      <p className="mt-3 font-sans text-sm text-muted">Please check again shortly.</p>
    </section>
  );
}

function auditPath(entry: LeaderboardEntry) {
  return `/check/${encodeURIComponent(entry.repoOwner)}/${encodeURIComponent(entry.repoName)}`;
}

function formatCount(value: number) {
  return new Intl.NumberFormat("en-US", {
    notation: value >= 1000 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

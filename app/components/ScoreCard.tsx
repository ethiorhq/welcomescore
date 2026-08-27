"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AlgofoxReviewCard from "@/app/components/AlgofoxReviewCard";
import BadgeShareModal from "@/app/components/BadgeShareModal";
import NextUsefulMoveCard from "@/app/components/NextUsefulMoveCard";
import {
  CODE_OF_CONDUCT_TEMPLATE,
  CONTRIBUTING_TEMPLATE,
} from "@/lib/templates";
import type { Check, ScoreResult } from "@/lib/scoreRepo";

const TEMPLATE_OPTIONS = {
  "CONTRIBUTING.md": {
    title: "CONTRIBUTING.md template",
    content: CONTRIBUTING_TEMPLATE,
  },
  "CODE_OF_CONDUCT.md": {
    title: "CODE_OF_CONDUCT.md template",
    content: CODE_OF_CONDUCT_TEMPLATE,
  },
} as const;

type TemplateFile = keyof typeof TEMPLATE_OPTIONS;
type HallOfFameStatus =
  | "checking"
  | "ready"
  | "already-listed"
  | "added"
  | "unavailable";

export default function ScoreCard({
  result,
  highlightScore = true,
  onRequestRefresh,
}: {
  result: ScoreResult;
  highlightScore?: boolean;
  onRequestRefresh?: () => void;
}) {
  const [isBadgeModalOpen, setIsBadgeModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateFile | null>(
    null,
  );
  const [isAddingToLeaderboard, setIsAddingToLeaderboard] = useState(false);
  const [hallOfFameStatus, setHallOfFameStatus] = useState<HallOfFameStatus>(
    result.isEligibleForLeaderboard ? "checking" : "ready",
  );

  useEffect(() => {
    if (!result.isEligibleForLeaderboard) {
      return;
    }

    let cancelled = false;
    setHallOfFameStatus("checking");

    void fetch(`/api/leaderboard/status?repo=${encodeURIComponent(result.repo)}`, {
      cache: "no-store",
    })
      .then(async (response) => {
        const payload = (await response.json().catch(() => null)) as {
          listed?: boolean;
        } | null;

        if (!cancelled) {
          setHallOfFameStatus(payload?.listed ? "already-listed" : "ready");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setHallOfFameStatus("ready");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [result.isEligibleForLeaderboard, result.repo]);

  async function handleAddToLeaderboard() {
    setIsAddingToLeaderboard(true);

    try {
      const response = await fetch(
        `/api/leaderboard/add?repo=${encodeURIComponent(result.repo)}`,
        { method: "POST" },
      );
      const payload = (await response.json().catch(() => null)) as {
        alreadyListed?: boolean;
      } | null;
      setHallOfFameStatus(
        response.ok
          ? payload?.alreadyListed
            ? "already-listed"
            : "added"
          : "unavailable",
      );
    } catch {
      setHallOfFameStatus("unavailable");
    } finally {
      setIsAddingToLeaderboard(false);
    }
  }

  const issueCount = result.goodFirstIssueCount;
  const cardId = result.repo.replace(/[^a-z0-9]/gi, "-").toLowerCase();
  const issueSearchUrl = `https://github.com/${result.repo}/issues?q=is%3Aopen+is%3Aissue+label%3A%22good+first+issue%22`;

  return (
    <section
      className="w-full rounded-lg border border-muted/25 bg-surface p-5 text-left sm:p-8"
      aria-labelledby={`results-title-${cardId}`}
    >
      <p className="break-all font-mono text-sm text-muted">{result.repo}</p>

      <div
        className="relative mt-4 flex items-center gap-3 sm:gap-4"
        id={`results-title-${cardId}`}
      >
        {highlightScore ? <span className="score-glow" aria-hidden="true" /> : null}
        <span className="relative font-mono text-6xl font-bold leading-none tracking-tight text-text sm:text-8xl">
          {result.score}
        </span>
        <span className="relative font-mono text-3xl font-bold text-accent sm:text-5xl">
          {result.grade}
        </span>
      </div>

      <div className="mt-8 flex flex-wrap gap-2" aria-label={`${result.repo} repository checks`}>
        {result.checks.map((check) => (
          <CheckPill
            key={check.label}
            check={check}
            repo={result.repo}
            defaultBranch={result.defaultBranch}
            onOpenTemplate={setSelectedTemplate}
          />
        ))}
      </div>

      <NextUsefulMoveCard result={result} onRequestRefresh={onRequestRefresh} />

      {result.goodFirstIssues.length > 0 ? (
        <section
          className="mt-7 border-t border-muted/20 pt-6"
          aria-labelledby={`beginner-issues-${cardId}`}
        >
          <h2
            id={`beginner-issues-${cardId}`}
            className="font-sans text-sm font-semibold text-muted"
          >
            {issueCount} beginner-friendly issue{issueCount === 1 ? "" : "s"} open
          </h2>
          <ul className="mt-3 space-y-2 font-sans text-sm">
            {result.goodFirstIssues.map((issue) => (
              <li key={issue.url}>
                <a
                  className="text-link underline underline-offset-4"
                  href={issue.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {issue.title}
                </a>
              </li>
            ))}
          </ul>
          {issueCount > result.goodFirstIssues.length ? (
            <a
              className="mt-3 inline-block font-sans text-sm text-link underline underline-offset-4"
              href={issueSearchUrl}
              target="_blank"
              rel="noreferrer"
            >
              See all {issueCount} on GitHub
            </a>
          ) : null}
        </section>
      ) : null}

      <AlgofoxReviewCard repo={result.repo} />

      <HallOfFamePanel
        result={result}
        status={hallOfFameStatus}
        isAdding={isAddingToLeaderboard}
        onAdd={() => void handleAddToLeaderboard()}
        idPrefix={cardId}
      />

      <div className="mt-9 border-t border-muted/20 pt-6">
        <h2 className="font-sans text-sm font-semibold text-muted">Share your score</h2>
        <div className="mt-3 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setIsBadgeModalOpen(true)}
            className="h-10 rounded-md border border-muted/35 bg-base/30 px-4 font-sans text-sm font-medium text-muted transition-colors duration-180 ease-out hover:border-accent/45 hover:text-accent"
          >
            Embed badge
          </button>
          <Link
            href={`/lounge?repo=${encodeURIComponent(result.repo)}&score=${result.score}&grade=${encodeURIComponent(result.grade)}`}
            className="inline-flex h-10 items-center justify-center rounded-md border border-accent/45 bg-accent/10 px-4 font-sans text-sm font-medium text-accent transition-colors duration-180 ease-out hover:bg-accent/15"
          >
            Share to Dev Lounge
          </Link>
        </div>
      </div>

      {selectedTemplate ? (
        <TemplateModal
          title={TEMPLATE_OPTIONS[selectedTemplate].title}
          content={TEMPLATE_OPTIONS[selectedTemplate].content}
          onClose={() => setSelectedTemplate(null)}
        />
      ) : null}

      {isBadgeModalOpen ? (
        <BadgeShareModal
          repoPath={result.repo}
          score={result.score}
          onClose={() => setIsBadgeModalOpen(false)}
        />
      ) : null}
    </section>
  );
}

function HallOfFamePanel({
  result,
  status,
  isAdding,
  onAdd,
  idPrefix,
}: {
  result: ScoreResult;
  status: HallOfFameStatus;
  isAdding: boolean;
  onAdd: () => void;
  idPrefix: string;
}) {
  const isComplete = status === "already-listed" || status === "added";
  const issueSearchUrl = `https://github.com/${result.repo}/issues?q=is%3Aopen+is%3Aissue+label%3A%22good+first+issue%22`;

  if (!result.isEligibleForLeaderboard) {
    const foundationChecks = [
      {
        label: "Contributor-readiness score",
        detail: `${result.score} / 100 · ${result.score >= 75 ? "meets the 75-point threshold" : `${75 - result.score} more point${75 - result.score === 1 ? "" : "s"} needed`}`,
        complete: result.score >= 75,
      },
      {
        label: "Repository README",
        detail: result.hasReadme ? "published" : "still needed",
        complete: result.hasReadme,
      },
      {
        label: "Published license",
        detail: result.hasLicense ? "published" : "still needed",
        complete: result.hasLicense,
      },
    ];
    const foundationComplete = foundationChecks.every((check) => check.complete);
    const starProgress = Math.min((result.starsCount / 5) * 100, 100);
    const forkProgress = Math.min((result.forksCount / 2) * 100, 100);
    const repositoryUrl = `https://github.com/${result.repo}`;
    const communityProfileUrl = `${repositoryUrl}/community`;

    return (
      <section
        className="mt-9 border-t border-muted/20 pt-6"
        aria-labelledby={`${idPrefix}-hall-progress-title`}
      >
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
          <div>
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-accent">
              Hall readiness
            </p>
            <h2
              id={`${idPrefix}-hall-progress-title`}
              className="mt-1 font-sans text-base font-semibold text-text"
            >
              {foundationComplete
                ? "Contributor-ready. Building community proof."
                : "Build the contributor foundation first."}
            </h2>
          </div>
          <span
            className={
              foundationComplete
                ? "rounded-md border border-good/45 bg-good/15 px-2.5 py-1 font-mono text-xs font-semibold text-good"
                : "rounded-md border border-muted/30 bg-base/25 px-2.5 py-1 font-mono text-xs font-semibold text-muted"
            }
          >
            {foundationComplete ? "FOUNDATION COMPLETE" : "FOUNDATION IN PROGRESS"}
          </span>
        </div>

        <p className="mt-3 max-w-2xl font-sans text-sm leading-6 text-muted">
          Hall entries need a contributor-ready repository and one real community-adoption milestone: five GitHub stars or two forks. The final Hall submission always remains your explicit choice.
        </p>

        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          <section
            className="rounded-md border border-muted/25 bg-base/25 p-4"
            aria-labelledby={`${idPrefix}-foundation-title`}
          >
            <div className="flex items-center justify-between gap-3">
              <h3
                id={`${idPrefix}-foundation-title`}
                className="font-sans text-sm font-semibold text-text"
              >
                Contributor foundation
              </h3>
              <span className="font-mono text-xs text-muted">
                {foundationChecks.filter((check) => check.complete).length}/{foundationChecks.length}
              </span>
            </div>
            <ul className="mt-3 space-y-2.5" aria-label="Contributor foundation progress">
              {foundationChecks.map((check) => (
                <li key={check.label} className="flex gap-2.5 text-sm">
                  <span
                    className={
                      check.complete
                        ? "mt-0.5 font-mono font-bold text-good"
                        : "mt-0.5 font-mono font-bold text-muted"
                    }
                    aria-hidden="true"
                  >
                    {check.complete ? "✓" : "–"}
                  </span>
                  <span>
                    <span className={check.complete ? "font-medium text-text" : "font-medium text-muted"}>
                      {check.label}
                    </span>
                    <span className="text-muted"> · {check.detail}</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section
            className="rounded-md border border-accent/25 bg-accent/5 p-4"
            aria-labelledby={`${idPrefix}-community-title`}
          >
            <div className="flex items-center justify-between gap-3">
              <h3
                id={`${idPrefix}-community-title`}
                className="font-sans text-sm font-semibold text-text"
              >
                Community proof
              </h3>
              <span className="font-mono text-xs text-accent">REACH EITHER</span>
            </div>
            <p className="mt-2 font-sans text-xs leading-5 text-muted">
              These are public adoption signals, not a quality certification. Earn them by making the project useful and easy to evaluate—not through exchanges or artificial activity.
            </p>
            <div className="mt-4 space-y-3" aria-label="Community adoption progress">
              <CommunityProgress
                label="GitHub stars"
                current={result.starsCount}
                target={5}
                value={starProgress}
                id={`${idPrefix}-stars-progress`}
              />
              <CommunityProgress
                label="GitHub forks"
                current={result.forksCount}
                target={2}
                value={forkProgress}
                id={`${idPrefix}-forks-progress`}
              />
            </div>
          </section>
        </div>

        <section className="mt-4 rounded-md border border-muted/25 bg-surface/60 p-4" aria-labelledby={`${idPrefix}-next-actions-title`}>
          <h3 id={`${idPrefix}-next-actions-title`} className="font-sans text-sm font-semibold text-text">
            Earn attention by being useful
          </h3>
          <p className="mt-1 font-sans text-sm leading-6 text-muted">
            Give potential users and contributors a clear reason to explore the work. These resources do not change your score or promise stars or forks.
          </p>
          <ul className="mt-3 grid gap-2 font-sans text-sm sm:grid-cols-2">
            <li>
              <a className="text-link underline underline-offset-4" href={repositoryUrl} target="_blank" rel="noreferrer">
                Review the project README on GitHub
              </a>
            </li>
            <li>
              <Link className="text-link underline underline-offset-4" href="/guides/open-source-contributor-onboarding-checklist">
                Strengthen the first-contribution path
              </Link>
            </li>
            <li>
              <a className="text-link underline underline-offset-4" href={issueSearchUrl} target="_blank" rel="noreferrer">
                Keep starter issues accurate and current
              </a>
            </li>
            <li>
              <a className="text-link underline underline-offset-4" href={communityProfileUrl} target="_blank" rel="noreferrer">
                Review GitHub Community Profile
              </a>
            </li>
          </ul>
        </section>
      </section>
    );
  }

  const description =
    status === "already-listed"
      ? "This repository is already posted in the public Hall of Fame. Rechecking it will never create a duplicate entry."
      : status === "added"
        ? "This repository has been added to the public Hall of Fame."
        : "This repository meets the score, social-proof, README, and license requirements. Add it when you are ready to make it public on the community leaderboard.";

  return (
    <section className="mt-9 border-t border-muted/20 pt-6" aria-labelledby={`${idPrefix}-hall-of-fame-title`}>
      <h2 id={`${idPrefix}-hall-of-fame-title`} className="font-sans text-sm font-semibold text-muted">
        Hall of Fame
      </h2>
      <p className="mt-2 max-w-xl font-sans text-sm leading-6 text-muted">{description}</p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        {isComplete ? (
          <span className="inline-flex h-10 items-center rounded-md border border-good/45 bg-good/15 px-4 font-sans text-sm font-medium text-good">
            {status === "already-listed" ? "Already in Hall of Fame" : "Added to Hall of Fame"}
          </span>
        ) : (
          <button
            type="button"
            onClick={onAdd}
            disabled={isAdding || status === "checking"}
            className="h-10 rounded-md border border-accent/45 bg-accent/10 px-4 font-sans text-sm font-medium text-accent disabled:cursor-not-allowed disabled:border-muted/25 disabled:bg-base/30 disabled:text-muted"
          >
            {status === "checking"
              ? "Checking Hall of Fame…"
              : isAdding
                ? "Adding…"
                : "Add to Hall of Fame"}
          </button>
        )}
        {isComplete ? (
          <Link className="text-link font-sans text-sm underline underline-offset-4" href="/leaderboard">
            View Hall of Fame
          </Link>
        ) : null}
        {status === "unavailable" ? (
          <p className="font-sans text-sm text-muted">Unable to add this repository right now. Please try again.</p>
        ) : null}
      </div>
    </section>
  );
}

function CommunityProgress({
  label,
  current,
  target,
  value,
  id,
}: {
  label: string;
  current: number;
  target: number;
  value: number;
  id: string;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-sans text-sm text-text">{label}</span>
        <span className="font-mono text-xs text-muted">
          {current} / {target}
        </span>
      </div>
      <div
        id={id}
        className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-base/80"
        role="progressbar"
        aria-label={`${label} progress`}
        aria-valuemin={0}
        aria-valuemax={target}
        aria-valuenow={Math.min(current, target)}
        aria-valuetext={`${current} of ${target} ${label.toLowerCase()}`}
      >
        <span
          className="block h-full rounded-full bg-accent transition-[width] duration-300 ease-out"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function CheckPill({
  check,
  repo,
  defaultBranch,
  onOpenTemplate,
}: {
  check: Check;
  repo: string;
  defaultBranch: string;
  onOpenTemplate: (template: TemplateFile) => void;
}) {
  const pointLabel = check.passed
    ? `+${check.points}`
    : `0/${check.maxPoints ?? check.points}`;
  const templateFile = isTemplateFile(check.label) ? check.label : null;
  const canCreateOnGitHub = [
    "CONTRIBUTING.md",
    "CODE_OF_CONDUCT.md",
    "LICENSE",
  ].includes(check.label);
  const createFileUrl = `https://github.com/${repo}/new/${encodeURIComponent(
    defaultBranch,
  )}?filename=${encodeURIComponent(check.label)}`;

  return (
    <span
      className={
        check.passed
          ? "inline-flex max-w-full flex-wrap items-center gap-1.5 rounded-full bg-good px-3 py-1.5 font-sans text-xs font-medium text-base"
          : "inline-flex max-w-full flex-wrap items-center gap-1.5 rounded-full border border-muted/55 px-3 py-1.5 font-sans text-xs font-medium text-muted"
      }
    >
      <span aria-hidden="true" className="font-mono font-bold">
        {check.passed ? "✓" : "–"}
      </span>
      <span className="break-words">{check.label}</span>
      <span className="font-mono">{pointLabel}</span>
      {!check.passed && (templateFile || canCreateOnGitHub) ? (
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1 border-l border-muted/35 pl-2">
          {templateFile ? (
            <button
              type="button"
              className="text-link underline underline-offset-2"
              onClick={() => onOpenTemplate(templateFile)}
            >
              Get template
            </button>
          ) : null}
          {canCreateOnGitHub ? (
            <a
              className="text-link underline underline-offset-2"
              href={createFileUrl}
              target="_blank"
              rel="noreferrer"
            >
              Create on GitHub
            </a>
          ) : null}
        </span>
      ) : null}
    </span>
  );
}

function isTemplateFile(label: string): label is TemplateFile {
  return label === "CONTRIBUTING.md" || label === "CODE_OF_CONDUCT.md";
}

function TemplateModal({
  title,
  content,
  onClose,
}: {
  title: string;
  content: string;
  onClose: () => void;
}) {
  const [isCopied, setIsCopied] = useState(false);

  async function handleCopyTemplate() {
    try {
      await navigator.clipboard.writeText(content);
      setIsCopied(true);
      window.setTimeout(() => setIsCopied(false), 1500);
    } catch {
      setIsCopied(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-base/80 p-4"
      onMouseDown={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="template-modal-title"
        className="w-full max-w-2xl rounded-lg border border-muted/25 bg-surface p-5 shadow-2xl sm:p-6"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <h2
            id="template-modal-title"
            className="font-mono text-base font-semibold text-text"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-link -mt-1 text-xl leading-none"
            aria-label="Close template"
          >
            ×
          </button>
        </div>

        <pre className="mt-5 max-h-[55vh] overflow-auto rounded-md border border-muted/35 bg-base/40 p-4 font-mono text-xs leading-6 text-text whitespace-pre-wrap">
          {content}
        </pre>

        <button
          type="button"
          onClick={handleCopyTemplate}
          className={`mt-5 h-10 rounded-md border border-muted/35 bg-base/30 px-4 font-sans text-sm font-medium ${
            isCopied ? "text-good" : "text-muted"
          }`}
        >
          {isCopied ? "Copied!" : "Copy to clipboard"}
        </button>
      </div>
    </div>
  );
}

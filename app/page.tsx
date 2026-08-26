"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import BackButton from "@/app/components/BackButton";
import BadgeShareModal from "@/app/components/BadgeShareModal";
import {
  CODE_OF_CONDUCT_TEMPLATE,
  CONTRIBUTING_TEMPLATE,
} from "@/lib/templates";
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

type Check = {
  label: string;
  passed: boolean;
  points: number;
  maxPoints?: number;
};

type GoodFirstIssue = {
  title: string;
  url: string;
};

type ScoreResult = {
  repo: string;
  score: number;
  grade: string;
  checks: Check[];
  defaultBranch: string;
  starsCount: number;
  forksCount: number;
  primaryLanguage: string;
  hasReadme: boolean;
  hasLicense: boolean;
  isEligibleForLeaderboard: boolean;
  goodFirstIssueCount: number;
  goodFirstIssues: GoodFirstIssue[];
};

type ScoreError = {
  error?: string;
};

export default function Home({
  initialRepository,
}: {
  initialRepository?: string;
}) {
  const [repository, setRepository] = useState(initialRepository ?? "");
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<ScoreResult | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const initialScanStarted = useRef(false);
  const isRepositoryEmpty = repository.trim().length === 0;

  async function runCheck(requestedRepository: string) {
    const normalizedRepository = requestedRepository.trim();
    if (!normalizedRepository) {
      return;
    }

    setIsChecking(true);
    setResult(null);
    setErrorMessage("");

    try {
      const response = await fetch(
        `/api/score?repo=${encodeURIComponent(normalizedRepository)}`,
      );

      if (!response.ok) {
        const error = (await response.json().catch(() => ({}))) as ScoreError;

        if (response.status === 404) {
          setErrorMessage("Couldn't find that repo, check the spelling");
        } else if (response.status === 429 || error.error === "rate-limit") {
          setErrorMessage(
            "Too many checks right now — try again in a few minutes",
          );
        } else {
          setErrorMessage("Something went wrong, try again");
        }
        return;
      }

      const scoreResult = (await response.json()) as ScoreResult;
      setResult(scoreResult);
    } catch {
      setErrorMessage("Something went wrong, try again");
    } finally {
      setIsChecking(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void runCheck(repository);
  }

  useEffect(() => {
    if (initialRepository && !initialScanStarted.current) {
      initialScanStarted.current = true;
      setRepository(initialRepository);
      void runCheck(initialRepository);
    }
  }, [initialRepository]);

  return (
    <main className="flex min-h-screen flex-1 flex-col overflow-x-hidden bg-base px-4 py-10 text-text sm:px-6 sm:py-20">
      {initialRepository ? (
        <div className="mx-auto w-full max-w-3xl">
          <BackButton />
        </div>
      ) : null}
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center">
        <section className="w-full text-center" aria-labelledby="page-title">
          <div className="flex items-start justify-center gap-2">
            <h1
              id="page-title"
              className="font-mono text-3xl font-bold tracking-tight text-accent sm:text-6xl"
            >
              WelcomeScore
            </h1>
            <span className="mt-0.5 inline-flex rounded-md border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 font-mono text-xs font-semibold text-amber-500 sm:mt-2 sm:px-2 sm:py-1">
              .js.org
            </span>
          </div>

          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link
              className="inline-flex h-10 items-center justify-center rounded-md border border-muted/35 bg-surface px-4 font-sans text-sm font-medium text-muted transition-colors duration-180 ease-out hover:border-accent/45 hover:text-accent"
              href="/leaderboard"
            >
              Explore the Hall of Fame
            </Link>
            <Link
              className="inline-flex h-10 items-center justify-center rounded-md border border-accent/45 bg-accent/10 px-4 font-sans text-sm font-medium text-accent transition-colors duration-180 ease-out hover:bg-accent/15"
              href="/lounge"
            >
              Open Dev Lounge
            </Link>
          </div>

          <form
            className="mx-auto mt-5 flex w-full max-w-2xl flex-col gap-3 sm:flex-row"
            onSubmit={handleSubmit}
          >
            <label className="sr-only" htmlFor="repository">
              Repository
            </label>
            <input
              id="repository"
              type="text"
              value={repository}
              onChange={(event) => setRepository(event.target.value)}
              placeholder="owner/repo — e.g. vercel/next.js"
              className="h-12 w-full rounded-md border border-muted/45 bg-surface px-4 font-mono text-sm text-text outline-none placeholder:text-muted focus:border-accent"
            />
            <button
              type="submit"
              disabled={isChecking || isRepositoryEmpty}
              className="h-12 shrink-0 rounded-md bg-accent px-6 font-sans text-sm font-semibold text-base disabled:cursor-not-allowed disabled:bg-surface disabled:text-muted"
            >
              {isChecking ? "Checking…" : "Check"}
            </button>
          </form>

          {errorMessage ? (
            <p className="mt-3 font-sans text-sm text-muted" role="status">
              {errorMessage}
            </p>
          ) : null}
        </section>

        {result ? <ResultsCard result={result} /> : null}
      </div>

    </main>
  );
}

function ResultsCard({ result }: { result: ScoreResult }) {
  const [isBadgeModalOpen, setIsBadgeModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateFile | null>(
    null,
  );
  const [isAddingToLeaderboard, setIsAddingToLeaderboard] = useState(false);
  const [leaderboardStatus, setLeaderboardStatus] = useState<
    "idle" | "added" | "unavailable"
  >("idle");

  async function handleAddToLeaderboard() {
    setIsAddingToLeaderboard(true);
    setLeaderboardStatus("idle");

    try {
      const response = await fetch(
        `/api/leaderboard/add?repo=${encodeURIComponent(result.repo)}`,
        { method: "POST" },
      );
      setLeaderboardStatus(response.ok ? "added" : "unavailable");
    } catch {
      setLeaderboardStatus("unavailable");
    } finally {
      setIsAddingToLeaderboard(false);
    }
  }

  const issueCount = result.goodFirstIssueCount;
  const issueSearchUrl = `https://github.com/${result.repo}/issues?q=is%3Aopen+is%3Aissue+label%3A%22good+first+issue%22`;

  return (
    <section
      className="mt-8 w-full max-w-2xl rounded-lg border border-muted/25 bg-surface p-5 text-left sm:mt-10 sm:p-8"
      aria-labelledby="results-title"
    >
      <p className="break-all font-mono text-sm text-muted">{result.repo}</p>

      <div
        className="relative mt-4 flex items-center gap-3 sm:gap-4"
        id="results-title"
      >
        <span className="score-glow" aria-hidden="true" />
        <span className="relative font-mono text-6xl font-bold leading-none tracking-tight text-text sm:text-8xl">
          {result.score}
        </span>
        <span className="relative font-mono text-3xl font-bold text-accent sm:text-5xl">
          {result.grade}
        </span>
      </div>

      <div className="mt-8 flex flex-wrap gap-2" aria-label="Repository checks">
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

      {result.goodFirstIssues.length > 0 ? (
        <section
          className="mt-7 border-t border-muted/20 pt-6"
          aria-labelledby="beginner-issues-title"
        >
          <h2
            id="beginner-issues-title"
            className="font-sans text-sm font-semibold text-muted"
          >
            {issueCount} beginner-friendly issue{issueCount === 1 ? "" : "s"}{" "}
            open
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

      {result.isEligibleForLeaderboard ? (
        <section className="mt-9 border-t border-muted/20 pt-6" aria-labelledby="hall-of-fame-title">
          <h2 id="hall-of-fame-title" className="font-sans text-sm font-semibold text-muted">
            Hall of Fame
          </h2>
          <p className="mt-2 max-w-xl font-sans text-sm leading-6 text-muted">
            This repository meets the score, social-proof, README, and license requirements.
            Add it when you are ready to make it public on the community leaderboard.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void handleAddToLeaderboard()}
              disabled={isAddingToLeaderboard || leaderboardStatus === "added"}
              className={`h-10 rounded-md border px-4 font-sans text-sm font-medium disabled:cursor-not-allowed ${
                leaderboardStatus === "added"
                  ? "border-good/45 bg-good/15 text-good"
                  : "border-accent/45 bg-accent/10 text-accent"
              }`}
            >
              {leaderboardStatus === "added"
                ? "Added to Hall of Fame"
                : isAddingToLeaderboard
                  ? "Adding…"
                  : "Add to Hall of Fame"}
            </button>
            {leaderboardStatus === "added" ? (
              <Link className="text-link font-sans text-sm underline underline-offset-4" href="/leaderboard">
                View Hall of Fame
              </Link>
            ) : null}
            {leaderboardStatus === "unavailable" ? (
              <p className="font-sans text-sm text-muted">Unable to add this repository right now. Please try again.</p>
            ) : null}
          </div>
        </section>
      ) : null}

      <div className="mt-9 border-t border-muted/20 pt-6">
        <h2 className="font-sans text-sm font-semibold text-muted">
          Share your score
        </h2>
        <div className="mt-3 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setIsBadgeModalOpen(true)}
            className="h-10 rounded-md border border-muted/35 bg-base/30 px-4 font-sans text-sm font-medium text-muted transition-colors duration-180 ease-out hover:border-accent/45 hover:text-accent"
          >
            Copy badge
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

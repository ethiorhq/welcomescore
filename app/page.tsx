"use client";

import { FormEvent, useState } from "react";

const BADGE_BASE_URL = "https://welcomescore.vercel.app";
// Increment when the generated badge design changes to refresh external image caches.
const BADGE_VERSION = "3";
const COMPANY_NAME = "ETHIOR";
const COMPANY_URL = "https://ethior.com";

// TODO: Replace placeholder destinations with published help and legal pages.
const FOOTER_LINKS = [
  "How it works",
  "FAQ",
  "Privacy Policy",
  "Terms & Conditions",
] as const;

type Check = {
  label: string;
  passed: boolean;
  points: number;
  maxPoints?: number;
};

type ScoreResult = {
  repo: string;
  score: number;
  grade: string;
  checks: Check[];
};

type ScoreError = {
  error?: string;
};

export default function Home() {
  const [repository, setRepository] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<ScoreResult | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const isRepositoryEmpty = repository.trim().length === 0;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const requestedRepository = repository.trim();
    if (!requestedRepository) {
      return;
    }

    setIsChecking(true);
    setResult(null);
    setErrorMessage("");

    try {
      const response = await fetch(
        `/api/score?repo=${encodeURIComponent(requestedRepository)}`,
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

  return (
    <main className="flex min-h-screen flex-col overflow-x-hidden bg-base px-4 py-10 text-text sm:px-6 sm:py-20">
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

          <form
            className="mx-auto mt-8 flex w-full max-w-2xl flex-col gap-3 sm:flex-row"
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

      <Footer />
    </main>
  );
}

function Footer() {
  return (
    <footer className="mt-10 border-t border-muted/20 pt-6 text-center font-sans text-xs text-muted">
      <nav aria-label="Footer navigation" className="flex flex-wrap justify-center gap-x-4 gap-y-2">
        {FOOTER_LINKS.map((label) => (
          <a
            key={label}
            className="text-link underline underline-offset-4"
            href="#"
          >
            {label}
          </a>
        ))}
      </nav>
      <p className="mt-4">
        Built by{" "}
        <a className="text-link underline underline-offset-4" href={COMPANY_URL}>
          {COMPANY_NAME}
        </a>
      </p>
    </footer>
  );
}

function ResultsCard({ result }: { result: ScoreResult }) {
  const [isBadgeCopied, setIsBadgeCopied] = useState(false);

  async function handleCopyBadge() {
    const badgeImageUrl = `${BADGE_BASE_URL}/api/badge?repo=${result.repo}&v=${BADGE_VERSION}`;
    const markdown = `[![WelcomeScore](${badgeImageUrl})](${BADGE_BASE_URL}/?repo=${result.repo})`;

    try {
      await navigator.clipboard.writeText(markdown);
      setIsBadgeCopied(true);
      window.setTimeout(() => setIsBadgeCopied(false), 1500);
    } catch {
      setIsBadgeCopied(false);
    }
  }

  return (
    <section
      className="mt-8 w-full max-w-2xl rounded-lg border border-muted/25 bg-surface p-5 text-left sm:mt-10 sm:p-8"
      aria-labelledby="results-title"
    >
      <p className="break-all font-mono text-sm text-muted">{result.repo}</p>

      <div className="relative mt-4 flex items-center gap-3 sm:gap-4" id="results-title">
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
          <CheckPill key={check.label} check={check} />
        ))}
      </div>

      <div className="mt-9 border-t border-muted/20 pt-6">
        <h2 className="font-sans text-sm font-semibold text-muted">
          Share your score
        </h2>
        <button
          type="button"
          onClick={handleCopyBadge}
          className={`mt-3 h-10 rounded-md border border-muted/35 bg-base/30 px-4 font-sans text-sm font-medium ${
            isBadgeCopied ? "text-good" : "text-muted"
          }`}
        >
          {isBadgeCopied ? "Copied!" : "Copy badge"}
        </button>
      </div>
    </section>
  );
}

function CheckPill({ check }: { check: Check }) {
  const pointLabel = check.passed
    ? `+${check.points}`
    : `0/${check.maxPoints ?? check.points}`;

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
    </span>
  );
}

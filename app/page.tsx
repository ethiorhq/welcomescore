"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import BackButton from "@/app/components/BackButton";
import BadgeShareModal from "@/app/components/BadgeShareModal";
import WelcomeScoreWordmark from "@/app/components/WelcomeScoreWordmark";
import { useAlgofoxPet } from "@/app/components/pet/AlgofoxPetProvider";
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

type HallOfFameStatus =
  | "checking"
  | "ready"
  | "already-listed"
  | "added"
  | "unavailable";

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
  const { setAlgofoxState } = useAlgofoxPet();

  async function runCheck(requestedRepository: string) {
    const normalizedRepository = requestedRepository.trim();
    if (!normalizedRepository) {
      return;
    }

    setIsChecking(true);
    setResult(null);
    setErrorMessage("");
    setAlgofoxState(
      "running",
      "Scanning contributor signals: docs, setup, license, and newcomer issues.",
    );

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
        setAlgofoxState("failed", "I couldn’t finish that audit. Check the repository link and try again.", 5_000);
        return;
      }

      const scoreResult = (await response.json()) as ScoreResult;
      setResult(scoreResult);
      if (scoreResult.score >= 85) {
        setAlgofoxState("jumping", "Strong contributor path. Algofox is celebrating!", 5_000);
      } else if (scoreResult.score >= 75) {
        setAlgofoxState("review", "Solid foundation. Let’s review the final contributor details.", 5_000);
      } else {
        setAlgofoxState("failed", "There is a clear path upward. Let’s improve one contributor signal at a time.", 5_000);
      }
    } catch {
      setErrorMessage("Something went wrong, try again");
      setAlgofoxState("failed", "I couldn’t reach that audit right now. Let’s try again in a moment.", 5_000);
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
          <h1 id="page-title" className="text-3xl text-accent sm:text-6xl">
            <WelcomeScoreWordmark />
          </h1>

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
              onFocus={() => setAlgofoxState("review", "Drop a GitHub repository here and I’ll inspect the first-contributor path.", 4_000)}
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

      <HallOfFamePanel
        result={result}
        status={hallOfFameStatus}
        isAdding={isAddingToLeaderboard}
        onAdd={() => void handleAddToLeaderboard()}
      />

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
}: {
  result: ScoreResult;
  status: HallOfFameStatus;
  isAdding: boolean;
  onAdd: () => void;
}) {
  const isComplete = status === "already-listed" || status === "added";

  if (!result.isEligibleForLeaderboard) {
    const nextSteps = hallOfFameNextSteps(result);

    return (
      <section className="mt-9 border-t border-muted/20 pt-6" aria-labelledby="hall-progress-title">
        <h2 id="hall-progress-title" className="font-sans text-sm font-semibold text-muted">
          On your way to the Hall of Fame
        </h2>
        <p className="mt-2 max-w-xl font-sans text-sm leading-6 text-muted">
          Every contributor-friendly improvement counts. Clear the next milestone, run another audit, and the Hall of Fame option will unlock automatically.
        </p>
        <ul className="mt-3 flex flex-wrap gap-2" aria-label="Next Hall of Fame milestones">
          {nextSteps.map((step) => (
            <li key={step} className="rounded-md border border-muted/30 bg-base/25 px-3 py-2 font-sans text-sm text-muted">
              {step}
            </li>
          ))}
        </ul>
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
    <section className="mt-9 border-t border-muted/20 pt-6" aria-labelledby="hall-of-fame-title">
      <h2 id="hall-of-fame-title" className="font-sans text-sm font-semibold text-muted">
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

function hallOfFameNextSteps(result: ScoreResult) {
  const steps: string[] = [];

  if (result.score < 75) {
    const pointsNeeded = 75 - result.score;
    steps.push(`Earn ${pointsNeeded} more point${pointsNeeded === 1 ? "" : "s"} to reach 75`);
  }
  if (!result.hasReadme) {
    steps.push("Add a clear README");
  }
  if (!result.hasLicense) {
    steps.push("Add an open-source license");
  }
  if (result.starsCount < 5 && result.forksCount < 2) {
    steps.push("Build community proof with stars or forks");
  }

  return steps.length > 0 ? steps : ["Keep strengthening the contributor journey"];
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

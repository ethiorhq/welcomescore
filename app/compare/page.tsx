"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import BackButton from "@/app/components/BackButton";
import ScoreCard from "@/app/components/ScoreCard";
import WelcomeScoreWordmark from "@/app/components/WelcomeScoreWordmark";
import { getAlgofoxMessage } from "@/app/components/pet/algofoxMessages";
import { useAlgofoxPet } from "@/app/components/pet/AlgofoxPetProvider";
import type { ScoreResult } from "@/lib/scoreRepo";

type ComparisonOutcome = {
  repo: string;
  result: ScoreResult | null;
  error: string | null;
};

export default function ComparePage() {
  const [repoA, setRepoA] = useState("");
  const [repoB, setRepoB] = useState("");
  const [isComparing, setIsComparing] = useState(false);
  const [sameRepositoryError, setSameRepositoryError] = useState(false);
  const [outcomes, setOutcomes] = useState<[ComparisonOutcome, ComparisonOutcome] | null>(null);
  const autoComparisonStarted = useRef(false);
  const { setAlgofoxState } = useAlgofoxPet();

  const areInputsReady = repoA.trim().length > 0 && repoB.trim().length > 0;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialA = params.get("a")?.trim() ?? "";
    const initialB = params.get("b")?.trim() ?? "";

    if (!initialA || !initialB || autoComparisonStarted.current) {
      return;
    }

    autoComparisonStarted.current = true;
    setRepoA(initialA);
    setRepoB(initialB);
    void compareRepositories(initialA, initialB);
    // The URL is intentionally read once on load. New comparisons replace it below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function compareRepositories(leftInput: string, rightInput: string) {
    const left = leftInput.trim();
    const right = rightInput.trim();

    if (!left || !right) {
      return;
    }

    if (left.toLowerCase() === right.toLowerCase()) {
      setSameRepositoryError(true);
      setOutcomes(null);
      setAlgofoxState("waving", getAlgofoxMessage("compareDuplicate"), 4_500);
      return;
    }

    setSameRepositoryError(false);
    setIsComparing(true);
    setOutcomes(null);
    setAlgofoxState("running", getAlgofoxMessage("compareRunning"));

    try {
      const comparison = await Promise.all([
        scoreRepository(left),
        scoreRepository(right),
      ]);
      setOutcomes(comparison);

      const [first, second] = comparison;
      if (first.result && second.result) {
        if (first.result.score === second.result.score) {
          setAlgofoxState("waving", getAlgofoxMessage("compareTie"), 5_000);
        } else {
          const winner = first.result.score > second.result.score ? first.result.repo : second.result.repo;
          setAlgofoxState("jumping", getAlgofoxMessage("compareWinner", { winner }), 5_000);
        }
      } else {
        setAlgofoxState("review", getAlgofoxMessage("comparePartial"), 5_000);
      }

      const query = new URLSearchParams({ a: left, b: right });
      window.history.replaceState(null, "", `/compare?${query.toString()}`);
    } finally {
      setIsComparing(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void compareRepositories(repoA, repoB);
  }

  const firstResult = outcomes?.[0].result ?? null;
  const secondResult = outcomes?.[1].result ?? null;
  const canDetermineWinner = Boolean(firstResult && secondResult);
  const firstHighlights = canDetermineWinner && firstResult!.score >= secondResult!.score;
  const secondHighlights = canDetermineWinner && secondResult!.score >= firstResult!.score;

  return (
    <main className="flex min-h-screen flex-1 flex-col overflow-x-hidden bg-base px-4 py-10 text-text sm:px-6 sm:py-16">
      <div className="mx-auto w-full max-w-7xl">
        <BackButton />
      </div>

      <div className="mx-auto w-full max-w-7xl flex-1">
        <section className="mx-auto max-w-3xl text-center" aria-labelledby="compare-page-title">
          <h1 id="compare-page-title" className="text-3xl text-accent sm:text-5xl">
            <WelcomeScoreWordmark />
          </h1>
          <p className="mt-4 font-sans text-base leading-7 text-muted">
            Compare two public GitHub repositories using the same contributor-readiness audit.
          </p>

          <form className="mt-7" onSubmit={handleSubmit}>
            <div className="grid items-center gap-3 md:grid-cols-[1fr_auto_1fr]">
              <label className="sr-only" htmlFor="compare-repo-a">
                First repository
              </label>
              <input
                id="compare-repo-a"
                type="text"
                value={repoA}
                onChange={(event) => {
                  setRepoA(event.target.value);
                  setSameRepositoryError(false);
                }}
                onFocus={() => setAlgofoxState("review", getAlgofoxMessage("compareFocus"), 4_000)}
                placeholder="owner/repo"
                className="h-12 w-full rounded-md border border-muted/45 bg-surface px-4 font-mono text-sm text-text outline-none placeholder:text-muted focus:border-accent"
              />
              <span className="font-mono text-sm font-semibold text-muted" aria-hidden="true">
                VS
              </span>
              <label className="sr-only" htmlFor="compare-repo-b">
                Second repository
              </label>
              <input
                id="compare-repo-b"
                type="text"
                value={repoB}
                onChange={(event) => {
                  setRepoB(event.target.value);
                  setSameRepositoryError(false);
                }}
                placeholder="owner/repo"
                className="h-12 w-full rounded-md border border-muted/45 bg-surface px-4 font-mono text-sm text-text outline-none placeholder:text-muted focus:border-accent"
              />
            </div>

            {sameRepositoryError ? (
              <p className="mt-3 font-sans text-sm text-muted" role="status">
                Try two different repos
              </p>
            ) : null}

            <button
              type="submit"
              disabled={!areInputsReady || isComparing}
              className="mt-4 h-12 rounded-md bg-accent px-6 font-sans text-sm font-semibold text-base disabled:cursor-not-allowed disabled:bg-surface disabled:text-muted"
            >
              {isComparing ? "Checking latest…" : "Compare"}
            </button>
          </form>

          <Link
            href="/"
            className="mt-4 inline-block font-sans text-sm text-link underline underline-offset-4"
          >
            Check one repo instead →
          </Link>
        </section>

        {outcomes ? (
          <section
            className="mt-10 grid items-start gap-6 lg:grid-cols-2"
            aria-label="Repository comparison results"
          >
            <ComparisonSide
              label="Repository A"
              outcome={outcomes[0]}
              highlightScore={firstHighlights}
            />
            <ComparisonSide
              label="Repository B"
              outcome={outcomes[1]}
              highlightScore={secondHighlights}
            />
          </section>
        ) : null}
      </div>
    </main>
  );
}

function ComparisonSide({
  label,
  outcome,
  highlightScore,
}: {
  label: string;
  outcome: ComparisonOutcome;
  highlightScore: boolean;
}) {
  return (
    <div className="min-w-0">
      <p className="mb-3 font-mono text-xs font-semibold uppercase tracking-[0.16em] text-muted">
        {label}
      </p>
      {outcome.result ? (
        <ScoreCard result={outcome.result} highlightScore={highlightScore} />
      ) : (
        <section className="rounded-lg border border-muted/25 bg-surface p-5 text-left sm:p-8" aria-label={`${label} audit error`}>
          <p className="break-all font-mono text-sm text-muted">{outcome.repo}</p>
          <p className="mt-5 font-sans text-sm leading-6 text-muted">{outcome.error}</p>
        </section>
      )}
    </div>
  );
}

async function scoreRepository(repo: string): Promise<ComparisonOutcome> {
  try {
    const query = new URLSearchParams({ repo, fresh: "1" });
    const response = await fetch(`/api/score?${query.toString()}`, {
      cache: "no-store",
    });
    if (response.ok) {
      return { repo, result: (await response.json()) as ScoreResult, error: null };
    }

    const payload = (await response.json().catch(() => ({}))) as { error?: string };
    return { repo, result: null, error: scoreErrorMessage(response.status, payload.error) };
  } catch {
    return {
      repo,
      result: null,
      error: "Something went wrong, try again",
    };
  }
}

function scoreErrorMessage(status: number, error?: string) {
  if (status === 404) {
    return "Couldn't find that repo, check the spelling";
  }
  if (status === 429 || error === "rate-limit") {
    return "Too many checks right now — try again in a few minutes";
  }
  return "Something went wrong, try again";
}

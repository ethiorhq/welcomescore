"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import BackButton from "@/app/components/BackButton";
import ScoreCard from "@/app/components/ScoreCard";
import WelcomeScoreWordmark from "@/app/components/WelcomeScoreWordmark";
import { getAlgofoxMessage } from "@/app/components/pet/algofoxMessages";
import { useAlgofoxPet } from "@/app/components/pet/AlgofoxPetProvider";
import type { ScoreResult } from "@/lib/scoreRepo";

type ScoreError = {
  error?: string;
};

export default function AuditHome({
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
      getAlgofoxMessage("auditRunning"),
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
        setAlgofoxState("failed", getAlgofoxMessage("auditMissing"), 5_000);
        return;
      }

      const scoreResult = (await response.json()) as ScoreResult;
      setResult(scoreResult);
      if (scoreResult.score >= 85) {
        setAlgofoxState("jumping", getAlgofoxMessage("auditCelebration"), 5_000);
      } else if (scoreResult.score >= 75) {
        setAlgofoxState("review", getAlgofoxMessage("auditStrong"), 5_000);
      } else {
        setAlgofoxState("failed", getAlgofoxMessage("auditImprove"), 5_000);
      }
    } catch {
      setErrorMessage("Something went wrong, try again");
      setAlgofoxState("failed", getAlgofoxMessage("auditUnavailable"), 5_000);
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
              onFocus={() => setAlgofoxState("review", getAlgofoxMessage("auditFocus"), 4_000)}
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

          <Link
            href="/compare"
            className="mt-3 inline-block font-sans text-sm text-link underline underline-offset-4"
          >
            Compare two repos instead →
          </Link>

          {errorMessage ? (
            <p className="mt-3 font-sans text-sm text-muted" role="status">
              {errorMessage}
            </p>
          ) : null}
        </section>

        {result ? (
          <div className="mt-8 w-full max-w-2xl sm:mt-10">
            <ScoreCard result={result} />
          </div>
        ) : null}
      </div>
    </main>
  );
}

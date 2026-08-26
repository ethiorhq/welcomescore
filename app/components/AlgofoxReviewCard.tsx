"use client";

import { useState } from "react";
import { useAlgofoxPet } from "@/app/components/pet/AlgofoxPetProvider";

type AlgofoxReviewMode = "motivation" | "tough-love" | "celebration";
type AlgofoxReviewState = "review" | "failed" | "jumping" | "waving";
type ReviewProvider = "groq" | "gemini" | "rule-engine";

type AlgofoxReview = {
  schemaVersion: 1;
  mode: AlgofoxReviewMode;
  spriteState: AlgofoxReviewState;
  headline: string;
  roastText: string;
  motivationText: string;
  focusChecks: string[];
  provider: ReviewProvider;
};

type ReviewResponse = {
  review?: AlgofoxReview;
  error?: string;
};

export default function AlgofoxReviewCard({ repo }: { repo: string }) {
  const { setAlgofoxState } = useAlgofoxPet();
  const [review, setReview] = useState<AlgofoxReview | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [activeTab, setActiveTab] = useState<"guidance" | "roast">("guidance");

  async function requestReview() {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repo }),
      });
      const payload = (await response.json().catch(() => ({}))) as ReviewResponse;

      if (!response.ok || !payload.review) {
        setErrorMessage(
          response.status === 429 || payload.error === "rate-limit"
            ? "Algofox is reviewing a lot of repos right now. Please try again in a little while."
            : "Algofox could not prepare a review right now. Your audit result is still available.",
        );
        return;
      }

      setReview(payload.review);
      setAlgofoxState(payload.review.spriteState, payload.review.headline, 6_000);
    } catch {
      setErrorMessage(
        "Algofox could not prepare a review right now. Your audit result is still available.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section
      className="mt-9 border-t border-muted/20 pt-6"
      aria-labelledby="algofox-review-title"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-accent">
            Algofox review
          </p>
          <h2
            id="algofox-review-title"
            className="mt-1 font-sans text-base font-semibold text-text"
          >
            Evidence-based contributor guidance
          </h2>
          <p className="mt-2 max-w-xl font-sans text-sm leading-6 text-muted">
            Ask for a concise review based only on this audit’s published contributor signals. It never adds a Hall entry or posts to Dev Lounge.
          </p>
        </div>
        {!review ? (
          <button
            type="button"
            onClick={() => void requestReview()}
            disabled={isLoading}
            className="h-10 shrink-0 rounded-md border border-accent/45 bg-accent/10 px-4 font-sans text-sm font-medium text-accent transition-colors duration-180 ease-out hover:bg-accent/15 disabled:cursor-not-allowed disabled:border-muted/25 disabled:bg-base/30 disabled:text-muted"
          >
            {isLoading ? "Asking Algofox…" : "Ask Algofox for a review"}
          </button>
        ) : null}
      </div>

      {errorMessage ? (
        <p className="mt-4 rounded-md border border-muted/30 bg-base/25 px-3 py-2 font-sans text-sm leading-6 text-muted" role="status">
          {errorMessage}
        </p>
      ) : null}

      {review ? (
        <div className="mt-5 rounded-md border border-muted/30 bg-base/25 p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-mono text-xs font-semibold text-accent">{review.headline}</p>
              <p className="mt-2 max-w-xl font-sans text-sm leading-6 text-muted">
                {review.motivationText}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void requestReview()}
              disabled={isLoading}
              className="h-9 rounded-md border border-muted/35 bg-surface px-3 font-sans text-xs font-medium text-muted transition-colors duration-180 ease-out hover:border-accent/45 hover:text-accent disabled:cursor-not-allowed disabled:text-muted"
            >
              {isLoading ? "Refreshing…" : "Refresh review"}
            </button>
          </div>

          {review.focusChecks.length > 0 ? (
            <ul className="mt-4 flex flex-wrap gap-2" aria-label="Review focus checks">
              {review.focusChecks.map((check) => (
                <li
                  key={check}
                  className="rounded-md border border-muted/35 px-2.5 py-1 font-mono text-xs text-muted"
                >
                  Focus: {check}
                </li>
              ))}
            </ul>
          ) : null}

          <div className="mt-5 border-b border-muted/20" role="tablist" aria-label="Algofox review views">
            <button
              id="algofox-guidance-tab"
              type="button"
              role="tab"
              aria-controls="algofox-guidance-panel"
              aria-selected={activeTab === "guidance"}
              onClick={() => setActiveTab("guidance")}
              className={`mr-5 border-b-2 pb-2 font-sans text-sm font-medium transition-colors duration-180 ease-out ${
                activeTab === "guidance"
                  ? "border-accent text-accent"
                  : "border-transparent text-muted hover:text-text"
              }`}
            >
              Guidance
            </button>
            <button
              id="algofox-roast-tab"
              type="button"
              role="tab"
              aria-controls="algofox-roast-panel"
              aria-selected={activeTab === "roast"}
              onClick={() => setActiveTab("roast")}
              className={`border-b-2 pb-2 font-sans text-sm font-medium transition-colors duration-180 ease-out ${
                activeTab === "roast"
                  ? "border-accent text-accent"
                  : "border-transparent text-muted hover:text-text"
              }`}
            >
              Technical roast
            </button>
          </div>

          <div className="pt-4">
            {activeTab === "guidance" ? (
              <p
                id="algofox-guidance-panel"
                role="tabpanel"
                aria-labelledby="algofox-guidance-tab"
                className="font-sans text-sm leading-6 text-text"
              >
                {review.motivationText}
              </p>
            ) : (
              <p
                id="algofox-roast-panel"
                role="tabpanel"
                aria-labelledby="algofox-roast-tab"
                className="font-sans text-sm leading-6 text-text"
              >
                {review.roastText}
              </p>
            )}
          </div>

          <p className="mt-5 font-mono text-[11px] text-muted">
            {review.provider === "rule-engine"
              ? "Generated from WelcomeScore’s deterministic evidence rules."
              : `Structured review generated with ${review.provider === "groq" ? "Groq" : "Gemini"} and validated against this audit.`}
          </p>
        </div>
      ) : null}
    </section>
  );
}

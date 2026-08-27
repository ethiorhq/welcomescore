"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { getAlgofoxMessage } from "@/app/components/pet/algofoxMessages";
import AlgofoxSprite from "@/app/components/pet/AlgofoxSprite";
import { useAlgofoxPet } from "@/app/components/pet/AlgofoxPetProvider";
import { SITE_URL } from "@/lib/site";

// Keep this version and all existing style IDs stable so previous README embeds
// retain their exact SVG route, cache behavior, and visual geometry.
const BADGE_RENDER_VERSION = "3";

const BADGE_STYLES = [
  {
    id: "1",
    name: "Minimal",
    description: "Compact README badge",
    width: 270,
    height: 32,
  },
  {
    id: "2",
    name: "Rank shield",
    description: "Legacy shield visual style",
    width: 420,
    height: 92,
  },
  {
    id: "3",
    name: "Metrics",
    description: "Legacy score and grade display",
    width: 520,
    height: 54,
  },
  {
    id: "4",
    name: "Dark glow",
    description: "Developer-tool display card",
    width: 430,
    height: 104,
  },
] as const;

type BadgeStyleId = (typeof BADGE_STYLES)[number]["id"];
type EmbedFormat = "markdown" | "html";

export default function BadgeShareModal({
  repoPath,
  onClose,
}: {
  repoPath: string;
  score: number;
  onClose: () => void;
}) {
  const [feedback, setFeedback] = useState(false);
  const { setAlgofoxState } = useAlgofoxPet();
  const [style, setStyle] = useState<BadgeStyleId>("1");
  const [format, setFormat] = useState<EmbedFormat>("markdown");
  const [owner, repo] = repoPath.split("/");
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const copyTimerRef = useRef<number | null>(null);

  const selectedStyle = BADGE_STYLES.find((option) => option.id === style) ?? BADGE_STYLES[0];
  const badgePath = `/api/badge/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}?style=${style}&v=${BADGE_RENDER_VERSION}`;
  const badgeUrl = `${SITE_URL}${badgePath}`;
  const auditUrl = `${SITE_URL}${auditPath(repoPath)}`;
  const purposeAlt = `Open current WelcomeScore contributor-readiness audit for ${repoPath}`;
  const embed = useMemo(() => {
    if (format === "html") {
      return `<a href="${auditUrl}"><img src="${badgeUrl}" alt="${purposeAlt}" /></a>`;
    }

    return `[![${purposeAlt}](${badgeUrl})](${auditUrl})`;
  }, [auditUrl, badgeUrl, format, purposeAlt]);
  const discussionPath = `/lounge?prepareAudit=${encodeURIComponent(repoPath)}`;

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    const timer = window.setTimeout(() => closeButtonRef.current?.focus(), 0);

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.clearTimeout(timer);
      if (copyTimerRef.current) {
        window.clearTimeout(copyTimerRef.current);
      }
      window.removeEventListener("keydown", handleKeyDown);
      previousFocus?.focus();
    };
  }, [onClose]);

  async function copyEmbed() {
    try {
      await navigator.clipboard.writeText(embed);
      setFeedback(true);
      setAlgofoxState("jumping", getAlgofoxMessage("badgeCopied"), 4_000);
      if (copyTimerRef.current) {
        window.clearTimeout(copyTimerRef.current);
      }
      copyTimerRef.current = window.setTimeout(() => setFeedback(false), 1_500);
    } catch {
      setFeedback(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-base/85 px-3 py-4 sm:px-6 sm:py-8"
      onMouseDown={onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="badge-share-modal-title"
        className="mx-auto w-full max-w-xl rounded-lg border border-muted/25 bg-surface p-4 shadow-2xl sm:my-4 sm:p-5"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-muted/20 pb-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-accent">
              Embed a contributor-signal badge
            </p>
            <h2 id="badge-share-modal-title" className="mt-2 break-all font-mono text-lg font-bold">
              {repoPath}
            </h2>
            <p className="mt-1.5 max-w-lg font-sans text-sm leading-5 text-muted">
              Select a cached SVG style, then copy a README-ready embed that links to the current public audit.
            </p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            className="text-link text-xl leading-none"
            onClick={onClose}
            aria-label="Close contributor-signal badge dialog"
          >
            ×
          </button>
        </div>

        <fieldset className="mt-4">
          <legend className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-muted">
            Badge style
          </legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {BADGE_STYLES.map((option) => {
              const isSelected = option.id === style;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    setStyle(option.id);
                    setAlgofoxState("review", getAlgofoxMessage("badgeReview"), 3_000);
                  }}
                  className={`rounded-md border px-3 py-2.5 text-left transition-colors duration-180 ease-out ${
                    isSelected
                      ? "border-accent/45 bg-accent/10"
                      : "border-muted/25 bg-base/25 hover:border-muted/45"
                  }`}
                  aria-pressed={isSelected}
                >
                  <span className={`block font-mono text-sm font-semibold ${isSelected ? "text-accent" : "text-text"}`}>
                    {option.name}
                  </span>
                  <span className="mt-0.5 block font-sans text-xs leading-4 text-muted">{option.description}</span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="mt-4 border-t border-muted/20 pt-4">
          <div className="rounded-md border border-muted/25 bg-base/35 p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-mono text-xs uppercase tracking-[0.14em] text-muted">Cached SVG preview</p>
                <div className="mt-3">
                  <Image
                    src={badgePath}
                    alt={`Preview: ${purposeAlt}`}
                    width={selectedStyle.width}
                    height={selectedStyle.height}
                    unoptimized
                    className="h-auto max-w-full"
                  />
                </div>
              </div>
              <div className="hidden w-14 shrink-0 flex-col items-center text-center sm:flex">
                <AlgofoxSprite state="review" size={48} />
                <span className="mt-1 font-mono text-[9px] uppercase tracking-[0.12em] text-muted">Reviewing</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 border-t border-muted/20 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="inline-flex rounded-md border border-muted/25 bg-base/25 p-1" aria-label="Embed format">
            {(["markdown", "html"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setFormat(option)}
                className={`rounded-md px-3 py-1.5 font-mono text-xs font-semibold transition-colors duration-180 ease-out ${
                  format === option ? "bg-accent/10 text-accent" : "text-muted hover:text-text"
                }`}
                aria-pressed={format === option}
              >
                {option === "markdown" ? "Markdown" : "HTML"}
              </button>
            ))}
          </div>
          <p className="font-sans text-xs text-muted">Cached SVG · bounded refresh</p>
        </div>

        <pre className="mt-2 max-h-28 overflow-auto rounded-md border border-muted/35 bg-base/40 p-3 font-mono text-xs leading-5 text-text whitespace-pre-wrap">
          {embed}
        </pre>

        <p className="mt-3 font-sans text-xs leading-5 text-muted">
          This badge displays bounded public contributor-readiness signals. It is not a security review, code-quality certification, Hall listing, or endorsement.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-muted/20 pt-4">
          <button
            type="button"
            onClick={() => void copyEmbed()}
            className={`h-10 rounded-md border border-accent/45 bg-accent/10 px-4 font-sans text-sm font-medium transition-colors duration-180 ease-out hover:bg-accent/15 ${
              feedback ? "text-good" : "text-accent"
            }`}
          >
            {feedback ? "Copied" : `Copy ${format === "markdown" ? "Markdown" : "HTML"}`}
          </button>
          <Link
            href={discussionPath}
            className="text-link font-sans text-sm underline underline-offset-4"
          >
            Prepare a Dev Lounge discussion
          </Link>
        </div>
        <p role="status" className="mt-3 min-h-5 font-sans text-xs leading-5 text-muted">
          {feedback ? "Badge embed copied. Nothing has been added to your repository for you." : "Copying is always an explicit action."}
        </p>
      </section>
    </div>
  );
}

function auditPath(repoPath: string) {
  const [owner, repo] = repoPath.split("/");
  return `/check/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
}

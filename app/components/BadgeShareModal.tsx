"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getAlgofoxMessage } from "@/app/components/pet/algofoxMessages";
import AlgofoxSprite from "@/app/components/pet/AlgofoxSprite";
import { useAlgofoxPet } from "@/app/components/pet/AlgofoxPetProvider";

const SITE_URL = "https://welcomescore.vercel.app";
// Bump this whenever badge geometry changes so previews and fresh embeds cannot reuse a prior SVG response.
const BADGE_RENDER_VERSION = "3";

const BADGE_STYLES = [
  {
    id: "1",
    name: "Minimal",
    description: "Compact README pill",
    width: 270,
    height: 32,
  },
  {
    id: "2",
    name: "Rank shield",
    description: "Rank-forward certification",
    width: 420,
    height: 92,
  },
  {
    id: "3",
    name: "Metrics",
    description: "Score, grade, and rank",
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

type BadgeStyleId = typeof BADGE_STYLES[number]["id"];
type EmbedFormat = "markdown" | "html";

export default function BadgeShareModal({
  repoPath,
  score,
  onClose,
}: {
  repoPath: string;
  score: number;
  onClose: () => void;
}) {
  const [feedback, setFeedback] = useState<"embed" | "share" | null>(null);
  const { setAlgofoxState } = useAlgofoxPet();
  const [style, setStyle] = useState<BadgeStyleId>("1");
  const [format, setFormat] = useState<EmbedFormat>("markdown");
  const [owner, repo] = repoPath.split("/");

  const selectedStyle = BADGE_STYLES.find((option) => option.id === style) ?? BADGE_STYLES[0];
  const badgePath = `/api/badge/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}?style=${style}&v=${BADGE_RENDER_VERSION}`;
  const badgeUrl = `${SITE_URL}${badgePath}`;
  const auditUrl = `${SITE_URL}${auditPath(repoPath)}`;
  const embed = useMemo(() => {
    if (format === "html") {
      return `<a href="${auditUrl}"><img src="${badgeUrl}" alt="WelcomeScore rank badge for ${repoPath}" /></a>`;
    }

    return `[![WelcomeScore Rank](${badgeUrl})](${auditUrl})`;
  }, [auditUrl, badgeUrl, format, repoPath]);
  const socialText = `We scored ${score}/100 on WelcomeScore! Our open-source contributor health audit is live: ${auditUrl}`;
  const discussionPath = `/lounge?prepareAudit=${encodeURIComponent(repoPath)}`;

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  async function copy(value: string, type: "embed" | "share") {
    try {
      await navigator.clipboard.writeText(value);
      setFeedback(type);
      if (type === "embed") {
        setAlgofoxState("jumping", getAlgofoxMessage("badgeCopied"), 4_000);
      }
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
              Embed your rank badge
            </p>
            <h2 id="badge-share-modal-title" className="mt-2 break-all font-mono text-lg font-bold">
              {repoPath}
            </h2>
            <p className="mt-1.5 max-w-lg font-sans text-sm leading-5 text-muted">
              Select a live SVG style, then copy a README-ready embed.
            </p>
          </div>
          <button
            type="button"
            className="text-link text-xl leading-none"
            onClick={onClose}
            aria-label="Close badge modal"
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
                <p className="font-mono text-xs uppercase tracking-[0.14em] text-muted">Live preview</p>
                <div className="mt-3">
                  <Image
                    src={badgePath}
                    alt={`WelcomeScore ${selectedStyle.name} badge preview for ${repoPath}`}
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
          <p className="font-sans text-xs text-muted">Live SVG · cached for fast README loads</p>
        </div>

        <pre className="mt-2 max-h-28 overflow-auto rounded-md border border-muted/35 bg-base/40 p-3 font-mono text-xs leading-5 text-text whitespace-pre-wrap">
          {embed}
        </pre>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-muted/20 pt-4">
          <button
            type="button"
            onClick={() => void copy(embed, "embed")}
            className={`h-10 rounded-md border border-accent/45 bg-accent/10 px-4 font-sans text-sm font-medium transition-colors duration-180 ease-out hover:bg-accent/15 ${
              feedback === "embed" ? "text-good" : "text-accent"
            }`}
          >
            {feedback === "embed" ? "Copied!" : `Copy ${format === "markdown" ? "Markdown" : "HTML"}`}
          </button>
          <Link
            href={discussionPath}
            className="text-link font-sans text-sm underline underline-offset-4"
          >
            Start an audit discussion
          </Link>
          <button
            type="button"
            onClick={shareOnX}
            className="text-link font-sans text-sm underline underline-offset-4"
          >
            Share on X
          </button>
          <button
            type="button"
            onClick={() => void shareOnLinkedIn()}
            className={`font-sans text-sm underline underline-offset-4 ${
              feedback === "share" ? "text-good" : "text-link"
            }`}
          >
            {feedback === "share" ? "Post copied" : "Share on LinkedIn"}
          </button>
        </div>
      </section>
    </div>
  );
}

function auditPath(repoPath: string) {
  const [owner, repo] = repoPath.split("/");
  return `/check/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
}

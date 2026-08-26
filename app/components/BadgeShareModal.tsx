"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

const SITE_URL = "https://welcomescore.vercel.app";

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
  const [style, setStyle] = useState<BadgeStyleId>("1");
  const [format, setFormat] = useState<EmbedFormat>("markdown");
  const [owner, repo] = repoPath.split("/");

  const selectedStyle = BADGE_STYLES.find((option) => option.id === style) ?? BADGE_STYLES[0];
  const badgePath = `/api/badge/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}?style=${style}`;
  const badgeUrl = `${SITE_URL}${badgePath}`;
  const auditUrl = `${SITE_URL}${auditPath(repoPath)}`;
  const embed = useMemo(() => {
    if (format === "html") {
      return `<a href="${auditUrl}"><img src="${badgeUrl}" alt="WelcomeScore rank badge for ${repoPath}" /></a>`;
    }

    return `[![WelcomeScore Rank](${badgeUrl})](${auditUrl})`;
  }, [auditUrl, badgeUrl, format, repoPath]);
  const socialText = `We scored ${score}/100 on WelcomeScore! Our open-source contributor health audit is live: ${auditUrl}`;

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-base/80 p-4"
      onMouseDown={onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="badge-share-modal-title"
        className="max-h-[calc(100vh-2rem)] w-full max-w-2xl overflow-y-auto rounded-lg border border-muted/25 bg-surface p-5 shadow-2xl sm:p-6"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-accent">
              Embed your rank badge
            </p>
            <h2 id="badge-share-modal-title" className="mt-2 break-all font-mono text-lg font-bold">
              {repoPath}
            </h2>
            <p className="mt-2 max-w-xl font-sans text-sm leading-6 text-muted">
              Pick a live SVG style. It recalculates from the repository audit whenever the badge is requested.
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

        <fieldset className="mt-5">
          <legend className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-muted">
            Badge style
          </legend>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {BADGE_STYLES.map((option) => {
              const isSelected = option.id === style;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setStyle(option.id)}
                  className={`rounded-md border px-3 py-3 text-left transition-colors duration-180 ease-out ${
                    isSelected
                      ? "border-accent/45 bg-accent/10"
                      : "border-muted/25 bg-base/25 hover:border-muted/45"
                  }`}
                  aria-pressed={isSelected}
                >
                  <span className={`block font-mono text-sm font-semibold ${isSelected ? "text-accent" : "text-text"}`}>
                    {option.name}
                  </span>
                  <span className="mt-1 block font-sans text-xs text-muted">{option.description}</span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="mt-5 rounded-md border border-muted/25 bg-base/35 p-4">
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-muted">Live preview</p>
          <div className="mt-4 overflow-x-auto pb-1">
            <Image
              src={badgePath}
              alt={`WelcomeScore ${selectedStyle.name} badge preview for ${repoPath}`}
              width={selectedStyle.width}
              height={selectedStyle.height}
              unoptimized
              className="h-auto max-w-none"
            />
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
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

        <pre className="mt-3 max-h-36 overflow-auto rounded-md border border-muted/35 bg-base/40 p-4 font-mono text-xs leading-6 text-text whitespace-pre-wrap">
          {embed}
        </pre>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void copy(embed, "embed")}
            className={`h-10 rounded-md border border-accent/45 bg-accent/10 px-4 font-sans text-sm font-medium transition-colors duration-180 ease-out hover:bg-accent/15 ${
              feedback === "embed" ? "text-good" : "text-accent"
            }`}
          >
            {feedback === "embed" ? "Copied!" : `Copy ${format === "markdown" ? "Markdown" : "HTML"}`}
          </button>
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

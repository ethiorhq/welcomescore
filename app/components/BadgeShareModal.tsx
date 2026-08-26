"use client";

import { useState } from "react";

const SITE_URL = "https://welcomescore.vercel.app";
const BADGE_VERSION = "3";

export default function BadgeShareModal({
  repoPath,
  score,
  onClose,
}: {
  repoPath: string;
  score: number;
  onClose: () => void;
}) {
  const [feedback, setFeedback] = useState<"badge" | "share" | null>(null);
  const badgeUrl = `${SITE_URL}/api/badge?repo=${encodeURIComponent(repoPath)}&v=${BADGE_VERSION}`;
  const auditUrl = `${SITE_URL}${auditPath(repoPath)}`;
  const markdown = `[![WelcomeScore](${badgeUrl})](${auditUrl})`;
  const socialText = `We scored ${score}/100 on @WelcomeScore! Checked our open-source contributor health & ready-to-work setup. View audit: ${auditUrl}`;

  async function copy(value: string, type: "badge" | "share") {
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
        className="w-full max-w-xl rounded-lg border border-muted/25 bg-surface p-5 shadow-2xl sm:p-6"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-accent">
              Share your contributor health
            </p>
            <h2 id="badge-share-modal-title" className="mt-2 break-all font-mono text-lg font-bold">
              {repoPath}
            </h2>
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

        <pre className="mt-5 max-h-36 overflow-auto rounded-md border border-muted/35 bg-base/40 p-4 font-mono text-xs leading-6 text-text whitespace-pre-wrap">
          {markdown}
        </pre>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void copy(markdown, "badge")}
            className={`h-10 rounded-md border border-muted/35 bg-base/30 px-4 font-sans text-sm font-medium ${
              feedback === "badge" ? "text-good" : "text-muted"
            }`}
          >
            {feedback === "badge" ? "Copied!" : "Copy README badge"}
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

"use client";

import { useEffect, useRef, useState } from "react";
import type { NextUsefulMove } from "@/lib/report/types";

type ActionDraftModalProps = {
  move: NextUsefulMove;
  isOpen: boolean;
  onClose: () => void;
};

export default function ActionDraftModal({
  move,
  isOpen,
  onClose,
}: ActionDraftModalProps) {
  const [activeTab, setActiveTab] = useState<"issue" | "patch">("issue");
  const [copied, setCopied] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }

    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const issue = move.issueDraft;
  const patch = move.patchPlan;

  async function handleCopy() {
    let textToCopy = "";
    if (activeTab === "issue" && issue) {
      textToCopy = `Title: ${issue.title}\nLabels: ${issue.labels.join(", ")}\n\n${issue.body}`;
    } else if (activeTab === "patch" && patch) {
      textToCopy = `Safety: ${patch.safety}\nFiles: ${patch.files.join(", ")}\nOperations:\n${patch.operations.map((o) => `- ${o}`).join("\n")}`;
    }

    if (!textToCopy) return;

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-action-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-base/80 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className="w-full max-w-2xl rounded-xl border border-muted/30 bg-surface p-6 shadow-2xl safe-top safe-bottom"
      >
        <div className="flex items-start justify-between border-b border-muted/20 pb-4">
          <div>
            <h2 id="modal-action-title" className="font-mono text-lg font-bold text-text">
              {move.title}
            </h2>
            <p className="mt-1 font-sans text-xs text-muted">
              Evidence-backed next step · Review carefully before opening or applying
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="rounded p-1 text-muted hover:text-text focus:outline-none"
          >
            ✕
          </button>
        </div>

        {/* Tab switcher if both issue draft and patch plan exist */}
        {issue && patch && (
          <div className="mt-4 flex gap-2 border-b border-muted/20 pb-2">
            <button
              type="button"
              onClick={() => setActiveTab("issue")}
              className={`rounded px-3 py-1 font-mono text-xs font-medium transition ${
                activeTab === "issue"
                  ? "bg-accent/15 text-accent border border-accent/40"
                  : "text-muted hover:text-text"
              }`}
            >
              Issue Draft
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("patch")}
              className={`rounded px-3 py-1 font-mono text-xs font-medium transition ${
                activeTab === "patch"
                  ? "bg-accent/15 text-accent border border-accent/40"
                  : "text-muted hover:text-text"
              }`}
            >
              Patch Plan ({patch.safety})
            </button>
          </div>
        )}

        <div className="mt-4 max-h-[60vh] overflow-y-auto space-y-4">
          {activeTab === "issue" && issue && (
            <div className="space-y-3 font-sans text-sm">
              <div>
                <label className="text-xs font-mono uppercase tracking-wider text-muted">
                  Suggested Title
                </label>
                <div className="mt-1 rounded border border-muted/20 bg-base/60 p-2.5 font-mono text-xs text-text select-all">
                  {issue.title}
                </div>
              </div>

              <div>
                <label className="text-xs font-mono uppercase tracking-wider text-muted">
                  Suggested Labels
                </label>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {issue.labels.map((l) => (
                    <span
                      key={l}
                      className="rounded bg-muted/15 px-2 py-0.5 font-mono text-[11px] text-muted border border-muted/20"
                    >
                      {l}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-mono uppercase tracking-wider text-muted">
                  Issue Description
                </label>
                <pre className="mt-1 whitespace-pre-wrap rounded border border-muted/20 bg-base/60 p-3 font-mono text-xs text-text overflow-x-auto select-all">
                  {issue.body}
                </pre>
              </div>
            </div>
          )}

          {activeTab === "patch" && patch && (
            <div className="space-y-3 font-sans text-sm">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase tracking-wider text-muted">
                  Safety Classification:
                </span>
                <span
                  className={`rounded px-2 py-0.5 font-mono text-[11px] font-semibold uppercase ${
                    patch.safety === "low-risk"
                      ? "bg-good/15 text-good border border-good/30"
                      : "bg-accent/15 text-accent border border-accent/30"
                  }`}
                >
                  {patch.safety}
                </span>
              </div>

              <div>
                <label className="text-xs font-mono uppercase tracking-wider text-muted">
                  Target Files
                </label>
                <div className="mt-1 flex flex-wrap gap-2">
                  {patch.files.map((f) => (
                    <code
                      key={f}
                      className="rounded border border-muted/20 bg-base/60 px-2 py-1 font-mono text-xs text-text"
                    >
                      {f}
                    </code>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-mono uppercase tracking-wider text-muted">
                  Planned Operations
                </label>
                <ul className="mt-1 space-y-1 rounded border border-muted/20 bg-base/60 p-3 font-mono text-xs text-text">
                  {patch.operations.map((op) => (
                    <li key={op} className="flex items-start gap-2">
                      <span className="text-accent" aria-hidden="true">
                        →
                      </span>
                      <span>{op}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-muted/20 pt-4">
          <p className="font-sans text-[11px] text-muted">
            WelcomeScore never creates automatic issues or pull requests. Maintainers retain full editorial control.
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="rounded border border-accent/60 bg-accent/20 px-4 py-2 font-mono text-xs font-semibold text-accent transition hover:bg-accent/30 focus:outline-none"
            >
              {copied ? "✓ Copied to clipboard" : "Copy to clipboard"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded border border-muted/30 px-3 py-2 font-mono text-xs text-muted hover:text-text"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

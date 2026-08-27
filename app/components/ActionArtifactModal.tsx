"use client";

import { useEffect, useRef, useState } from "react";
import type { ActionArtifact } from "@/lib/actionArtifacts";

type ActionArtifactModalProps = {
  artifact: ActionArtifact;
  onClose: () => void;
  onCopied?: () => void;
};

export default function ActionArtifactModal({
  artifact,
  onClose,
  onCopied,
}: ActionArtifactModalProps) {
  const [content, setContent] = useState(artifact.content);
  const [isCopied, setIsCopied] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    closeButtonRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(content);
      setIsCopied(true);
      onCopied?.();
      window.setTimeout(() => setIsCopied(false), 1_500);
    } catch {
      setIsCopied(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-base/85 px-3 py-4 sm:px-6 sm:py-8" onMouseDown={onClose}>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="action-artifact-modal-title"
        className="mx-auto w-full max-w-2xl rounded-lg border border-muted/25 bg-surface p-4 shadow-2xl sm:my-4 sm:p-6"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-muted/20 pb-4">
          <div>
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-accent">Editable starting point</p>
            <h2 id="action-artifact-modal-title" className="mt-1.5 font-mono text-base font-semibold text-text">
              {artifact.title}
            </h2>
            <p className="mt-1.5 max-w-xl font-sans text-sm leading-5 text-muted">{artifact.summary}</p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="-mt-1 text-xl leading-none text-link"
            aria-label="Close editable starting point"
          >
            ×
          </button>
        </div>

        <div className="mt-4 rounded-md border border-muted/25 bg-base/25 p-3">
          <p className="font-sans text-xs leading-5 text-muted">
            <span className="font-semibold text-accent">Keep it honest:</span> {artifact.guardrail}
          </p>
        </div>

        <label htmlFor="action-artifact-content" className="mt-4 block font-mono text-xs font-semibold uppercase tracking-[0.12em] text-muted">
          Edit before copying
        </label>
        <textarea
          id="action-artifact-content"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          rows={18}
          spellCheck={false}
          className="mt-2 min-h-[18rem] w-full resize-y rounded-md border border-muted/35 bg-base/40 p-4 font-mono text-xs leading-6 text-text outline-none focus:border-accent"
        />

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-muted/20 pt-4">
          <button
            type="button"
            onClick={() => void handleCopy()}
            className={`h-10 rounded-md border border-accent/45 bg-accent/10 px-4 font-sans text-sm font-medium transition-colors duration-180 ease-out hover:bg-accent/15 ${
              isCopied ? "text-good" : "text-accent"
            }`}
          >
            {isCopied ? "Copied!" : artifact.copyLabel}
          </button>
          {isCopied ? (
            <p className="font-sans text-xs text-good" role="status" aria-atomic="true">
              Editable text copied. Review it before publishing anywhere.
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}

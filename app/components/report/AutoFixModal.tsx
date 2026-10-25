"use client";

import { useEffect, useState } from "react";
import type { AutoFixProposal } from "@/lib/autofix/engine";

export interface AutoFixModalProps {
  proposal?: AutoFixProposal;
  fixPackage?: AutoFixProposal;
  onClose: () => void;
}

export default function AutoFixModal({ proposal, fixPackage, onClose }: AutoFixModalProps) {
  const activeProposal = proposal || fixPackage;
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!activeProposal) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(activeProposal.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // safe fallback
    }
  };

  const handleDownload = () => {
    const blob = new Blob([activeProposal.content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = activeProposal.targetPath.split("/").pop() || "remediation.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-base/80 p-3 sm:p-5 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="autofix-modal-title"
    >
      <div
        className="relative flex max-h-[90vh] w-full max-w-3xl flex-col rounded-lg border border-accent/35 bg-surface shadow-2xl overflow-hidden text-text"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-muted/20 px-5 py-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded border border-accent/40 bg-accent/15 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-accent">
                Maintainer Autopilot
              </span>
              <span className="font-mono text-xs text-muted">
                {activeProposal.targetPath}
              </span>
            </div>
            <h2 id="autofix-modal-title" className="mt-1 font-mono text-lg font-bold text-text">
              {activeProposal.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 font-mono text-muted hover:text-text hover:bg-white/5 transition-colors cursor-pointer"
            aria-label="Close AutoFix dialog"
          >
            ✕
          </button>
        </div>

        {/* Body Explanation & Code Box */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <div className="rounded-md border border-muted/20 bg-base/40 p-3 font-sans text-xs text-muted leading-relaxed">
            <span className="font-semibold text-text">Why it matters: </span>
            {activeProposal.whyItMatters}
          </div>

          <div className="relative">
            <div className="flex items-center justify-between rounded-t-md border-t border-l border-r border-muted/25 bg-base px-3 py-2 font-mono text-[11px] text-muted">
              <span>{activeProposal.targetPath}</span>
              <button
                type="button"
                onClick={handleCopy}
                className="text-accent hover:underline flex items-center gap-1 cursor-pointer"
              >
                {copied ? "✓ Copied" : "Copy Content"}
              </button>
            </div>
            <pre className="max-h-80 overflow-x-auto rounded-b-md border border-muted/25 bg-base/80 p-3 font-mono text-xs leading-5 text-text/90 scrollbar-thin">
              <code>{activeProposal.content}</code>
            </pre>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-muted/20 bg-surface/70 px-5 py-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex h-9 items-center justify-center rounded-md border border-muted/35 bg-surface px-3 font-mono text-xs font-medium text-text hover:border-accent/40 hover:text-accent transition-colors cursor-pointer"
            >
              {copied ? "✓ Copied to Clipboard" : "📋 Copy File"}
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex h-9 items-center justify-center rounded-md border border-muted/35 bg-surface px-3 font-mono text-xs font-medium text-text hover:border-accent/40 hover:text-accent transition-colors cursor-pointer"
            >
              💾 Download
            </button>
          </div>

          <a
            href={activeProposal.directGitHubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-accent bg-accent/20 px-4 font-mono text-xs font-bold text-accent shadow-sm hover:bg-accent hover:text-base transition-all duration-180 active:scale-[0.98]"
          >
            <span>🚀 Open 1-Click PR on GitHub</span>
            <span className="text-[10px]">↗</span>
          </a>
        </div>
      </div>
    </div>
  );
}

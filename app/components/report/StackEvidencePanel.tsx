"use client";

import React, { useState } from "react";
import type { StackCheck, StackReport } from "@/lib/stacks/types";

interface StackEvidencePanelProps {
  report: StackReport;
}

export default function StackEvidencePanel({ report }: StackEvidencePanelProps) {
  const [expandedCheckId, setExpandedCheckId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copySnippet = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const downloadRemediation = (targetPath: string, code: string) => {
    const blob = new Blob([code], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const fileName = targetPath.split("/").pop() || "remediation.txt";
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section aria-labelledby="stack-evidence-heading" className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-muted/20 pb-4">
        <div>
          <h2 id="stack-evidence-heading" className="font-mono text-lg font-bold text-text">
            {report.stackName} Signals
          </h2>
          <p className="font-sans text-xs text-muted mt-1">{report.tagline}</p>
        </div>
        <span className="font-mono text-xs text-muted">
          Total Score: <strong className="text-accent">{report.score}/100</strong> (Grade {report.grade})
        </span>
      </div>

      <div className="space-y-3">
        {report.checks.map((check: StackCheck) => {
          const isPass = check.status === "pass";
          const isPartial = check.status === "partial";
          const isExpanded = expandedCheckId === check.id;

          return (
            <div
              key={check.id}
              className="rounded-md border border-muted/20 bg-surface p-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        isPass ? "bg-good" : isPartial ? "bg-amber-400" : "bg-bad"
                      }`}
                    />
                    <h3 className="font-mono text-sm font-semibold text-text">{check.label}</h3>
                    <span className="font-mono text-[10px] uppercase text-muted bg-base/50 px-2 py-0.5 rounded border border-muted/15">
                      {check.category}
                    </span>
                  </div>
                  <p className="font-sans text-xs text-muted/90 pl-4">{check.explanation}</p>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                  <span
                    className={`font-mono text-xs font-semibold px-2 py-0.5 rounded ${
                      isPass
                        ? "bg-good/15 text-good"
                        : isPartial
                        ? "bg-amber-400/15 text-amber-300"
                        : "bg-bad/15 text-bad"
                    }`}
                  >
                    {check.points}/{check.maxPoints} pts
                  </span>

                  {check.remediation && (
                    <button
                      onClick={() => setExpandedCheckId(isExpanded ? null : check.id)}
                      type="button"
                      className="rounded border border-muted/30 bg-base/60 px-2.5 py-1 font-mono text-[11px] text-muted hover:text-text hover:border-accent/40 transition"
                    >
                      {isExpanded ? "Hide Patch" : "View Patch"}
                    </button>
                  )}
                </div>
              </div>

              {/* Expandable Remediation Patch */}
              {isExpanded && check.remediation && (
                <div className="mt-4 border-t border-muted/15 pt-3 space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="font-mono text-xs text-text">
                      <span className="text-muted">Target: </span>
                      <code className="rounded bg-base px-1.5 py-0.5 text-accent">
                        {check.remediation.targetPath}
                      </code>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => downloadRemediation(check.remediation!.targetPath, check.remediation!.codeSnippet)}
                        type="button"
                        className="inline-flex items-center gap-1 rounded bg-surface border border-muted/30 px-2.5 py-1 font-mono text-[11px] font-medium text-text hover:border-accent hover:text-accent transition"
                      >
                        ↓ Download File
                      </button>
                      <button
                        onClick={() => copySnippet(check.id, check.remediation!.codeSnippet)}
                        type="button"
                        className="inline-flex items-center gap-1 rounded bg-accent/15 px-2.5 py-1 font-mono text-[11px] font-semibold text-accent border border-accent/30 hover:bg-accent/25 transition"
                      >
                        {copiedId === check.id ? "✓ Copied" : "Copy Code"}
                      </button>
                    </div>
                  </div>

                  <pre className="overflow-x-auto rounded-lg border border-muted/20 bg-base p-3 font-mono text-xs text-text/90 leading-relaxed">
                    <code>{check.remediation.codeSnippet}</code>
                  </pre>

                  {check.remediation.acceptanceCriteria.length > 0 && (
                    <div className="space-y-1 text-xs">
                      <span className="font-mono text-[10px] uppercase text-muted tracking-wider">
                        Acceptance Criteria:
                      </span>
                      <ul className="list-disc pl-5 text-muted space-y-0.5">
                        {check.remediation.acceptanceCriteria.map((crit, idx) => (
                          <li key={idx}>{crit}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

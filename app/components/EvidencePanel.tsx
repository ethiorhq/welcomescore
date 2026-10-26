"use client";

import type { EvidenceItem } from "@/lib/report/types";
import { resolveAutoFix, type AutoFixPackage } from "@/lib/autofix/engine";

type EvidencePanelProps = {
  checks: EvidenceItem[];
  repo?: string;
  defaultBranch?: string;
  onReportIncorrectSignal?: (check: EvidenceItem) => void;
  onTriggerAutoFix?: (pkg: AutoFixPackage) => void;
};

const STATUS_BADGES: Record<
  EvidenceItem["status"],
  { label: string; className: string }
> = {
  pass: {
    label: "✓ Pass",
    className: "bg-good/15 text-good border-good/30",
  },
  partial: {
    label: "~ Partial",
    className: "bg-accent/15 text-accent border-accent/30",
  },
  missing: {
    label: "✗ Missing",
    className: "bg-muted/15 text-muted border-muted/30",
  },
  unknown: {
    label: "? Unknown",
    className: "bg-muted/20 text-muted/80 border-muted/20",
  },
};

export default function EvidencePanel({
  checks,
  repo = "",
  defaultBranch = "main",
  onReportIncorrectSignal,
  onTriggerAutoFix,
}: EvidencePanelProps) {
  // Group by category
  const categories = Array.from(new Set(checks.map((c) => c.category)));

  return (
    <section aria-labelledby="evidence-heading" className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-2 border-b border-muted/20 pb-3">
        <div>
          <h2 id="evidence-heading" className="font-mono text-xl font-bold text-text">
            Evidence Breakdown
          </h2>
          <p className="mt-1 font-sans text-xs text-muted">
            All checks are evaluated deterministically from public repository metadata and conventional files.
          </p>
        </div>
        <span className="font-mono text-xs text-muted">
          {checks.filter((c) => c.status === "pass").length}/{checks.length} passed
        </span>
      </div>

      <div className="space-y-6">
        {categories.map((category) => {
          const categoryChecks = checks.filter((c) => c.category === category);
          const categoryPoints = categoryChecks.reduce((sum, c) => sum + c.points, 0);
          const categoryMax = categoryChecks.reduce((sum, c) => sum + c.maxPoints, 0);

          return (
            <div key={category} className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-mono text-xs uppercase tracking-wider text-muted">
                  {category}
                </h3>
                <span className="font-mono text-xs text-muted">
                  {categoryPoints}/{categoryMax} pts
                </span>
              </div>

              <div className="divide-y divide-muted/10 rounded-md border border-muted/20 bg-surface/40 overflow-hidden">
                {categoryChecks.map((check) => {
                  const badge = STATUS_BADGES[check.status];

                  return (
                    <article
                      key={check.id}
                      className="p-4 transition hover:bg-surface/80"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-mono text-sm font-semibold text-text">
                              {check.label}
                            </h4>
                            <span
                              className={`rounded border px-2 py-0.5 font-mono text-[10px] font-medium uppercase ${badge.className}`}
                            >
                              {badge.label}
                            </span>
                            <span className="text-[11px] font-mono text-muted/60">
                              Confidence: {check.confidence}
                            </span>
                          </div>

                          <p className="font-sans text-xs text-muted leading-relaxed">
                            {check.explanation}
                          </p>
                        </div>

                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          <span className="font-mono text-sm font-bold text-text">
                            {check.points}/{check.maxPoints} pts
                          </span>

                          <div className="flex items-center gap-2 font-mono text-[11px]">
                            {check.status !== "pass" && repo && onTriggerAutoFix ? (() => {
                              const autoFix = resolveAutoFix(check.label, { repo, branch: defaultBranch });
                              return autoFix ? (
                                <button
                                  type="button"
                                  onClick={() => onTriggerAutoFix(autoFix)}
                                  className="inline-flex items-center gap-1 rounded bg-accent/20 px-2 py-0.5 font-mono text-[11px] font-semibold text-accent border border-accent/40 hover:bg-accent/30 transition cursor-pointer"
                                  title={`Generate 1-Click PR on GitHub for ${check.label}`}
                                >
                                  ⚡ 1-Click Fix
                                </button>
                              ) : null;
                            })() : null}
                            {check.sourceUrl && (
                              <a
                                href={check.sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-link underline underline-offset-2 hover:text-accent"
                              >
                                Source ↗
                              </a>
                            )}
                            {onReportIncorrectSignal && (
                              <button
                                type="button"
                                onClick={() => onReportIncorrectSignal(check)}
                                className="text-muted/70 hover:text-accent transition underline underline-offset-2"
                              >
                                Report signal
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {check.limitations && check.limitations.length > 0 && (
                        <div className="mt-2 text-[11px] text-muted/60 font-sans italic">
                          Limit: {check.limitations.join(" · ")}
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

"use client";

import React from "react";
import type { ImprovementEvent } from "@/lib/improvement/types";

interface ImprovementTimelineProps {
  repo: string;
  events: ImprovementEvent[];
  isLoading?: boolean;
}

export function ImprovementTimeline({
  repo,
  events,
  isLoading = false,
}: ImprovementTimelineProps) {


  if (isLoading) {
    return (
      <div className="w-full rounded-xl border border-white/10 bg-[#1B1E29] p-6 text-center text-[#8B8F9E]">
        <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-[#E8A23D] border-t-transparent mb-2" />
        <p className="text-xs font-mono">Loading repository improvement timeline...</p>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="w-full rounded-xl border border-white/10 bg-[#1B1E29] p-6 text-center">
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-[#E8A23D]">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
        <h4 className="text-sm font-semibold text-[#F2EEE6] mb-1">
          First Recorded Audit
        </h4>
        <p className="text-xs text-[#8B8F9E] max-w-md mx-auto">
          WelcomeScore has recorded this initial baseline audit for <span className="font-mono text-[#F2EEE6]">{repo}</span>.
          When maintainers make improvements or run subsequent checks, verified score and signal changes will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full rounded-xl border border-white/10 bg-[#1B1E29] p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/10 gap-2 mb-6">
        <div>
          <h3 className="text-base font-semibold text-[#F2EEE6] flex items-center gap-2">
            <svg className="h-4 w-4 text-[#7A9B76]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            Improvement Timeline
          </h3>
          <p className="text-xs text-[#8B8F9E] mt-0.5">
            Verified evidence changes and progress across audits.
          </p>
        </div>
        <span className="text-xs font-mono text-[#8B8F9E] self-start sm:self-auto bg-white/5 px-2.5 py-1 rounded-md border border-white/5">
          {events.length} {events.length === 1 ? "audit recorded" : "audits recorded"}
        </span>
      </div>

      <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-white/10">
        {events.map((evt, idx) => {
          const isLatest = idx === 0;
          const delta = evt.scoreDelta;

          return (
            <div key={evt.id} className="relative">

              {/* Dot on the timeline spine */}
              <div
                className={`absolute -left-6 top-1.5 h-4 w-4 rounded-full border-2 ${
                  isLatest
                    ? "border-[#E8A23D] bg-[#12141C]"
                    : delta !== null && delta > 0
                    ? "border-[#7A9B76] bg-[#12141C]"
                    : "border-white/20 bg-[#12141C]"
                }`}
              />

              <div className="rounded-lg border border-white/5 bg-[#12141C]/60 p-4 transition-colors hover:border-white/10">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-lg font-bold text-[#F2EEE6]">
                      {evt.newScore}
                    </span>
                    <span className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-xs text-[#8B8F9E] uppercase">
                      Grade {evt.newGrade}
                    </span>

                    {delta !== null && (
                      <span
                        className={`font-mono text-xs px-2 py-0.5 rounded-full font-medium ${
                          delta > 0
                            ? "bg-[#7A9B76]/10 text-[#7A9B76] border border-[#7A9B76]/20"
                            : delta < 0
                            ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                            : "bg-white/5 text-[#8B8F9E]"
                        }`}
                      >
                        {delta > 0 ? `+${delta} pts` : delta < 0 ? `${delta} pts` : "Unchanged"}
                      </span>
                    )}

                    {isLatest && (
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[#E8A23D] bg-[#E8A23D]/10 px-2 py-0.5 rounded border border-[#E8A23D]/20">
                        Current
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-[#8B8F9E] font-mono">
                    {evt.defaultBranch && (
                      <span className="hidden sm:inline-block">branch: {evt.defaultBranch}</span>
                    )}
                    {evt.commitSha && (
                      <span className="text-[#8B8F9E]" title={`Commit ${evt.commitSha}`}>
                        {evt.commitSha.slice(0, 7)}
                      </span>
                    )}
                    <time dateTime={evt.analyzedAt}>
                      {new Date(evt.analyzedAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </time>
                  </div>
                </div>

                {/* Score transition note */}
                {evt.previousScore !== null && (
                  <p className="text-xs text-[#8B8F9E] mb-3">
                    Progressed from score <span className="font-mono text-[#F2EEE6]">{evt.previousScore}</span> ({evt.previousGrade}) to <span className="font-mono text-[#F2EEE6]">{evt.newScore}</span> ({evt.newGrade}).
                  </p>
                )}

                {/* Completed Moves */}
                {evt.completedMoves.length > 0 && (
                  <div className="mb-3 rounded-md bg-[#7A9B76]/10 border border-[#7A9B76]/20 p-2.5">
                    <span className="text-xs font-semibold text-[#7A9B76] block mb-1">
                      Completed Next Move:
                    </span>
                    <ul className="list-inside list-disc text-xs text-[#F2EEE6] space-y-0.5 font-mono">
                      {evt.completedMoves.map((m) => (
                        <li key={m}>{m}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Changed Signals */}
                {evt.changedSignals.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    <span className="text-xs font-mono text-[#8B8F9E] block">
                      Signal Changes ({evt.changedSignals.length}):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {evt.changedSignals.map((sig) => (
                        <span
                          key={sig.id}
                          className={`text-[11px] font-mono px-2 py-0.5 rounded border ${
                            sig.afterPassed
                              ? "bg-[#7A9B76]/10 text-[#7A9B76] border-[#7A9B76]/20"
                              : "bg-rose-500/10 text-rose-300 border-rose-500/20"
                          }`}
                        >
                          {sig.afterPassed ? "✓" : "✗"} {sig.label} ({sig.pointsDelta >= 0 ? `+${sig.pointsDelta}` : sig.pointsDelta} pts)
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Remaining move info */}
                {evt.remainingMoveId && (
                  <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-xs text-[#8B8F9E]">
                    <span>
                      Next target: <span className="font-mono text-[#E8A23D]">{evt.remainingMoveId}</span>
                    </span>
                    {evt.confidence && (
                      <span className="font-mono text-[10px]">
                        Confidence: {evt.confidence}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

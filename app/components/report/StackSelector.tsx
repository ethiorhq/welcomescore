"use client";

import React from "react";
import { STACK_DEFINITIONS, type StackId, type StackReport } from "@/lib/stacks/types";

interface StackSelectorProps {
  activeStack: string;
  onSelectStack: (stackId: string) => void;
  coreScore: number;
  coreGrade: string;
  stackReports?: Record<string, StackReport>;
}

export default function StackSelector({
  activeStack,
  onSelectStack,
  coreScore,
  coreGrade,
  stackReports = {},
}: StackSelectorProps) {
  const availableStacks: Array<{
    id: string;
    name: string;
    icon: string;
    score: number;
    grade: string;
    color: string;
  }> = [
    {
      id: "core",
      name: "Contributor Readiness",
      icon: "★",
      score: coreScore,
      grade: coreGrade,
      color: "#E8A23D",
    },
  ];

  for (const [id, rep] of Object.entries(stackReports)) {
    const def = STACK_DEFINITIONS[id as StackId];
    if (def) {
      availableStacks.push({
        id,
        name: def.name,
        icon: def.icon,
        score: rep.score,
        grade: rep.grade,
        color: def.color,
      });
    }
  }

  if (availableStacks.length <= 1) {
    return null;
  }

  return (
    <nav
      aria-label="Stack evaluation selector"
      className="flex items-center gap-2 overflow-x-auto pb-1"
    >
      <div className="flex items-center gap-1.5 rounded-md border border-muted/25 bg-surface p-1.5">
        {availableStacks.map((s) => {
          const isActive = activeStack === s.id;
          return (
            <button
              key={s.id}
              onClick={() => onSelectStack(s.id)}
              type="button"
              className={`flex items-center gap-2.5 rounded-md px-3.5 py-1.5 font-mono text-xs transition-colors duration-150 ${
                isActive
                  ? "bg-accent text-base font-semibold shadow-sm"
                  : "text-muted hover:text-text hover:bg-white/5"
              }`}
            >
              <span aria-hidden="true" className="text-sm">
                {s.icon}
              </span>
              <span>{s.name}</span>
              <span
                className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                  isActive
                    ? "bg-base/30 text-base"
                    : "bg-white/5 text-text border border-white/5"
                }`}
              >
                {s.score} ({s.grade})
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

"use client";

import React, { useMemo } from "react";
import AlgofoxSprite from "@/app/components/pet/AlgofoxSprite";
import type { AlgofoxState } from "@/app/components/pet/AlgofoxPetProvider";
import type { Vitals } from "@/lib/game/types";

interface AlgofoxGameCompanionProps {
  vitals: Vitals;
  isGameOver: boolean;
  isSprintCelebration: boolean;
  isHoveringChoice?: "left" | "right" | null;
  day: number;
  sprint: number;
}

export default function AlgofoxGameCompanion({
  vitals,
  isGameOver,
  isSprintCelebration,
  isHoveringChoice,
  day,
  sprint,
}: AlgofoxGameCompanionProps) {
  // Determine mascot animation state
  const spriteState: AlgofoxState = useMemo(() => {
    if (isGameOver) return "failed";
    if (isSprintCelebration) return "jumping";
    if (isHoveringChoice) return "review";

    // Danger zone checks
    if (vitals.server <= 25 || vitals.morale <= 25 || vitals.runway <= 25 || vitals.stars <= 25) {
      return "waiting";
    }

    if (vitals.server >= 80 || vitals.stars >= 80) {
      return "running";
    }

    return "idle";
  }, [vitals, isGameOver, isSprintCelebration, isHoveringChoice]);

  // Dynamic speech comment
  const comment = useMemo(() => {
    if (isGameOver) {
      return "Well... at least we can write a post-mortem about it.";
    }
    if (isSprintCelebration) {
      return `🎉 Sprint ${sprint} completed! Take a breath before next sprint!`;
    }
    if (isHoveringChoice === "left") {
      return "Playing it safe? Or avoiding disaster?";
    }
    if (isHoveringChoice === "right") {
      return "Bold move! Hope production can handle it!";
    }

    // Critical vitals comments
    if (vitals.server <= 25) {
      return "⚠️ The servers are smoking! Don't push any more code!";
    }
    if (vitals.morale <= 25) {
      return "⚠️ The engineers are drafting resignation letters!";
    }
    if (vitals.runway <= 25) {
      return "⚠️ AWS credit card is about to bounce! Need runway!";
    }
    if (vitals.stars <= 25) {
      return "⚠️ We're losing stars! Community thinks we abandoned the repo!";
    }

    if (vitals.server >= 85) {
      return "Server is so pristine nobody dares touch it.";
    }
    if (vitals.morale >= 85) {
      return "High morale! Lots of ping-pong, zero pull requests.";
    }

    // Default witty hints
    const hints = [
      "Keep all 4 bars balanced. 0% or 100% means game over!",
      "Drag cards left or right, or tap the action buttons.",
      `Day ${day} of Sprint ${sprint}. Hang in there!`,
      "Remember: It worked on local is not a legal defense.",
    ];
    return hints[(day + sprint) % hints.length];
  }, [vitals, isGameOver, isSprintCelebration, isHoveringChoice, day, sprint]);

  return (
    <div className="flex items-center gap-3 rounded-lg border border-muted/20 bg-base/50 p-2.5 sm:p-3">
      <div className="shrink-0 flex items-center justify-center">
        <AlgofoxSprite state={spriteState} size={48} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-accent">
            Algofox Co-Pilot
          </span>
          <span className="text-[10px] text-muted">· Advisor</span>
        </div>
        <p className="font-sans text-xs text-text/90 leading-tight mt-0.5 truncate sm:whitespace-normal">
          {comment}
        </p>
      </div>
    </div>
  );
}

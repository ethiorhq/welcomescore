"use client";

import React, { useEffect } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import type { SprintCard as SprintCardType } from "@/lib/game/types";

interface SprintCardProps {
  card: SprintCardType;
  onChoose: (direction: "left" | "right") => void;
  onDragHoverChange: (direction: "left" | "right" | null) => void;
}

const SWIPE_THRESHOLD = 80;

export default function SprintCard({
  card,
  onChoose,
  onDragHoverChange,
}: SprintCardProps) {
  const x = useMotionValue(0);

  // Dynamic transforms based on drag offset
  const rotate = useTransform(x, [-200, 200], [-12, 12]);
  const leftStampOpacity = useTransform(x, [-120, -30], [1, 0]);
  const rightStampOpacity = useTransform(x, [30, 120], [0, 1]);

  // Keyboard controls listener (ArrowLeft, ArrowRight, A, D)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === "ArrowLeft" || e.key.toLowerCase() === "a") {
        e.preventDefault();
        onChoose("left");
      } else if (e.key === "ArrowRight" || e.key.toLowerCase() === "d") {
        e.preventDefault();
        onChoose("right");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onChoose]);

  const handleDrag = () => {
    const currentX = x.get();
    if (currentX < -25) {
      onDragHoverChange("left");
    } else if (currentX > 25) {
      onDragHoverChange("right");
    } else {
      onDragHoverChange(null);
    }
  };

  const handleDragEnd = () => {
    const currentX = x.get();
    onDragHoverChange(null);

    if (currentX < -SWIPE_THRESHOLD) {
      onChoose("left");
    } else if (currentX > SWIPE_THRESHOLD) {
      onChoose("right");
    }
  };

  return (
    <div className="relative w-full max-w-sm sm:max-w-md mx-auto select-none touch-none">
      {/* Draggable Card with Framer Motion spring physics */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.7}
        style={{ x, rotate }}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        whileTap={{ cursor: "grabbing" }}
        className="relative cursor-grab overflow-hidden rounded-xl border border-muted/30 bg-[#161825] p-5 sm:p-6 shadow-2xl backdrop-blur-md transition-colors hover:border-accent/40"
      >
        {/* Left Stamp: REJECT / OPTION A */}
        <motion.div
          style={{ opacity: leftStampOpacity }}
          className="pointer-events-none absolute left-4 top-4 z-20 rounded-md border-2 border-bad/80 bg-bad/15 px-3 py-1 font-mono text-xs font-bold uppercase tracking-wider text-bad shadow-md"
        >
          ← {card.left.tag || "REJECT"}
        </motion.div>

        {/* Right Stamp: ACCEPT / OPTION B */}
        <motion.div
          style={{ opacity: rightStampOpacity }}
          className="pointer-events-none absolute right-4 top-4 z-20 rounded-md border-2 border-accent bg-accent/20 px-3 py-1 font-mono text-xs font-bold uppercase tracking-wider text-accent shadow-md"
        >
          {card.right.tag || "ACCEPT"} →
        </motion.div>

        {/* Card Header: Character & Role */}
        <div className="flex items-center gap-3 border-b border-muted/20 pb-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-accent/30 bg-accent/10 text-2xl shadow-inner">
            {card.avatarIcon}
          </div>
          <div>
            <h3 className="font-mono text-base font-bold text-text">
              {card.character}
            </h3>
            <p className="font-mono text-xs font-semibold text-accent">
              {card.role}
            </p>
          </div>
        </div>

        {/* Card Body: Quote / Dilemma */}
        <div className="py-5 min-h-[120px] flex items-center">
          <blockquote className="font-sans text-sm sm:text-base leading-relaxed text-text">
            &ldquo;{card.quote}&rdquo;
          </blockquote>
        </div>

        {/* Swipe instruction tooltip */}
        <div className="border-t border-muted/20 pt-3 flex items-center justify-between text-[11px] font-mono text-muted/70">
          <span>← Drag Left to Reject</span>
          <span>Drag Right to Accept →</span>
        </div>
      </motion.div>

      {/* Accessible Interactive Choice Action Buttons */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onChoose("left")}
          onMouseEnter={() => onDragHoverChange("left")}
          onMouseLeave={() => onDragHoverChange(null)}
          className="group flex flex-col justify-between rounded-lg border border-muted/30 bg-surface/80 p-3 text-left transition hover:border-bad/60 hover:bg-bad/10 active:scale-[0.98] focus:outline-none focus:ring-1 focus:ring-bad"
        >
          <div className="flex items-center justify-between w-full">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted group-hover:text-bad">
              Option A [←]
            </span>
            <span className="text-xs text-muted group-hover:text-bad font-mono">
              {card.left.tag || "Reject"}
            </span>
          </div>
          <p className="font-sans text-xs text-text mt-1 leading-snug line-clamp-2">
            {card.left.text}
          </p>
        </button>

        <button
          type="button"
          onClick={() => onChoose("right")}
          onMouseEnter={() => onDragHoverChange("right")}
          onMouseLeave={() => onDragHoverChange(null)}
          className="group flex flex-col justify-between rounded-lg border border-muted/30 bg-surface/80 p-3 text-left transition hover:border-accent/60 hover:bg-accent/10 active:scale-[0.98] focus:outline-none focus:ring-1 focus:ring-accent"
        >
          <div className="flex items-center justify-between w-full">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted group-hover:text-accent">
              Option B [→]
            </span>
            <span className="text-xs text-muted group-hover:text-accent font-mono">
              {card.right.tag || "Accept"}
            </span>
          </div>
          <p className="font-sans text-xs text-text mt-1 leading-snug line-clamp-2">
            {card.right.text}
          </p>
        </button>
      </div>
    </div>
  );
}

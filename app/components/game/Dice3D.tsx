"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface Dice3DProps {
  value: number | null;
  isRolling: boolean;
  onRoll: () => void;
  disabled?: boolean;
  doubleBoostActive?: boolean;
}

// Visual dot arrangements for dice faces 1 to 6
const DICE_DOTS: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

export default function Dice3D({
  value,
  isRolling,
  onRoll,
  disabled = false,
  doubleBoostActive = false,
}: Dice3DProps) {
  const [displayValue, setDisplayValue] = useState<number>(value || 1);

  // During rolling animation, rapidly cycle faces
  useEffect(() => {
    if (!isRolling) {
      if (value) setDisplayValue(value);
      return;
    }

    const interval = setInterval(() => {
      setDisplayValue(Math.floor(Math.random() * 6) + 1);
    }, 80);

    return () => clearInterval(interval);
  }, [isRolling, value]);

  // Spacebar to roll
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !disabled && !isRolling) {
        if (
          e.target instanceof HTMLInputElement ||
          e.target instanceof HTMLTextAreaElement
        ) {
          return;
        }
        e.preventDefault();
        onRoll();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [disabled, isRolling, onRoll]);

  const activeDots = DICE_DOTS[displayValue] || DICE_DOTS[1];

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      {/* 3D Animated Dice Cube Container */}
      <motion.div
        animate={
          isRolling
            ? {
                rotateX: [0, 360, 720, 1080],
                rotateY: [0, 180, 540, 720],
                rotateZ: [0, 90, 270, 360],
                scale: [1, 1.15, 0.95, 1.1, 1],
              }
            : {
                rotateX: 0,
                rotateY: 0,
                rotateZ: 0,
                scale: 1,
              }
        }
        transition={
          isRolling
            ? { duration: 0.7, ease: "easeInOut", repeat: 0 }
            : { duration: 0.2 }
        }
        className={`relative h-20 w-20 sm:h-24 sm:w-24 rounded-2xl border-2 p-2 shadow-2xl transition-all duration-300 ${
          doubleBoostActive
            ? "border-accent bg-gradient-to-br from-[#2a1e12] to-[#161825] shadow-[0_0_25px_rgba(232,162,61,0.4)]"
            : "border-muted/40 bg-gradient-to-br from-[#1f2233] to-[#12141d] shadow-[0_0_20px_rgba(0,0,0,0.5)]"
        }`}
      >
        {/* Dice Pips Grid (3x3) */}
        <div className="grid h-full w-full grid-cols-3 grid-rows-3 p-1">
          {[...Array(9)].map((_, i) => {
            const hasDot = activeDots.includes(i);
            return (
              <div
                key={i}
                className="flex items-center justify-center"
              >
                {hasDot && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={`h-3 w-3 sm:h-3.5 sm:w-3.5 rounded-full shadow-inner ${
                      doubleBoostActive
                        ? "bg-accent shadow-[0_0_8px_#E8A23D]"
                        : "bg-text shadow-[0_0_6px_rgba(255,255,255,0.4)]"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Double boost ribbon */}
        {doubleBoostActive && (
          <div className="absolute -top-2 -right-2 rounded-full border border-accent bg-accent px-1.5 py-0.5 text-[9px] font-mono font-bold text-base shadow">
            2X
          </div>
        )}
      </motion.div>

      {/* Action Button */}
      <button
        type="button"
        onClick={onRoll}
        disabled={disabled || isRolling}
        className="group relative flex items-center justify-center gap-2 rounded-lg border border-accent/60 bg-gradient-to-r from-accent/90 to-accent px-5 py-2.5 font-mono text-sm font-bold text-base shadow-lg transition-all duration-180 ease-out hover:from-accent hover:to-accent/95 hover:shadow-[0_0_20px_rgba(232,162,61,0.4)] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className="text-base group-hover:rotate-45 transition-transform">
          🎲
        </span>
        <span>{isRolling ? "Rolling..." : "ROLL DICE"}</span>
        <kbd className="hidden sm:inline-block rounded bg-base/20 px-1 py-0.5 text-[10px] text-base/80">
          Space
        </kbd>
      </button>
    </div>
  );
}

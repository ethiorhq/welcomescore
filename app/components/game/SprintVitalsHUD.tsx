"use client";

import React from "react";
import type { StatDelta, VitalKey, Vitals } from "@/lib/game/types";

interface SprintVitalsHUDProps {
  vitals: Vitals;
  activeDelta?: StatDelta | null;
}

const VITALS_META: Array<{
  key: VitalKey;
  label: string;
  icon: string;
}> = [
  { key: "server", label: "Server", icon: "💻" },
  { key: "morale", label: "Morale", icon: "☕" },
  { key: "runway", label: "Runway", icon: "💰" },
  { key: "stars", label: "Hype", icon: "⭐" },
];

export default function SprintVitalsHUD({
  vitals,
  activeDelta,
}: SprintVitalsHUDProps) {
  return (
    <div className="grid grid-cols-4 gap-2 sm:gap-3 rounded-xl border border-muted/25 bg-surface/90 p-3 sm:p-4 backdrop-blur-md shadow-md">
      {VITALS_META.map(({ key, label, icon }) => {
        const value = vitals[key];
        const isCritical = value <= 20 || value >= 85;
        const delta = activeDelta ? activeDelta[key] : undefined;
        const hasDelta = typeof delta === "number" && delta !== 0;

        // Determine bar color based on health range
        let barColor = "bg-accent";
        if (value <= 20) {
          barColor = "bg-bad animate-pulse";
        } else if (value >= 85) {
          barColor = "bg-accent animate-pulse";
        } else if (value >= 40 && value <= 70) {
          barColor = "bg-good";
        }

        return (
          <div key={key} className="space-y-1.5 flex flex-col items-center sm:items-stretch">
            {/* Top row: Icon, Label, and Preview Dot Indicator */}
            <div className="flex items-center justify-between w-full">
              <span className="flex items-center gap-1 font-mono text-xs text-text font-bold">
                <span className="text-sm">{icon}</span>
                <span className="hidden sm:inline font-sans font-medium text-muted">
                  {label}
                </span>
              </span>

              {/* Dynamic Indicator Dot: shows if this card affects this stat */}
              <div className="h-2 w-2 flex items-center justify-center">
                {hasDelta && (
                  <span
                    className={`inline-block rounded-full bg-accent animate-ping ${
                      Math.abs(delta!) >= 20 ? "h-2 w-2" : "h-1.5 w-1.5"
                    }`}
                    title="This choice impacts this vital"
                  />
                )}
              </div>
            </div>

            {/* Gauge progress bar */}
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-base/80 border border-muted/20">
              <div
                className={`h-full transition-all duration-300 ease-out rounded-full ${barColor}`}
                style={{ width: `${Math.max(4, Math.min(100, value))}%` }}
              />
            </div>

            {/* Percentage text */}
            <div className="flex items-center justify-between text-[10px] font-mono font-semibold">
              <span className={isCritical ? "text-bad font-bold" : "text-muted"}>
                {value}%
              </span>
              {hasDelta && (
                <span
                  className={`text-[9px] font-mono ${
                    delta! > 0 ? "text-good" : "text-bad"
                  }`}
                >
                  {delta! > 0 ? `+` : `-`}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import SprintVitalsHUD from "./SprintVitalsHUD";
import AlgofoxGameCompanion from "./AlgofoxGameCompanion";
import SprintCard from "./SprintCard";
import {
  createInitialGameState,
  processDecision,
  formatPostMortemReceipt,
} from "@/lib/game/sprintEngine";
import type { GameState, StatDelta } from "@/lib/game/types";
import {
  isSoundMuted,
  setSoundMuted,
  playSwipeSound,
  playStatBlip,
  playSprintSuccessChime,
  playGameOverTone,
} from "@/lib/game/gameAudio";

interface SurviveSprintModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HIGH_SCORE_KEY = "welcomescore_sprint_highscore";

export default function SurviveSprintModal({
  isOpen,
  onClose,
}: SurviveSprintModalProps) {
  const [gameState, setGameState] = useState<GameState>(() =>
    createInitialGameState(),
  );
  const [hoverDirection, setHoverDirection] = useState<
    "left" | "right" | null
  >(null);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [copiedReceipt, setCopiedReceipt] = useState<boolean>(false);
  const [showReceipt, setShowReceipt] = useState<boolean>(false);
  const [highScore, setHighScore] = useState<number>(1);

  // Sync mute state and high score on client mount
  useEffect(() => {
    setIsMuted(isSoundMuted());
    try {
      const savedHigh = localStorage.getItem(HIGH_SCORE_KEY);
      if (savedHigh) {
        const parsed = parseInt(savedHigh, 10);
        if (!isNaN(parsed)) setHighScore(parsed);
      }
    } catch {}
  }, []);

  // Update high score whenever sprint advances
  useEffect(() => {
    if (gameState.sprint > highScore) {
      setHighScore(gameState.sprint);
      try {
        localStorage.setItem(HIGH_SCORE_KEY, gameState.sprint.toString());
      } catch {}
    }
  }, [gameState.sprint, highScore]);

  // Handle ESC key to exit
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Sound toggle handler
  const toggleSound = useCallback(() => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    setSoundMuted(nextMuted);
  }, [isMuted]);

  // Choice decision handler
  const handleChoice = useCallback(
    (direction: "left" | "right") => {
      playSwipeSound(direction);
      playStatBlip();

      setGameState((prev) => {
        const next = processDecision(prev, direction);
        if (next.isGameOver) {
          playGameOverTone();
        } else if (next.isSprintCompletedCelebration) {
          playSprintSuccessChime();
        }
        return next;
      });
      setHoverDirection(null);
    },
    [],
  );

  // Restart game
  const handleRestart = useCallback(() => {
    setGameState(createInitialGameState());
    setHoverDirection(null);
    setShowReceipt(false);
    setCopiedReceipt(false);
  }, []);

  // Continue after sprint celebration
  const handleContinueSprint = useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      isSprintCompletedCelebration: false,
    }));
  }, []);

  // Copy post-mortem receipt
  const handleCopyReceipt = useCallback(async () => {
    const receipt = formatPostMortemReceipt(gameState);
    try {
      await navigator.clipboard.writeText(receipt);
      setCopiedReceipt(true);
      setTimeout(() => setCopiedReceipt(false), 2500);
    } catch {
      // Fallback
    }
  }, [gameState]);

  // Current active card
  const currentCard = useMemo(() => {
    if (!gameState.deck || gameState.deck.length === 0) return null;
    return gameState.deck[gameState.activeCardIndex % gameState.deck.length];
  }, [gameState.deck, gameState.activeCardIndex]);

  // Delta preview when hovering or dragging
  const activeDelta: StatDelta | null = useMemo(() => {
    if (!hoverDirection || !currentCard) return null;
    return hoverDirection === "left"
      ? currentCard.left.delta
      : currentCard.right.delta;
  }, [hoverDirection, currentCard]);

  // Twitter share link
  const shareTwitterUrl = useMemo(() => {
    const title = gameState.ending?.title || "Sprint Game Over";
    const text = encodeURIComponent(
      `I survived ${gameState.sprint} sprints and ${gameState.cardsPlayed} dev dilemmas in "Survive the Sprint!" on WelcomeScore.\n\nCause of Death: ${title}\n\nCan your repo manage this? Play the dev break:`,
    );
    const url = encodeURIComponent("https://welcomescore.vercel.app");
    return `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
  }, [gameState]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="game-dialog-title"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-base/80 backdrop-blur-md overflow-y-auto"
      >
        {/* Clickable backdrop overlay */}
        <div
          className="fixed inset-0 -z-10"
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Modal Window Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative w-full max-w-lg rounded-xl border border-muted/30 bg-[#141622] p-4 sm:p-6 shadow-2xl overflow-hidden flex flex-col gap-4 my-auto max-h-[95vh]"
        >
          {/* Top Bar: Sprint & Day Counter, Sound Toggle, Close Button */}
          <header className="flex items-center justify-between border-b border-muted/20 pb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-7 items-center rounded-md border border-accent/40 bg-accent/10 px-2.5 font-mono text-xs font-bold text-accent">
                Sprint {gameState.sprint} · Day {gameState.day}/10
              </span>
              <span className="hidden sm:inline-flex items-center font-mono text-xs text-muted">
                Best: Sprint {highScore}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Sound Toggle */}
              <button
                type="button"
                onClick={toggleSound}
                className="flex h-8 items-center gap-1 rounded-md border border-muted/30 bg-surface px-2.5 font-mono text-xs text-muted hover:border-accent/40 hover:text-accent transition-colors"
                title={isMuted ? "Unmute Sound" : "Mute Sound"}
                aria-label={isMuted ? "Unmute Sound" : "Mute Sound"}
              >
                <span>{isMuted ? "🔇" : "🔊"}</span>
                <span className="hidden sm:inline">
                  {isMuted ? "Muted" : "SFX"}
                </span>
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-md border border-muted/30 bg-surface text-muted hover:border-bad hover:bg-bad/10 hover:text-bad transition-colors"
                title="Exit Game (Esc)"
                aria-label="Exit Game"
              >
                ✕
              </button>
            </div>
          </header>

          {/* Vitals HUD Gauges */}
          <SprintVitalsHUD
            vitals={gameState.vitals}
            activeDelta={activeDelta}
          />

          {/* Mascot Co-Pilot Companion */}
          <AlgofoxGameCompanion
            vitals={gameState.vitals}
            isGameOver={gameState.isGameOver}
            isSprintCelebration={gameState.isSprintCompletedCelebration}
            isHoveringChoice={hoverDirection}
            day={gameState.day}
            sprint={gameState.sprint}
          />

          {/* Main Stage: Card Swiper OR Game Over OR Celebration */}
          <main className="relative flex-1 flex flex-col justify-center min-h-[300px]">
            {gameState.isGameOver ? (
              /* --- GAME OVER POST-MORTEM VIEW --- */
              <div className="space-y-4 rounded-xl border border-bad/40 bg-bad/5 p-4 sm:p-5 text-center">
                <div className="space-y-1">
                  <span className="inline-block rounded-md bg-bad/20 px-2 py-0.5 font-mono text-xs font-bold uppercase tracking-wider text-bad">
                    Sprint Terminated
                  </span>
                  <h2
                    id="game-dialog-title"
                    className="font-mono text-xl sm:text-2xl font-bold text-text pt-1"
                  >
                    {gameState.ending?.title}
                  </h2>
                </div>

                <p className="font-sans text-xs sm:text-sm text-text/80 leading-relaxed italic bg-base/50 p-3 rounded-lg border border-muted/20">
                  &ldquo;{gameState.ending?.postMortem}&rdquo;
                </p>

                {/* Score Summary */}
                <div className="grid grid-cols-3 gap-2 border-y border-muted/20 py-2.5 font-mono text-xs">
                  <div>
                    <span className="block text-muted text-[10px] uppercase">
                      Sprints
                    </span>
                    <span className="font-bold text-accent text-sm">
                      {gameState.sprint}
                    </span>
                  </div>
                  <div>
                    <span className="block text-muted text-[10px] uppercase">
                      Decisions
                    </span>
                    <span className="font-bold text-text text-sm">
                      {gameState.cardsPlayed}
                    </span>
                  </div>
                  <div>
                    <span className="block text-muted text-[10px] uppercase">
                      Personal Best
                    </span>
                    <span className="font-bold text-good text-sm">
                      Sprint {highScore}
                    </span>
                  </div>
                </div>

                {/* Actions: Restart & Share */}
                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleRestart}
                    className="flex-1 flex items-center justify-center gap-2 rounded-md bg-accent px-4 py-2.5 font-mono text-sm font-bold text-base hover:bg-accent/90 active:scale-[0.98] transition-all shadow-md"
                  >
                    <span>🔄</span>
                    <span>Restart Sprint</span>
                  </button>

                  <a
                    href={shareTwitterUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 rounded-md border border-muted/30 bg-surface px-4 py-2.5 font-mono text-xs font-semibold text-text hover:border-accent hover:text-accent transition-colors"
                  >
                    <span>𝕏</span>
                    <span>Share Score</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => setShowReceipt(!showReceipt)}
                    className="flex items-center justify-center gap-1 rounded-md border border-muted/30 bg-surface px-3 py-2.5 font-mono text-xs text-muted hover:border-accent/40 hover:text-text transition-colors"
                  >
                    <span>{showReceipt ? "Hide" : "Receipt"}</span>
                  </button>
                </div>

                {/* Collapsible Post-Mortem Receipt */}
                {showReceipt && (
                  <div className="mt-3 text-left space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] text-muted uppercase">
                        Post-Mortem Receipt
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyReceipt}
                        className="font-mono text-xs text-accent hover:underline"
                      >
                        {copiedReceipt ? "✓ Copied!" : "Copy Receipt"}
                      </button>
                    </div>
                    <pre className="overflow-x-auto rounded-md bg-[#0e1017] p-3 font-mono text-[11px] leading-snug text-muted border border-muted/20">
                      {formatPostMortemReceipt(gameState)}
                    </pre>
                  </div>
                )}
              </div>
            ) : gameState.isSprintCompletedCelebration ? (
              /* --- SPRINT RETRO CELEBRATION VIEW --- */
              <div className="space-y-4 rounded-xl border border-good/40 bg-good/5 p-5 text-center">
                <span className="inline-block rounded-md bg-good/20 px-2.5 py-1 font-mono text-xs font-bold uppercase tracking-wider text-good">
                  🎉 Sprint {gameState.sprint - 1} Retrospective Passed!
                </span>
                <h3 className="font-mono text-lg sm:text-xl font-bold text-text">
                  Production Survived Another Iteration
                </h3>
                <p className="font-sans text-xs sm:text-sm text-text/80 leading-relaxed max-w-sm mx-auto">
                  All pull requests merged without bringing down the database.
                  The stakeholders are temporarily pacified with shiny charts.
                </p>
                <button
                  type="button"
                  onClick={handleContinueSprint}
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-accent px-6 py-2.5 font-mono text-sm font-bold text-base hover:bg-accent/90 active:scale-[0.98] transition-all shadow-md"
                >
                  <span>Continue to Sprint {gameState.sprint} →</span>
                </button>
              </div>
            ) : currentCard ? (
              /* --- ACTIVE CARD VIEW --- */
              <SprintCard
                card={currentCard}
                onChoose={handleChoice}
                onDragHoverChange={setHoverDirection}
              />
            ) : null}
          </main>

          {/* Footer Controls & Helpful Shortcuts */}
          <footer className="border-t border-muted/20 pt-2 flex items-center justify-between text-[11px] font-mono text-muted/70">
            <span className="hidden sm:inline">
              Controls: ← / A (Reject) · → / D (Accept)
            </span>
            <span className="sm:hidden">
              Swipe or tap options above
            </span>
            <span className="flex items-center gap-1">
              <span>Exit:</span>
              <kbd className="rounded border border-muted/30 bg-surface px-1 py-0.5 text-[10px]">
                Esc
              </kbd>
            </span>
          </footer>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

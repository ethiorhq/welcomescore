"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import BoardGrid from "./BoardGrid";
import Dice3D from "./Dice3D";
import AlgofoxSprite from "@/app/components/pet/AlgofoxSprite";
import { BOARD_TILES } from "@/lib/game/boardData";
import {
  createInitialBoardState,
  calculateMove,
  activateCoffeeBoost,
  formatBoardVictoryReceipt,
  getTileById,
} from "@/lib/game/boardEngine";
import type { BoardGameState, BoardTile } from "@/lib/game/boardTypes";
import {
  isSoundMuted,
  setSoundMuted,
  playDiceRollSound,
  playHopSound,
  playLadderRocketSound,
  playSnakeSlideSound,
  playVictoryCelebration,
} from "@/lib/game/gameAudio";

interface DevBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DevBoardModal({ isOpen, onClose }: DevBoardModalProps) {
  const [gameState, setGameState] = useState<BoardGameState>(() =>
    createInitialBoardState(),
  );
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [inspectedTile, setInspectedTile] = useState<BoardTile | null>(null);
  const [copiedReceipt, setCopiedReceipt] = useState<boolean>(false);

  // Sync mute state on mount
  useEffect(() => {
    setIsMuted(isSoundMuted());
  }, []);

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

  // Sound toggle
  const toggleSound = useCallback(() => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    setSoundMuted(nextMuted);
  }, [isMuted]);

  // Handle Roll Dice Action with Step-by-Step Hopping Animation
  const handleRollDice = useCallback(async () => {
    if (gameState.isRolling || gameState.isMoving || gameState.gameStatus === "won") {
      return;
    }

    // 1. Start dice rolling animation & sound
    setGameState((prev) => ({ ...prev, isRolling: true }));
    playDiceRollSound();

    // Wait for dice tumbling animation
    await new Promise((resolve) => setTimeout(resolve, 700));

    // 2. Calculate destination
    const calculation = calculateMove(gameState);

    setGameState((prev) => ({
      ...prev,
      isRolling: false,
      lastRoll: calculation.roll,
      isMoving: true,
    }));

    // 3. Step-by-step intermediate hopping along tiles
    for (const stepPos of calculation.intermediateTiles) {
      await new Promise((resolve) => setTimeout(resolve, 180));
      playHopSound();
      setGameState((prev) => ({
        ...prev,
        player: { ...prev.player, position: stepPos },
      }));
    }

    // Brief pause at landed tile
    await new Promise((resolve) => setTimeout(resolve, 350));

    // 4. Special tile transitions (Ladder Rocket or Snake Slide)
    if (calculation.isLadder) {
      playLadderRocketSound();
      await new Promise((resolve) => setTimeout(resolve, 400));
      setGameState((prev) => ({
        ...prev,
        player: { ...prev.player, position: calculation.finalTile.id },
      }));
    } else if (calculation.isSnake) {
      playSnakeSlideSound();
      await new Promise((resolve) => setTimeout(resolve, 400));
      setGameState((prev) => ({
        ...prev,
        player: { ...prev.player, position: calculation.finalTile.id },
      }));
    }

    // 5. Finalize state
    if (calculation.isVictory) {
      playVictoryCelebration();
    }

    setGameState((prev) => ({
      ...prev,
      player: calculation.nextPlayer,
      isMoving: false,
      doubleRollActive: false,
      gameStatus: calculation.isVictory ? "won" : "playing",
      historyLog: [...calculation.newLogs, ...prev.historyLog],
      activeTileEvent: calculation.finalTile,
    }));
  }, [gameState]);

  // Activate Coffee Boost
  const handleUseCoffee = useCallback(() => {
    setGameState((prev) => activateCoffeeBoost(prev));
  }, []);

  // Restart Board Run
  const handleRestart = useCallback(() => {
    setGameState(createInitialBoardState());
    setInspectedTile(null);
    setCopiedReceipt(false);
  }, []);

  // Copy Victory Receipt
  const handleCopyReceipt = useCallback(async () => {
    const receipt = formatBoardVictoryReceipt(gameState);
    try {
      await navigator.clipboard.writeText(receipt);
      setCopiedReceipt(true);
      setTimeout(() => setCopiedReceipt(false), 2500);
    } catch {}
  }, [gameState]);

  // Current tile details
  const currentTile = useMemo(() => {
    return getTileById(gameState.player.position);
  }, [gameState.player.position]);

  // Twitter Share Url
  const shareTwitterUrl = useMemo(() => {
    const text = encodeURIComponent(
      `🏆 I navigated bugs, ladders & coffee to reach $10B IPO Unicorn in ${gameState.player.turn} turns on Algofox: Sprint Quest!\n\nCan your repo survive to IPO? Play the Dev Board Game:`,
    );
    const url = encodeURIComponent("https://welcomescore.vercel.app");
    return `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
  }, [gameState.player.turn]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="boardgame-title"
        className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-base/85 backdrop-blur-md overflow-y-auto"
      >
        {/* Backdrop click to close */}
        <div className="fixed inset-0 -z-10" onClick={onClose} aria-hidden="true" />

        {/* Board Arena Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="relative w-full max-w-6xl rounded-2xl border border-muted/30 bg-[#0e1017] p-3 sm:p-5 shadow-2xl flex flex-col gap-3 my-auto max-h-[96vh] overflow-y-auto"
        >
          {/* Header Bar: Title, Stats HUD, Sound & Exit */}
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-muted/20 pb-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="text-2xl sm:text-3xl">🦊</span>
              <div>
                <h2
                  id="boardgame-title"
                  className="font-mono text-base sm:text-lg font-bold text-white flex items-center gap-2"
                >
                  <span>ALGOFOX: SPRINT QUEST</span>
                  <span className="rounded bg-accent/20 px-2 py-0.5 text-[10px] font-mono font-bold text-accent border border-accent/30">
                    BOARD GAME
                  </span>
                </h2>
                <p className="font-sans text-xs text-muted">
                  From <code className="text-accent font-mono">git init</code> to <code className="text-pink-400 font-mono">10B IPO Unicorn</code>
                </p>
              </div>
            </div>

            {/* Inventory & Stats Badges */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {/* Turn Badge */}
              <div className="flex items-center gap-1.5 rounded-lg border border-muted/30 bg-[#161825] px-2.5 py-1 text-xs font-mono font-bold text-white">
                <span className="text-muted text-[10px] uppercase">Turn</span>
                <span className="text-accent">{gameState.player.turn}</span>
              </div>

              {/* Stars Badge */}
              <div className="flex items-center gap-1.5 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-2.5 py-1 text-xs font-mono font-bold text-yellow-400">
                <span>⭐</span>
                <span>{gameState.player.stars.toLocaleString()}</span>
              </div>

              {/* Coffee Boost Button */}
              <button
                type="button"
                onClick={handleUseCoffee}
                disabled={gameState.player.coffee <= 0 || gameState.doubleRollActive}
                className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-mono font-bold transition-all ${
                  gameState.doubleRollActive
                    ? "border-accent bg-accent text-base animate-pulse shadow-[0_0_12px_#E8A23D]"
                    : gameState.player.coffee > 0
                    ? "border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 active:scale-95 cursor-pointer"
                    : "border-muted/20 bg-muted/5 text-muted cursor-not-allowed"
                }`}
                title="Spend 1 Coffee to Double (2x) your next dice roll movement!"
              >
                <span>☕</span>
                <span>{gameState.player.coffee}</span>
                <span className="text-[10px] uppercase tracking-wide">
                  {gameState.doubleRollActive ? "2X ACTIVE" : "Boost"}
                </span>
              </button>

              {/* Capital Badge */}
              <div className="hidden md:flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-mono font-bold text-emerald-400">
                <span>💰</span>
                <span>${(gameState.player.capital / 1000).toFixed(0)}k</span>
              </div>

              {/* Sound Toggle */}
              <button
                type="button"
                onClick={toggleSound}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-muted/30 bg-[#161825] text-xs text-muted hover:border-accent/40 hover:text-accent transition-colors"
                title={isMuted ? "Unmute Sound" : "Mute Sound"}
                aria-label={isMuted ? "Unmute Sound" : "Mute Sound"}
              >
                {isMuted ? "🔇" : "🔊"}
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-muted/30 bg-[#161825] font-mono text-sm text-muted hover:border-bad hover:bg-bad/10 hover:text-bad transition-colors"
                title="Exit Game (Esc)"
                aria-label="Exit Game"
              >
                ✕
              </button>
            </div>
          </header>

          {/* Main Stage Grid: Board Track (Left) & Controls/Feed (Right) */}
          <main className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 items-start">
            {/* Left 8 Columns: Serpentine Board Track */}
            <div className="lg:col-span-8 flex flex-col gap-2">
              <BoardGrid
                tiles={BOARD_TILES}
                playerPosition={gameState.player.position}
                isMoving={gameState.isMoving}
                onTileClick={(tile) => setInspectedTile(tile)}
              />

              {/* Tile Quick Guide Legend */}
              <div className="flex flex-wrap items-center justify-between text-[11px] font-mono text-muted/80 bg-[#141624] px-3 py-1.5 rounded-lg border border-muted/20">
                <span className="flex items-center gap-1">
                  <span className="text-amber-400">🚀</span> Ladder (Skip ahead)
                </span>
                <span className="flex items-center gap-1">
                  <span className="text-red-400">🐍</span> Bug Snake (Slither back)
                </span>
                <span className="flex items-center gap-1">
                  <span className="text-amber-300">☕</span> Coffee (2x Roll)
                </span>
                <span className="flex items-center gap-1">
                  <span className="text-pink-400">🦄</span> #36 IPO Finish
                </span>
                <span className="hidden sm:inline text-muted/60">
                  Click any tile to inspect
                </span>
              </div>
            </div>

            {/* Right 4 Columns: Interactive Dice + Companion + Terminal Log */}
            <div className="lg:col-span-4 flex flex-col gap-3">
              {/* Dice Roller Card */}
              <div className="rounded-xl border border-muted/30 bg-[#141624] p-4 flex flex-col items-center justify-center shadow-lg">
                <Dice3D
                  value={gameState.lastRoll}
                  isRolling={gameState.isRolling}
                  onRoll={handleRollDice}
                  disabled={gameState.isMoving || gameState.gameStatus === "won"}
                  doubleBoostActive={gameState.doubleRollActive}
                />
              </div>

              {/* Algofox Live Companion Card */}
              <div className="flex items-center gap-3 rounded-xl border border-muted/25 bg-[#141624] p-3 shadow-md">
                <div className="shrink-0">
                  <AlgofoxSprite
                    state={
                      gameState.gameStatus === "won"
                        ? "jumping"
                        : gameState.isMoving
                        ? "running"
                        : "idle"
                    }
                    size={46}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold text-accent uppercase">
                      Current Tile #{currentTile.id}
                    </span>
                    <span className="font-mono text-[10px] text-muted">
                      {currentTile.name}
                    </span>
                  </div>
                  <p className="font-sans text-xs text-white/90 leading-tight mt-1 line-clamp-2">
                    &ldquo;{currentTile.flavorQuote}&rdquo;
                  </p>
                </div>
              </div>

              {/* Real-time Dev Log Feed */}
              <div className="rounded-xl border border-muted/25 bg-[#10121d] p-3 flex flex-col shadow-inner">
                <div className="flex items-center justify-between border-b border-muted/20 pb-2 mb-2">
                  <span className="font-mono text-xs font-bold text-white flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-good animate-ping" />
                    <span>Dev Terminal Log</span>
                  </span>
                  <span className="font-mono text-[10px] text-muted">
                    {gameState.historyLog.length} events
                  </span>
                </div>

                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {gameState.historyLog.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-start gap-2 text-xs font-mono leading-tight bg-[#151726] p-2 rounded border border-muted/15"
                    >
                      <span className="text-sm shrink-0">{log.icon}</span>
                      <div className="flex-1 min-w-0">
                        {log.badge && (
                          <span className="mr-1.5 inline-block rounded bg-accent/20 px-1 text-[9px] font-bold text-accent">
                            {log.badge}
                          </span>
                        )}
                        <span className="text-white/90 break-words">{log.text}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </main>

          {/* Victory Modal Overlay when reaching Tile 36 */}
          {gameState.gameStatus === "won" && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-base/90 backdrop-blur-lg">
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="w-full max-w-md rounded-2xl border-2 border-pink-500/60 bg-[#161827] p-6 shadow-2xl text-center space-y-4"
              >
                <div className="inline-block rounded-full bg-pink-500/20 p-3 text-4xl shadow-inner">
                  🦄
                </div>

                <div className="space-y-1">
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-pink-400">
                    Nasdaq Bell Rang!
                  </span>
                  <h3 className="font-mono text-2xl font-bold text-white">
                    $10B IPO UNICORN!
                  </h3>
                  <p className="font-sans text-xs text-muted max-w-xs mx-auto">
                    You survived production bugs, AWS bills, and Friday deployments to build a legendary software empire!
                  </p>
                </div>

                {/* Score Summary Grid */}
                <div className="grid grid-cols-3 gap-2 border-y border-muted/20 py-3 font-mono text-xs">
                  <div>
                    <span className="block text-muted text-[10px] uppercase">Turns</span>
                    <span className="font-bold text-accent text-sm">
                      {gameState.player.turn}
                    </span>
                  </div>
                  <div>
                    <span className="block text-muted text-[10px] uppercase">Stars</span>
                    <span className="font-bold text-yellow-400 text-sm">
                      ⭐ {gameState.player.stars.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="block text-muted text-[10px] uppercase">Bugs Survived</span>
                    <span className="font-bold text-emerald-400 text-sm">
                      🐛 {gameState.player.bugsSquashed}
                    </span>
                  </div>
                </div>

                {/* Actions: Restart, Share, Copy Receipt */}
                <div className="flex flex-col gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleRestart}
                    className="w-full rounded-lg bg-accent py-2.5 font-mono text-sm font-bold text-base hover:bg-accent/90 active:scale-[0.98] transition-all shadow-md"
                  >
                    🔄 Play Another Run
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <a
                      href={shareTwitterUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1.5 rounded-lg border border-muted/30 bg-[#12141f] py-2 font-mono text-xs font-semibold text-white hover:border-accent hover:text-accent transition-colors"
                    >
                      <span>𝕏</span>
                      <span>Share Run</span>
                    </a>

                    <button
                      type="button"
                      onClick={handleCopyReceipt}
                      className="flex items-center justify-center gap-1.5 rounded-lg border border-muted/30 bg-[#12141f] py-2 font-mono text-xs text-muted hover:border-accent/40 hover:text-white transition-colors"
                    >
                      <span>{copiedReceipt ? "✓ Copied!" : "📋 Receipt"}</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}

          {/* Inspected Tile Popup Dialog */}
          {inspectedTile && (
            <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-base/60 backdrop-blur-sm">
              <div className="w-full max-w-sm rounded-xl border border-accent/40 bg-[#161827] p-5 shadow-2xl space-y-3">
                <div className="flex items-center justify-between border-b border-muted/20 pb-2">
                  <span className="flex items-center gap-2 font-mono text-sm font-bold text-white">
                    <span className="text-xl">{inspectedTile.icon}</span>
                    <span>#{inspectedTile.id} {inspectedTile.name}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setInspectedTile(null)}
                    className="h-6 w-6 rounded text-muted hover:text-white font-mono"
                  >
                    ✕
                  </button>
                </div>

                <p className="font-sans text-xs text-muted">
                  {inspectedTile.description}
                </p>

                <p className="font-sans text-xs italic text-accent bg-base/50 p-2.5 rounded border border-muted/20">
                  &ldquo;{inspectedTile.flavorQuote}&rdquo;
                </p>

                <div className="flex items-center justify-between text-xs font-mono pt-1 text-muted">
                  <span>Type: <strong className="text-white uppercase">{inspectedTile.type}</strong></span>
                  {inspectedTile.targetTile && (
                    <span className="text-accent font-bold">
                      Jumps to #{inspectedTile.targetTile}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setInspectedTile(null)}
                  className="w-full rounded bg-surface py-2 font-mono text-xs text-white hover:bg-muted/20 transition-colors"
                >
                  Close Inspection
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

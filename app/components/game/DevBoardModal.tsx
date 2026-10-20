"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import BoardGrid from "./BoardGrid";
import Dice3D from "./Dice3D";
import AlgofoxSprite from "@/app/components/pet/AlgofoxSprite";
import { BOARD_TILES } from "@/lib/game/boardData";
import {
  createInitialBoardState,
  calculatePlayerMove,
  shouldComputerUseBoost,
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
  const [movingPlayer, setMovingPlayer] = useState<"player" | "computer" | null>(
    null,
  );
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [inspectedTile, setInspectedTile] = useState<BoardTile | null>(null);
  const [copiedReceipt, setCopiedReceipt] = useState<boolean>(false);
  const gameStateRef = React.useRef(gameState);
  gameStateRef.current = gameState;

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

  // Handle Player Roll Dice
  const handleRollDice = useCallback(async () => {
    if (
      gameState.currentTurn !== "player" ||
      gameState.isRolling ||
      gameState.isMoving ||
      gameState.gameStatus === "won"
    ) {
      return;
    }

    // 1. Start dice rolling animation & sound
    setMovingPlayer("player");
    setGameState((prev) => ({ ...prev, isRolling: true }));
    playDiceRollSound();

    // Wait for dice tumbling animation
    await new Promise((resolve) => setTimeout(resolve, 700));

    // 2. Calculate destination
    const calculation = calculatePlayerMove(gameState, "player");

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
      winner: calculation.isVictory ? "player" : null,
      currentTurn: calculation.isVictory ? "player" : "computer",
      historyLog: [...calculation.newLogs, ...prev.historyLog],
      activeTileEvent: calculation.finalTile,
    }));
    setMovingPlayer(null);
  }, [gameState]);

  // Automated Computer AI Turn Trigger
  useEffect(() => {
    if (
      gameState.currentTurn !== "computer" ||
      gameState.isRolling ||
      gameState.isMoving ||
      gameState.gameStatus === "won" ||
      !isOpen
    ) {
      return;
    }

    let isMounted = true;

    const runComputerTurn = async () => {
      // 1. Thinking pause (~900ms)
      await new Promise((r) => setTimeout(r, 900));
      if (!isMounted) return;

      // 2. Decide if OctoBot should use coffee boost
      let currentSnapshot = gameStateRef.current;
      if (shouldComputerUseBoost(currentSnapshot.computer, currentSnapshot.player)) {
        currentSnapshot = activateCoffeeBoost(currentSnapshot, "computer");
        setGameState(currentSnapshot);
        await new Promise((r) => setTimeout(r, 450));
        if (!isMounted) return;
      }

      // 3. Roll dice
      setMovingPlayer("computer");
      setGameState((prev) => ({ ...prev, isRolling: true }));
      playDiceRollSound();

      await new Promise((r) => setTimeout(r, 700));
      if (!isMounted) return;

      const calc = calculatePlayerMove(currentSnapshot, "computer");

      setGameState((prev) => ({
        ...prev,
        isRolling: false,
        lastRoll: calc.roll,
        isMoving: true,
      }));

      // 4. Intermediate hops
      for (const stepPos of calc.intermediateTiles) {
        await new Promise((r) => setTimeout(r, 180));
        if (!isMounted) return;
        playHopSound();
        setGameState((prev) => ({
          ...prev,
          computer: { ...prev.computer, position: stepPos },
        }));
      }

      await new Promise((r) => setTimeout(r, 350));
      if (!isMounted) return;

      // 5. Ladder / snake
      if (calc.isLadder) {
        playLadderRocketSound();
        await new Promise((r) => setTimeout(r, 400));
        if (!isMounted) return;
        setGameState((prev) => ({
          ...prev,
          computer: { ...prev.computer, position: calc.finalTile.id },
        }));
      } else if (calc.isSnake) {
        playSnakeSlideSound();
        await new Promise((r) => setTimeout(r, 400));
        if (!isMounted) return;
        setGameState((prev) => ({
          ...prev,
          computer: { ...prev.computer, position: calc.finalTile.id },
        }));
      }

      // 6. Victory check
      if (calc.isVictory) {
        playVictoryCelebration();
      }

      setGameState((prev) => ({
        ...prev,
        computer: calc.nextPlayer,
        isMoving: false,
        computerDoubleBoost: false,
        gameStatus: calc.isVictory ? "won" : "playing",
        winner: calc.isVictory ? "computer" : prev.winner,
        currentTurn: calc.isVictory ? "computer" : "player",
        historyLog: [...calc.newLogs, ...prev.historyLog],
      }));
      setMovingPlayer(null);
    };

    void runComputerTurn();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    gameState.currentTurn,
    gameState.isRolling,
    gameState.isMoving,
    gameState.gameStatus,
    isOpen,
  ]);

  // Activate Coffee Boost for player
  const handleUseCoffee = useCallback(() => {
    setGameState((prev) => activateCoffeeBoost(prev, "player"));
  }, []);

  // Restart Board Run
  const handleRestart = useCallback(() => {
    setGameState(createInitialBoardState());
    setMovingPlayer(null);
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
    const isPlayerWin = gameState.winner === "player";
    const text = encodeURIComponent(
      isPlayerWin
        ? `🏆 I defeated OctoBot AI in a 1v1 startup race to $10B IPO Unicorn in ${gameState.player.turn} turns on Algofox: Sprint Quest!\n\nCan your repo beat the AI? Play the Dev Board Game:`
        : `🐙 OctoBot AI beat me to IPO on Algofox: Sprint Quest! Time for a rematch!\n\nTest your startup survival skills:`,
    );
    const url = encodeURIComponent("https://welcomescore.vercel.app");
    return `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
  }, [gameState.winner, gameState.player.turn]);

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
          {/* Header Bar: Title, 1v1 Turn Banner, Stats, Sound & Exit */}
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
                    1v1 vs OctoBot AI
                  </span>
                </h2>
                <p className="font-sans text-xs text-muted">
                  Race your AI rival to the <code className="text-pink-400 font-mono">10B IPO Unicorn</code> finish line!
                </p>
              </div>
            </div>

            {/* Active Turn Status Banner */}
            <div className="flex items-center gap-2">
              {gameState.currentTurn === "player" ? (
                <div className="rounded-full bg-accent/20 border border-accent/60 px-3 py-1 font-mono text-xs font-bold text-accent flex items-center gap-1.5 shadow-[0_0_12px_rgba(232,162,61,0.3)] animate-pulse">
                  <span>🦊</span>
                  <span>YOUR TURN</span>
                </div>
              ) : (
                <div className="rounded-full bg-purple-500/20 border border-purple-500/60 px-3 py-1 font-mono text-xs font-bold text-purple-300 flex items-center gap-1.5 shadow-[0_0_12px_rgba(168,85,247,0.3)] animate-pulse">
                  <span>🐙</span>
                  <span>OCTOBOT AI THINKING...</span>
                </div>
              )}
            </div>

            {/* 1v1 Player vs Computer Stats Badges */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {/* User Algofox Badge */}
              <div className="flex items-center gap-1.5 rounded-lg border border-accent/40 bg-accent/10 px-2.5 py-1 text-xs font-mono font-bold text-accent">
                <span>🦊 You:</span>
                <span className="text-white">Tile #{gameState.player.position}</span>
              </div>

              {/* Computer OctoBot Badge */}
              <div className="flex items-center gap-1.5 rounded-lg border border-purple-500/40 bg-purple-500/10 px-2.5 py-1 text-xs font-mono font-bold text-purple-300">
                <span>🐙 Bot:</span>
                <span className="text-white">Tile #{gameState.computer.position}</span>
              </div>

              {/* Coffee Boost Button for User */}
              <button
                type="button"
                onClick={handleUseCoffee}
                disabled={
                  gameState.player.coffee <= 0 ||
                  gameState.doubleRollActive ||
                  gameState.currentTurn !== "player"
                }
                className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-mono font-bold transition-all ${
                  gameState.doubleRollActive
                    ? "border-accent bg-accent text-base animate-pulse shadow-[0_0_12px_#E8A23D]"
                    : gameState.player.coffee > 0 && gameState.currentTurn === "player"
                    ? "border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 active:scale-95 cursor-pointer"
                    : "border-muted/20 bg-muted/5 text-muted cursor-not-allowed"
                }`}
                title="Spend 1 Coffee to Double (2x) your next dice roll movement!"
              >
                <span>☕</span>
                <span>{gameState.player.coffee}</span>
                <span className="text-[10px] uppercase tracking-wide">
                  {gameState.doubleRollActive ? "2X READY" : "Boost"}
                </span>
              </button>

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
            {/* Left 8 Columns: Serpentine Board Track with Dual Pawns */}
            <div className="lg:col-span-8 flex flex-col gap-2">
              <BoardGrid
                tiles={BOARD_TILES}
                playerPosition={gameState.player.position}
                computerPosition={gameState.computer.position}
                isMoving={gameState.isMoving}
                movingPlayer={movingPlayer}
                onTileClick={(tile) => setInspectedTile(tile)}
              />

              {/* Tile Quick Guide Legend */}
              <div className="flex flex-wrap items-center justify-between text-[11px] font-mono text-muted/80 bg-[#141624] px-3 py-1.5 rounded-lg border border-muted/20">
                <span className="flex items-center gap-1">
                  <span className="text-amber-400 font-bold">🦊 Algofox (You)</span> vs{" "}
                  <span className="text-purple-400 font-bold">🐙 OctoBot AI</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="text-amber-400">🚀</span> Ladder ·{" "}
                  <span className="text-red-400">🐍</span> Bug ·{" "}
                  <span className="text-pink-400">🦄</span> #36 Finish
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
                  disabled={
                    gameState.currentTurn !== "player" ||
                    gameState.isMoving ||
                    gameState.gameStatus === "won"
                  }
                  doubleBoostActive={gameState.doubleRollActive}
                />
              </div>

              {/* Algofox Live Companion Card */}
              <div className="flex items-center gap-3 rounded-xl border border-muted/25 bg-[#141624] p-3 shadow-md">
                <div className="shrink-0">
                  <AlgofoxSprite
                    state={
                      gameState.gameStatus === "won" && gameState.winner === "player"
                        ? "jumping"
                        : gameState.isMoving && movingPlayer === "player"
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
                    <span>Live 1v1 Match Feed</span>
                  </span>
                  <span className="font-mono text-[10px] text-muted">
                    {gameState.historyLog.length} events
                  </span>
                </div>

                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {gameState.historyLog.map((log) => (
                    <div
                      key={log.id}
                      className={`flex items-start gap-2 text-xs font-mono leading-tight p-2 rounded border ${
                        log.playerType === "computer"
                          ? "bg-[#181528] border-purple-500/25 text-purple-200"
                          : "bg-[#151726] border-muted/15 text-white/90"
                      }`}
                    >
                      <span className="text-sm shrink-0">{log.icon}</span>
                      <div className="flex-1 min-w-0">
                        {log.badge && (
                          <span
                            className={`mr-1.5 inline-block rounded px-1 text-[9px] font-bold ${
                              log.playerType === "computer"
                                ? "bg-purple-500/25 text-purple-300"
                                : "bg-accent/20 text-accent"
                            }`}
                          >
                            {log.badge}
                          </span>
                        )}
                        <span className="break-words">{log.text}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </main>

          {/* Victory / Defeat Modal Overlay when someone reaches Tile 36 */}
          {gameState.gameStatus === "won" && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-base/90 backdrop-blur-lg">
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className={`w-full max-w-md rounded-2xl border-2 p-6 shadow-2xl text-center space-y-4 ${
                  gameState.winner === "player"
                    ? "border-pink-500/60 bg-[#161827]"
                    : "border-purple-500/60 bg-[#161426]"
                }`}
              >
                <div className="inline-block rounded-full bg-pink-500/20 p-3 text-4xl shadow-inner">
                  {gameState.winner === "player" ? "🏆" : "🤖"}
                </div>

                <div className="space-y-1">
                  <span
                    className={`font-mono text-xs font-bold uppercase tracking-wider ${
                      gameState.winner === "player" ? "text-pink-400" : "text-purple-400"
                    }`}
                  >
                    {gameState.winner === "player" ? "Victory! Nasdaq Bell Rang!" : "Defeat! OctoBot AI IPO'd First!"}
                  </span>
                  <h3 className="font-mono text-2xl font-bold text-white">
                    {gameState.winner === "player"
                      ? "YOU WON THE 1v1 RACE!"
                      : "OCTOBOT TOOK THE UNICORN!"}
                  </h3>
                  <p className="font-sans text-xs text-muted max-w-xs mx-auto">
                    {gameState.winner === "player"
                      ? "You outmaneuvered OctoBot AI through production bugs, AWS bills, and coffee boosts to ring the IPO bell first!"
                      : "OctoBot AI successfully automated its way to $10B IPO valuation first. Ready for a rematch?"}
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
                    <span className="block text-muted text-[10px] uppercase">Rival Finish</span>
                    <span className="font-bold text-purple-400 text-sm">
                      Tile #{gameState.computer.position}
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
                    🔄 Rematch vs OctoBot AI
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <a
                      href={shareTwitterUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1.5 rounded-lg border border-muted/30 bg-[#12141f] py-2 font-mono text-xs font-semibold text-white hover:border-accent hover:text-accent transition-colors"
                    >
                      <span>𝕏</span>
                      <span>Share Match</span>
                    </a>

                    <button
                      type="button"
                      onClick={handleCopyReceipt}
                      className="flex items-center justify-center gap-1.5 rounded-lg border border-muted/30 bg-[#12141f] py-2 font-mono text-xs text-muted hover:border-accent/40 hover:text-white transition-colors"
                    >
                      <span>{copiedReceipt ? "✓ Copied!" : "📋 Match Receipt"}</span>
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

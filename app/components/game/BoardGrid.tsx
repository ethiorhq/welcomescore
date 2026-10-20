"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import type { BoardTile } from "@/lib/game/boardTypes";
import AlgofoxSprite from "@/app/components/pet/AlgofoxSprite";

interface BoardGridProps {
  tiles: BoardTile[];
  playerPosition: number;
  computerPosition: number;
  isMoving?: boolean;
  movingPlayer?: "player" | "computer" | null;
  onTileClick?: (tile: BoardTile) => void;
}

export default function BoardGrid({
  tiles,
  playerPosition,
  computerPosition,
  isMoving = false,
  movingPlayer = null,
  onTileClick,
}: BoardGridProps) {
  // Build the 6x6 serpentine 2D array
  const gridRows = useMemo(() => {
    const rows: BoardTile[][] = [];
    for (let r = 0; r < 6; r++) {
      const rowTiles: BoardTile[] = [];
      if (r % 2 === 0) {
        // Left to right
        for (let c = 1; c <= 6; c++) {
          const id = r * 6 + c;
          const tile = tiles.find((t) => t.id === id);
          if (tile) rowTiles.push(tile);
        }
      } else {
        // Right to left
        for (let c = 6; c >= 1; c--) {
          const id = r * 6 + c;
          const tile = tiles.find((t) => t.id === id);
          if (tile) rowTiles.push(tile);
        }
      }
      rows.push(rowTiles);
    }
    return rows;
  }, [tiles]);

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-muted/30 bg-[#0e1019] p-2 sm:p-4 shadow-2xl">
      {/* Background circuit grid pattern */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#1f2438_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />

      {/* 6x6 Board Grid */}
      <div className="relative grid grid-rows-6 gap-2 sm:gap-2.5">
        {gridRows.map((row, rowIndex) => (
          <div key={`row-${rowIndex}`} className="grid grid-cols-6 gap-2 sm:gap-2.5">
            {row.map((tile) => {
              const isPlayerHere = playerPosition === tile.id;
              const isComputerHere = computerPosition === tile.id;
              const isLadder = tile.type === "ladder";
              const isSnake = tile.type === "snake";
              const isFinish = tile.type === "finish";
              const isStart = tile.type === "start";

              // Distinct border & glow styling
              let tileTheme = "border-muted/20 bg-[#161826] hover:border-muted/40";
              if (isStart) {
                tileTheme = "border-good/60 bg-good/10 shadow-[0_0_12px_rgba(34,197,94,0.15)]";
              } else if (isFinish) {
                tileTheme = "border-pink-500 bg-pink-500/15 shadow-[0_0_15px_rgba(236,72,153,0.3)] animate-pulse";
              } else if (isLadder) {
                tileTheme = "border-amber-500/60 bg-amber-500/10 shadow-[0_0_10px_rgba(245,158,11,0.2)]";
              } else if (isSnake) {
                tileTheme = "border-red-500/60 bg-red-500/10 shadow-[0_0_10px_rgba(239,68,68,0.2)]";
              } else if (tile.type === "coffee") {
                tileTheme = "border-amber-600/40 bg-amber-600/10";
              } else if (tile.type === "star") {
                tileTheme = "border-yellow-500/40 bg-yellow-500/10";
              }

              return (
                <div
                  key={tile.id}
                  onClick={() => onTileClick?.(tile)}
                  className={`group relative flex flex-col justify-between rounded-lg border p-1.5 sm:p-2.5 text-left transition-all duration-200 cursor-pointer select-none min-h-[64px] sm:min-h-[84px] md:min-h-[96px] ${tileTheme} ${
                    isPlayerHere ? "ring-2 ring-accent ring-offset-1 ring-offset-[#0e1019]" : ""
                  } ${isComputerHere ? "ring-2 ring-purple-500 ring-offset-1 ring-offset-[#0e1019]" : ""}`}
                >
                  {/* Top Bar: Tile # and Special Badge */}
                  <div className="flex items-center justify-between w-full">
                    <span className="font-mono text-[9px] sm:text-[10px] font-bold text-muted/80">
                      #{String(tile.id).padStart(2, "0")}
                    </span>

                    {/* Special tile destination chip */}
                    {isLadder && (
                      <span className="rounded bg-amber-500/20 px-1 py-0.2 font-mono text-[8px] sm:text-[9px] font-bold text-amber-400">
                        ➔ {tile.targetTile}
                      </span>
                    )}
                    {isSnake && (
                      <span className="rounded bg-red-500/20 px-1 py-0.2 font-mono text-[8px] sm:text-[9px] font-bold text-red-400">
                        ➔ {tile.targetTile}
                      </span>
                    )}
                    {isFinish && (
                      <span className="rounded bg-pink-500/30 px-1 py-0.2 font-mono text-[8px] sm:text-[9px] font-bold text-pink-300">
                        IPO
                      </span>
                    )}
                  </div>

                  {/* Tile Icon and Name */}
                  <div className="my-auto flex flex-col items-center sm:items-start text-center sm:text-left">
                    <span className="text-base sm:text-xl leading-none">
                      {tile.icon}
                    </span>
                    <span className="hidden sm:inline-block font-sans text-[11px] font-bold leading-tight text-white mt-1 line-clamp-1">
                      {tile.name}
                    </span>
                  </div>

                  {/* Tile Subtext / Delta Badge */}
                  <div className="hidden sm:flex items-center justify-between text-[9px] font-mono text-muted/90 border-t border-muted/15 pt-1">
                    {tile.starsDelta ? (
                      <span className="text-good font-bold">
                        +{tile.starsDelta}★
                      </span>
                    ) : tile.coffeeDelta ? (
                      <span className="text-amber-400 font-bold">
                        {tile.coffeeDelta > 0 ? `+${tile.coffeeDelta}` : tile.coffeeDelta}☕
                      </span>
                    ) : (
                      <span className="text-muted/60">{tile.type}</span>
                    )}
                  </div>

                  {/* PLAYER & COMPUTER TOKENS OVERLAY */}
                  {(isPlayerHere || isComputerHere) && (
                    <div className="absolute inset-0 z-30 flex items-center justify-center gap-1.5 p-1 rounded-lg bg-black/45 backdrop-blur-[1px]">
                      {isPlayerHere && (
                        <motion.div
                          animate={
                            isMoving && movingPlayer === "player"
                              ? { y: [-6, 0], scale: [1.15, 0.95, 1] }
                              : { y: [0, -2, 0] }
                          }
                          transition={{
                            repeat: Infinity,
                            duration: isMoving && movingPlayer === "player" ? 0.2 : 1.6,
                            ease: "easeInOut",
                          }}
                          className="flex flex-col items-center"
                          title="Algofox (You)"
                        >
                          <div className="rounded-full bg-accent/25 p-0.5 shadow-[0_0_10px_#E8A23D]">
                            <AlgofoxSprite
                              state={isMoving && movingPlayer === "player" ? "running" : "idle"}
                              size={isComputerHere ? 24 : 32}
                            />
                          </div>
                          <span className="rounded bg-accent px-1 py-0.2 text-[7px] sm:text-[8px] font-mono font-bold text-base shadow">
                            YOU
                          </span>
                        </motion.div>
                      )}

                      {isComputerHere && (
                        <motion.div
                          animate={
                            isMoving && movingPlayer === "computer"
                              ? { y: [-6, 0], scale: [1.15, 0.95, 1] }
                              : { y: [0, -2, 0] }
                          }
                          transition={{
                            repeat: Infinity,
                            duration: isMoving && movingPlayer === "computer" ? 0.2 : 1.6,
                            ease: "easeInOut",
                          }}
                          className="flex flex-col items-center"
                          title="OctoBot AI (Computer Rival)"
                        >
                          <div className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full border border-purple-400 bg-purple-900/80 text-xs sm:text-sm shadow-[0_0_10px_#A855F7]">
                            🐙
                          </div>
                          <span className="rounded bg-purple-600 px-1 py-0.2 text-[7px] sm:text-[8px] font-mono font-bold text-white shadow">
                            BOT
                          </span>
                        </motion.div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

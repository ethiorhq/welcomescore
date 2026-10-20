import type {
  BoardGameState,
  BoardTile,
  LogEntry,
  PlayerStats,
} from "./boardTypes";
import { BOARD_TILES } from "./boardData";

export const INITIAL_PLAYER_STATS: PlayerStats = {
  name: "Algofox",
  avatar: "🦊",
  position: 1,
  stars: 100,
  coffee: 2,
  capital: 100000,
  turn: 1,
  bugsSquashed: 0,
};

export const INITIAL_COMPUTER_STATS: PlayerStats = {
  name: "OctoBot AI",
  avatar: "🐙",
  position: 1,
  stars: 100,
  coffee: 2,
  capital: 100000,
  turn: 1,
  bugsSquashed: 0,
};

export function getTileById(id: number): BoardTile {
  return BOARD_TILES[id - 1] || BOARD_TILES[0];
}

export function createInitialBoardState(): BoardGameState {
  const initialLog: LogEntry = {
    id: "init-0",
    turn: 1,
    text: "Game initialized! Algofox 🦊 vs OctoBot AI 🐙 in the race to $10B IPO Unicorn!",
    icon: "🌱",
    badge: "START",
  };

  return {
    player: { ...INITIAL_PLAYER_STATS },
    computer: { ...INITIAL_COMPUTER_STATS },
    currentTurn: "player",
    isRolling: false,
    lastRoll: null,
    isMoving: false,
    activeTileEvent: null,
    gameStatus: "playing",
    winner: null,
    historyLog: [initialLog],
    doubleRollActive: false,
    computerDoubleBoost: false,
  };
}

export function rollDiceValue(): number {
  return Math.floor(Math.random() * 6) + 1;
}

export type MoveCalculationResult = {
  roll: number;
  intermediateTiles: number[];
  landedTile: BoardTile;
  finalTile: BoardTile;
  isLadder: boolean;
  isSnake: boolean;
  nextPlayer: PlayerStats;
  newLogs: LogEntry[];
  isVictory: boolean;
};

export function calculatePlayerMove(
  currentState: BoardGameState,
  target: "player" | "computer",
  forcedRoll?: number,
): MoveCalculationResult {
  const targetPlayer = target === "player" ? currentState.player : currentState.computer;
  const isBoosted = target === "player" ? currentState.doubleRollActive : currentState.computerDoubleBoost;

  const baseRoll = forcedRoll !== undefined ? forcedRoll : rollDiceValue();
  const effectiveRoll = isBoosted ? baseRoll * 2 : baseRoll;

  const currentPos = targetPlayer.position;
  const targetPos = Math.min(36, currentPos + effectiveRoll);

  // Generate intermediate tiles for hopping animation
  const intermediateTiles: number[] = [];
  for (let p = currentPos + 1; p <= targetPos; p++) {
    intermediateTiles.push(p);
  }

  const landedTile = getTileById(targetPos);
  let finalTile = landedTile;
  let isLadder = false;
  let isSnake = false;

  // Check for ladders and snakes
  if (landedTile.type === "ladder" && landedTile.targetTile) {
    isLadder = true;
    finalTile = getTileById(landedTile.targetTile);
  } else if (landedTile.type === "snake" && landedTile.targetTile) {
    isSnake = true;
    finalTile = getTileById(landedTile.targetTile);
  }

  // Calculate stats deltas
  const starsGained = (landedTile.starsDelta || 0) + (isLadder ? 50 : 0);
  const coffeeGained = landedTile.coffeeDelta || 0;
  const capitalGained = landedTile.capitalDelta || 0;
  const bugsGained = isSnake ? 1 : 0;

  const nextPlayer: PlayerStats = {
    ...targetPlayer,
    position: finalTile.id,
    stars: Math.max(0, targetPlayer.stars + starsGained),
    coffee: Math.max(0, targetPlayer.coffee + coffeeGained),
    capital: Math.max(0, targetPlayer.capital + capitalGained),
    turn: targetPlayer.turn + 1,
    bugsSquashed: targetPlayer.bugsSquashed + bugsGained,
  };

  const newLogs: LogEntry[] = [];
  const tag = target === "player" ? "Algofox 🦊" : "OctoBot 🐙";

  // Log 1: Roll result
  newLogs.push({
    id: `roll-${target}-${targetPlayer.turn}-${Date.now()}`,
    turn: targetPlayer.turn,
    text: `[${tag}] Rolled a ${baseRoll}${isBoosted ? " (x2 Boost = " + effectiveRoll + ")" : ""} ➔ Advanced to [Tile ${targetPos}] ${landedTile.name}`,
    icon: target === "player" ? "🎲" : "🤖",
    badge: `${tag.toUpperCase()} ROLL ${baseRoll}`,
    playerType: target,
  });

  // Log 2: Special event (ladder / snake / finish)
  if (isLadder && landedTile.targetTile) {
    newLogs.push({
      id: `ladder-${target}-${targetPlayer.turn}-${Date.now()}`,
      turn: targetPlayer.turn,
      text: `🚀 [${tag}] ROCKET BOOST! Zoomed ahead to [Tile ${landedTile.targetTile}]!`,
      icon: "🚀",
      badge: "LADDER",
      playerType: target,
    });
  } else if (isSnake && landedTile.targetTile) {
    newLogs.push({
      id: `snake-${target}-${targetPlayer.turn}-${Date.now()}`,
      turn: targetPlayer.turn,
      text: `🐛 [${tag}] CRITICAL BUG! Slithered back to [Tile ${landedTile.targetTile}]!`,
      icon: "🐍",
      badge: "SNAKE",
      playerType: target,
    });
  }

  const isVictory = finalTile.id === 36;
  if (isVictory) {
    newLogs.push({
      id: `win-${target}-${targetPlayer.turn}-${Date.now()}`,
      turn: targetPlayer.turn,
      text: `🏆 [${tag}] UNICORN REACHED! First to ring the Nasdaq bell at $10B IPO!`,
      icon: "🦄",
      badge: "VICTORY",
      playerType: target,
    });
  }

  return {
    roll: baseRoll,
    intermediateTiles,
    landedTile,
    finalTile,
    isLadder,
    isSnake,
    nextPlayer,
    newLogs,
    isVictory,
  };
}

// Backwards-compatible calculateMove for player
export function calculateMove(
  currentState: BoardGameState,
  forcedRoll?: number,
): MoveCalculationResult {
  return calculatePlayerMove(currentState, "player", forcedRoll);
}

// AI decision logic: should OctoBot spend an espresso cup?
export function shouldComputerUseBoost(
  computerStats: PlayerStats,
  playerStats: PlayerStats,
): boolean {
  if (computerStats.coffee <= 0) return false;

  // If close to IPO finish line (within 12 tiles)
  if (computerStats.position >= 24) return true;

  // If falling behind user by 4 or more tiles
  if (playerStats.position - computerStats.position >= 4) return true;

  // If a ladder is within reach of 2x roll (tile 4, 14, 24)
  const distToLadder4 = 4 - computerStats.position;
  const distToLadder14 = 14 - computerStats.position;
  const distToLadder24 = 24 - computerStats.position;

  if (
    (distToLadder4 > 0 && distToLadder4 <= 12) ||
    (distToLadder14 > 0 && distToLadder14 <= 12) ||
    (distToLadder24 > 0 && distToLadder24 <= 12)
  ) {
    return Math.random() > 0.4;
  }

  return false;
}

export function activateCoffeeBoost(
  state: BoardGameState,
  target: "player" | "computer" = "player",
): BoardGameState {
  if (target === "player") {
    if (state.player.coffee <= 0 || state.doubleRollActive) return state;

    const boostLog: LogEntry = {
      id: `boost-p-${Date.now()}`,
      turn: state.player.turn,
      text: "☕ Algofox Espresso Boost Activated! Next roll will be DOUBLED (2x)!",
      icon: "⚡",
      badge: "2x BOOST",
      playerType: "player",
    };

    return {
      ...state,
      player: {
        ...state.player,
        coffee: state.player.coffee - 1,
      },
      doubleRollActive: true,
      historyLog: [boostLog, ...state.historyLog],
    };
  } else {
    if (state.computer.coffee <= 0 || state.computerDoubleBoost) return state;

    const boostLog: LogEntry = {
      id: `boost-c-${Date.now()}`,
      turn: state.computer.turn,
      text: "🤖 OctoBot AI activated Overclocked Espresso! Next roll DOUBLED (2x)!",
      icon: "⚡",
      badge: "OCTOBOT 2x",
      playerType: "computer",
    };

    return {
      ...state,
      computer: {
        ...state.computer,
        coffee: state.computer.coffee - 1,
      },
      computerDoubleBoost: true,
      historyLog: [boostLog, ...state.historyLog],
    };
  }
}

export function formatBoardVictoryReceipt(state: BoardGameState): string {
  const isPlayerWinner = state.winner === "player";
  const winnerTitle = isPlayerWinner
    ? "VICTORY: ALGOFOX REACHED IPO!"
    : "DEFEAT: OCTOBOT AI REACHED IPO FIRST!";

  return [
    "=========================================",
    "       ALGOFOX: SPRINT QUEST (IPO)       ",
    "        1v1 STARTUP FOUNDER RACE         ",
    "=========================================",
    `Outcome:         ${winnerTitle}`,
    `Algofox Tile:    Tile ${state.player.position} of 36`,
    `OctoBot Tile:    Tile ${state.computer.position} of 36`,
    "-----------------------------------------",
    `Algofox Stars:   ⭐ ${state.player.stars.toLocaleString()}`,
    `Algofox Capital: 💰 $${state.player.capital.toLocaleString()}`,
    `Turns Elapsed:   ${state.player.turn} Turns`,
    "-----------------------------------------",
    `Verdict:         ${
      isPlayerWinner
        ? "You outmaneuvered the AI bot to IPO! 🦊🚀"
        : "OctoBot AI IPO'd first! Time for a rematch! 🐙⚡"
    }`,
    "=========================================",
    "Play 1v1 on https://welcomescore.vercel.app",
  ].join("\n");
}

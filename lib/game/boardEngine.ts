import type {
  BoardGameState,
  BoardTile,
  LogEntry,
  PlayerStats,
} from "./boardTypes";
import { BOARD_TILES } from "./boardData";

export const INITIAL_PLAYER_STATS: PlayerStats = {
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
    text: "Game initialized at 'git init'. Roll the dice to begin your journey to IPO!",
    icon: "🌱",
    badge: "START",
  };

  return {
    player: { ...INITIAL_PLAYER_STATS },
    isRolling: false,
    lastRoll: null,
    isMoving: false,
    activeTileEvent: null,
    gameStatus: "playing",
    historyLog: [initialLog],
    doubleRollActive: false,
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

export function calculateMove(
  currentState: BoardGameState,
  forcedRoll?: number,
): MoveCalculationResult {
  const baseRoll = forcedRoll !== undefined ? forcedRoll : rollDiceValue();
  const effectiveRoll = currentState.doubleRollActive ? baseRoll * 2 : baseRoll;

  const currentPos = currentState.player.position;
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
    position: finalTile.id,
    stars: Math.max(0, currentState.player.stars + starsGained),
    coffee: Math.max(0, currentState.player.coffee + coffeeGained),
    capital: Math.max(0, currentState.player.capital + capitalGained),
    turn: currentState.player.turn + 1,
    bugsSquashed: currentState.player.bugsSquashed + bugsGained,
  };

  const newLogs: LogEntry[] = [];

  // Log 1: Roll result
  newLogs.push({
    id: `roll-${currentState.player.turn}-${Date.now()}`,
    turn: currentState.player.turn,
    text: `Rolled a ${baseRoll}${currentState.doubleRollActive ? " (x2 Boost = " + effectiveRoll + ")" : ""} ➔ Advanced to [Tile ${targetPos}] ${landedTile.name}`,
    icon: "🎲",
    badge: `ROLL ${baseRoll}`,
  });

  // Log 2: Special event (ladder / snake / finish)
  if (isLadder && landedTile.targetTile) {
    newLogs.push({
      id: `ladder-${currentState.player.turn}-${Date.now()}`,
      turn: currentState.player.turn,
      text: `🚀 ROCKET BOOST! ${landedTile.flavorQuote} ➔ Zoomed to [Tile ${landedTile.targetTile}]!`,
      icon: "🚀",
      badge: "LADDER",
    });
  } else if (isSnake && landedTile.targetTile) {
    newLogs.push({
      id: `snake-${currentState.player.turn}-${Date.now()}`,
      turn: currentState.player.turn,
      text: `🐛 CRITICAL BUG! ${landedTile.flavorQuote} ➔ Slithered back to [Tile ${landedTile.targetTile}]!`,
      icon: "🐍",
      badge: "SNAKE",
    });
  }

  const isVictory = finalTile.id === 36;
  if (isVictory) {
    newLogs.push({
      id: `win-${currentState.player.turn}-${Date.now()}`,
      turn: currentState.player.turn,
      text: `🏆 UNICORN STATUS REACHED! Nasdaq ringing bell at $10B IPO valuation!`,
      icon: "🦄",
      badge: "VICTORY",
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

export function activateCoffeeBoost(state: BoardGameState): BoardGameState {
  if (state.player.coffee <= 0 || state.doubleRollActive) return state;

  const boostLog: LogEntry = {
    id: `boost-${Date.now()}`,
    turn: state.player.turn,
    text: "☕ Espresso Boost Activated! Next dice roll movement will be DOUBLED (2x)!",
    icon: "⚡",
    badge: "2x BOOST",
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
}

export function formatBoardVictoryReceipt(state: BoardGameState): string {
  return [
    "=========================================",
    "       ALGOFOX: SPRINT QUEST (IPO)       ",
    "         THE UNICORN BOARD GAME          ",
    "=========================================",
    `Valuation:       $10,000,000,000 (IPO UNICORN)`,
    `Turns to IPO:    ${state.player.turn} Turns`,
    `GitHub Stars:    ⭐ ${state.player.stars.toLocaleString()}`,
    `Venture Capital: 💰 $${state.player.capital.toLocaleString()}`,
    `Bugs Survived:   🐛 ${state.player.bugsSquashed}`,
    "-----------------------------------------",
    `Status:          LEGENDARY TECH FOUNDER`,
    `Verdict:         Algofox approves this unicorn build! 🦊🚀`,
    "=========================================",
    "Play the Dev Board Game on https://welcomescore.vercel.app",
  ].join("\n");
}

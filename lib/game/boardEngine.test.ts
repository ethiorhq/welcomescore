import { describe, expect, it } from "vitest";
import {
  activateCoffeeBoost,
  calculateMove,
  calculatePlayerMove,
  createInitialBoardState,
  formatBoardVictoryReceipt,
  getTileById,
  shouldComputerUseBoost,
} from "./boardEngine";
import { BOARD_TILES } from "./boardData";

describe("Algofox: Sprint Quest Board Game Engine (1v1 vs OctoBot AI)", () => {
  it("initializes board state with 36 tiles and proper starting stats for both players", () => {
    expect(BOARD_TILES.length).toBe(36);
    expect(BOARD_TILES[0].name).toBe("git init");
    expect(BOARD_TILES[35].name).toBe("🦄 $10B IPO UNICORN!");

    const state = createInitialBoardState();
    expect(state.player.position).toBe(1);
    expect(state.player.name).toBe("Algofox");
    expect(state.computer.position).toBe(1);
    expect(state.computer.name).toBe("OctoBot AI");
    expect(state.currentTurn).toBe("player");
    expect(state.gameStatus).toBe("playing");
  });

  it("advances position correctly on normal rolls for player", () => {
    const state = createInitialBoardState();
    // Force roll 2 -> Tile 3
    const result = calculateMove(state, 2);

    expect(result.roll).toBe(2);
    expect(result.landedTile.id).toBe(3);
    expect(result.finalTile.id).toBe(3);
    expect(result.isLadder).toBe(false);
    expect(result.isSnake).toBe(false);
    expect(result.nextPlayer.position).toBe(3);
  });

  it("advances position correctly on normal rolls for computer", () => {
    const state = createInitialBoardState();
    // Force roll 4 for computer -> Tile 5
    const result = calculatePlayerMove(state, "computer", 4);

    expect(result.roll).toBe(4);
    expect(result.landedTile.id).toBe(5);
    expect(result.finalTile.id).toBe(5);
    expect(result.nextPlayer.position).toBe(5);
    expect(result.newLogs[0].text).toContain("OctoBot 🐙");
  });

  it("handles Rocket Ladders jumping forward for both players", () => {
    const state = createInitialBoardState();
    // Force roll 3 -> Lands on Tile 4 (Viral on Reddit, ladder to 11)
    const result = calculatePlayerMove(state, "computer", 3);

    expect(result.landedTile.id).toBe(4);
    expect(result.isLadder).toBe(true);
    expect(result.finalTile.id).toBe(11);
    expect(result.nextPlayer.position).toBe(11);
  });

  it("handles Bug Snakes sliding backward", () => {
    const state = createInitialBoardState();
    state.player.position = 6;

    // Force roll 2 -> Lands on Tile 8 (Syntax error, snake to 3)
    const result = calculateMove(state, 2);

    expect(result.landedTile.id).toBe(8);
    expect(result.isSnake).toBe(true);
    expect(result.finalTile.id).toBe(3);
    expect(result.nextPlayer.position).toBe(3);
    expect(result.nextPlayer.bugsSquashed).toBe(1);
  });

  it("activates espresso boost to double the next roll for player and computer", () => {
    let state = createInitialBoardState();
    expect(state.player.coffee).toBe(2);

    state = activateCoffeeBoost(state, "player");
    expect(state.doubleRollActive).toBe(true);
    expect(state.player.coffee).toBe(1);

    // Roll 3 with boost -> effective move is 6
    const result = calculatePlayerMove(state, "player", 3);
    expect(result.landedTile.id).toBe(7); // 1 + 6 = 7

    // Test computer boost
    state = activateCoffeeBoost(state, "computer");
    expect(state.computerDoubleBoost).toBe(true);
    expect(state.computer.coffee).toBe(1);
  });

  it("evaluates computer boost decision correctly based on distance and finish line", () => {
    const compStats = { ...createInitialBoardState().computer, position: 28, coffee: 1 };
    const playerStats = { ...createInitialBoardState().player, position: 25 };

    // Within finish sprint (position >= 24)
    expect(shouldComputerUseBoost(compStats, playerStats)).toBe(true);

    // No coffee -> false
    expect(shouldComputerUseBoost({ ...compStats, coffee: 0 }, playerStats)).toBe(false);
  });

  it("detects player victory and formats victory receipt", () => {
    const state = createInitialBoardState();
    state.player.position = 33;
    state.winner = "player";

    // Force roll 3 -> reaches Tile 36
    const result = calculatePlayerMove(state, "player", 3);
    expect(result.isVictory).toBe(true);
    expect(result.finalTile.id).toBe(36);

    state.player = result.nextPlayer;
    const receipt = formatBoardVictoryReceipt(state);
    expect(receipt).toContain("VICTORY: ALGOFOX REACHED IPO!");
    expect(receipt).toContain("1v1 STARTUP FOUNDER RACE");
  });

  it("detects computer victory and formats defeat rematch receipt", () => {
    const state = createInitialBoardState();
    state.computer.position = 34;
    state.winner = "computer";

    const result = calculatePlayerMove(state, "computer", 2);
    expect(result.isVictory).toBe(true);
    expect(result.finalTile.id).toBe(36);

    state.computer = result.nextPlayer;
    const receipt = formatBoardVictoryReceipt(state);
    expect(receipt).toContain("DEFEAT: OCTOBOT AI REACHED IPO FIRST!");
  });

  it("retrieves valid tiles for all IDs from 1 to 36", () => {
    for (let i = 1; i <= 36; i++) {
      const tile = getTileById(i);
      expect(tile.id).toBe(i);
      expect(tile.name).toBeTruthy();
      expect(tile.icon).toBeTruthy();
      expect(tile.flavorQuote).toBeTruthy();
    }
  });
});

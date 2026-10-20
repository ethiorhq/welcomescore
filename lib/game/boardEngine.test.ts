import { describe, expect, it } from "vitest";
import {
  activateCoffeeBoost,
  calculateMove,
  createInitialBoardState,
  formatBoardVictoryReceipt,
  getTileById,
} from "./boardEngine";
import { BOARD_TILES } from "./boardData";

describe("Algofox: Sprint Quest Board Game Engine", () => {
  it("initializes board state with 36 tiles and proper starting stats", () => {
    expect(BOARD_TILES.length).toBe(36);
    expect(BOARD_TILES[0].name).toBe("git init");
    expect(BOARD_TILES[35].name).toBe("🦄 $10B IPO UNICORN!");

    const state = createInitialBoardState();
    expect(state.player.position).toBe(1);
    expect(state.player.stars).toBe(100);
    expect(state.player.coffee).toBe(2);
    expect(state.gameStatus).toBe("playing");
  });

  it("advances position correctly on normal rolls", () => {
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

  it("handles Rocket Ladders jumping forward", () => {
    const state = createInitialBoardState();
    // Force roll 3 -> Lands on Tile 4 (Viral on Reddit, ladder to 11)
    const result = calculateMove(state, 3);

    expect(result.landedTile.id).toBe(4);
    expect(result.isLadder).toBe(true);
    expect(result.finalTile.id).toBe(11);
    expect(result.nextPlayer.position).toBe(11);
  });

  it("handles Bug Snakes sliding backward", () => {
    const state = createInitialBoardState();
    // Move to Tile 6 first
    state.player.position = 6;

    // Force roll 2 -> Lands on Tile 8 (Syntax error, snake to 3)
    const result = calculateMove(state, 2);

    expect(result.landedTile.id).toBe(8);
    expect(result.isSnake).toBe(true);
    expect(result.finalTile.id).toBe(3);
    expect(result.nextPlayer.position).toBe(3);
    expect(result.nextPlayer.bugsSquashed).toBe(1);
  });

  it("activates espresso boost to double the next roll", () => {
    let state = createInitialBoardState();
    expect(state.player.coffee).toBe(2);

    state = activateCoffeeBoost(state);
    expect(state.doubleRollActive).toBe(true);
    expect(state.player.coffee).toBe(1);

    // Roll 3 with boost -> effective move is 6
    const result = calculateMove(state, 3);
    expect(result.landedTile.id).toBe(7); // 1 + 6 = 7
  });

  it("detects victory upon reaching tile 36", () => {
    const state = createInitialBoardState();
    state.player.position = 33;

    // Force roll 3 -> reaches Tile 36
    const result = calculateMove(state, 3);
    expect(result.isVictory).toBe(true);
    expect(result.finalTile.id).toBe(36);

    state.player = result.nextPlayer;
    const receipt = formatBoardVictoryReceipt(state);
    expect(receipt).toContain("ALGOFOX: SPRINT QUEST");
    expect(receipt).toContain("IPO UNICORN");
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

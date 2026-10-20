import { describe, expect, it } from "vitest";
import {
  INITIAL_VITALS,
  checkGameOver,
  clampVitals,
  createInitialGameState,
  formatPostMortemReceipt,
  processDecision,
} from "./sprintEngine";
import type { SprintCard } from "./types";

const mockCard: SprintCard = {
  id: "test_card",
  character: "Test Dev",
  role: "Tester",
  avatarIcon: "🧪",
  quote: "Do you want to test?",
  left: {
    text: "No",
    delta: { server: -10, morale: 10 },
  },
  right: {
    text: "Yes",
    delta: { server: 20, runway: -20 },
  },
};

describe("Survive the Sprint: Logic Engine", () => {
  it("initializes game state with balanced 55% vitals and day 1 sprint 1", () => {
    const state = createInitialGameState([mockCard]);
    expect(state.vitals).toEqual(INITIAL_VITALS);
    expect(state.day).toBe(1);
    expect(state.sprint).toBe(1);
    expect(state.cardsPlayed).toBe(0);
    expect(state.isGameOver).toBe(false);
    expect(state.ending).toBeNull();
  });

  it("clamps vitals between 0 and 100", () => {
    const clamped = clampVitals({
      server: 120,
      morale: -30,
      runway: 50.4,
      stars: 100,
    });

    expect(clamped.server).toBe(100);
    expect(clamped.morale).toBe(0);
    expect(clamped.runway).toBe(50);
    expect(clamped.stars).toBe(100);
  });

  it("detects game over when any vital drops to 0", () => {
    expect(checkGameOver({ server: 0, morale: 50, runway: 50, stars: 50 })?.key).toBe("server_low");
    expect(checkGameOver({ server: 50, morale: 0, runway: 50, stars: 50 })?.key).toBe("morale_low");
    expect(checkGameOver({ server: 50, morale: 50, runway: 0, stars: 50 })?.key).toBe("runway_low");
    expect(checkGameOver({ server: 50, morale: 50, runway: 50, stars: 0 })?.key).toBe("stars_low");
  });

  it("detects game over when any vital overloads to 100", () => {
    expect(checkGameOver({ server: 100, morale: 50, runway: 50, stars: 50 })?.key).toBe("server_high");
    expect(checkGameOver({ server: 50, morale: 100, runway: 50, stars: 50 })?.key).toBe("morale_high");
    expect(checkGameOver({ server: 50, morale: 50, runway: 100, stars: 50 })?.key).toBe("runway_high");
    expect(checkGameOver({ server: 50, morale: 50, runway: 50, stars: 100 })?.key).toBe("stars_high");
  });

  it("processes left and right decisions updating vitals correctly", () => {
    let state = createInitialGameState([mockCard]);

    // Process Left
    state = processDecision(state, "left");
    expect(state.vitals.server).toBe(45);
    expect(state.vitals.morale).toBe(65);
    expect(state.cardsPlayed).toBe(1);
    expect(state.history.length).toBe(1);

    // Process Right
    state = processDecision(state, "right");
    expect(state.vitals.server).toBe(65);
    expect(state.vitals.runway).toBe(35);
    expect(state.cardsPlayed).toBe(2);
  });

  it("triggers game over state and preserves final ending details", () => {
    const fatalCard: SprintCard = {
      id: "fatal",
      character: "Catastrophe",
      role: "Chaos",
      avatarIcon: "💥",
      quote: "Destroy server?",
      left: { text: "Yes", delta: { server: -80 } },
      right: { text: "No", delta: {} },
    };

    let state = createInitialGameState([fatalCard]);
    state = processDecision(state, "left");

    expect(state.isGameOver).toBe(true);
    expect(state.vitals.server).toBe(0);
    expect(state.ending?.key).toBe("server_low");
    expect(state.ending?.title).toContain("500 Outage");
  });

  it("formats a shareable post-mortem receipt", () => {
    let state = createInitialGameState([mockCard]);
    state = processDecision(state, "left");
    const receipt = formatPostMortemReceipt(state);

    expect(receipt).toContain("WELCOMESCORE DEV-BREAK");
    expect(receipt).toContain("SURVIVE THE SPRINT");
    expect(receipt).toContain("Final Vitals");
    expect(receipt).toContain("Algofox Verdict");
  });

  it("verifies the full SPRINT_CARDS dataset has valid structure and balance", async () => {
    const { SPRINT_CARDS } = await import("./sprintCards");
    expect(SPRINT_CARDS.length).toBeGreaterThanOrEqual(30);

    for (const card of SPRINT_CARDS) {
      expect(card.id).toBeTruthy();
      expect(card.character).toBeTruthy();
      expect(card.role).toBeTruthy();
      expect(card.avatarIcon).toBeTruthy();
      expect(card.quote.length).toBeGreaterThan(10);

      // Left choice
      expect(card.left.text.length).toBeGreaterThan(2);
      expect(typeof card.left.delta).toBe("object");

      // Right choice
      expect(card.right.text.length).toBeGreaterThan(2);
      expect(typeof card.right.delta).toBe("object");
    }
  });
});


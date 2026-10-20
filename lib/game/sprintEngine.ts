import type {
  Choice,
  GameOverReason,
  GameState,
  SprintCard,
  Vitals,
} from "./types";
import { SPRINT_CARDS } from "./sprintCards";

export const INITIAL_VITALS: Vitals = {
  server: 55,
  morale: 55,
  runway: 55,
  stars: 55,
};

export const GAME_OVER_ENDINGS: Record<string, GameOverReason> = {
  server_low: {
    key: "server_low",
    title: "🔥 The Great 500 Outage",
    postMortem: "AWS suspended your account for excessive server smoke emissions. Production is now a static GIF of a fire extinguisher.",
    statTriggered: "server",
    isHigh: false,
    algofoxComment: "You can't have uptime issues if the server physically melts into molten slag. 🦊🔥",
  },
  server_high: {
    key: "server_high",
    title: "🧊 Zero-Bug Carbon Freeze",
    postMortem: "You optimized the server so hard that no developer is permitted to change a single line of code ever again.",
    statTriggered: "server",
    isHigh: true,
    algofoxComment: "The server is 100% bug-free because the repository has been sealed in concrete. 🦊🧊",
  },
  morale_low: {
    key: "morale_low",
    title: "🚪 The Mass Rage-Quit",
    postMortem: "The entire engineering team resigned simultaneously to start an artisanal sourdough bakery in Oregon. You are now the only employee.",
    statTriggered: "morale",
    isHigh: false,
    algofoxComment: "At least their sourdough will have cleaner gluten architecture than your codebase. 🦊🍞",
  },
  morale_high: {
    key: "morale_high",
    title: "🍕 Perpetual Pizza Party",
    postMortem: "Team morale reached euphoria. Everyone has been playing ping-pong and chatting on Slack for 3 weeks straight. Zero pull requests have landed.",
    statTriggered: "morale",
    isHigh: true,
    algofoxComment: "Happiness is at an all-time high! Unfortunately, the product doesn't exist anymore. 🦊🎉",
  },
  runway_low: {
    key: "runway_low",
    title: "💳 Credit Card Declined in Prod",
    postMortem: "Your OpenAI and cloud hosting invoices bounced. Staging was repossessed by the bank, and your domain is now an online shoe store.",
    statTriggered: "runway",
    isHigh: false,
    algofoxComment: "Cloud computing is just someone else's computer taking all of your money. 🦊💸",
  },
  runway_high: {
    key: "runway_high",
    title: "🦄 Overfunded Zombie Unicorn",
    postMortem: "You raised a $500M Series D at a $12B valuation. 80 Vice Presidents were hired to argue about the font color in the README.",
    statTriggered: "runway",
    isHigh: true,
    algofoxComment: "You have more capital than some European nations, yet git clone still times out. 🦊🦄",
  },
  stars_low: {
    key: "stars_low",
    title: "🪦 Vaporware Oblivion",
    postMortem: "Your project was declared dead on Reddit. The last remaining GitHub star was unstarred by your own mother.",
    statTriggered: "stars",
    isHigh: false,
    algofoxComment: "Even Google's crawler gave up trying to find your documentation. 🦊🪦",
  },
  stars_high: {
    key: "stars_high",
    title: "🌊 The Viral Hug of Death",
    postMortem: "You went mega-viral on TikTok. 400,000 non-programmers submitted pull requests asking why the app doesn't play background music.",
    statTriggered: "stars",
    isHigh: true,
    algofoxComment: "Congratulations on fame! Your issue tracker is now permanently unusable. 🦊🌊",
  },
};

export function clampVitals(vitals: Vitals): Vitals {
  return {
    server: Math.max(0, Math.min(100, Math.round(vitals.server))),
    morale: Math.max(0, Math.min(100, Math.round(vitals.morale))),
    runway: Math.max(0, Math.min(100, Math.round(vitals.runway))),
    stars: Math.max(0, Math.min(100, Math.round(vitals.stars))),
  };
}

export function checkGameOver(vitals: Vitals): GameOverReason | null {
  if (vitals.server <= 0) return GAME_OVER_ENDINGS.server_low;
  if (vitals.server >= 100) return GAME_OVER_ENDINGS.server_high;

  if (vitals.morale <= 0) return GAME_OVER_ENDINGS.morale_low;
  if (vitals.morale >= 100) return GAME_OVER_ENDINGS.morale_high;

  if (vitals.runway <= 0) return GAME_OVER_ENDINGS.runway_low;
  if (vitals.runway >= 100) return GAME_OVER_ENDINGS.runway_high;

  if (vitals.stars <= 0) return GAME_OVER_ENDINGS.stars_low;
  if (vitals.stars >= 100) return GAME_OVER_ENDINGS.stars_high;

  return null;
}

export function shuffleDeck<T>(array: T[]): T[] {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function createInitialGameState(customDeck?: SprintCard[]): GameState {
  const deck = customDeck && customDeck.length > 0 ? shuffleDeck(customDeck) : shuffleDeck(SPRINT_CARDS);
  return {
    vitals: { ...INITIAL_VITALS },
    day: 1,
    sprint: 1,
    cardsPlayed: 0,
    activeCardIndex: 0,
    deck,
    isGameOver: false,
    ending: null,
    history: [],
    highScore: 1,
    isSprintCompletedCelebration: false,
  };
}

export function processDecision(
  state: GameState,
  direction: "left" | "right",
): GameState {
  if (state.isGameOver) return state;

  const currentCard = state.deck[state.activeCardIndex % state.deck.length];
  const choice: Choice = direction === "left" ? currentCard.left : currentCard.right;

  // Apply stat delta
  const rawVitals: Vitals = {
    server: state.vitals.server + (choice.delta.server || 0),
    morale: state.vitals.morale + (choice.delta.morale || 0),
    runway: state.vitals.runway + (choice.delta.runway || 0),
    stars: state.vitals.stars + (choice.delta.stars || 0),
  };

  const clampedVitals = clampVitals(rawVitals);
  const ending = checkGameOver(clampedVitals);

  const newCardsPlayed = state.cardsPlayed + 1;
  const newDay = (state.cardsPlayed % 10) + 1;
  const isSprintEnd = newDay === 10;
  const newSprint = isSprintEnd ? state.sprint + 1 : state.sprint;

  // Record history
  const historyItem = {
    cardId: currentCard.id,
    character: currentCard.character,
    choiceText: choice.text,
    day: state.day,
    sprint: state.sprint,
  };

  if (ending) {
    return {
      ...state,
      vitals: clampedVitals,
      isGameOver: true,
      ending,
      cardsPlayed: newCardsPlayed,
      history: [historyItem, ...state.history],
      highScore: Math.max(state.highScore, state.sprint),
      isSprintCompletedCelebration: false,
    };
  }

  // Next card index (reshuffle if cycling through entire deck)
  let nextDeck = state.deck;
  let nextIndex = state.activeCardIndex + 1;

  if (nextIndex >= state.deck.length) {
    nextDeck = shuffleDeck(state.deck);
    nextIndex = 0;
  }

  return {
    ...state,
    vitals: clampedVitals,
    day: isSprintEnd ? 1 : state.day + 1,
    sprint: newSprint,
    cardsPlayed: newCardsPlayed,
    activeCardIndex: nextIndex,
    deck: nextDeck,
    isGameOver: false,
    ending: null,
    history: [historyItem, ...state.history],
    highScore: Math.max(state.highScore, newSprint),
    isSprintCompletedCelebration: isSprintEnd,
  };
}

export function formatPostMortemReceipt(state: GameState): string {
  const endingTitle = state.ending?.title || "Sprint Concluded";
  const endingQuote = state.ending?.postMortem || "Survived without incident.";
  const algofoxVerdict = state.ending?.algofoxComment || "Algofox approves of this run.";

  return [
    "=========================================",
    "         WELCOMESCORE DEV-BREAK          ",
    "         SURVIVE THE SPRINT #1           ",
    "=========================================",
    `Survival Time: ${state.sprint} Sprints, ${state.day} Days (${state.cardsPlayed} Decisions)`,
    `Cause of Death:`,
    `▸ ${endingTitle}`,
    `  "${endingQuote}"`,
    "-----------------------------------------",
    "Final Vitals:",
    `💻 Server: ${state.vitals.server}%  |  ☕ Morale: ${state.vitals.morale}%`,
    `💰 Runway: ${state.vitals.runway}%  |  ⭐ Hype: ${state.vitals.stars}%`,
    "-----------------------------------------",
    `Algofox Verdict:`,
    `"${algofoxVerdict}"`,
    "=========================================",
    "Play the Dev-Break on https://welcomescore.vercel.app",
  ].join("\n");
}

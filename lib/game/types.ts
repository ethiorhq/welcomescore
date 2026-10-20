export type Vitals = {
  server: number;  // 0 - 100%
  morale: number;  // 0 - 100%
  runway: number;  // 0 - 100%
  stars: number;   // 0 - 100%
};

export type VitalKey = keyof Vitals;

export type StatDelta = {
  server?: number;
  morale?: number;
  runway?: number;
  stars?: number;
};

export type Choice = {
  text: string;
  delta: StatDelta;
  reaction?: string;
  tag?: string;
};

export type SprintCard = {
  id: string;
  character: string;
  role: string;
  avatarIcon: string;
  quote: string;
  left: Choice;
  right: Choice;
  rarity?: "common" | "rare" | "boss";
};

export type GameOverReason = {
  key: string;
  title: string;
  postMortem: string;
  statTriggered: VitalKey;
  isHigh: boolean;
  algofoxComment: string;
};

export type DecisionHistoryItem = {
  cardId: string;
  character: string;
  choiceText: string;
  day: number;
  sprint: number;
};

export type GameState = {
  vitals: Vitals;
  day: number;
  sprint: number;
  cardsPlayed: number;
  activeCardIndex: number;
  deck: SprintCard[];
  isGameOver: boolean;
  ending: GameOverReason | null;
  history: DecisionHistoryItem[];
  highScore: number;
  isSprintCompletedCelebration: boolean;
};

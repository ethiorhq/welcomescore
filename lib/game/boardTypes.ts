export type TileType =
  | "start"
  | "feature"
  | "coffee"
  | "ladder"
  | "snake"
  | "mystery"
  | "star"
  | "boss"
  | "finish";

export type BoardTile = {
  id: number; // 1 to 36
  name: string;
  description: string;
  icon: string;
  type: TileType;
  targetTile?: number; // destination tile if this is a ladder or snake
  starsDelta?: number;
  coffeeDelta?: number;
  capitalDelta?: number;
  flavorQuote: string;
  color?: string;
};

export type PlayerStats = {
  position: number; // 1 to 36
  stars: number;
  coffee: number;
  capital: number;
  turn: number;
  bugsSquashed: number;
};

export type LogEntry = {
  id: string;
  turn: number;
  text: string;
  icon: string;
  badge?: string;
};

export type BoardGameState = {
  player: PlayerStats;
  isRolling: boolean;
  lastRoll: number | null;
  isMoving: boolean;
  activeTileEvent: BoardTile | null;
  gameStatus: "playing" | "won" | "event";
  historyLog: LogEntry[];
  doubleRollActive: boolean;
};

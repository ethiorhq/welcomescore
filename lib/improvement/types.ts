/**
 * WelcomeScore Improvement Event Types
 * Privacy-safe public timeline tracking repository changes over time.
 */

export interface ChangedSignal {
  id: string;
  label: string;
  beforePassed: boolean;
  afterPassed: boolean;
  pointsDelta: number;
}

export interface ImprovementEvent {
  id: string;
  repo: string;
  analyzedAt: string;
  previousScore: number | null;
  newScore: number;
  scoreDelta: number | null;
  previousGrade: string | null;
  newGrade: string;
  defaultBranch?: string;
  commitSha?: string;
  changedSignals: ChangedSignal[];
  completedMoves: string[];
  remainingMoveId?: string;
  confidence?: string;
}

export interface TimelineResponse {
  repo: string;
  events: ImprovementEvent[];
  totalEvents: number;
}

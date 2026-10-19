import type { WelcomeScoreReport } from "../report/types";
import type { ChangedSignal, ImprovementEvent } from "./types";

/**
 * Deterministically computes an ImprovementEvent comparing two WelcomeScore reports.
 * Pure function: no database access, no side effects.
 */
export function calculateImprovementEvent(
  currentReport: WelcomeScoreReport,
  previousReport?: WelcomeScoreReport | null,
  overrideId?: string,
): ImprovementEvent {
  const repo = currentReport.repository.fullName;
  const newScore = currentReport.score;
  const newGrade = currentReport.grade;
  const analyzedAt = currentReport.analyzedAt;
  const defaultBranch = currentReport.repository.defaultBranch;
  const commitSha = currentReport.analyzedCommit;
  const remainingMoveId = currentReport.nextUsefulMove?.id;
  const confidence = currentReport.coverage.percentage >= 100 ? "high" : currentReport.coverage.percentage >= 70 ? "medium" : "limited";

  if (!previousReport) {
    return {
      id: overrideId || `evt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      repo,
      analyzedAt,
      previousScore: null,
      newScore,
      scoreDelta: null,
      previousGrade: null,
      newGrade,
      defaultBranch,
      commitSha,
      changedSignals: [],
      completedMoves: [],
      remainingMoveId,
      confidence,
    };
  }

  const previousScore = previousReport.score;
  const previousGrade = previousReport.grade;
  const scoreDelta = newScore - previousScore;

  // Build map of previous checks
  const prevCheckMap = new Map(
    previousReport.checks.map((chk) => [chk.id, chk]),
  );

  const changedSignals: ChangedSignal[] = [];

  for (const currentCheck of currentReport.checks) {
    const prevCheck = prevCheckMap.get(currentCheck.id);
    const beforePassed = prevCheck ? prevCheck.status === "pass" : false;
    const afterPassed = currentCheck.status === "pass";

    if (beforePassed !== afterPassed) {
      const prevPoints = beforePassed ? (prevCheck?.points ?? 0) : 0;
      const afterPoints = afterPassed ? currentCheck.points : 0;
      changedSignals.push({
        id: currentCheck.id,
        label: currentCheck.label,
        beforePassed,
        afterPassed,
        pointsDelta: afterPoints - prevPoints,
      });
    }
  }

  // Detect completed moves
  const completedMoves: string[] = [];
  if (previousReport.nextUsefulMove) {
    const prevMove = previousReport.nextUsefulMove;
    // Check if the evidence IDs for previous move are now all passing
    const allPassedNow = prevMove.evidenceIds.every((evId) => {
      const chk = currentReport.checks.find((c) => c.id === evId);
      return chk && chk.status === "pass";
    });

    if (allPassedNow && prevMove.id !== remainingMoveId) {
      completedMoves.push(prevMove.id);
    }
  }


  return {
    id: overrideId || `evt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    repo,
    analyzedAt,
    previousScore,
    newScore,
    scoreDelta,
    previousGrade,
    newGrade,
    defaultBranch,
    commitSha,
    changedSignals,
    completedMoves,
    remainingMoveId,
    confidence,
  };
}

/**
 * Computes an ImprovementEvent when only the previous event summary is available (e.g. from database query).
 */
export function calculateImprovementFromPreviousEvent(
  currentReport: WelcomeScoreReport,
  previousEvent?: ImprovementEvent | null,
  overrideId?: string,
): ImprovementEvent {
  const repo = currentReport.repository.fullName;
  const newScore = currentReport.score;
  const newGrade = currentReport.grade;
  const analyzedAt = currentReport.analyzedAt;
  const defaultBranch = currentReport.repository.defaultBranch;
  const commitSha = currentReport.analyzedCommit;
  const remainingMoveId = currentReport.nextUsefulMove?.id;
  const confidence = currentReport.coverage.percentage >= 100 ? "high" : currentReport.coverage.percentage >= 70 ? "medium" : "limited";

  if (!previousEvent) {
    return {
      id: overrideId || `evt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      repo,
      analyzedAt,
      previousScore: null,
      newScore,
      scoreDelta: null,
      previousGrade: null,
      newGrade,
      defaultBranch,
      commitSha,
      changedSignals: [],
      completedMoves: [],
      remainingMoveId,
      confidence,
    };
  }

  const previousScore = previousEvent.newScore;
  const previousGrade = previousEvent.newGrade;
  const scoreDelta = newScore - previousScore;

  // Completed move: if previous had a remaining move that is now absent or resolved
  const completedMoves: string[] = [];
  if (previousEvent.remainingMoveId && previousEvent.remainingMoveId !== remainingMoveId && scoreDelta > 0) {
    completedMoves.push(previousEvent.remainingMoveId);
  }

  return {
    id: overrideId || `evt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    repo,
    analyzedAt,
    previousScore,
    newScore,
    scoreDelta,
    previousGrade,
    newGrade,
    defaultBranch,
    commitSha,
    changedSignals: [],
    completedMoves,
    remainingMoveId,
    confidence,
  };
}


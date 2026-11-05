import type { EvidenceItem, WelcomeScoreReport } from "../report/types";
import type { ChangedSignal, ImprovementEvent } from "./types";

/**
 * Shared per-check comparison used by `calculateImprovementEvent`.
 * A check counts as changed only when its pass/fail state flips; the
 * points delta uses the actual awarded points (the good-first-issue
 * check awards graded points, so a flip is not always worth its maximum).
 */
export function changedSignalsFromReports(
  currentChecks: EvidenceItem[],
  previousChecks: EvidenceItem[],
): ChangedSignal[] {
  const prevCheckMap = new Map(previousChecks.map((chk) => [chk.id, chk]));
  const changedSignals: ChangedSignal[] = [];

  for (const currentCheck of currentChecks) {
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

  return changedSignals;
}

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

  const changedSignals = changedSignalsFromReports(
    currentReport.checks,
    previousReport.checks,
  );

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
 *
 * Honest limitation, documented rather than papered over: an
 * `ImprovementEvent` stores the previous score and grade, but not the
 * previous per-check pass/fail states — the previous report itself is
 * never persisted (see `lib/improvement/timeline.ts`). Per-check changes
 * for the current transition therefore cannot be derived here. This
 * function returns `changedSignals: []` ("not derivable") instead of
 * copying `previousEvent.changedSignals` into the new event, which would
 * misattribute the previous transition's changes to this one.
 *
 * Per-check changes are preserved, not lost, at the timeline level:
 * `recordImprovementEvent` prepends and never replaces events, and the
 * report page only records a new event when the score actually changes,
 * so the previous event — with its own changedSignals — stays visible
 * until a real change occurs. For a full per-check diff, compare two
 * reports with `calculateImprovementEvent` or two audits with
 * `computeAuditDiff` in `lib/auditDiff.ts`.
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


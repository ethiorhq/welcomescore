import type { ImprovementEvent } from "./types";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_KEY;

const inMemoryStore = new Map<string, ImprovementEvent[]>();

export function isImprovementStoreConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_SERVICE_KEY);
}

export function clearInMemoryTimelineStore(): void {
  inMemoryStore.clear();
}

function normalizeRepo(repo: string): string {
  return repo.trim().toLowerCase();
}

/**
 * Stores an improvement event in Supabase (if configured) or in memory.
 */
export async function recordImprovementEvent(
  event: ImprovementEvent,
): Promise<ImprovementEvent> {
  const normRepo = normalizeRepo(event.repo);

  // Always update in-memory cache
  const existing = inMemoryStore.get(normRepo) || [];
  // Prepend newest event
  const updated = [event, ...existing.filter((e) => e.id !== event.id)].slice(0, 50);
  inMemoryStore.set(normRepo, updated);

  if (!isImprovementStoreConfigured()) {
    return event;
  }

  try {
    const payload = {
      id: event.id.startsWith("evt-") ? undefined : event.id,
      repo_path: normRepo,
      analyzed_at: event.analyzedAt,
      previous_score: event.previousScore,
      new_score: event.newScore,
      previous_grade: event.previousGrade,
      new_grade: event.newGrade,
      score_delta: event.scoreDelta,
      default_branch: event.defaultBranch,
      commit_sha: event.commitSha,
      changed_signals: event.changedSignals,
      completed_moves: event.completedMoves,
      remaining_move_id: event.remainingMoveId,
      confidence: event.confidence,
    };

    const res = await fetch(`${SUPABASE_URL}/rest/v1/repo_improvement_events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_SERVICE_KEY!,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        Prefer: "return=representation",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      console.warn("Failed to persist improvement event to Supabase:", await res.text());
    }
  } catch (err) {
    console.warn("Supabase improvement event write failed:", err);
  }

  return event;
}

/**
 * Retrieves the improvement timeline for a repository in descending order.
 */
export async function getRepoTimeline(
  repo: string,
  limit = 20,
): Promise<ImprovementEvent[]> {
  const normRepo = normalizeRepo(repo);

  if (!isImprovementStoreConfigured()) {
    const events = inMemoryStore.get(normRepo) || [];
    return events.slice(0, limit);
  }

  try {
    const endpoint = new URL(`${SUPABASE_URL}/rest/v1/repo_improvement_events`);
    endpoint.searchParams.set("repo_path", `eq.${normRepo}`);
    endpoint.searchParams.set("order", "analyzed_at.desc");
    endpoint.searchParams.set("limit", String(limit));

    const res = await fetch(endpoint.toString(), {
      headers: {
        apikey: SUPABASE_SERVICE_KEY!,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
      next: { revalidate: 60 },
    });

    if (res.ok) {
      const rows = (await res.json()) as Array<{
        id: string;
        repo_path: string;
        analyzed_at: string;
        previous_score: number | null;
        new_score: number;
        score_delta: number | null;
        previous_grade: string | null;
        new_grade: string;
        default_branch: string | null;
        commit_sha: string | null;
        changed_signals: ImprovementEvent["changedSignals"];
        completed_moves: string[];
        remaining_move_id: string | null;
        confidence: string | null;
      }>;

      if (Array.isArray(rows) && rows.length > 0) {
        return rows.map((r) => ({
          id: r.id,
          repo: r.repo_path,
          analyzedAt: r.analyzed_at,
          previousScore: r.previous_score,
          newScore: r.new_score,
          scoreDelta: r.score_delta,
          previousGrade: r.previous_grade,
          newGrade: r.new_grade,
          defaultBranch: r.default_branch ?? undefined,
          commitSha: r.commit_sha ?? undefined,
          changedSignals: r.changed_signals || [],
          completedMoves: r.completed_moves || [],
          remainingMoveId: r.remaining_move_id ?? undefined,
          confidence: r.confidence ?? undefined,
        }));
      }
    }
  } catch (err) {
    console.warn("Supabase improvement event query failed:", err);
  }

  // Fallback to in-memory store
  const events = inMemoryStore.get(normRepo) || [];
  return events.slice(0, limit);
}

/**
 * Deletes all timeline events for a given repository (Maintainer Right to be Forgotten).
 */
export async function deleteRepoTimeline(repo: string): Promise<boolean> {
  const normRepo = normalizeRepo(repo);
  inMemoryStore.delete(normRepo);

  if (!isImprovementStoreConfigured()) {
    return true;
  }

  try {
    const endpoint = new URL(`${SUPABASE_URL}/rest/v1/repo_improvement_events`);
    endpoint.searchParams.set("repo_path", `eq.${normRepo}`);

    const res = await fetch(endpoint.toString(), {
      method: "DELETE",
      headers: {
        apikey: SUPABASE_SERVICE_KEY!,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
    });

    return res.ok;
  } catch (err) {
    console.error("Failed to delete repo timeline:", err);
    return false;
  }
}

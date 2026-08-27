"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { MoveId } from "@/lib/nextUsefulMove";
import {
  MAX_RETURN_NOTE_LENGTH,
  RETURN_HANDOFF_KEY,
  RETURN_WORKSPACE_INDEX_KEY,
  isLocalReturnWorkspace,
  isReturnHandoff,
  isReturnWorkspaceIndex,
  normalizeReturnRepository,
  returnWorkspaceStorageKey,
  type AuditSignalSnapshot,
  type LocalReturnWorkspace,
  type PrivateWorkState,
  type ReturnHandoff,
  type ReturnIntent,
  type ReturnWorkspaceIndexEntry,
  type SavedMoveSnapshot,
} from "@/lib/returnWithPurpose";

const LEGACY_STORAGE_PREFIX = "welcomescore:next-useful-move:v1:";
const MAX_HANDOFF_AGE_MS = 10 * 60 * 1000;
const WORKSPACE_CHANGE_EVENT = "welcomescore:return-workspace-changed";

type LegacyReflection = {
  version: 1;
  repo: string;
  activeMoveId: MoveId;
  status: "planned" | "in-progress" | "ready-to-recheck";
  note?: string;
  createdAt: string;
  updatedAt: string;
};

function isLegacyReflection(value: unknown, repo: string): value is LegacyReflection {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<LegacyReflection>;
  return (
    candidate.version === 1 &&
    candidate.repo === normalizeReturnRepository(repo) &&
    typeof candidate.activeMoveId === "string" &&
    [
      "readme-setup",
      "contributing-guide",
      "code-of-conduct",
      "license",
      "starter-issue",
      "starter-issue-quality",
      "maintenance-clarity",
      "maintain-the-path",
    ].includes(candidate.activeMoveId) &&
    (candidate.status === "planned" ||
      candidate.status === "in-progress" ||
      candidate.status === "ready-to-recheck") &&
    typeof candidate.createdAt === "string" &&
    typeof candidate.updatedAt === "string" &&
    (candidate.note === undefined ||
      (typeof candidate.note === "string" && candidate.note.length <= MAX_RETURN_NOTE_LENGTH))
  );
}

function legacyStatusToWorkState(status: LegacyReflection["status"]): PrivateWorkState {
  if (status === "ready-to-recheck") {
    return "ready-for-fresh-audit";
  }
  return status;
}

export function mergeReturnWorkspaceIndex(
  entries: ReturnWorkspaceIndexEntry[],
  next: ReturnWorkspaceIndexEntry,
) {
  return [...entries.filter((entry) => entry.repo !== next.repo), next].sort((left, right) =>
    right.lastTouchedAt.localeCompare(left.lastTouchedAt),
  );
}

export function removeReturnWorkspaceIndex(
  entries: ReturnWorkspaceIndexEntry[],
  repo: string,
) {
  const normalized = normalizeReturnRepository(repo);
  return entries.filter((entry) => entry.repo !== normalized);
}

function parseWorkspaceIndex(rawValue: string | null): ReturnWorkspaceIndexEntry[] {
  if (!rawValue) {
    return [];
  }

  try {
    const parsedValue: unknown = JSON.parse(rawValue);
    return isReturnWorkspaceIndex(parsedValue)
      ? parsedValue.map((entry) => ({
          repo: normalizeReturnRepository(entry.repo),
          lastTouchedAt: entry.lastTouchedAt,
        }))
      : [];
  } catch {
    return [];
  }
}

function saveWorkspaceIndex(entries: ReturnWorkspaceIndexEntry[]) {
  window.localStorage.setItem(RETURN_WORKSPACE_INDEX_KEY, JSON.stringify(entries));
}

function announceWorkspaceChange() {
  window.dispatchEvent(new Event(WORKSPACE_CHANGE_EVENT));
}

export function createReturnHandoff(repo: string, now = new Date()): ReturnHandoff {
  return {
    version: 1,
    repo: normalizeReturnRepository(repo),
    requestedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + MAX_HANDOFF_AGE_MS).toISOString(),
  };
}

export function isActiveReturnHandoff(value: unknown, repo?: string, now = new Date()) {
  return isReturnHandoff(value, repo) && new Date(value.expiresAt).getTime() >= now.getTime();
}

export function readLocalReturnWorkspace(repo: string): LocalReturnWorkspace | null {
  const normalizedRepo = normalizeReturnRepository(repo);

  try {
    const rawWorkspace = window.localStorage.getItem(returnWorkspaceStorageKey(normalizedRepo));
    if (!rawWorkspace) {
      return null;
    }
    const parsedValue: unknown = JSON.parse(rawWorkspace);
    return isLocalReturnWorkspace(parsedValue, normalizedRepo) ? parsedValue : null;
  } catch {
    return null;
  }
}

export function useLocalReturnWorkspace(repo: string) {
  const normalizedRepo = useMemo(() => normalizeReturnRepository(repo), [repo]);
  const [workspace, setWorkspace] = useState<LocalReturnWorkspace | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isStorageAvailable, setIsStorageAvailable] = useState(true);

  useEffect(() => {
    setIsLoaded(false);

    try {
      const workspaceKey = returnWorkspaceStorageKey(normalizedRepo);
      const rawWorkspace = window.localStorage.getItem(workspaceKey);

      if (rawWorkspace) {
        const parsedValue: unknown = JSON.parse(rawWorkspace);
        if (isLocalReturnWorkspace(parsedValue, normalizedRepo)) {
          setWorkspace(parsedValue);
        } else {
          window.localStorage.removeItem(workspaceKey);
          setWorkspace(null);
        }
      } else {
        const legacyValue = window.localStorage.getItem(`${LEGACY_STORAGE_PREFIX}${normalizedRepo}`);
        const legacyParsed: unknown = legacyValue ? JSON.parse(legacyValue) : null;

        if (isLegacyReflection(legacyParsed, normalizedRepo)) {
          const migrated: LocalReturnWorkspace = {
            version: 1,
            repo: normalizedRepo,
            activeMoveId: legacyParsed.activeMoveId,
            workState: legacyStatusToWorkState(legacyParsed.status),
            returnIntent: "not-set",
            ...(legacyParsed.note ? { note: legacyParsed.note } : {}),
            firstSavedAt: legacyParsed.createdAt,
            lastTouchedAt: legacyParsed.updatedAt,
          };
          window.localStorage.setItem(workspaceKey, JSON.stringify(migrated));
          saveWorkspaceIndex(
            mergeReturnWorkspaceIndex(parseWorkspaceIndex(window.localStorage.getItem(RETURN_WORKSPACE_INDEX_KEY)), {
              repo: normalizedRepo,
              lastTouchedAt: migrated.lastTouchedAt,
            }),
          );
          setWorkspace(migrated);
        } else {
          setWorkspace(null);
        }
      }

      setIsStorageAvailable(true);
    } catch {
      setWorkspace(null);
      setIsStorageAvailable(false);
    } finally {
      setIsLoaded(true);
    }
  }, [normalizedRepo]);

  const saveWorkspace = useCallback(
    ({
      moveId,
      workState,
      returnIntent,
      note,
      lastKnownAudit,
      savedMove,
    }: {
      moveId: MoveId;
      workState: PrivateWorkState;
      returnIntent?: ReturnIntent;
      note?: string;
      lastKnownAudit?: AuditSignalSnapshot;
      savedMove?: SavedMoveSnapshot;
    }) => {
      const now = new Date().toISOString();
      const nextWorkspace: LocalReturnWorkspace = {
        version: 1,
        repo: normalizedRepo,
        activeMoveId: moveId,
        ...(savedMove ? { savedMove } : workspace?.savedMove ? { savedMove: workspace.savedMove } : {}),
        workState,
        returnIntent: returnIntent ?? workspace?.returnIntent ?? "not-set",
        ...(note?.trim() ? { note: note.trim().slice(0, MAX_RETURN_NOTE_LENGTH) } : {}),
        firstSavedAt: workspace?.activeMoveId === moveId ? workspace.firstSavedAt : now,
        lastTouchedAt: now,
        ...(lastKnownAudit ?? workspace?.lastKnownAudit
          ? { lastKnownAudit: lastKnownAudit ?? workspace?.lastKnownAudit }
          : {}),
        ...(workspace?.lastReviewedAt ? { lastReviewedAt: workspace.lastReviewedAt } : {}),
        ...(workspace?.dismissedAuditNoticeAt
          ? { dismissedAuditNoticeAt: workspace.dismissedAuditNoticeAt }
          : {}),
      };

      try {
        window.localStorage.setItem(returnWorkspaceStorageKey(normalizedRepo), JSON.stringify(nextWorkspace));
        saveWorkspaceIndex(
          mergeReturnWorkspaceIndex(parseWorkspaceIndex(window.localStorage.getItem(RETURN_WORKSPACE_INDEX_KEY)), {
            repo: normalizedRepo,
            lastTouchedAt: nextWorkspace.lastTouchedAt,
          }),
        );
        setWorkspace(nextWorkspace);
        announceWorkspaceChange();
        setIsStorageAvailable(true);
        return true;
      } catch {
        setIsStorageAvailable(false);
        return false;
      }
    },
    [normalizedRepo, workspace],
  );

  const clearWorkspace = useCallback(() => {
    try {
      window.localStorage.removeItem(returnWorkspaceStorageKey(normalizedRepo));
      saveWorkspaceIndex(
        removeReturnWorkspaceIndex(
          parseWorkspaceIndex(window.localStorage.getItem(RETURN_WORKSPACE_INDEX_KEY)),
          normalizedRepo,
        ),
      );
      setWorkspace(null);
      announceWorkspaceChange();
      setIsStorageAvailable(true);
      return true;
    } catch {
      setIsStorageAvailable(false);
      return false;
    }
  }, [normalizedRepo]);

  const prepareFreshAudit = useCallback(() => {
    try {
      window.localStorage.setItem(RETURN_HANDOFF_KEY, JSON.stringify(createReturnHandoff(normalizedRepo)));
      setIsStorageAvailable(true);
      return true;
    } catch {
      setIsStorageAvailable(false);
      return false;
    }
  }, [normalizedRepo]);

  return {
    workspace,
    isLoaded,
    isStorageAvailable,
    maxNoteLength: MAX_RETURN_NOTE_LENGTH,
    saveWorkspace,
    clearWorkspace,
    prepareFreshAudit,
  };
}

export function useLocalReturnWorkspaceIndex() {
  const [entries, setEntries] = useState<ReturnWorkspaceIndexEntry[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isStorageAvailable, setIsStorageAvailable] = useState(true);

  const reload = useCallback(() => {
    try {
      setEntries(parseWorkspaceIndex(window.localStorage.getItem(RETURN_WORKSPACE_INDEX_KEY)));
      setIsStorageAvailable(true);
    } catch {
      setEntries([]);
      setIsStorageAvailable(false);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    reload();
    window.addEventListener(WORKSPACE_CHANGE_EVENT, reload);
    return () => window.removeEventListener(WORKSPACE_CHANGE_EVENT, reload);
  }, [reload]);

  const clearAll = useCallback(() => {
    try {
      const currentEntries = parseWorkspaceIndex(window.localStorage.getItem(RETURN_WORKSPACE_INDEX_KEY));
      currentEntries.forEach((entry) => {
        window.localStorage.removeItem(returnWorkspaceStorageKey(entry.repo));
      });
      window.localStorage.removeItem(RETURN_WORKSPACE_INDEX_KEY);
      setEntries([]);
      announceWorkspaceChange();
      setIsStorageAvailable(true);
      return true;
    } catch {
      setIsStorageAvailable(false);
      return false;
    }
  }, []);

  return { entries, isLoaded, isStorageAvailable, reload, clearAll };
}

export function hasActiveReturnHandoff(repo: string) {
  try {
    const rawValue = window.localStorage.getItem(RETURN_HANDOFF_KEY);
    if (!rawValue) {
      return false;
    }
    const parsedValue: unknown = JSON.parse(rawValue);
    const active = isActiveReturnHandoff(parsedValue, repo);
    if (!active) {
      window.localStorage.removeItem(RETURN_HANDOFF_KEY);
    }
    return active;
  } catch {
    return false;
  }
}

export function consumeReturnHandoff(repo: string) {
  const active = hasActiveReturnHandoff(repo);
  if (active) {
    try {
      window.localStorage.removeItem(RETURN_HANDOFF_KEY);
    } catch {
      // Local storage is optional; a failed cleanup must not block an explicit audit.
    }
  }
  return active;
}


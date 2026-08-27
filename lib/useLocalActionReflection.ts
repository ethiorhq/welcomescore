"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { MoveId } from "@/lib/nextUsefulMove";

export type LocalActionStatus = "planned" | "in-progress" | "ready-to-recheck";

export type LocalActionReflection = {
  version: 1;
  repo: string;
  activeMoveId: MoveId;
  status: LocalActionStatus;
  note?: string;
  createdAt: string;
  updatedAt: string;
};

const STORAGE_PREFIX = "welcomescore:next-useful-move:v1:";
const MAX_NOTE_LENGTH = 280;
const validStatuses = new Set<LocalActionStatus>([
  "planned",
  "in-progress",
  "ready-to-recheck",
]);
const validMoveIds = new Set<MoveId>([
  "readme-setup",
  "contributing-guide",
  "code-of-conduct",
  "license",
  "starter-issue",
  "starter-issue-quality",
  "maintenance-clarity",
  "maintain-the-path",
]);

function normalizedRepo(repo: string) {
  return repo.trim().toLowerCase();
}

function storageKey(repo: string) {
  return `${STORAGE_PREFIX}${normalizedRepo(repo)}`;
}

function isReflection(value: unknown, repo: string): value is LocalActionReflection {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<LocalActionReflection>;
  return (
    candidate.version === 1 &&
    candidate.repo === normalizedRepo(repo) &&
    typeof candidate.activeMoveId === "string" &&
    validMoveIds.has(candidate.activeMoveId as MoveId) &&
    typeof candidate.status === "string" &&
    validStatuses.has(candidate.status as LocalActionStatus) &&
    typeof candidate.createdAt === "string" &&
    typeof candidate.updatedAt === "string" &&
    (candidate.note === undefined || (typeof candidate.note === "string" && candidate.note.length <= MAX_NOTE_LENGTH))
  );
}

export function useLocalActionReflection(repo: string) {
  const [reflection, setReflection] = useState<LocalActionReflection | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isStorageAvailable, setIsStorageAvailable] = useState(true);
  const key = useMemo(() => storageKey(repo), [repo]);
  const normalized = useMemo(() => normalizedRepo(repo), [repo]);

  useEffect(() => {
    try {
      const rawValue = window.localStorage.getItem(key);
      if (!rawValue) {
        setReflection(null);
      } else {
        const parsedValue: unknown = JSON.parse(rawValue);
        if (isReflection(parsedValue, repo)) {
          setReflection(parsedValue);
        } else {
          window.localStorage.removeItem(key);
          setReflection(null);
        }
      }
      setIsStorageAvailable(true);
    } catch {
      setReflection(null);
      setIsStorageAvailable(false);
    } finally {
      setIsLoaded(true);
    }
  }, [key, repo]);

  const saveReflection = useCallback(
    ({
      moveId,
      status,
      note,
    }: {
      moveId: MoveId;
      status: LocalActionStatus;
      note?: string;
    }) => {
      const now = new Date().toISOString();
      const nextReflection: LocalActionReflection = {
        version: 1,
        repo: normalized,
        activeMoveId: moveId,
        status,
        ...(note?.trim() ? { note: note.trim().slice(0, MAX_NOTE_LENGTH) } : {}),
        createdAt: reflection?.activeMoveId === moveId ? reflection.createdAt : now,
        updatedAt: now,
      };

      try {
        window.localStorage.setItem(key, JSON.stringify(nextReflection));
        setReflection(nextReflection);
        setIsStorageAvailable(true);
        return true;
      } catch {
        setIsStorageAvailable(false);
        return false;
      }
    },
    [key, normalized, reflection],
  );

  const clearReflection = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
      setReflection(null);
      setIsStorageAvailable(true);
      return true;
    } catch {
      setIsStorageAvailable(false);
      return false;
    }
  }, [key]);

  return {
    reflection,
    isLoaded,
    isStorageAvailable,
    maxNoteLength: MAX_NOTE_LENGTH,
    saveReflection,
    clearReflection,
  };
}

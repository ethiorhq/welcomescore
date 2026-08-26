"use client";

import { createAvatar } from "@dicebear/core";
import { identicon } from "@dicebear/collection";

const SESSION_KEY = "welcomescore.dev-lounge.session-id";
const PREFIXES = [
  "Async",
  "Null",
  "Lazy",
  "Recursive",
  "Headless",
  "Legacy",
  "Deprecating",
  "JankFree",
  "Uncaught",
  "ZeroCost",
] as const;
const NOUNS = [
  "Pointer",
  "Ninja",
  "Closure",
  "Hydrator",
  "Bundler",
  "Promise",
  "Compiler",
  "StackOverflow",
  "GitBlame",
  "Tuple",
] as const;

const FILTERED_TERMS = /\b(?:fuck|shit|bitch|asshole|dick|cunt|bastard)\b/gi;
const CONTROL_CHARACTERS = /[\u0000-\u001F\u007F]/g;
const REPEATED_CHARACTER_RUN = /(.)\1{11,}/;

export type DevIdentity = {
  sessionId: string;
  sessionHash: string;
  handle: string;
  avatarDataUri: string;
};

export function getDevIdentity(): DevIdentity {
  const sessionId = getOrCreateSessionId();
  const seed = stableHash(sessionId);
  const prefix = PREFIXES[seed % PREFIXES.length];
  const noun = NOUNS[Math.floor(seed / PREFIXES.length) % NOUNS.length];
  const suffix = (seed % 4096).toString(16).toUpperCase().padStart(3, "0");

  return {
    sessionId,
    sessionHash: `${stableHash(`${sessionId}:welcomescore`)}`.padStart(16, "0"),
    handle: `${prefix}${noun}_${suffix}`,
    avatarDataUri: createDevAvatar(sessionId),
  };
}

export function createDevAvatar(seed: string) {
  return createAvatar(identicon, {
    seed,
    backgroundColor: ["1b1e29"],
    radius: 50,
    scale: 88,
  }).toDataUri();
}

export function sanitizeLoungeContent(value: string) {
  return value
    .replace(CONTROL_CHARACTERS, " ")
    .replace(FILTERED_TERMS, "••••")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 300);
}

export function isBlockedLoungeContent(value: string) {
  const urlCount = (value.match(/https?:\/\//gi) ?? []).length;
  return REPEATED_CHARACTER_RUN.test(value) || urlCount > 2;
}

function getOrCreateSessionId() {
  const existing = window.localStorage.getItem(SESSION_KEY);
  if (existing) {
    return existing;
  }

  const sessionId =
    typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  window.localStorage.setItem(SESSION_KEY, sessionId);
  return sessionId;
}

function stableHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

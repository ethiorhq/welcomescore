"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import {
  getDevIdentity,
  isBlockedLoungeContent,
  sanitizeLoungeContent,
  type DevIdentity,
} from "@/lib/devIdentity";
import { getSupabaseBrowserClient } from "@/lib/supabaseBrowser";

const MESSAGE_LIMIT = 50;
const COOLDOWN_MS = 3000;

export type LoungeScoreCard = {
  repo: string;
  score: number;
  grade: string;
  summary: string;
};

export type PetReaction = {
  pet: "sukuna" | "gob" | "algofox";
  quote: string;
};

export type LoungeReply = {
  id: string;
  dev_handle: string;
  content: string;
  created_at: string;
};

export type LoungeMessage = {
  id: string;
  session_hash: string;
  dev_handle: string;
  avatar_seed: string;
  content: string;
  score_card: LoungeScoreCard | null;
  pet_reaction: PetReaction | null;
  reply_to: LoungeReply | null;
  created_at: string;
  expires_at: string;
};

type LoungeStatus = "connecting" | "ready" | "unavailable";

export function useDevLounge() {
  const [identity, setIdentity] = useState<DevIdentity | null>(null);
  const [messages, setMessages] = useState<LoungeMessage[]>([]);
  const [status, setStatus] = useState<LoungeStatus>("connecting");
  const [onlineCount, setOnlineCount] = useState(0);
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [now, setNow] = useState(0);

  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  const appendMessage = useCallback((incoming: LoungeMessage) => {
    setMessages((current) => {
      if (current.some((message) => message.id === incoming.id)) {
        return current;
      }

      return [...current, incoming].slice(-MESSAGE_LIMIT);
    });
  }, []);

  useEffect(() => {
    setIdentity(getDevIdentity());
    setNow(Date.now());
    const interval = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!supabase || !identity) {
      setStatus("unavailable");
      return;
    }

    const client = supabase;
    let isMounted = true;
    let channel: RealtimeChannel | null = null;

    async function connect() {
      const { data, error } = await client
        .from("lounge_messages")
        .select("*")
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: true })
        .limit(MESSAGE_LIMIT);

      if (!isMounted) {
        return;
      }

      if (error) {
        setStatus("unavailable");
        return;
      }

      setMessages((data ?? []) as LoungeMessage[]);
      channel = client
        .channel("welcomescore-dev-lounge")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "lounge_messages" },
          (payload) => appendMessage(payload.new as LoungeMessage),
        )
        .on("presence", { event: "sync" }, () => {
          if (!channel) {
            return;
          }
          setOnlineCount(countPresence(channel.presenceState()));
        })
        .subscribe(async (subscriptionStatus) => {
          if (!isMounted) {
            return;
          }

          if (subscriptionStatus === "SUBSCRIBED" && channel) {
            await channel.track({ dev_handle: identity!.handle });
            setStatus("ready");
          } else if (subscriptionStatus === "CHANNEL_ERROR" || subscriptionStatus === "TIMED_OUT") {
            setStatus("unavailable");
          }
        });
    }

    void connect();

    return () => {
      isMounted = false;
      if (channel) {
        void client.removeChannel(channel);
      }
    };
  }, [appendMessage, identity, supabase]);

  const sendMessage = useCallback(
    async ({
      content,
      scoreCard,
      replyTo,
    }: {
      content: string;
      scoreCard?: LoungeScoreCard;
      replyTo?: LoungeReply;
    }) => {
      if (!supabase || !identity) {
        return { error: "The lounge is not configured yet." };
      }

      if (Date.now() < cooldownUntil) {
        return { error: "Please wait a moment before sending another message." };
      }

      const sanitizedContent = sanitizeLoungeContent(content);
      if ((!sanitizedContent && !scoreCard) || isBlockedLoungeContent(sanitizedContent)) {
        return { error: "Please rewrite that message and try again." };
      }

      const messageToInsert = {
        session_hash: identity.sessionHash,
        dev_handle: identity.handle,
        avatar_seed: identity.sessionId,
        content: sanitizedContent,
        score_card: scoreCard ?? null,
        pet_reaction: scoreCard ? getPetReaction(scoreCard.score) : null,
        ...(replyTo ? { reply_to: replyTo } : {}),
      };

      const { error } = await supabase.from("lounge_messages").insert(messageToInsert);

      if (error) {
        return { error: "Unable to send the message right now." };
      }

      setCooldownUntil(Date.now() + COOLDOWN_MS);
      return { error: null };
    },
    [cooldownUntil, identity, supabase],
  );

  return {
    identity,
    messages,
    onlineCount,
    status,
    cooldownRemaining: Math.max(0, Math.ceil((cooldownUntil - now) / 1000)),
    sendMessage,
  };
}

function countPresence(state: Record<string, unknown[]>) {
  return Object.values(state).reduce((total, presences) => total + presences.length, 0);
}

function getPetReaction(score: number): PetReaction | null {
  if (score < 50) {
    return {
      pet: "sukuna",
      quote: "The contributor path needs attention. Start with the clearest missing check and build upward.",
    };
  }

  if (score > 85) {
    return score % 2 === 0
      ? {
          pet: "gob",
          quote: "Excellent signal! This project is making first-time contributors feel at home.",
        }
      : {
          pet: "algofox",
          quote: "High contributor readiness detected. Recommendation: keep the welcome path well maintained.",
        };
  }

  return null;
}

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
import type {
  LoungeAnswerMark,
  LoungeCommunityContext,
  LoungePreparedContext,
  LoungeReplySnapshot,
  LoungeReportReason,
  LoungeTopic,
} from "@/lib/loungeTypes";

const MESSAGE_LIMIT = 50;
const COOLDOWN_MS = 3000;

export const LOUNGE_REACTIONS = ["thumbs_up", "lightbulb", "tada", "eyes"] as const;
export type LoungeReaction = typeof LOUNGE_REACTIONS[number];

export type LoungeScoreCard = {
  repo: string;
  score: number;
  grade: string;
  summary: string;
};

export type PetReaction = {
  pet: "algofox";
  quote: string;
};

export type LoungeReply = LoungeReplySnapshot;

export type LoungeReactionRecord = {
  id: string;
  message_id: string;
  session_hash: string;
  reaction: LoungeReaction;
  created_at: string;
};

export type LoungeMessage = {
  id: string;
  session_hash: string;
  dev_handle: string;
  avatar_seed: string;
  content: string;
  topic: LoungeTopic;
  parent_message_id: string | null;
  community_context: LoungeCommunityContext | null;
  score_card: LoungeScoreCard | null;
  pet_reaction: PetReaction | null;
  reply_to: LoungeReply | null;
  created_at: string;
  expires_at: string;
};

type LoungeStatus = "connecting" | "ready" | "unavailable";
type GatewayState = "checking" | "ready" | "legacy";

export function useDevLounge() {
  const [identity, setIdentity] = useState<DevIdentity | null>(null);
  const [messages, setMessages] = useState<LoungeMessage[]>([]);
  const [reactions, setReactions] = useState<LoungeReactionRecord[]>([]);
  const [answerMarks, setAnswerMarks] = useState<LoungeAnswerMark[]>([]);
  const [status, setStatus] = useState<LoungeStatus>("connecting");
  const [gatewayState, setGatewayState] = useState<GatewayState>("checking");
  const [onlineCount, setOnlineCount] = useState(0);
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [now, setNow] = useState(0);

  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const isVerifiedGateway = gatewayState === "ready";

  const appendMessage = useCallback((incoming: LoungeMessage) => {
    setMessages((current) => {
      if (current.some((message) => message.id === incoming.id)) {
        return current;
      }
      return [...current, incoming].slice(-MESSAGE_LIMIT);
    });
  }, []);

  const appendReaction = useCallback((incoming: LoungeReactionRecord) => {
    setReactions((current) => {
      if (current.some((reaction) => reaction.id === incoming.id)) {
        return current;
      }
      return [...current, incoming];
    });
  }, []);

  const appendAnswerMark = useCallback((incoming: LoungeAnswerMark) => {
    setAnswerMarks((current) => [
      ...current.filter((mark) => mark.question_message_id !== incoming.question_message_id),
      incoming,
    ]);
  }, []);

  useEffect(() => {
    setIdentity(getDevIdentity());
    setNow(Date.now());
    const interval = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    let active = true;
    async function checkGateway() {
      try {
        const response = await fetch("/api/lounge/health", { cache: "no-store" });
        const data = await response.json() as { ready?: boolean };
        if (active) {
          setGatewayState(data.ready ? "ready" : "legacy");
        }
      } catch {
        if (active) {
          setGatewayState("legacy");
        }
      }
    }
    void checkGateway();
    return () => {
      active = false;
    };
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

      const activeMessages = (data ?? []) as LoungeMessage[];
      setMessages(activeMessages);

      if (activeMessages.length > 0) {
        const messageIds = activeMessages.map((message) => message.id);
        const [{ data: reactionData }, { data: answerMarkData }] = await Promise.all([
          client
            .from("lounge_reactions")
            .select("*")
            .in("message_id", messageIds)
            .order("created_at", { ascending: true }),
          isVerifiedGateway
            ? client
              .from("lounge_answer_marks")
              .select("*")
              .in("question_message_id", messageIds)
              .order("created_at", { ascending: true })
            : Promise.resolve({ data: [] as LoungeAnswerMark[] }),
        ]);
        if (isMounted) {
          setReactions((reactionData ?? []) as LoungeReactionRecord[]);
          setAnswerMarks((answerMarkData ?? []) as LoungeAnswerMark[]);
        }
      } else {
        setReactions([]);
        setAnswerMarks([]);
      }

      if (!isMounted) {
        return;
      }

      channel = client
        .channel("welcomescore-dev-lounge")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "lounge_messages" },
          (payload) => appendMessage(payload.new as LoungeMessage),
        )
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "lounge_reactions" },
          (payload) => appendReaction(payload.new as LoungeReactionRecord),
        );

      if (isVerifiedGateway) {
        channel
          .on(
            "postgres_changes",
            { event: "INSERT", schema: "public", table: "lounge_answer_marks" },
            (payload) => appendAnswerMark(payload.new as LoungeAnswerMark),
          )
          .on(
            "postgres_changes",
            { event: "DELETE", schema: "public", table: "lounge_answer_marks" },
            (payload) => {
              const removed = payload.old as Pick<LoungeAnswerMark, "question_message_id">;
              setAnswerMarks((current) => current.filter((mark) => mark.question_message_id !== removed.question_message_id));
            },
          );
      }

      channel
        .on("presence", { event: "sync" }, () => {
          if (channel) {
            setOnlineCount(countPresence(channel.presenceState()));
          }
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
  }, [appendAnswerMark, appendMessage, appendReaction, identity, isVerifiedGateway, supabase]);

  const prepareAuditDiscussion = useCallback(async ({ repo, focus }: { repo: string; focus?: string }) => {
    if (!identity || !isVerifiedGateway) {
      return { error: "Fresh-audit discussions are being connected. No message was posted.", prepared: null };
    }
    return prepareContext("/api/lounge/context/audit", {
      sessionHash: identity.sessionHash,
      repo,
      focus,
    });
  }, [identity, isVerifiedGateway]);

  const prepareHallDiscussion = useCallback(async ({ repo }: { repo: string }) => {
    if (!identity || !isVerifiedGateway) {
      return { error: "Hall-pattern discussions are being connected. No message was posted.", prepared: null };
    }
    return prepareContext("/api/lounge/context/hall", {
      sessionHash: identity.sessionHash,
      repo,
    });
  }, [identity, isVerifiedGateway]);

  const sendMessage = useCallback(async ({
    content,
    topic = "general",
    contextToken,
    replyTo,
    scoreCard,
  }: {
    content: string;
    topic?: LoungeTopic;
    contextToken?: string | null;
    replyTo?: LoungeReply;
    scoreCard?: LoungeScoreCard;
  }) => {
    if (!supabase || !identity) {
      return { error: "The Lounge is not configured yet." };
    }
    if (Date.now() < cooldownUntil) {
      return { error: "Please wait a moment before sending another message." };
    }

    const sanitizedContent = sanitizeLoungeContent(content);
    if ((!sanitizedContent && !scoreCard) || isBlockedLoungeContent(sanitizedContent)) {
      return { error: "Please rewrite that message and try again." };
    }

    if (isVerifiedGateway) {
      const outcome = await postJson("/api/lounge/messages", {
        sessionHash: identity.sessionHash,
        devHandle: identity.handle,
        avatarSeed: identity.sessionId,
        content: sanitizedContent,
        topic,
        contextToken,
        replyTo,
        clientRequestId: crypto.randomUUID(),
      });
      if (outcome.error) {
        return { error: outcome.error };
      }
      appendMessage(outcome.data.message as LoungeMessage);
    } else {
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
    }

    setCooldownUntil(Date.now() + COOLDOWN_MS);
    return { error: null };
  }, [appendMessage, cooldownUntil, identity, isVerifiedGateway, supabase]);

  const addReaction = useCallback(async ({ messageId, reaction }: { messageId: string; reaction: LoungeReaction }) => {
    if (!supabase || !identity) {
      return { error: "The Lounge is not configured yet." };
    }
    const existingReaction = reactions.find((record) => record.message_id === messageId && record.session_hash === identity.sessionHash);
    if (existingReaction) {
      return { error: "You have already reacted to this message." };
    }

    if (isVerifiedGateway) {
      const outcome = await postJson("/api/lounge/reactions", {
        sessionHash: identity.sessionHash,
        messageId,
        reaction,
      });
      if (outcome.error) {
        return { error: outcome.error };
      }
      if (outcome.data.reaction) {
        appendReaction(outcome.data.reaction as LoungeReactionRecord);
      }
    } else {
      const { data, error } = await supabase
        .from("lounge_reactions")
        .insert({ message_id: messageId, session_hash: identity.sessionHash, reaction })
        .select()
        .single();
      if (error) {
        return { error: error.code === "23505" ? "You have already reacted to this message." : "Unable to add that reaction right now." };
      }
      appendReaction(data as LoungeReactionRecord);
    }

    return { error: null };
  }, [appendReaction, identity, isVerifiedGateway, reactions, supabase]);

  const markAnswer = useCallback(async ({ questionMessageId, answerMessageId }: { questionMessageId: string; answerMessageId: string }) => {
    if (!identity || !isVerifiedGateway) {
      return { error: "Useful-answer marking is being connected." };
    }
    const outcome = await postJson("/api/lounge/answers", {
      sessionHash: identity.sessionHash,
      questionMessageId,
      answerMessageId,
    });
    if (outcome.error) {
      return { error: outcome.error };
    }
    appendAnswerMark(outcome.data.answerMark as LoungeAnswerMark);
    return { error: null };
  }, [appendAnswerMark, identity, isVerifiedGateway]);

  const clearAnswerMark = useCallback(async ({ questionMessageId }: { questionMessageId: string }) => {
    if (!identity || !isVerifiedGateway) {
      return { error: "Useful-answer marking is being connected." };
    }
    const outcome = await deleteJson("/api/lounge/answers", {
      sessionHash: identity.sessionHash,
      questionMessageId,
    });
    if (outcome.error) {
      return { error: outcome.error };
    }
    setAnswerMarks((current) => current.filter((mark) => mark.question_message_id !== questionMessageId));
    return { error: null };
  }, [identity, isVerifiedGateway]);

  const reportMessage = useCallback(async ({ messageId, reason, detail }: { messageId: string; reason: LoungeReportReason; detail?: string }) => {
    if (!identity || !isVerifiedGateway) {
      return { error: "Private reporting is being connected." };
    }
    const outcome = await postJson("/api/lounge/reports", {
      sessionHash: identity.sessionHash,
      messageId,
      reason,
      detail,
    });
    return { error: outcome.error };
  }, [identity, isVerifiedGateway]);

  return {
    identity,
    messages,
    reactions,
    answerMarks,
    onlineCount,
    status,
    gatewayState,
    isVerifiedGateway,
    cooldownRemaining: Math.max(0, Math.ceil((cooldownUntil - now) / 1000)),
    sendMessage,
    addReaction,
    markAnswer,
    clearAnswerMark,
    reportMessage,
    prepareAuditDiscussion,
    prepareHallDiscussion,
  };
}

async function prepareContext(path: string, body: Record<string, unknown>) {
  const outcome = await postJson(path, body);
  if (outcome.error) {
    return { error: outcome.error, prepared: null };
  }
  return { error: null, prepared: outcome.data as LoungePreparedContext };
}

async function postJson(path: string, body: Record<string, unknown>) {
  try {
    const response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const data = response.status === 204 ? {} : await response.json() as Record<string, unknown>;
    return { error: response.ok ? null : typeof data.error === "string" ? data.error : "Unable to complete that Lounge action right now.", data };
  } catch {
    return { error: "Unable to complete that Lounge action right now.", data: {} as Record<string, unknown> };
  }
}

async function deleteJson(path: string, body: Record<string, unknown>) {
  try {
    const response = await fetch(path, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    if (response.ok) {
      return { error: null };
    }
    const data = await response.json() as { error?: string };
    return { error: data.error ?? "Unable to complete that Lounge action right now." };
  } catch {
    return { error: "Unable to complete that Lounge action right now." };
  }
}

function countPresence(state: Record<string, unknown[]>) {
  return Object.values(state).reduce((total, presences) => total + presences.length, 0);
}

function getPetReaction(score: number): PetReaction | null {
  if (score < 50) {
    return {
      pet: "algofox",
      quote: "The contributor path needs attention. Start with the clearest missing check and build upward.",
    };
  }
  if (score > 85) {
    return {
      pet: "algofox",
      quote: "High contributor readiness detected. Recommendation: keep the welcome path well maintained.",
    };
  }
  return null;
}

"use client";

import Link from "next/link";
import { FormEvent, PointerEvent, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import BackButton from "@/app/components/BackButton";
import WelcomeScoreWordmark from "@/app/components/WelcomeScoreWordmark";
import { getAlgofoxMessage } from "@/app/components/pet/algofoxMessages";
import AlgofoxSprite from "@/app/components/pet/AlgofoxSprite";
import { useAlgofoxPet } from "@/app/components/pet/AlgofoxPetProvider";
import { createDevAvatar } from "@/lib/devIdentity";
import {
  useDevLounge,
  type LoungeMessage,
  type LoungeReaction,
  type LoungeReactionRecord,
  type LoungeReply,
  type LoungeScoreCard,
} from "@/hooks/useDevLounge";

const FOLLOW_THRESHOLD_PX = 96;
const REACTION_OPTIONS: Record<LoungeReaction, { icon: string; label: string }> = {
  thumbs_up: { icon: "👍", label: "Helpful" },
  lightbulb: { icon: "💡", label: "Insightful" },
  tada: { icon: "🎉", label: "Celebrate" },
  eyes: { icon: "👀", label: "Following" },
};

export default function DevLoungePage() {
  return (
    <Suspense fallback={<LoungeLoadingState />}>
      <DevLoungeContent />
    </Suspense>
  );
}

function DevLoungeContent() {
  const searchParams = useSearchParams();
  const sharedScore = useMemo(() => scoreCardFromSearchParams(searchParams), [searchParams]);
  const {
    identity,
    messages,
    reactions,
    onlineCount,
    status,
    cooldownRemaining,
    sendMessage,
    addReaction,
  } = useDevLounge();
  const { state: algofoxState, setAlgofoxState } = useAlgofoxPet();
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [selectedScore, setSelectedScore] = useState<LoungeScoreCard | null>(null);
  const [attachedScore, setAttachedScore] = useState<LoungeScoreCard | null>(null);
  const [replyingTo, setReplyingTo] = useState<LoungeReply | null>(null);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [reactionPickerMessageId, setReactionPickerMessageId] = useState<string | null>(null);
  const [reactionError, setReactionError] = useState("");
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const chatViewportRef = useRef<HTMLDivElement>(null);
  const hasInitializedScrollRef = useRef(false);
  const wasNearBottomRef = useRef(true);
  const knownMessageIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (sharedScore) {
      setAttachedScore(sharedScore);
      setDraft("Just checked my project health score!");
    }
  }, [sharedScore]);

  useEffect(() => {
    if (replyingTo) {
      messageInputRef.current?.focus();
    }
  }, [replyingTo]);

  const scrollToLatest = useCallback((behavior: ScrollBehavior = preferredScrollBehavior()) => {
    const viewport = chatViewportRef.current;
    if (!viewport) {
      return;
    }

    viewport.scrollTo({ top: viewport.scrollHeight, behavior });
    wasNearBottomRef.current = true;
    setUnreadMessageCount(0);
  }, []);

  function handleChatScroll() {
    const viewport = chatViewportRef.current;
    if (!viewport) {
      return;
    }

    wasNearBottomRef.current = isNearChatBottom(viewport);
    if (wasNearBottomRef.current) {
      setUnreadMessageCount(0);
    }
  }

  useEffect(() => {
    if (status !== "ready" || messages.length === 0) {
      return;
    }

    const currentMessageIds = new Set(messages.map((message) => message.id));
    const newlyReceivedMessages = messages.filter((message) => !knownMessageIdsRef.current.has(message.id));

    if (!hasInitializedScrollRef.current) {
      hasInitializedScrollRef.current = true;
      knownMessageIdsRef.current = currentMessageIds;
      const frame = window.requestAnimationFrame(() => scrollToLatest("auto"));
      return () => window.cancelAnimationFrame(frame);
    }

    knownMessageIdsRef.current = currentMessageIds;
    if (newlyReceivedMessages.length === 0) {
      return;
    }

    if (wasNearBottomRef.current) {
      const frame = window.requestAnimationFrame(() => scrollToLatest());
      return () => window.cancelAnimationFrame(frame);
    }

    setUnreadMessageCount((count) => count + newlyReceivedMessages.length);
  }, [messages, scrollToLatest, status]);

  const reactionsByMessage = useMemo(() => groupReactionsByMessage(reactions), [reactions]);

  const statusLabel = useMemo(() => {
    if (status === "ready") {
      return `${Math.max(onlineCount, 1)} developer${Math.max(onlineCount, 1) === 1 ? "" : "s"} active`;
    }

    if (status === "connecting") {
      return "Connecting…";
    }

    return "Setup required";
  }, [onlineCount, status]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const outcome = await sendMessage({
      content: draft,
      scoreCard: attachedScore ?? undefined,
      replyTo: replyingTo ?? undefined,
    });
    if (outcome.error) {
      setError(outcome.error);
      return;
    }

    setDraft("");
    setAttachedScore(null);
    setReplyingTo(null);
    setAlgofoxState(
      "waving",
      getAlgofoxMessage(attachedScore ? "loungeScoreSent" : "loungeMessageSent"),
      4_000,
    );
    scrollToLatest();
  }

  function selectReply(message: LoungeMessage) {
    setReplyingTo(replySnapshotFromMessage(message));
    setError("");
  }

  async function handleReaction(messageId: string, reaction: LoungeReaction) {
    setReactionError("");
    const outcome = await addReaction({ messageId, reaction });
    if (outcome.error) {
      setReactionError(outcome.error);
      return;
    }

    setReactionPickerMessageId(null);
  }

  return (
    <main className="flex min-h-screen flex-1 flex-col bg-base px-4 py-8 text-text sm:px-6 sm:py-12">
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col">
        <header className="flex flex-col gap-5 border-b border-muted/20 pb-7 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-accent">
              Anonymous community chat
            </p>
            <h1 className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-3xl sm:text-5xl">
              <WelcomeScoreWordmark badgeClassName="sm:mt-1.5" />
              <span className="font-mono font-bold tracking-tight">Dev Lounge</span>
            </h1>
            <p className="mt-3 max-w-2xl font-sans text-sm leading-6 text-muted sm:text-base">
              A temporary space for first-contributor questions, score celebrations, and practical open-source encouragement.
              Messages disappear after 24 hours.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <BackButton />
            <Link
              href="/"
              className="inline-flex h-10 items-center justify-center rounded-md border border-accent/45 bg-accent/10 px-4 font-sans text-sm font-medium text-accent transition-colors duration-180 ease-out hover:bg-accent/15"
            >
              Check a repository
            </Link>
          </div>
        </header>

        <section className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
          <div className="rounded-lg border border-muted/25 bg-surface">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-muted/20 px-5 py-4">
              <div className="flex items-center gap-3">
                <AlgofoxSprite state={algofoxState} size={42} />
                <div>
                  <h2 className="font-mono text-sm font-bold">Live developer chat</h2>
                  <p className="mt-1 font-sans text-xs text-muted">Algofox helps keep it constructive. Never share secrets or personal data.</p>
                </div>
              </div>
              <span className={`inline-flex items-center gap-2 rounded-md border px-2.5 py-1 font-mono text-xs ${
                status === "ready" ? "border-good/45 bg-good/10 text-good" : "border-muted/30 text-muted"
              }`}>
                <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
                {statusLabel}
              </span>
            </div>

            <div className="relative">
              <div
                ref={chatViewportRef}
                onScroll={handleChatScroll}
                className="min-h-[380px] max-h-[58vh] overflow-y-auto px-5 py-5"
                aria-live="polite"
              >
                {status === "unavailable" ? <SetupState /> : null}
                {status !== "unavailable" && messages.length === 0 ? <EmptyLoungeState /> : null}
                {status !== "unavailable" ? (
                  <div className="space-y-5">
                    {messages.map((message) => (
                      <MessageItem
                        key={message.id}
                        message={message}
                        onOpenScore={setSelectedScore}
                        onReply={selectReply}
                        isReplyTarget={replyingTo?.id === message.id}
                        reactions={reactionsByMessage.get(message.id) ?? []}
                        ownReaction={reactions.find(
                          (reaction) => reaction.message_id === message.id && reaction.session_hash === identity?.sessionHash,
                        )?.reaction ?? null}
                        isReactionPickerOpen={reactionPickerMessageId === message.id}
                        reactionError={reactionPickerMessageId === message.id ? reactionError : ""}
                        onToggleReactionPicker={() => {
                          setReactionError("");
                          setReactionPickerMessageId((current) => current === message.id ? null : message.id);
                        }}
                        onReact={handleReaction}
                      />
                    ))}
                  </div>
                ) : null}
              </div>
              {unreadMessageCount > 0 ? (
                <button
                  type="button"
                  onClick={() => scrollToLatest()}
                  className="absolute bottom-4 left-1/2 z-10 inline-flex -translate-x-1/2 items-center gap-2 rounded-md border border-accent/45 bg-surface px-3 py-2 font-mono text-xs font-semibold text-accent shadow-lg transition-colors duration-180 ease-out hover:bg-accent/10 focus:bg-accent/10"
                  aria-label={`Jump to ${unreadMessageCount} new ${unreadMessageCount === 1 ? "message" : "messages"}`}
                >
                  <span aria-hidden="true">↓</span>
                  {unreadMessageCount} new {unreadMessageCount === 1 ? "message" : "messages"}
                </button>
              ) : null}
            </div>

            <form className="border-t border-muted/20 p-4" onSubmit={handleSubmit}>
              <label className="sr-only" htmlFor="lounge-message">Send a message</label>
              {replyingTo ? (
                <div className="mb-3 flex items-start justify-between gap-3 rounded-md border border-accent/35 border-l-2 bg-accent/10 px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="font-mono text-xs font-semibold text-accent">Replying to {replyingTo.dev_handle}</p>
                    <p className="mt-1 truncate font-sans text-xs text-muted">{replyingTo.content}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setReplyingTo(null)}
                    className="text-link shrink-0 font-mono text-lg leading-none"
                    aria-label="Cancel reply"
                  >
                    ×
                  </button>
                </div>
              ) : null}
              {attachedScore ? (
                <div className="mb-3 flex items-start justify-between gap-3 rounded-md border border-accent/35 bg-accent/10 px-3 py-2 font-sans text-xs text-muted">
                  <p>
                    Your score card for <span className="font-mono text-text">{attachedScore.repo}</span> will be attached to this message.
                  </p>
                  <button
                    type="button"
                    onClick={() => setAttachedScore(null)}
                    className="text-link shrink-0 font-mono text-lg leading-none"
                    aria-label="Remove attached score card"
                  >
                    ×
                  </button>
                </div>
              ) : null}
              <textarea
                ref={messageInputRef}
                id="lounge-message"
                value={draft}
                onChange={(event) => setDraft(event.target.value.slice(0, 300))}
                onFocus={() => setAlgofoxState("waving", getAlgofoxMessage("loungeFocus"), 3_500)}
                placeholder="Ask a contributor question or share a small win…"
                rows={3}
                disabled={status !== "ready"}
                className="w-full resize-none rounded-md border border-muted/35 bg-base/40 px-3 py-3 font-sans text-sm text-text outline-none placeholder:text-muted focus:border-accent disabled:cursor-not-allowed disabled:opacity-60"
              />
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-mono text-xs text-muted">{draft.length}/300</p>
                  {error ? <p className="mt-1 font-sans text-xs text-muted">{error}</p> : null}
                </div>
                <button
                  type="submit"
                  disabled={status !== "ready" || cooldownRemaining > 0 || draft.trim().length === 0}
                  className="h-10 rounded-md border border-accent/45 bg-accent/10 px-4 font-sans text-sm font-medium text-accent transition-colors duration-180 ease-out hover:bg-accent/15 disabled:cursor-not-allowed disabled:border-muted/30 disabled:bg-base/30 disabled:text-muted"
                >
                  {cooldownRemaining > 0 ? `Send in ${cooldownRemaining}s` : "Send message"}
                </button>
              </div>
            </form>
          </div>

          <aside className="space-y-4">
            <section className="rounded-lg border border-muted/25 bg-surface p-5">
              <h2 className="font-mono text-sm font-bold">Your temporary handle</h2>
              {identity ? (
                <div className="mt-4 flex items-center gap-3">
                  <img
                    src={identity.avatarDataUri}
                    alt="Your generated developer avatar"
                    className="h-12 w-12 rounded-full border border-muted/30 bg-base"
                  />
                  <div className="min-w-0">
                    <p className="truncate font-mono text-sm font-semibold text-accent">{identity.handle}</p>
                    <p className="mt-1 font-sans text-xs leading-5 text-muted">Stored only in this browser until you clear site data.</p>
                  </div>
                </div>
              ) : (
                <p className="mt-3 font-sans text-sm text-muted">Generating your anonymous handle…</p>
              )}
            </section>

            <section className="rounded-lg border border-muted/25 bg-surface p-5">
              <h2 className="font-mono text-sm font-bold">Lounge norms</h2>
              <ul className="mt-3 space-y-2 font-sans text-sm leading-6 text-muted">
                <li>Keep messages practical and welcoming.</li>
                <li>Do not post credentials, tokens, or private links.</li>
                <li>Messages are limited to 300 characters.</li>
                <li>Each message has a short cooldown.</li>
              </ul>
            </section>
          </aside>
        </section>
      </div>

      {selectedScore ? <ScorePreview scoreCard={selectedScore} onClose={() => setSelectedScore(null)} /> : null}
    </main>
  );
}

function groupReactionsByMessage(reactions: LoungeReactionRecord[]) {
  const grouped = new Map<string, LoungeReactionRecord[]>();

  reactions.forEach((reaction) => {
    const messageReactions = grouped.get(reaction.message_id) ?? [];
    messageReactions.push(reaction);
    grouped.set(reaction.message_id, messageReactions);
  });

  return grouped;
}

function summarizeReactions(reactions: LoungeReactionRecord[]) {
  return Object.keys(REACTION_OPTIONS)
    .map((reaction) => {
      const typedReaction = reaction as LoungeReaction;
      return {
        reaction: typedReaction,
        count: reactions.filter((entry) => entry.reaction === typedReaction).length,
      };
    })
    .filter(({ count }) => count > 0);
}

function isNearChatBottom(viewport: HTMLElement) {
  return viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight <= FOLLOW_THRESHOLD_PX;
}

function preferredScrollBehavior(): ScrollBehavior {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
}

function LoungeLoadingState() {
  return (
    <main className="flex min-h-screen flex-1 items-center justify-center bg-base px-4 text-text">
      <p className="font-mono text-sm text-muted">Opening the Dev Lounge…</p>
    </main>
  );
}

function MessageItem({
  message,
  onOpenScore,
  onReply,
  isReplyTarget,
  reactions,
  ownReaction,
  isReactionPickerOpen,
  reactionError,
  onToggleReactionPicker,
  onReact,
}: {
  message: LoungeMessage;
  onOpenScore: (scoreCard: LoungeScoreCard) => void;
  onReply: (message: LoungeMessage) => void;
  isReplyTarget: boolean;
  reactions: LoungeReactionRecord[];
  ownReaction: LoungeReaction | null;
  isReactionPickerOpen: boolean;
  reactionError: string;
  onToggleReactionPicker: () => void;
  onReact: (messageId: string, reaction: LoungeReaction) => Promise<void>;
}) {
  const longPressTimer = useRef<number | null>(null);
  const pointerStart = useRef<{ x: number; y: number } | null>(null);

  function clearReplyGesture() {
    if (longPressTimer.current !== null) {
      window.clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }

  function handlePointerDown(event: PointerEvent<HTMLElement>) {
    if (event.pointerType === "mouse") {
      return;
    }

    pointerStart.current = { x: event.clientX, y: event.clientY };
    longPressTimer.current = window.setTimeout(() => {
      onReply(message);
      window.navigator.vibrate?.(12);
      clearReplyGesture();
    }, 450);
  }

  function handlePointerMove(event: PointerEvent<HTMLElement>) {
    if (!pointerStart.current) {
      return;
    }

    const movedX = Math.abs(event.clientX - pointerStart.current.x);
    const movedY = Math.abs(event.clientY - pointerStart.current.y);
    if (movedX > 12 || movedY > 12) {
      clearReplyGesture();
    }
  }

  function handlePointerUp(event: PointerEvent<HTMLElement>) {
    const start = pointerStart.current;
    pointerStart.current = null;
    clearReplyGesture();

    if (!start) {
      return;
    }

    const movedX = event.clientX - start.x;
    const movedY = event.clientY - start.y;
    if (Math.abs(movedX) >= 56 && Math.abs(movedX) > Math.abs(movedY)) {
      onReply(message);
    }
  }

  return (
    <article
      className={`group -mx-2 flex gap-3 rounded-md px-2 py-1 transition-colors duration-180 ease-out ${
        isReplyTarget ? "bg-accent/[0.07]" : "hover:bg-base/30"
      }`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => {
        pointerStart.current = null;
        clearReplyGesture();
      }}
    >
      <img
        src={createDevAvatar(message.avatar_seed)}
        alt=""
        className="h-9 w-9 shrink-0 rounded-full border border-muted/30 bg-base"
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <p className="font-mono text-xs font-semibold text-accent">{message.dev_handle}</p>
          <time className="font-sans text-xs text-muted" dateTime={message.created_at}>
            {formatMessageTime(message.created_at)}
          </time>
        </div>
        {message.reply_to ? (
          <div className="mt-2 rounded-md border border-muted/30 border-l-2 border-l-accent/60 bg-base/35 px-3 py-2">
            <p className="font-mono text-xs font-semibold text-accent">Replying to {message.reply_to.dev_handle}</p>
            <p className="mt-1 max-h-10 overflow-hidden break-words font-sans text-xs leading-5 text-muted">{message.reply_to.content}</p>
          </div>
        ) : null}
        {message.content ? <p className="mt-1 break-words font-sans text-sm leading-6 text-text">{message.content}</p> : null}
        {message.score_card ? (
          <button
            type="button"
            onClick={() => {
              if (message.score_card) {
                onOpenScore(message.score_card);
              }
            }}
            className="mt-3 block w-full rounded-md border border-accent/35 bg-accent/10 p-3 text-left transition-colors duration-180 ease-out hover:bg-accent/15"
          >
            <span className="font-mono text-xs uppercase tracking-[0.15em] text-accent">Shared WelcomeScore</span>
            <span className="mt-2 flex items-end justify-between gap-3">
              <span className="min-w-0">
                <span className="block truncate font-mono text-sm font-semibold text-text">{message.score_card.repo}</span>
                <span className="mt-1 block font-sans text-xs text-muted">{message.score_card.summary}</span>
              </span>
              <span className="shrink-0 font-mono text-2xl font-bold text-accent">{message.score_card.score}</span>
            </span>
          </button>
        ) : null}
        {message.pet_reaction ? (
          <p className="mt-3 border-l-2 border-muted/35 pl-3 font-sans text-xs leading-5 text-muted">
            <span className="font-mono font-semibold text-accent">{petName(message.pet_reaction.pet)}:</span>{" "}
            {message.pet_reaction.quote}
          </p>
        ) : null}
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {summarizeReactions(reactions).map(({ reaction, count }) => (
            <span
              key={reaction}
              className={`inline-flex h-7 items-center gap-1 rounded-md border px-2 font-mono text-xs ${
                ownReaction === reaction
                  ? "border-accent/45 bg-accent/10 text-accent"
                  : "border-muted/25 bg-base/25 text-muted"
              }`}
              title={`${count} ${REACTION_OPTIONS[reaction].label.toLowerCase()} reaction${count === 1 ? "" : "s"}`}
            >
              <span aria-hidden="true">{REACTION_OPTIONS[reaction].icon}</span>
              <span>{count}</span>
            </span>
          ))}
          {ownReaction ? (
            <span className="font-sans text-xs text-muted">Reaction added</span>
          ) : (
            <button
              type="button"
              onClick={onToggleReactionPicker}
              onPointerDown={(event) => event.stopPropagation()}
              onPointerUp={(event) => event.stopPropagation()}
              className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-muted/30 bg-base/25 font-mono text-sm text-muted transition-colors duration-180 ease-out hover:border-accent/45 hover:bg-accent/10 hover:text-accent focus:border-accent/45 focus:bg-accent/10 focus:text-accent"
              aria-label={`Add a reaction to ${message.dev_handle}'s message`}
              aria-expanded={isReactionPickerOpen}
            >
              +
            </button>
          )}
        </div>
        {isReactionPickerOpen ? (
          <div className="mt-2 flex flex-wrap items-center gap-1.5 rounded-md border border-muted/25 bg-base/35 p-2" role="group" aria-label="Choose one reaction">
            {Object.entries(REACTION_OPTIONS).map(([reaction, option]) => (
              <button
                key={reaction}
                type="button"
                onClick={() => void onReact(message.id, reaction as LoungeReaction)}
                onPointerDown={(event) => event.stopPropagation()}
                onPointerUp={(event) => event.stopPropagation()}
                className="inline-flex h-8 min-w-8 items-center justify-center rounded-md border border-muted/25 bg-surface px-2 text-base transition-colors duration-180 ease-out hover:border-accent/45 hover:bg-accent/10 focus:border-accent/45 focus:bg-accent/10"
                aria-label={option.label}
                title={option.label}
              >
                {option.icon}
              </button>
            ))}
            {reactionError ? <p className="basis-full px-1 pt-1 font-sans text-xs text-muted">{reactionError}</p> : null}
          </div>
        ) : null}
        <button
          type="button"
          onClick={() => onReply(message)}
          onPointerDown={(event) => event.stopPropagation()}
          onPointerUp={(event) => event.stopPropagation()}
          className="mt-2 inline-flex h-7 items-center rounded-md px-2 font-mono text-xs text-muted transition-colors duration-180 ease-out hover:bg-accent/10 hover:text-accent focus:bg-accent/10 focus:text-accent sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
          aria-label={`Reply to ${message.dev_handle}`}
        >
          Reply
        </button>
      </div>
    </article>
  );
}

function EmptyLoungeState() {
  return (
    <div className="flex min-h-[340px] items-center justify-center text-center">
      <div className="max-w-sm">
        <p className="font-mono text-sm font-semibold">The lounge is quiet for now.</p>
        <p className="mt-2 font-sans text-sm leading-6 text-muted">Start the conversation with a contributor question or share a score from your latest repository audit.</p>
      </div>
    </div>
  );
}

function SetupState() {
  return (
    <div className="flex min-h-[340px] items-center justify-center text-center">
      <div className="max-w-md">
        <p className="font-mono text-sm font-semibold">The Dev Lounge is being connected.</p>
        <p className="mt-2 font-sans text-sm leading-6 text-muted">Realtime chat will become available after the public Supabase connection and lounge migration are configured.</p>
      </div>
    </div>
  );
}

function ScorePreview({
  scoreCard,
  onClose,
}: {
  scoreCard: LoungeScoreCard;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-base/80 p-4" onMouseDown={onClose}>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="shared-score-title"
        className="w-full max-w-md rounded-lg border border-muted/25 bg-surface p-6 shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-accent">Lounge score card</p>
            <h2 id="shared-score-title" className="mt-2 break-all font-mono text-lg font-bold">{scoreCard.repo}</h2>
          </div>
          <button type="button" className="text-link text-xl leading-none" onClick={onClose} aria-label="Close score preview">×</button>
        </div>
        <div className="mt-6 rounded-md border border-accent/35 bg-accent/10 p-5">
          <p className="font-mono text-5xl font-bold text-accent">{scoreCard.score}<span className="ml-2 text-2xl text-text">{scoreCard.grade}</span></p>
          <p className="mt-4 font-sans text-sm leading-6 text-muted">{scoreCard.summary}</p>
        </div>
      </section>
    </div>
  );
}

function replySnapshotFromMessage(message: LoungeMessage): LoungeReply {
  return {
    id: message.id,
    dev_handle: message.dev_handle,
    content: message.content || "Shared a WelcomeScore score card.",
    created_at: message.created_at,
  };
}

function scoreCardFromSearchParams(searchParams: ReturnType<typeof useSearchParams>): LoungeScoreCard | null {
  const repo = searchParams.get("repo");
  const rawScore = searchParams.get("score");
  const grade = searchParams.get("grade");
  const score = rawScore ? Number(rawScore) : Number.NaN;

  if (!repo || !grade || !Number.isInteger(score) || score < 0 || score > 100) {
    return null;
  }

  return {
    repo,
    score,
    grade,
    summary: `Shared from a WelcomeScore contributor-health audit: ${score}/100, grade ${grade}.`,
  };
}

function petName(pet: string) {
  // Accept the stored companion value without exposing a legacy identity in the UI.
  void pet;
  // Older 24-hour Lounge rows can contain pre-Algofox companion labels.
  // This display-only normalization preserves the user message while ensuring
  // the product presents one consistent mascot identity.
  return "Algofox";
}

function formatMessageTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

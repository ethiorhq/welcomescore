"use client";

import Link from "next/link";
import { FormEvent, PointerEvent, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import BackButton from "@/app/components/BackButton";
import LoungeTurnstile from "@/app/components/LoungeTurnstile";
import WelcomeScoreWordmark from "@/app/components/WelcomeScoreWordmark";
import { getAlgofoxMessage } from "@/app/components/pet/algofoxMessages";
import AlgofoxSprite from "@/app/components/pet/AlgofoxSprite";
import { useAlgofoxPet } from "@/app/components/pet/AlgofoxPetProvider";
import { createDevAvatar } from "@/lib/devIdentity";
import {
  LOUNGE_REPORT_REASONS,
  LOUNGE_TOPIC_DETAILS,
  requiresPreparedContext,
} from "@/lib/loungeTypes";
import type {
  LoungeAnswerMark,
  LoungeCommunityContext,
  LoungePreparedContext,
  LoungeReportReason,
  LoungeTopic,
} from "@/lib/loungeTypes";
import {
  useDevLounge,
  type LoungeMessage,
  type LoungeReaction,
  type LoungeReactionRecord,
  type LoungeReply,
  type LoungeScoreCard,
} from "@/hooks/useDevLounge";

const FOLLOW_THRESHOLD_PX = 96;
const HIDDEN_MESSAGES_KEY = "welcomescore.dev-lounge.hidden-message-ids";
const REACTION_OPTIONS: Record<LoungeReaction, { icon: string; label: string }> = {
  thumbs_up: { icon: "👍", label: "Helpful" },
  lightbulb: { icon: "💡", label: "Insightful" },
  tada: { icon: "🎉", label: "Celebrate" },
  eyes: { icon: "👀", label: "Following" },
};

type ConversationTopic = Exclude<LoungeTopic, "general">;
type LoungeFilter = "all" | ConversationTopic;

const FILTERS: Array<{ key: LoungeFilter; label: string }> = [
  { key: "all", label: "All" },
  { key: "contributor_question", label: "Questions" },
  { key: "audit_discussion", label: "Fresh audits" },
  { key: "small_win", label: "Small wins" },
  { key: "hall_pattern", label: "Hall patterns" },
];

export default function DevLoungePage() {
  return (
    <Suspense fallback={<LoungeLoadingState />}>
      <DevLoungeContent />
    </Suspense>
  );
}

function DevLoungeContent() {
  const searchParams = useSearchParams();
  const incomingAuditRepo = validRepository(searchParams?.get("prepareAudit") ?? searchParams?.get("repo") ?? null);
  const incomingHallRepo = validRepository(searchParams?.get("hallRepo") ?? null);
  const incomingFocus = searchParams?.get("focus") ?? null;
  const {
    identity,
    messages,
    reactions,
    answerMarks,
    onlineCount,
    status,
    gatewayState,
    isVerifiedGateway,
    verification,
    refreshVerification,
    cooldownRemaining,
    sendMessage,
    addReaction,
    markAnswer,
    clearAnswerMark,
    reportMessage,
    prepareAuditDiscussion,
    prepareHallDiscussion,
  } = useDevLounge();
  const { state: algofoxState, setAlgofoxState } = useAlgofoxPet();
  const [draft, setDraft] = useState("");
  const [topic, setTopic] = useState<ConversationTopic>(incomingHallRepo ? "hall_pattern" : incomingAuditRepo ? "audit_discussion" : "contributor_question");
  const [contextRepo, setContextRepo] = useState(incomingHallRepo ?? incomingAuditRepo ?? "");
  const [preparedContext, setPreparedContext] = useState<LoungePreparedContext | null>(null);
  const [replyingTo, setReplyingTo] = useState<LoungeReply | null>(null);
  const [selectedScore, setSelectedScore] = useState<LoungeScoreCard | null>(null);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [reactionPickerMessageId, setReactionPickerMessageId] = useState<string | null>(null);
  const [hiddenMessageIds, setHiddenMessageIds] = useState<Set<string>>(() => new Set());
  const [reportingMessage, setReportingMessage] = useState<LoungeMessage | null>(null);
  const [pendingReplyJumpId, setPendingReplyJumpId] = useState<string | null>(null);
  const [jumpedMessageId, setJumpedMessageId] = useState<string | null>(null);
  const [jumpAnnouncement, setJumpAnnouncement] = useState("");
  const [filter, setFilter] = useState<LoungeFilter>("all");
  const [isPreparingContext, setIsPreparingContext] = useState(false);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [messageTurnstileToken, setMessageTurnstileToken] = useState<string | null>(null);
  const [messageHoneypot, setMessageHoneypot] = useState("");
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const chatViewportRef = useRef<HTMLDivElement>(null);
  const hasInitializedScrollRef = useRef(false);
  const wasNearBottomRef = useRef(true);
  const knownMessageIdsRef = useRef<Set<string>>(new Set());
  const messageElementsRef = useRef(new Map<string, HTMLElement>());
  const jumpReturnFocusRef = useRef<HTMLButtonElement | null>(null);
  const jumpHighlightTimerRef = useRef<number | null>(null);

  useEffect(() => {
    try {
      const stored = JSON.parse(window.localStorage.getItem(HIDDEN_MESSAGES_KEY) ?? "[]") as unknown;
      if (Array.isArray(stored)) {
        setHiddenMessageIds(new Set(stored.filter((value): value is string => typeof value === "string").slice(-100)));
      }
    } catch {
      setHiddenMessageIds(new Set());
    }
  }, []);

  useEffect(() => {
    if (replyingTo) {
      messageInputRef.current?.focus();
    }
  }, [replyingTo]);

  useEffect(() => () => {
    if (jumpHighlightTimerRef.current !== null) {
      window.clearTimeout(jumpHighlightTimerRef.current);
    }
  }, []);

  useEffect(() => {
    if (gatewayState === "legacy" && !isVerifiedGateway && requiresPreparedContext(topic)) {
      setTopic("contributor_question");
      setPreparedContext(null);
    }
  }, [gatewayState, isVerifiedGateway, topic]);

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

  const messagesById = useMemo(() => new Map(messages.map((message) => [message.id, message])), [messages]);
  const reactionsByMessage = useMemo(() => groupReactionsByMessage(reactions), [reactions]);
  const answerMarksByQuestion = useMemo(() => new Map(answerMarks.map((mark) => [mark.question_message_id, mark])), [answerMarks]);
  const visibleMessages = useMemo(() => messages.filter((message) => {
    if (hiddenMessageIds.has(message.id)) {
      return false;
    }
    return matchesLoungeFilter(message, filter, messagesById);
  }), [filter, hiddenMessageIds, messages, messagesById]);

  const registerMessageElement = useCallback((messageId: string, element: HTMLElement | null) => {
    if (element) {
      messageElementsRef.current.set(messageId, element);
    } else {
      messageElementsRef.current.delete(messageId);
    }
  }, []);

  useEffect(() => {
    if (!pendingReplyJumpId) {
      return;
    }
    const frame = window.requestAnimationFrame(() => {
      const target = messageElementsRef.current.get(pendingReplyJumpId);
      if (!target) {
        setActionError("The original message is no longer available in this temporary Lounge view.");
        setJumpAnnouncement("The original message is no longer available.");
        setPendingReplyJumpId(null);
        return;
      }

      target.scrollIntoView({ block: "center", behavior: preferredScrollBehavior() });
      target.focus({ preventScroll: true });
      setJumpedMessageId(pendingReplyJumpId);
      setJumpAnnouncement("Moved to the original message.");
      setPendingReplyJumpId(null);
      if (jumpHighlightTimerRef.current !== null) {
        window.clearTimeout(jumpHighlightTimerRef.current);
      }
      jumpHighlightTimerRef.current = window.setTimeout(() => {
        setJumpedMessageId(null);
        jumpReturnFocusRef.current?.focus();
        jumpReturnFocusRef.current = null;
        jumpHighlightTimerRef.current = null;
      }, 2_200);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [pendingReplyJumpId, visibleMessages]);

  const statusLabel = useMemo(() => {
    if (status === "ready") {
      return `${Math.max(onlineCount, 1)} developer${Math.max(onlineCount, 1) === 1 ? "" : "s"} active`;
    }
    if (status === "connecting") {
      return "Connecting…";
    }
    return "Setup required";
  }, [onlineCount, status]);

  const topicOptions = (isVerifiedGateway
    ? Object.keys(LOUNGE_TOPIC_DETAILS)
    : ["contributor_question", "small_win"]) as ConversationTopic[];
  const topicDetail = LOUNGE_TOPIC_DETAILS[topic];
  const needsContext = requiresPreparedContext(topic);
  const contextKindMatches = !needsContext
    || (topic === "audit_discussion" && preparedContext?.context.kind === "audit")
    || (topic === "hall_pattern" && preparedContext?.context.kind === "hall");
  const canSend = status === "ready"
    && gatewayState !== "upgrade_required"
    && cooldownRemaining === 0
    && draft.trim().length > 0
    && (!needsContext || contextKindMatches)
    && (!isVerifiedGateway || Boolean(verification?.proof))
    && (!verification?.turnstile.enabled || Boolean(messageTurnstileToken));

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setActionError("");
    const outcome = await sendMessage({
      content: draft,
      topic,
      contextToken: preparedContext?.token,
      replyTo: replyingTo ?? undefined,
      turnstileToken: messageTurnstileToken,
      website: messageHoneypot,
    });
    if (outcome.error) {
      setError(outcome.error);
      return;
    }

    setDraft("");
    setReplyingTo(null);
    setPreparedContext(null);
    setMessageTurnstileToken(null);
    void refreshVerification();
    setAlgofoxState("waving", getAlgofoxMessage("loungeMessageSent"), 4_000);
    scrollToLatest();
  }

  function selectReply(message: LoungeMessage) {
    const mention = `@${message.dev_handle} `;
    setReplyingTo(replySnapshotFromMessage(message));
    setDraft((current) => {
      const previousReplyMention = current.match(/^@[A-Za-z][A-Za-z0-9_]+\s+/)?.[0] ?? "";
      const remaining = previousReplyMention ? current.slice(previousReplyMention.length) : current;
      return `${mention}${remaining}`.slice(0, 300);
    });
    setError("");
  }

  function jumpToReplySource(reply: LoungeReply, trigger: HTMLButtonElement) {
    const source = messagesById.get(reply.id);
    setActionError("");
    jumpReturnFocusRef.current = trigger;

    if (!source) {
      setActionError("The original message has expired or is no longer available in this temporary Lounge.");
      setJumpAnnouncement("The original message is no longer available.");
      return;
    }
    if (hiddenMessageIds.has(source.id)) {
      setActionError("The original message is hidden on this device. Show it again from a fresh Lounge session to open it.");
      setJumpAnnouncement("The original message is hidden on this device.");
      return;
    }
    if (!matchesLoungeFilter(source, filter, messagesById)) {
      setFilter("all");
      setJumpAnnouncement("Showing all conversations to open the original message.");
    }
    setPendingReplyJumpId(source.id);
  }

  async function handlePrepareContext() {
    setError("");
    setIsPreparingContext(true);
    const outcome = topic === "hall_pattern"
      ? await prepareHallDiscussion({ repo: contextRepo.trim() })
      : await prepareAuditDiscussion({ repo: contextRepo.trim(), focus: incomingFocus ?? undefined });
    setIsPreparingContext(false);
    if (outcome.error || !outcome.prepared) {
      setError(outcome.error ?? "The discussion context could not be prepared. No message was posted.");
      return;
    }
    setPreparedContext(outcome.prepared);
    setAlgofoxState("review", getAlgofoxMessage("loungeFocus"), 3_500);
  }

  async function handleReaction(messageId: string, reaction: LoungeReaction) {
    setActionError("");
    const outcome = await addReaction({ messageId, reaction });
    if (outcome.error) {
      setActionError(outcome.error);
      return;
    }
    setReactionPickerMessageId(null);
  }

  async function handleAnswerMark(questionMessageId: string, answerMessageId: string, isMarked: boolean) {
    setActionError("");
    const outcome = isMarked
      ? await clearAnswerMark({ questionMessageId })
      : await markAnswer({ questionMessageId, answerMessageId });
    if (outcome.error) {
      setActionError(outcome.error);
    }
  }

  function hideMessage(messageId: string) {
    setHiddenMessageIds((current) => {
      const next = new Set(current);
      next.add(messageId);
      try {
        window.localStorage.setItem(HIDDEN_MESSAGES_KEY, JSON.stringify(Array.from(next).slice(-100)));
      } catch {
        // The message is still hidden during this browser session if storage is unavailable.
      }
      return next;
    });
  }

  return (
    <main className="flex min-h-screen flex-1 flex-col bg-base px-4 py-8 text-text sm:px-6 sm:py-12">
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col">
        <header className="flex flex-col gap-5 border-b border-muted/20 pb-7 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-accent">Anonymous community workspace</p>
            <h1 className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-3xl sm:text-5xl">
              <WelcomeScoreWordmark badgeClassName="sm:mt-1.5" />
              <span className="font-mono font-bold tracking-tight">Dev Lounge</span>
            </h1>
            <p className="mt-3 max-w-2xl font-sans text-sm leading-6 text-muted sm:text-base">
              A temporary space for practical contributor questions, small wins, and public audit context. Messages disappear after 24 hours.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <BackButton />
            <Link href="/" className="inline-flex h-10 items-center justify-center rounded-md border border-accent/45 bg-accent/10 px-4 font-sans text-sm font-medium text-accent transition-colors duration-180 ease-out hover:bg-accent/15">
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
                  <h2 className="font-mono text-sm font-bold">Focused contributor conversations</h2>
                  <p className="mt-1 font-sans text-xs text-muted">Algofox helps keep it practical. Never share secrets, private links, or vulnerability details.</p>
                </div>
              </div>
              <span className={`inline-flex items-center gap-2 rounded-md border px-2.5 py-1 font-mono text-xs ${status === "ready" ? "border-good/45 bg-good/10 text-good" : "border-muted/30 text-muted"}`}>
                <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
                {statusLabel}
              </span>
            </div>

            <div className="border-b border-muted/20 px-4 py-3 sm:px-5">
              <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Filter Lounge conversations">
                {FILTERS.map((option) => {
                  const selected = filter === option.key;
                  return (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => setFilter(option.key)}
                      className={`shrink-0 rounded-md border px-3 py-1.5 font-mono text-xs font-semibold transition-colors duration-180 ease-out ${selected ? "border-accent/45 bg-accent/10 text-accent" : "border-muted/25 bg-base/25 text-muted hover:border-muted/45 hover:text-text"}`}
                      aria-pressed={selected}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
              {isVerifiedGateway ? (
                <p className="mt-2 font-sans text-xs text-muted">Verified context, private safety reports, and visitor protections are active. Every message is still your explicit choice.</p>
              ) : gatewayState === "upgrade_required" ? (
                <p className="mt-2 font-sans text-xs text-muted">Safety upgrade pending: messages, reactions, and reports will resume after the owner applies the published database migration.</p>
              ) : gatewayState === "checking" ? (
                <p className="mt-2 font-sans text-xs text-muted">Preparing the verified Lounge workspace…</p>
              ) : (
                <p className="mt-2 font-sans text-xs text-muted">Temporary chat is active while the verified context upgrade is being connected.</p>
              )}
            </div>

            <div className="relative">
              <p className="sr-only" role="status">
                {unreadMessageCount > 0 ? `${unreadMessageCount} new ${unreadMessageCount === 1 ? "message" : "messages"}. Use the jump button to read them.` : ""}
              </p>
              <p className="sr-only" role="status">{jumpAnnouncement}</p>
              <div ref={chatViewportRef} onScroll={handleChatScroll} className="min-h-[380px] max-h-[58vh] overflow-y-auto px-5 py-5" aria-live="off">
                {status === "unavailable" ? <SetupState /> : null}
                {status !== "unavailable" && visibleMessages.length === 0 ? <EmptyLoungeState filter={filter} /> : null}
                {status !== "unavailable" ? (
                  <div className="space-y-5">
                    {visibleMessages.map((message) => {
                      const parent = message.parent_message_id ? messagesById.get(message.parent_message_id) ?? null : null;
                      const answerMark = parent ? answerMarksByQuestion.get(parent.id) ?? null : answerMarksByQuestion.get(message.id) ?? null;
                      return (
                        <MessageItem
                          key={message.id}
                          message={message}
                          parent={parent}
                          onOpenScore={setSelectedScore}
                          onReply={selectReply}
                          isReplyTarget={replyingTo?.id === message.id}
                          isJumpTarget={jumpedMessageId === message.id}
                          registerMessageElement={registerMessageElement}
                          onJumpToReplySource={jumpToReplySource}
                          reactions={reactionsByMessage.get(message.id) ?? []}
                          ownReaction={reactions.find((reaction) => reaction.message_id === message.id && reaction.session_hash === identity?.sessionHash)?.reaction ?? null}
                          isReactionPickerOpen={reactionPickerMessageId === message.id}
                          onToggleReactionPicker={() => {
                            setActionError("");
                            setReactionPickerMessageId((current) => current === message.id ? null : message.id);
                          }}
                          onReact={handleReaction}
                          onHide={hideMessage}
                          onReport={setReportingMessage}
                          answerMark={answerMark}
                          canManageAnswer={Boolean(parent && parent.topic === "contributor_question" && parent.session_hash === identity?.sessionHash && isVerifiedGateway)}
                          onAnswerMark={handleAnswerMark}
                        />
                      );
                    })}
                  </div>
                ) : null}
              </div>
              {unreadMessageCount > 0 ? (
                <button type="button" onClick={() => scrollToLatest()} className="absolute bottom-4 left-1/2 z-10 inline-flex -translate-x-1/2 items-center gap-2 rounded-md border border-accent/45 bg-surface px-3 py-2 font-mono text-xs font-semibold text-accent shadow-lg transition-colors duration-180 ease-out hover:bg-accent/10 focus:bg-accent/10" aria-label={`Jump to ${unreadMessageCount} new ${unreadMessageCount === 1 ? "message" : "messages"}`}>
                  <span aria-hidden="true">↓</span>
                  {unreadMessageCount} new {unreadMessageCount === 1 ? "message" : "messages"}
                </button>
              ) : null}
            </div>

            <form className="border-t border-muted/20 p-4" onSubmit={handleSubmit}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="min-w-0 flex-1">
                  <label className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-muted" htmlFor="lounge-topic">Start a focused conversation</label>
                  <select
                    id="lounge-topic"
                    value={topic}
                    onChange={(event) => {
                      setTopic(event.target.value as ConversationTopic);
                      setError("");
                    }}
                    disabled={status !== "ready"}
                    className="mt-2 h-10 w-full rounded-md border border-muted/35 bg-base/40 px-3 font-sans text-sm text-text outline-none focus:border-accent disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {topicOptions.map((option) => (
                      <option key={option} value={option}>{LOUNGE_TOPIC_DETAILS[option].label}</option>
                    ))}
                  </select>
                </div>
                {preparedContext ? <ContextStatus context={preparedContext.context} onRemove={() => setPreparedContext(null)} /> : null}
              </div>

              <p id="lounge-topic-help" className="mt-3 font-sans text-xs leading-5 text-muted">{topicDetail.help}</p>
              {replyingTo ? (
                <div className="mt-3 flex items-start justify-between gap-3 rounded-md border border-accent/35 border-l-2 bg-accent/10 px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="font-mono text-xs font-semibold text-accent">Replying to {replyingTo.dev_handle}</p>
                    <p className="mt-1 truncate font-sans text-xs text-muted">Mention ready: @{replyingTo.dev_handle} · {replyingTo.content}</p>
                  </div>
                  <button type="button" onClick={() => setReplyingTo(null)} className="text-link shrink-0 font-mono text-lg leading-none" aria-label="Cancel reply">×</button>
                </div>
              ) : null}

              <input tabIndex={-1} aria-hidden="true" autoComplete="off" value={messageHoneypot} onChange={(event) => setMessageHoneypot(event.target.value)} className="sr-only" name="website" />
              <textarea
                ref={messageInputRef}
                id="lounge-message"
                value={draft}
                onChange={(event) => setDraft(event.target.value.slice(0, 300))}
                onFocus={() => setAlgofoxState("waving", getAlgofoxMessage("loungeFocus"), 3_500)}
                placeholder={topicDetail.prompt}
                rows={3}
                disabled={status !== "ready"}
                aria-describedby="lounge-topic-help"
                className="mt-3 w-full resize-none rounded-md border border-muted/35 bg-base/40 px-3 py-3 font-sans text-sm text-text outline-none placeholder:text-muted focus:border-accent disabled:cursor-not-allowed disabled:opacity-60"
              />

              {isVerifiedGateway ? (
                <section className="mt-3 rounded-md border border-muted/25 bg-base/25 p-3" aria-labelledby="discussion-context-title">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <h3 id="discussion-context-title" className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-muted">{needsContext ? "Required public context" : "Optional public context"}</h3>
                      <label className="sr-only" htmlFor="discussion-repository">Repository for discussion context</label>
                      <input
                        id="discussion-repository"
                        value={contextRepo}
                        onChange={(event) => setContextRepo(event.target.value.slice(0, 200))}
                        placeholder="owner/repo"
                        className="mt-2 h-9 w-full rounded-md border border-muted/30 bg-surface px-3 font-mono text-xs text-text outline-none placeholder:text-muted focus:border-accent"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => void handlePrepareContext()}
                      disabled={isPreparingContext || contextRepo.trim().length === 0}
                      className="h-9 shrink-0 rounded-md border border-accent/45 bg-accent/10 px-3 font-sans text-xs font-medium text-accent transition-colors duration-180 ease-out hover:bg-accent/15 disabled:cursor-not-allowed disabled:border-muted/30 disabled:bg-base/30 disabled:text-muted"
                    >
                      {isPreparingContext ? "Preparing…" : topic === "hall_pattern" ? "Prepare Hall context" : "Prepare fresh audit"}
                    </button>
                  </div>
                  <p className="mt-2 font-sans text-xs leading-5 text-muted">Preparation is explicit and does not post anything. It verifies only public contributor-audit data.</p>
                </section>
              ) : null}

              {verification?.turnstile.enabled && verification.turnstile.siteKey ? <LoungeTurnstile action="lounge_message" siteKey={verification.turnstile.siteKey} onTokenChange={setMessageTurnstileToken} /> : null}

              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-mono text-xs text-muted">{draft.length}/300</p>
                  {error ? <p className="mt-1 font-sans text-xs text-muted" role="status">{error}</p> : null}
                  {actionError ? <p className="mt-1 font-sans text-xs text-muted" role="status">{actionError}</p> : null}
                </div>
                <button type="submit" disabled={!canSend} className="h-10 rounded-md border border-accent/45 bg-accent/10 px-4 font-sans text-sm font-medium text-accent transition-colors duration-180 ease-out hover:bg-accent/15 disabled:cursor-not-allowed disabled:border-muted/30 disabled:bg-base/30 disabled:text-muted">
                  {gatewayState === "upgrade_required" ? "Safety upgrade required" : cooldownRemaining > 0 ? `Send in ${cooldownRemaining}s` : needsContext && !contextKindMatches ? "Prepare context first" : isVerifiedGateway && !verification?.proof ? "Preparing safety check" : verification?.turnstile.enabled && !messageTurnstileToken ? "Complete safety check" : "Send message"}
                </button>
              </div>
            </form>
          </div>

          <aside className="space-y-4">
            <section className="rounded-lg border border-muted/25 bg-surface p-5">
              <h2 className="font-mono text-sm font-bold">Your temporary handle</h2>
              {identity ? (
                <div className="mt-4 flex items-center gap-3">
                  <img src={identity.avatarDataUri} alt="Your generated developer avatar" className="h-12 w-12 rounded-full border border-muted/30 bg-base" />
                  <div className="min-w-0">
                    <p className="truncate font-mono text-sm font-semibold text-accent">{identity.handle}</p>
                    <p className="mt-1 font-sans text-xs leading-5 text-muted">Stored only in this browser until you clear site data.</p>
                  </div>
                </div>
              ) : <p className="mt-3 font-sans text-sm text-muted">Generating your anonymous handle…</p>}
            </section>

            <section className="rounded-lg border border-muted/25 bg-surface p-5">
              <h2 className="font-mono text-sm font-bold">Lounge purpose</h2>
              <ul className="mt-3 space-y-2 font-sans text-sm leading-6 text-muted">
                <li>Ask practical first-contributor questions.</li>
                <li>Share a small verified contributor improvement.</li>
                <li>Learn from dated public audit and Hall context.</li>
                <li>Never share credentials, private links, deals, or vulnerability details.</li>
              </ul>
              <Link href="/dev-lounge-policy" className="text-link mt-4 inline-block font-sans text-sm underline underline-offset-4">Read Lounge policy</Link>
            </section>
          </aside>
        </section>
      </div>

      {selectedScore ? <ScorePreview scoreCard={selectedScore} onClose={() => setSelectedScore(null)} /> : null}
      {reportingMessage ? <ReportDialog message={reportingMessage} onClose={() => setReportingMessage(null)} onSubmit={reportMessage} turnstile={verification?.turnstile ?? null} onVerificationUsed={refreshVerification} /> : null}
    </main>
  );
}

function MessageItem({
  message,
  parent,
  onOpenScore,
  onReply,
  isReplyTarget,
  isJumpTarget,
  registerMessageElement,
  onJumpToReplySource,
  reactions,
  ownReaction,
  isReactionPickerOpen,
  onToggleReactionPicker,
  onReact,
  onHide,
  onReport,
  answerMark,
  canManageAnswer,
  onAnswerMark,
}: {
  message: LoungeMessage;
  parent: LoungeMessage | null;
  onOpenScore: (scoreCard: LoungeScoreCard) => void;
  onReply: (message: LoungeMessage) => void;
  isReplyTarget: boolean;
  isJumpTarget: boolean;
  registerMessageElement: (messageId: string, element: HTMLElement | null) => void;
  onJumpToReplySource: (reply: LoungeReply, trigger: HTMLButtonElement) => void;
  reactions: LoungeReactionRecord[];
  ownReaction: LoungeReaction | null;
  isReactionPickerOpen: boolean;
  onToggleReactionPicker: () => void;
  onReact: (messageId: string, reaction: LoungeReaction) => Promise<void>;
  onHide: (messageId: string) => void;
  onReport: (message: LoungeMessage) => void;
  answerMark: LoungeAnswerMark | null;
  canManageAnswer: boolean;
  onAnswerMark: (questionMessageId: string, answerMessageId: string, isMarked: boolean) => Promise<void>;
}) {
  const longPressTimer = useRef<number | null>(null);
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const topicLabel = getTopicLabel(message.topic);
  const isMarkedAnswer = answerMark?.answer_message_id === message.id;

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
    if (Math.abs(event.clientX - pointerStart.current.x) > 12 || Math.abs(event.clientY - pointerStart.current.y) > 12) {
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
    <article ref={(element) => registerMessageElement(message.id, element)} tabIndex={-1} className={`group -mx-2 flex gap-3 rounded-md px-2 py-2 outline-none transition-colors duration-180 ease-out ${parent ? "ml-2 border-l border-accent/30 pl-3 sm:ml-6" : ""} ${isJumpTarget ? "bg-accent/15 ring-1 ring-accent/45" : isReplyTarget ? "bg-accent/[0.07]" : "hover:bg-base/30"}`} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={() => { pointerStart.current = null; clearReplyGesture(); }}>
      <img src={createDevAvatar(message.avatar_seed)} alt="" className="h-9 w-9 shrink-0 rounded-full border border-muted/30 bg-base" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <p className="font-mono text-xs font-semibold text-accent">{message.dev_handle}</p>
          <span className="rounded-md border border-muted/25 bg-base/25 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-muted">{topicLabel}</span>
          <time className="font-sans text-xs text-muted" dateTime={message.created_at}>{formatMessageTime(message.created_at)}</time>
        </div>
        {message.reply_to ? <button type="button" onClick={(event) => onJumpToReplySource(message.reply_to!, event.currentTarget)} onPointerDown={(event) => event.stopPropagation()} onPointerUp={(event) => event.stopPropagation()} className="mt-2 block w-full rounded-md border border-muted/30 border-l-2 border-l-accent/60 bg-base/35 px-3 py-2 text-left transition-colors duration-180 ease-out hover:border-accent/45 hover:bg-accent/10 focus:border-accent/45 focus:bg-accent/10"><p className="font-mono text-xs font-semibold text-accent">Replying to {message.reply_to.dev_handle}</p><p className="mt-1 max-h-10 overflow-hidden break-words font-sans text-xs leading-5 text-muted">{message.reply_to.content}</p><span className="mt-2 block font-mono text-[10px] uppercase tracking-[0.12em] text-muted">Open original message</span></button> : null}
        {message.content ? <p className="mt-1 break-words font-sans text-sm leading-6 text-text">{message.content}</p> : null}
        {message.community_context ? <CommunityContextCard context={message.community_context} /> : null}
        {message.score_card ? <button type="button" onClick={() => onOpenScore(message.score_card!)} className="mt-3 block w-full rounded-md border border-accent/35 bg-accent/10 p-3 text-left transition-colors duration-180 ease-out hover:bg-accent/15"><span className="font-mono text-xs uppercase tracking-[0.15em] text-accent">Shared WelcomeScore</span><span className="mt-2 flex items-end justify-between gap-3"><span className="min-w-0"><span className="block truncate font-mono text-sm font-semibold text-text">{message.score_card.repo}</span><span className="mt-1 block font-sans text-xs text-muted">{message.score_card.summary}</span></span><span className="shrink-0 font-mono text-2xl font-bold text-accent">{message.score_card.score}</span></span></button> : null}
        {message.pet_reaction ? <p className="mt-3 border-l-2 border-muted/35 pl-3 font-sans text-xs leading-5 text-muted"><span className="font-mono font-semibold text-accent">Algofox:</span> {message.pet_reaction.quote}</p> : null}
        {isMarkedAnswer ? <p className="mt-3 rounded-md border border-good/40 bg-good/10 px-3 py-2 font-sans text-xs text-good">Marked useful by the question author. This is not an official or correctness endorsement.</p> : null}
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {summarizeReactions(reactions).map(({ reaction, count }) => <span key={reaction} className={`inline-flex h-7 items-center gap-1 rounded-md border px-2 font-mono text-xs ${ownReaction === reaction ? "border-accent/45 bg-accent/10 text-accent" : "border-muted/25 bg-base/25 text-muted"}`} title={`${count} ${REACTION_OPTIONS[reaction].label.toLowerCase()} reaction${count === 1 ? "" : "s"}`}><span aria-hidden="true">{REACTION_OPTIONS[reaction].icon}</span><span>{count}</span></span>)}
          {ownReaction ? <span className="font-sans text-xs text-muted">Reaction added</span> : <button type="button" onClick={onToggleReactionPicker} onPointerDown={(event) => event.stopPropagation()} onPointerUp={(event) => event.stopPropagation()} className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-muted/30 bg-base/25 font-mono text-sm text-muted transition-colors duration-180 ease-out hover:border-accent/45 hover:bg-accent/10 hover:text-accent focus:border-accent/45 focus:bg-accent/10 focus:text-accent" aria-label={`Add a reaction to ${message.dev_handle}'s message`} aria-expanded={isReactionPickerOpen}>+</button>}
        </div>
        {isReactionPickerOpen ? <div className="mt-2 flex flex-wrap items-center gap-1.5 rounded-md border border-muted/25 bg-base/35 p-2" role="group" aria-label="Choose one reaction">{Object.entries(REACTION_OPTIONS).map(([reaction, option]) => <button key={reaction} type="button" onClick={() => void onReact(message.id, reaction as LoungeReaction)} onPointerDown={(event) => event.stopPropagation()} onPointerUp={(event) => event.stopPropagation()} className="inline-flex h-8 min-w-8 items-center justify-center rounded-md border border-muted/25 bg-surface px-2 text-base transition-colors duration-180 ease-out hover:border-accent/45 hover:bg-accent/10 focus:border-accent/45 focus:bg-accent/10" aria-label={option.label} title={option.label}>{option.icon}</button>)}</div> : null}
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
          <button type="button" onClick={() => onReply(message)} onPointerDown={(event) => event.stopPropagation()} onPointerUp={(event) => event.stopPropagation()} className="inline-flex h-7 items-center rounded-md px-2 font-mono text-xs text-muted transition-colors duration-180 ease-out hover:bg-accent/10 hover:text-accent focus:bg-accent/10 focus:text-accent sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100" aria-label={`Reply to ${message.dev_handle}`}>Reply</button>
          {canManageAnswer && parent ? <button type="button" onClick={() => void onAnswerMark(parent.id, message.id, isMarkedAnswer)} className="text-link font-mono text-xs underline underline-offset-4">{isMarkedAnswer ? "Clear useful mark" : "Mark useful"}</button> : null}
          <button type="button" onClick={() => onHide(message.id)} className="text-link font-mono text-xs underline underline-offset-4">Hide on this device</button>
          <button type="button" onClick={() => onReport(message)} className="text-link font-mono text-xs underline underline-offset-4">Report privately</button>
        </div>
      </div>
    </article>
  );
}

function CommunityContextCard({ context }: { context: LoungeCommunityContext }) {
  const isAudit = context.kind === "audit";
  const isStale = context.kind === "hall" && context.freshness === "stale";
  return <div className="mt-3 rounded-md border border-accent/35 bg-accent/10 p-3"><p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-accent">{isAudit ? "Fresh audit snapshot" : "Hall listing context"}</p><div className="mt-2 flex items-end justify-between gap-3"><Link href={context.auditPath} className="text-link min-w-0 truncate font-mono text-sm font-semibold underline underline-offset-4">{context.repo}</Link><span className="shrink-0 font-mono text-lg font-bold text-accent">{context.score}<span className="ml-1 text-sm text-text">{context.grade}</span></span></div><p className="mt-2 font-sans text-xs leading-5 text-muted">{isAudit ? `Checked ${formatMessageTime(context.checkedAt)} · public contributor-signal snapshot, not a certification.` : `${isStale ? "This Hall snapshot may have changed" : "Hall listing follows product eligibility rules"} · not an endorsement or certification.`}</p></div>;
}

function ContextStatus({ context, onRemove }: { context: LoungeCommunityContext; onRemove: () => void }) {
  return <div className="flex max-w-full items-center gap-2 rounded-md border border-accent/35 bg-accent/10 px-2.5 py-2"><span className="max-w-[180px] truncate font-mono text-xs text-accent">{context.kind === "audit" ? "Fresh audit" : "Hall context"}: {context.repo}</span><button type="button" onClick={onRemove} className="text-link font-mono text-base leading-none" aria-label="Remove prepared public context">×</button></div>;
}

function ReportDialog({ message, onClose, onSubmit, turnstile, onVerificationUsed }: { message: LoungeMessage; onClose: () => void; onSubmit: (input: { messageId: string; reason: LoungeReportReason; detail?: string; turnstileToken?: string | null; website?: string }) => Promise<{ error: string | null; autoHidden?: boolean; reviewState?: string | null }>; turnstile: { enabled: boolean; siteKey: string | null } | null; onVerificationUsed: () => Promise<void> }) {
  const [reason, setReason] = useState<LoungeReportReason>("spam");
  const [detail, setDetail] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [website, setWebsite] = useState("");

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback("");
    setIsSending(true);
    const outcome = await onSubmit({ messageId: message.id, reason, detail, turnstileToken, website });
    setIsSending(false);
    if (outcome.error) { setFeedback(outcome.error); return; }
    setTurnstileToken(null);
    void onVerificationUsed();
    setFeedback(outcome.autoHidden ? "Private report saved. A clear high-severity policy violation was temporarily hidden for safety." : outcome.reviewState === "needs_review" ? "Private report saved for owner review. No public change was made." : "Private report saved. No public change was made.");
  }

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-base/80 p-4" onMouseDown={onClose}><section role="dialog" aria-modal="true" aria-labelledby="lounge-report-title" className="w-full max-w-md rounded-lg border border-muted/25 bg-surface p-5 shadow-2xl" onMouseDown={(event) => event.stopPropagation()}><div className="flex items-start justify-between gap-4"><div><p className="font-mono text-xs uppercase tracking-[0.16em] text-accent">Private report</p><h2 id="lounge-report-title" className="mt-2 font-mono text-lg font-bold">Report this message</h2></div><button type="button" className="text-link text-xl leading-none" onClick={onClose} aria-label="Close report dialog">×</button></div><p className="mt-3 font-sans text-sm leading-6 text-muted">Choose a reason. Do not paste credentials, private links, personal data, or vulnerability details. Reporting opens a private safety review; clear high-severity violations may be temporarily hidden.</p><form className="mt-4" onSubmit={submit}><fieldset><legend className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-muted">Reason</legend><div className="mt-2 grid gap-2 sm:grid-cols-2">{LOUNGE_REPORT_REASONS.map((option) => <label key={option} className={`rounded-md border px-3 py-2 font-sans text-sm ${reason === option ? "border-accent/45 bg-accent/10 text-text" : "border-muted/25 bg-base/25 text-muted"}`}><input type="radio" className="mr-2 accent-[#E8A23D]" checked={reason === option} onChange={() => setReason(option)} name="lounge-report-reason" />{reportReasonLabel(option)}</label>)}</div></fieldset><label className="mt-4 block font-mono text-xs font-semibold uppercase tracking-[0.14em] text-muted" htmlFor="lounge-report-detail">Optional private detail</label><textarea id="lounge-report-detail" value={detail} onChange={(event) => setDetail(event.target.value.slice(0, 240))} rows={3} className="mt-2 w-full resize-none rounded-md border border-muted/35 bg-base/40 px-3 py-2 font-sans text-sm text-text outline-none placeholder:text-muted focus:border-accent" placeholder="Briefly describe the concern without repeating sensitive content." /><input tabIndex={-1} aria-hidden="true" autoComplete="off" value={website} onChange={(event) => setWebsite(event.target.value)} className="sr-only" name="website" />{turnstile?.enabled && turnstile.siteKey ? <LoungeTurnstile action="lounge_report" siteKey={turnstile.siteKey} onTokenChange={setTurnstileToken} /> : null}<div className="mt-3 flex items-center justify-between gap-3"><p className="font-mono text-xs text-muted">{detail.length}/240</p><button type="submit" disabled={isSending || Boolean(turnstile?.enabled && !turnstileToken)} className="h-10 rounded-md border border-accent/45 bg-accent/10 px-4 font-sans text-sm font-medium text-accent transition-colors duration-180 ease-out hover:bg-accent/15 disabled:cursor-not-allowed disabled:border-muted/30 disabled:bg-base/30 disabled:text-muted">{isSending ? "Sending…" : turnstile?.enabled && !turnstileToken ? "Complete safety check" : "Send private report"}</button></div>{feedback ? <p className="mt-3 font-sans text-xs text-muted" role="status">{feedback}</p> : null}</form></section></div>;
}

function matchesLoungeFilter(message: LoungeMessage, filter: LoungeFilter, messagesById: Map<string, LoungeMessage>) { if (filter === "all") { return true; } const parent = message.parent_message_id ? messagesById.get(message.parent_message_id) : null; return message.topic === filter || parent?.topic === filter; }
function groupReactionsByMessage(reactions: LoungeReactionRecord[]) { const grouped = new Map<string, LoungeReactionRecord[]>(); reactions.forEach((reaction) => { const messageReactions = grouped.get(reaction.message_id) ?? []; messageReactions.push(reaction); grouped.set(reaction.message_id, messageReactions); }); return grouped; }
function summarizeReactions(reactions: LoungeReactionRecord[]) { return Object.keys(REACTION_OPTIONS).map((reaction) => { const typedReaction = reaction as LoungeReaction; return { reaction: typedReaction, count: reactions.filter((entry) => entry.reaction === typedReaction).length }; }).filter(({ count }) => count > 0); }
function isNearChatBottom(viewport: HTMLElement) { return viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight <= FOLLOW_THRESHOLD_PX; }
function preferredScrollBehavior(): ScrollBehavior { return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"; }
function validRepository(value: string | null) { return value && /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(value) ? value : null; }
function getTopicLabel(topic: LoungeTopic | null | undefined) { return !topic || topic === "general" ? "Earlier chat" : LOUNGE_TOPIC_DETAILS[topic]?.label ?? "Earlier chat"; }
function reportReasonLabel(reason: LoungeReportReason) { return { spam: "Spam", secrets: "Secrets", harassment: "Harassment", "unsafe-link": "Unsafe link", other: "Other" }[reason]; }

function LoungeLoadingState() { return <main className="flex min-h-screen flex-1 items-center justify-center bg-base px-4 text-text"><p className="font-mono text-sm text-muted">Opening the Dev Lounge…</p></main>; }
function EmptyLoungeState({ filter }: { filter: LoungeFilter }) { return <div className="flex min-h-[340px] items-center justify-center text-center"><div className="max-w-sm"><p className="font-mono text-sm font-semibold">{filter === "all" ? "The lounge is quiet for now." : "No active conversations match this view."}</p><p className="mt-2 font-sans text-sm leading-6 text-muted">Start with a practical contributor question, a small verified win, or a focused discussion about public audit context.</p></div></div>; }
function SetupState() { return <div className="flex min-h-[340px] items-center justify-center text-center"><div className="max-w-md"><p className="font-mono text-sm font-semibold">The Dev Lounge is being connected.</p><p className="mt-2 font-sans text-sm leading-6 text-muted">Temporary community chat becomes available after the public Supabase connection and Lounge migration are configured.</p></div></div>; }

function ScorePreview({ scoreCard, onClose }: { scoreCard: LoungeScoreCard; onClose: () => void }) { return <div className="fixed inset-0 z-50 flex items-center justify-center bg-base/80 p-4" onMouseDown={onClose}><section role="dialog" aria-modal="true" aria-labelledby="shared-score-title" className="w-full max-w-md rounded-lg border border-muted/25 bg-surface p-6 shadow-2xl" onMouseDown={(event) => event.stopPropagation()}><div className="flex items-start justify-between gap-4"><div><p className="font-mono text-xs uppercase tracking-[0.16em] text-accent">Legacy Lounge score card</p><h2 id="shared-score-title" className="mt-2 break-all font-mono text-lg font-bold">{scoreCard.repo}</h2></div><button type="button" className="text-link text-xl leading-none" onClick={onClose} aria-label="Close score preview">×</button></div><div className="mt-6 rounded-md border border-accent/35 bg-accent/10 p-5"><p className="font-mono text-5xl font-bold text-accent">{scoreCard.score}<span className="ml-2 text-2xl text-text">{scoreCard.grade}</span></p><p className="mt-4 font-sans text-sm leading-6 text-muted">{scoreCard.summary}</p></div></section></div>; }
function replySnapshotFromMessage(message: LoungeMessage): LoungeReply { return { id: message.id, dev_handle: message.dev_handle, content: message.content || "Shared a WelcomeScore score card.", created_at: message.created_at }; }
function formatMessageTime(value: string) { return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(new Date(value)); }

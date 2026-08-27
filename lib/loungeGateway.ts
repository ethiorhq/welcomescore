import "server-only";
import { randomUUID } from "crypto";
import { createPreparedContext, readPreparedContext } from "@/lib/loungeCommunity";
import { getLeaderboardEntry } from "@/lib/leaderboard";
import { scoreRepo } from "@/lib/scoreRepo";
import {
  assessLoungeReport,
  fallbackModerationAssessment,
  shouldAutoHide,
} from "@/lib/loungeModeration";
import {
  deriveLoungeNetworkBucket,
  verifyLoungeHumanProof,
  verifyTurnstileToken,
} from "@/lib/loungeVerification";
import {
  isLoungeFocus,
  isLoungeReportReason,
  isLoungeTopic,
  requiresPreparedContext,
} from "@/lib/loungeTypes";
import type {
  LoungeCommunityContext,
  LoungePreparedContext,
  LoungeReportReason,
  LoungeReplySnapshot,
  LoungeTopic,
} from "@/lib/loungeTypes";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_KEY;
const LOUNGE_TABLE = "lounge_messages";
const SESSION_HASH_PATTERN = /^[A-Za-z0-9_-]{16,128}$/;
const AVATAR_SEED_PATTERN = /^[A-Za-z0-9_.:-]{16,128}$/;
const REQUEST_ID_PATTERN = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
const REPOSITORY_PATTERN = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
const CONTROL_CHARACTERS = /[\u0000-\u001F\u007F]/g;
const FILTERED_TERMS = /\b(?:fuck|shit|bitch|asshole|dick|cunt|bastard)\b/gi;
const REPEATED_CHARACTER_RUN = /(.)\1{11,}/;
const SECRET_LIKE_CONTENT = /(?:-----BEGIN(?: [A-Z]+)? PRIVATE KEY-----|\b(?:gh[pousr]_|github_pat_)[A-Za-z0-9_]{16,}|\bAIza[\w-]{20,}|\bsk-[A-Za-z0-9_-]{16,}|\b(?:xox[baprs]|AKIA)[A-Za-z0-9_-]{12,}|\b(?:password|passwd|secret|api[_ -]?key|token)\s*[:=]\s*\S{6,})/i;
const OFF_TOPIC_SOLICITATION = /\b(?:star\s*(?:for|4)\s*star|fork\s*(?:for|4)\s*fork|follow\s*(?:for|4)\s*follow|crypto\s*(?:deal|airdrop)|guaranteed\s*return|dm\s*(?:me|for)|telegram\s*(?:me|group)|whatsapp\s*(?:me|group))\b/i;

const RATE_RULES = {
  "root-post": { limit: 4, windowSeconds: 600 },
  reply: { limit: 6, windowSeconds: 600 },
  reaction: { limit: 15, windowSeconds: 600 },
  context: { limit: 3, windowSeconds: 600 },
  report: { limit: 5, windowSeconds: 86400 },
  "network-root-post": { limit: 8, windowSeconds: 600 },
  "network-reply": { limit: 12, windowSeconds: 600 },
  "network-reaction": { limit: 30, windowSeconds: 600 },
  "network-context": { limit: 6, windowSeconds: 600 },
  "network-report": { limit: 8, windowSeconds: 86400 },
} as const;

type RateAction = keyof typeof RATE_RULES;

type LoungeMessageRow = {
  id: string;
  session_hash: string;
  dev_handle: string;
  avatar_seed: string;
  content: string;
  topic: LoungeTopic;
  parent_message_id: string | null;
  community_context: LoungeCommunityContext | null;
  reply_to: LoungeReplySnapshot | null;
  score_card: unknown;
  pet_reaction: unknown;
  created_at: string;
  expires_at: string;
  visibility_state: "visible" | "hidden_by_moderator";
};

export class LoungeGatewayError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "LoungeGatewayError";
  }
}

export function isLoungeGatewayConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_SERVICE_KEY && process.env.LOUNGE_CONTEXT_SIGNING_SECRET);
}

export function parseRepositoryPath(value: unknown) {
  if (typeof value !== "string" || !REPOSITORY_PATTERN.test(value)) {
    throw new LoungeGatewayError(400, "Enter a repository as owner/repo before preparing a discussion.");
  }

  const [owner, repo] = value.split("/");
  return { owner, repo, repoPath: `${owner}/${repo}` };
}

export async function prepareAuditContext(input: {
  sessionHash: unknown;
  repo: unknown;
  focus?: unknown;
}): Promise<LoungePreparedContext> {
  const sessionHash = requireSessionHash(input.sessionHash);
  const { owner, repo, repoPath } = parseRepositoryPath(input.repo);
  const focus = input.focus && isLoungeFocus(input.focus) ? input.focus : undefined;
  await consumeRate(sessionHash, "context");

  const result = await scoreRepo(owner, repo, { fresh: true });
  const context = createPreparedContext({
    kind: "audit",
    repo: repoPath,
    score: result.score,
    grade: result.grade,
    checkedAt: new Date().toISOString(),
    auditPath: auditPath(repoPath),
    source: "fresh-user-requested",
    ...(focus ? { focus } : {}),
  });

  if (!context) {
    throw new LoungeGatewayError(503, "Fresh-audit discussions are being connected. No message was posted.");
  }

  return context;
}

export async function prepareHallContext(input: {
  sessionHash: unknown;
  repo: unknown;
}): Promise<LoungePreparedContext> {
  const sessionHash = requireSessionHash(input.sessionHash);
  const { repoPath } = parseRepositoryPath(input.repo);
  await consumeRate(sessionHash, "context");

  const entry = await getLeaderboardEntry(repoPath);
  if (!entry || entry.freshness === "expired") {
    throw new LoungeGatewayError(404, "A current Hall listing is needed before starting this discussion. No message was posted.");
  }

  const context = createPreparedContext({
    kind: "hall",
    evaluationId: entry.id,
    repo: entry.repoPath,
    score: entry.score,
    grade: entry.grade,
    evaluatedAt: entry.evaluatedAt,
    freshness: entry.freshness,
    auditPath: auditPath(entry.repoPath),
    source: "existing-hall-listing",
  });

  if (!context) {
    throw new LoungeGatewayError(503, "Hall-pattern discussions are being connected. No message was posted.");
  }

  return context;
}

export async function createLoungeMessage(input: {
  sessionHash: unknown;
  devHandle: unknown;
  avatarSeed: unknown;
  content: unknown;
  topic: unknown;
  clientRequestId: unknown;
  contextToken?: unknown;
  replyTo?: unknown;
  verificationProof?: unknown;
  turnstileToken?: unknown;
  website?: unknown;
  request: Request;
}): Promise<LoungeMessageRow> {
  const sessionHash = requireSessionHash(input.sessionHash);
  const devHandle = requireDevHandle(input.devHandle);
  const avatarSeed = requireAvatarSeed(input.avatarSeed);
  const topic = requireTopic(input.topic);
  const clientRequestId = requireRequestId(input.clientRequestId);
  const content = validateContent(input.content);
  const replyTo = input.replyTo ? requireReplySnapshot(input.replyTo) : null;
  const preparedContext = input.contextToken ? readPreparedContext(input.contextToken) : null;
  assertEmptyHoneypot(input.website);
  assertHumanProof(input.verificationProof, sessionHash);
  await assertTurnstile(input.turnstileToken, "lounge_message", input.request);

  if (requiresPreparedContext(topic) && !preparedContext) {
    throw new LoungeGatewayError(422, "Prepare the required public context before sending. No message was posted.");
  }

  if (topic === "audit_discussion" && preparedContext?.kind !== "audit") {
    throw new LoungeGatewayError(422, "This discussion needs a freshly prepared audit context. No message was posted.");
  }

  if (topic === "hall_pattern" && preparedContext?.kind !== "hall") {
    throw new LoungeGatewayError(422, "This discussion needs a Hall listing context. No message was posted.");
  }

  const existing = await findMessageByRequest(sessionHash, clientRequestId);
  if (existing) {
    return existing;
  }

  let parentMessageId: string | null = null;
  if (replyTo) {
    const parent = await getActiveMessage(replyTo.id);
    if (!parent) {
      throw new LoungeGatewayError(404, "That message is no longer available to reply to.");
    }
    parentMessageId = parent.id;
  }

  await consumeRatePair(sessionHash, deriveLoungeNetworkBucket(input.request), replyTo ? "reply" : "root-post");

  const response = await loungeRequest(`/${LOUNGE_TABLE}`, {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      session_hash: sessionHash,
      dev_handle: devHandle,
      avatar_seed: avatarSeed,
      content,
      topic,
      parent_message_id: parentMessageId,
      community_context: preparedContext,
      reply_to: replyTo,
      score_card: null,
      pet_reaction: null,
      client_request_id: clientRequestId,
    }),
  });

  if (!response.ok) {
    throw new LoungeGatewayError(503, "Unable to send the message right now. No message was posted.");
  }

  const rows = await response.json() as LoungeMessageRow[];
  if (!rows[0]) {
    throw new LoungeGatewayError(503, "Unable to confirm the message right now. No message was posted.");
  }

  return rows[0];
}

export async function createLoungeReaction(input: {
  sessionHash: unknown;
  messageId: unknown;
  reaction: unknown;
}) {
  const sessionHash = requireSessionHash(input.sessionHash);
  const messageId = requireUuid(input.messageId, "Choose an active message before reacting.");
  const reaction = typeof input.reaction === "string" && ["thumbs_up", "lightbulb", "tada", "eyes"].includes(input.reaction)
    ? input.reaction
    : null;
  if (!reaction) {
    throw new LoungeGatewayError(400, "Choose one of the available reactions.");
  }

  const message = await getActiveMessage(messageId);
  if (!message) {
    throw new LoungeGatewayError(404, "That message is no longer available to react to.");
  }

  await consumeRate(sessionHash, "reaction");
  const response = await loungeRequest("/lounge_reactions", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({ message_id: messageId, session_hash: sessionHash, reaction }),
  });

  if (response.status === 409) {
    throw new LoungeGatewayError(409, "You have already reacted to this message.");
  }

  if (!response.ok) {
    throw new LoungeGatewayError(503, "Unable to add that reaction right now.");
  }

  const rows = await response.json() as unknown[];
  return rows[0] ?? null;
}

export async function setLoungeAnswerMark(input: {
  sessionHash: unknown;
  questionMessageId: unknown;
  answerMessageId: unknown;
}) {
  const sessionHash = requireSessionHash(input.sessionHash);
  const questionMessageId = requireUuid(input.questionMessageId, "Choose an active contributor question first.");
  const answerMessageId = requireUuid(input.answerMessageId, "Choose an active direct reply first.");
  const question = await getActiveMessage(questionMessageId);
  const answer = await getActiveMessage(answerMessageId);

  if (!question || !answer || question.topic !== "contributor_question" || question.session_hash !== sessionHash || answer.parent_message_id !== question.id) {
    throw new LoungeGatewayError(403, "Only the author of an active contributor question can mark one direct reply useful.");
  }

  const response = await loungeRequest("/lounge_answer_marks?on_conflict=question_message_id", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify({
      question_message_id: question.id,
      answer_message_id: answer.id,
      resolver_session_hash: sessionHash,
    }),
  });

  if (!response.ok) {
    throw new LoungeGatewayError(503, "Unable to mark that reply useful right now.");
  }

  const rows = await response.json() as unknown[];
  return rows[0] ?? null;
}

export async function clearLoungeAnswerMark(input: {
  sessionHash: unknown;
  questionMessageId: unknown;
}) {
  const sessionHash = requireSessionHash(input.sessionHash);
  const questionMessageId = requireUuid(input.questionMessageId, "Choose an active contributor question first.");
  const response = await loungeRequest(`/lounge_answer_marks?question_message_id=eq.${encodeURIComponent(questionMessageId)}&resolver_session_hash=eq.${encodeURIComponent(sessionHash)}`, {
    method: "DELETE",
    headers: { Prefer: "return=minimal" },
  });

  if (!response.ok) {
    throw new LoungeGatewayError(503, "Unable to clear the useful-answer mark right now.");
  }
}

export async function createLoungeReport(input: {
  sessionHash: unknown;
  messageId: unknown;
  reason: unknown;
  detail?: unknown;
  verificationProof?: unknown;
  turnstileToken?: unknown;
  website?: unknown;
  request: Request;
}) {
  const sessionHash = requireSessionHash(input.sessionHash);
  const messageId = requireUuid(input.messageId, "Choose an active message before reporting.");
  if (!isLoungeReportReason(input.reason)) {
    throw new LoungeGatewayError(400, "Choose a report reason before sending it privately.");
  }

  const detail = validateReportDetail(input.detail);
  assertEmptyHoneypot(input.website);
  assertHumanProof(input.verificationProof, sessionHash);
  await assertTurnstile(input.turnstileToken, "lounge_report", input.request);
  const message = await getActiveMessage(messageId);
  if (!message) {
    throw new LoungeGatewayError(404, "That message is no longer available to report.");
  }

  await consumeRatePair(sessionHash, deriveLoungeNetworkBucket(input.request), "report");
  const response = await loungeRequest("/lounge_reports", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      message_id: messageId,
      reporter_session_hash: sessionHash,
      reason: input.reason as LoungeReportReason,
      detail,
    }),
  });

  if (response.status === 409) {
    throw new LoungeGatewayError(409, "You have already sent that report. It was not duplicated.");
  }

  if (!response.ok) {
    throw new LoungeGatewayError(503, "Unable to send that private report right now.");
  }

  const reportRows = await response.json() as Array<{ id?: string }>;
  const reportId = reportRows[0]?.id;
  if (!reportId) {
    throw new LoungeGatewayError(503, "Unable to confirm the private report right now.");
  }

  const assessment = await assessLoungeReport({
    messageContent: message.content,
    reportReason: input.reason as LoungeReportReason,
  }) ?? fallbackModerationAssessment();
  let actionTaken: "none" | "hidden" = "none";

  if (shouldAutoHide(assessment)) {
    const hideResponse = await loungeRequest(`/${LOUNGE_TABLE}?id=eq.${encodeURIComponent(messageId)}&visibility_state=eq.visible`, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ visibility_state: "hidden_by_moderator" }),
    });
    if (hideResponse.ok) {
      actionTaken = "hidden";
    } else {
      console.warn("Lounge moderation hide action could not complete", { messageId, reportId, status: hideResponse.status });
    }
  }

  const moderationResponse = await loungeRequest("/lounge_moderation_events", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      report_id: reportId,
      message_id: messageId,
      decision: assessment.decision,
      category: assessment.category,
      confidence: assessment.confidence,
      rationale: assessment.rationale,
      provider: assessment.provider,
      model: assessment.model,
      action_taken: actionTaken,
    }),
  });
  if (!moderationResponse.ok) {
    console.warn("Lounge moderation audit write could not complete", { messageId, reportId, status: moderationResponse.status });
  }

  return { autoHidden: actionTaken === "hidden", reviewState: assessment.decision };
}

function requireSessionHash(value: unknown) {
  if (typeof value !== "string" || !SESSION_HASH_PATTERN.test(value)) {
    throw new LoungeGatewayError(400, "Your temporary Lounge identity is not ready yet.");
  }
  return value;
}

function requireDevHandle(value: unknown) {
  if (typeof value !== "string" || value.length < 3 || value.length > 64 || !/^[A-Za-z][A-Za-z0-9_]+$/.test(value)) {
    throw new LoungeGatewayError(400, "Your temporary Lounge handle is not ready yet.");
  }
  return value;
}

function requireAvatarSeed(value: unknown) {
  if (typeof value !== "string" || !AVATAR_SEED_PATTERN.test(value)) {
    throw new LoungeGatewayError(400, "Your temporary Lounge avatar is not ready yet.");
  }
  return value;
}

function requireTopic(value: unknown): LoungeTopic {
  if (!isLoungeTopic(value)) {
    throw new LoungeGatewayError(400, "Choose a valid conversation purpose before sending.");
  }
  return value;
}

function requireRequestId(value: unknown) {
  if (typeof value !== "string" || !REQUEST_ID_PATTERN.test(value)) {
    throw new LoungeGatewayError(400, "Unable to prepare this message safely. Please try again.");
  }
  return value;
}

function requireUuid(value: unknown, message: string) {
  if (typeof value !== "string" || !REQUEST_ID_PATTERN.test(value)) {
    throw new LoungeGatewayError(400, message);
  }
  return value;
}

function requireReplySnapshot(value: unknown): LoungeReplySnapshot {
  if (!value || typeof value !== "object") {
    throw new LoungeGatewayError(400, "That reply context is not available.");
  }

  const reply = value as Record<string, unknown>;
  const id = requireUuid(reply.id, "That reply context is not available.");
  if (
    typeof reply.dev_handle !== "string"
    || reply.dev_handle.length < 3
    || reply.dev_handle.length > 64
    || typeof reply.content !== "string"
    || reply.content.length < 1
    || reply.content.length > 300
    || typeof reply.created_at !== "string"
    || reply.created_at.length < 1
    || reply.created_at.length > 64
  ) {
    throw new LoungeGatewayError(400, "That reply context is not available.");
  }

  return {
    id,
    dev_handle: reply.dev_handle,
    content: reply.content,
    created_at: reply.created_at,
  };
}

function validateContent(value: unknown) {
  if (typeof value !== "string") {
    throw new LoungeGatewayError(400, "Write a short practical message before sending.");
  }

  const content = value
    .replace(CONTROL_CHARACTERS, " ")
    .replace(FILTERED_TERMS, "••••")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 300);
  const urlCount = (content.match(/https?:\/\//gi) ?? []).length;

  if (!content) {
    throw new LoungeGatewayError(400, "Write a short practical message before sending.");
  }
  if (SECRET_LIKE_CONTENT.test(content)) {
    throw new LoungeGatewayError(422, "For safety, remove credentials, tokens, keys, passwords, or private links before sending. No message was posted.");
  }
  if (REPEATED_CHARACTER_RUN.test(content) || urlCount > 2 || OFF_TOPIC_SOLICITATION.test(content)) {
    throw new LoungeGatewayError(422, "Please rewrite that as a practical contributor conversation without repeated text, promotion exchanges, or off-topic contact requests.");
  }

  return content;
}

function validateReportDetail(value: unknown) {
  if (value === undefined || value === null) {
    return "";
  }
  if (typeof value !== "string") {
    throw new LoungeGatewayError(400, "Write a short report detail or leave it blank.");
  }

  const detail = value.replace(CONTROL_CHARACTERS, " ").replace(/\s+/g, " ").trim().slice(0, 240);
  if (SECRET_LIKE_CONTENT.test(detail)) {
    throw new LoungeGatewayError(422, "Do not include credentials, private links, or vulnerability details in a report.");
  }
  return detail;
}

async function getActiveMessage(messageId: string) {
  const query = new URLSearchParams({
    select: "id,session_hash,dev_handle,avatar_seed,content,topic,parent_message_id,community_context,reply_to,score_card,pet_reaction,created_at,expires_at,visibility_state",
    id: `eq.${messageId}`,
    visibility_state: "eq.visible",
    expires_at: `gt.${new Date().toISOString()}`,
    limit: "1",
  });
  const response = await loungeRequest(`/${LOUNGE_TABLE}?${query.toString()}`);
  if (!response.ok) {
    throw new LoungeGatewayError(503, "The Lounge is being connected. Please try again shortly.");
  }
  const rows = await response.json() as LoungeMessageRow[];
  return rows[0] ?? null;
}

async function findMessageByRequest(sessionHash: string, clientRequestId: string) {
  const query = new URLSearchParams({
    select: "id,session_hash,dev_handle,avatar_seed,content,topic,parent_message_id,community_context,reply_to,score_card,pet_reaction,created_at,expires_at,visibility_state",
    session_hash: `eq.${sessionHash}`,
    client_request_id: `eq.${clientRequestId}`,
    limit: "1",
  });
  const response = await loungeRequest(`/${LOUNGE_TABLE}?${query.toString()}`);
  if (!response.ok) {
    throw new LoungeGatewayError(503, "The Lounge is being connected. Please try again shortly.");
  }
  const rows = await response.json() as LoungeMessageRow[];
  return rows[0] ?? null;
}

async function consumeRatePair(sessionHash: string, networkBucket: string, action: Exclude<RateAction, `network-${string}`>) {
  await consumeRate(sessionHash, action);
  await consumeRate(networkBucket, `network-${action}` as RateAction);
}

async function consumeRate(sessionHash: string, action: RateAction) {
  ensureGatewayConfigured();
  const rule = RATE_RULES[action];
  const response = await loungeRequest("/rpc/consume_lounge_rate_event", {
    method: "POST",
    body: JSON.stringify({
      p_session_hash: sessionHash,
      p_action: action,
      p_limit: rule.limit,
      p_window_seconds: rule.windowSeconds,
    }),
  });

  if (!response.ok) {
    throw new LoungeGatewayError(503, "The Lounge is being connected. Please try again shortly.");
  }

  if ((await response.json()) !== true) {
    throw new LoungeGatewayError(429, "Please wait a little before trying that Lounge action again.");
  }
}

function assertEmptyHoneypot(value: unknown) {
  if (typeof value === "string" && value.trim().length > 0) {
    throw new LoungeGatewayError(400, "Unable to verify this Lounge request. Please try again.");
  }
}

function assertHumanProof(value: unknown, sessionHash: string) {
  if (!verifyLoungeHumanProof(value, sessionHash)) {
    throw new LoungeGatewayError(403, "Visitor verification expired. Please wait a moment and try again.");
  }
}

async function assertTurnstile(value: unknown, action: "lounge_message" | "lounge_report", request: Request) {
  const result = await verifyTurnstileToken({ token: value, action, request });
  if (!result.valid) {
    throw new LoungeGatewayError(result.reason === "unavailable" ? 503 : 403, result.reason === "unavailable" ? "Visitor verification is temporarily unavailable. Please try again shortly." : "Complete visitor verification before sending.");
  }
}

function ensureGatewayConfigured() {
  if (!isLoungeGatewayConfigured()) {
    throw new LoungeGatewayError(503, "The verified Lounge upgrade is being connected. No message was posted.");
  }
}

async function loungeRequest(path: string, init: RequestInit = {}) {
  ensureGatewayConfigured();
  const headers = new Headers(init.headers);
  headers.set("apikey", SUPABASE_SERVICE_KEY!);
  headers.set("Authorization", `Bearer ${SUPABASE_SERVICE_KEY!}`);
  headers.set("Content-Type", "application/json");
  headers.set("Accept", "application/json");

  return fetch(`${SUPABASE_URL!.replace(/\/$/, "")}/rest/v1${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });
}

function auditPath(repoPath: string) {
  const [owner, repo] = repoPath.split("/");
  return `/check/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
}

export function createClientRequestId() {
  return randomUUID();
}

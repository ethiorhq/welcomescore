export const LOUNGE_TOPICS = [
  "general",
  "contributor_question",
  "small_win",
  "audit_discussion",
  "hall_pattern",
] as const;

export type LoungeTopic = typeof LOUNGE_TOPICS[number];

export const LOUNGE_REPORT_REASONS = [
  "spam",
  "secrets",
  "harassment",
  "unsafe-link",
  "other",
] as const;

export type LoungeReportReason = typeof LOUNGE_REPORT_REASONS[number];

export type LoungeFocus =
  | "readme-setup"
  | "contributing-guide"
  | "code-of-conduct"
  | "license"
  | "starter-issues"
  | "maintenance";

export type LoungeAuditContext = {
  kind: "audit";
  repo: string;
  score: number;
  grade: string;
  checkedAt: string;
  auditPath: string;
  source: "fresh-user-requested";
  focus?: LoungeFocus;
};

export type LoungeHallContext = {
  kind: "hall";
  evaluationId: string;
  repo: string;
  score: number;
  grade: string;
  evaluatedAt: string;
  freshness: "fresh" | "stale" | "expired";
  auditPath: string;
  source: "existing-hall-listing";
};

export type LoungeCommunityContext = LoungeAuditContext | LoungeHallContext;

export type LoungePreparedContext = {
  token: string;
  context: LoungeCommunityContext;
  expiresAt: string;
};

export type LoungeReplySnapshot = {
  id: string;
  dev_handle: string;
  content: string;
  created_at: string;
};

export type LoungeAnswerMark = {
  question_message_id: string;
  answer_message_id: string;
  resolver_session_hash: string;
  created_at: string;
};

export const LOUNGE_TOPIC_DETAILS: Record<Exclude<LoungeTopic, "general">, {
  label: string;
  title: string;
  prompt: string;
  help: string;
  requiresContext: boolean;
}> = {
  contributor_question: {
    label: "Ask for contributor help",
    title: "Ask for contributor help",
    prompt: "What have you tried, and where does the contributor path become unclear?",
    help: "Share the observed obstacle and a practical question. Never share credentials, private links, or vulnerability details.",
    requiresContext: false,
  },
  small_win: {
    label: "Share a small contributor win",
    title: "Share a small contributor win",
    prompt: "What changed, and what might another maintainer reuse?",
    help: "Describe one real, bounded improvement rather than promoting a score.",
    requiresContext: false,
  },
  audit_discussion: {
    label: "Discuss a fresh audit",
    title: "Discuss a fresh audit",
    prompt: "Which observed signal are you working on, and what would be useful to clarify?",
    help: "A fresh public audit snapshot is required before this discussion can be sent.",
    requiresContext: true,
  },
  hall_pattern: {
    label: "Discuss a Hall contributor pattern",
    title: "Discuss a Hall contributor pattern",
    prompt: "Which public contributor pattern would you like to understand?",
    help: "A current Hall listing context is required before this discussion can be sent.",
    requiresContext: true,
  },
};

export function isLoungeTopic(value: unknown): value is LoungeTopic {
  return typeof value === "string" && (LOUNGE_TOPICS as readonly string[]).includes(value);
}

export function isLoungeReportReason(value: unknown): value is LoungeReportReason {
  return typeof value === "string" && (LOUNGE_REPORT_REASONS as readonly string[]).includes(value);
}

export function isLoungeFocus(value: unknown): value is LoungeFocus {
  return value === "readme-setup"
    || value === "contributing-guide"
    || value === "code-of-conduct"
    || value === "license"
    || value === "starter-issues"
    || value === "maintenance";
}

export function requiresPreparedContext(topic: LoungeTopic) {
  return topic === "audit_discussion" || topic === "hall_pattern";
}

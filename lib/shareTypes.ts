export const SHARE_INTENTS = [
  "request-setup-feedback",
  "invite-contributor-review",
  "document-improvement-work",
  "discuss-audit-evidence",
] as const;

export type ShareIntent = (typeof SHARE_INTENTS)[number];

export type ShareIntentOption = {
  id: ShareIntent;
  title: string;
  description: string;
  prompt: string;
};

export const SHARE_INTENT_OPTIONS: readonly ShareIntentOption[] = [
  {
    id: "request-setup-feedback",
    title: "Ask for setup feedback",
    description: "Invite a newcomer to inspect the public setup path.",
    prompt: "Could a new contributor follow the public setup path and tell us where it is unclear?",
  },
  {
    id: "invite-contributor-review",
    title: "Invite contributor-path review",
    description: "Ask for a thoughtful look at contribution docs or starter work.",
    prompt: "If you use this project, is there a public contribution step that needs clearer guidance?",
  },
  {
    id: "document-improvement-work",
    title: "Document improvement work",
    description: "Share a factual, dated contributor-path update.",
    prompt: "We are reviewing the public contributor path and welcome concrete documentation feedback when relevant.",
  },
  {
    id: "discuss-audit-evidence",
    title: "Discuss audit evidence",
    description: "Start a scoped technical conversation about public signals.",
    prompt: "What public contributor-path evidence should we improve or clarify next?",
  },
] as const;

export const SHAREABLE_CHECK_LABELS = [
  "CONTRIBUTING.md",
  "CODE_OF_CONDUCT.md",
  "README setup section",
  "LICENSE",
  "Good-first-issue labels",
  "Recently active",
] as const;

export type ShareableCheckLabel = (typeof SHAREABLE_CHECK_LABELS)[number];

export type VerifiedAuditReceiptPayload = {
  version: 1;
  repo: string;
  issuedAt: string;
  expiresAt: string;
  score: number;
  grade: string;
  passedCheckLabels: ShareableCheckLabel[];
  goodFirstIssueCount: number;
  defaultBranch: string;
  source: "explicit-fresh-audit";
};

export type VerifiedAuditReceipt = {
  token: string;
  url: string;
  payload: VerifiedAuditReceiptPayload;
};

const prohibitedSharePatterns = [
  /star\s+(this|the)?\s*(repo|project)/i,
  /fork\s+(this|the)?\s*(repo|project)/i,
  /follow\s+for/i,
  /follow\s+back/i,
  /like\s+and\s+share/i,
  /retweet/i,
  /upvote/i,
  /certified/i,
  /officially\s+approved/i,
  /security[-\s]?verified/i,
  /best\s+repo/i,
];

export function isAllowedShareCaption(value: string) {
  return !prohibitedSharePatterns.some((pattern) => pattern.test(value));
}

export function isShareIntent(value: unknown): value is ShareIntent {
  return typeof value === "string" && SHARE_INTENTS.includes(value as ShareIntent);
}

export function isShareableCheckLabel(value: unknown): value is ShareableCheckLabel {
  return (
    typeof value === "string" &&
    SHAREABLE_CHECK_LABELS.includes(value as ShareableCheckLabel)
  );
}

export function formatReceiptDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unavailable";
  }

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function getShareCaption({
  intent,
  repo,
  receiptUrl,
  issuedAt,
}: {
  intent: ShareIntent;
  repo: string;
  receiptUrl: string;
  issuedAt: string;
}) {
  const option = SHARE_INTENT_OPTIONS.find((candidate) => candidate.id === intent);
  const date = formatReceiptDate(issuedAt);
  const fallback = [
    `We ran a fresh WelcomeScore contributor-readiness audit for ${repo}.`,
    "It is a dated public snapshot of contributor signals—not a quality or security certification.",
    `Could a new contributor follow the public setup path and tell us where it is unclear?`,
    receiptUrl,
  ].join("\n");

  if (!option) {
    return fallback;
  }

  const candidate = [
    `We ran a fresh WelcomeScore contributor-readiness audit for ${repo} on ${date}.`,
    "It is a dated public snapshot of contributor signals—not a quality or security certification.",
    option.prompt,
    receiptUrl,
  ].join("\n");

  return isAllowedShareCaption(candidate) ? candidate : fallback;
}

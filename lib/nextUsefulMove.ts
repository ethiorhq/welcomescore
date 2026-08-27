import type { Check, ScoreResult } from "@/lib/scoreRepo";

export type MoveId =
  | "readme-setup"
  | "contributing-guide"
  | "code-of-conduct"
  | "license"
  | "starter-issue"
  | "starter-issue-quality"
  | "maintenance-clarity"
  | "maintain-the-path";

export type ActionArtifactId =
  | "readme-setup-outline"
  | "contributing-guide"
  | "code-of-conduct"
  | "starter-issue-brief"
  | "maintenance-status-note";

export type MoveEvidence = {
  label: string;
  observed: string;
};

export type MoveAction =
  | {
      kind: "guide";
      label: string;
      href: `/guides/${string}`;
    }
  | {
      kind: "artifact";
      label: string;
      artifactId: ActionArtifactId;
    }
  | {
      kind: "external";
      label: string;
      href: string;
    };

export type MoveDefinition = {
  id: MoveId;
  journeyStage: "first-run" | "safe-participation" | "first-task" | "maintenance";
  priority: number;
  title: string;
  summary: string;
  whyItMatters: string;
  completionDefinition: string;
  guardrail: string;
  estimatedEffort: "10–15 min" | "15–30 min" | "30+ min" | "Review when ready";
  guide: Extract<MoveAction, { kind: "guide" }>;
  artifact?: Extract<MoveAction, { kind: "artifact" }>;
  externalAction?: Extract<MoveAction, { kind: "external" }>;
  evidence: MoveEvidence[];
};

export type NextUsefulMovePlan = {
  version: 1;
  repo: string;
  score: number;
  grade: string;
  primary: MoveDefinition;
  secondary: MoveDefinition[];
  applicableMoveIds: MoveId[];
  generatedFrom: "current-audit-result";
};

const CHECK_LABELS = {
  contributing: "CONTRIBUTING.md",
  conduct: "CODE_OF_CONDUCT.md",
  readmeSetup: "README setup section",
  license: "LICENSE",
  recentActivity: "Recently active",
} as const;

const REPOSITORY_ROOT = (repo: string) => `https://github.com/${repo}`;

function checkByLabel(checks: Check[], label: string) {
  return checks.find((check) => check.label === label);
}

function checkFailed(checks: Check[], label: string) {
  return checkByLabel(checks, label)?.passed === false;
}

function checkEvidence(check: Check | undefined, missingMessage: string): MoveEvidence[] {
  if (!check) {
    return [];
  }

  return [
    {
      label: check.label,
      observed: check.passed ? "present in this audit" : missingMessage,
    },
  ];
}

function guide(label: string, href: `/guides/${string}`): Extract<MoveAction, { kind: "guide" }> {
  return { kind: "guide", label, href };
}

function artifact(
  label: string,
  artifactId: ActionArtifactId,
): Extract<MoveAction, { kind: "artifact" }> {
  return { kind: "artifact", label, artifactId };
}

function external(label: string, href: string): Extract<MoveAction, { kind: "external" }> {
  return { kind: "external", label, href };
}

function makeReadmeSetupMove(result: ScoreResult): MoveDefinition {
  const check = checkByLabel(result.checks, CHECK_LABELS.readmeSetup);

  return {
    id: "readme-setup",
    journeyStage: "first-run",
    priority: 10,
    title: "Write a setup path a newcomer can finish",
    summary: "Add a short, tested README route from prerequisites to a working local result.",
    whyItMatters:
      "A first contributor needs a reliable route from clone to a working baseline before they can evaluate or change the project.",
    completionDefinition:
      "A newcomer can find prerequisites, install, start, and expected-result instructions without a private credential.",
    guardrail: "Run every published command yourself and never put secrets in README text.",
    estimatedEffort: "15–30 min",
    guide: guide("Read the README setup guide", "/guides/readme-setup-new-contributor"),
    artifact: artifact("Build an editable setup outline", "readme-setup-outline"),
    externalAction: external("Open repository README", REPOSITORY_ROOT(result.repo)),
    evidence: checkEvidence(check, "no recognised setup section was found"),
  };
}

function makeContributingMove(result: ScoreResult): MoveDefinition {
  const check = checkByLabel(result.checks, CHECK_LABELS.contributing);

  return {
    id: "contributing-guide",
    journeyStage: "safe-participation",
    priority: 20,
    title: "Make contribution expectations visible",
    summary: "Explain how contributors choose work, validate changes, and open a focused pull request.",
    whyItMatters:
      "A willing contributor should not have to guess about scope, review expectations, or a safe starting point.",
    completionDefinition:
      "A public contribution guide explains the local baseline, work selection, validation, and review boundaries that match this project.",
    guardrail: "Replace every placeholder with project facts; do not promise a merge or response time.",
    estimatedEffort: "15–30 min",
    guide: guide("Read the contribution-guide guide", "/guides/write-contributing-guide-developers-use"),
    artifact: artifact("Build an editable CONTRIBUTING outline", "contributing-guide"),
    externalAction: external("Open repository Community Profile", `${REPOSITORY_ROOT(result.repo)}/community`),
    evidence: checkEvidence(check, "no CONTRIBUTING.md file was found"),
  };
}

function makeConductMove(result: ScoreResult): MoveDefinition {
  const check = checkByLabel(result.checks, CHECK_LABELS.conduct);

  return {
    id: "code-of-conduct",
    journeyStage: "safe-participation",
    priority: 30,
    title: "Publish participation and reporting boundaries",
    summary: "Make expected behavior, unacceptable conduct, and a real reporting route easy to find.",
    whyItMatters:
      "New contributors need to know the collaboration expectations and where to raise concerns without exposing sensitive information in public.",
    completionDefinition:
      "A public code of conduct explains expected behavior, unacceptable behavior, a monitored reporting route, and enforcement boundaries.",
    guardrail: "Choose a reporting route that a responsible project contact actually monitors.",
    estimatedEffort: "15–30 min",
    guide: guide("Read the community-safety guide", "/guides/safe-open-source-dev-lounge"),
    artifact: artifact("Build an editable conduct outline", "code-of-conduct"),
    externalAction: external("Open repository Community Profile", `${REPOSITORY_ROOT(result.repo)}/community`),
    evidence: checkEvidence(check, "no CODE_OF_CONDUCT.md file was found"),
  };
}

function makeLicenseMove(result: ScoreResult): MoveDefinition {
  const check = checkByLabel(result.checks, CHECK_LABELS.license);

  return {
    id: "license",
    journeyStage: "safe-participation",
    priority: 40,
    title: "Clarify how the work can be used",
    summary: "Choose and publish a license the project owners understand and are prepared to maintain.",
    whyItMatters:
      "A visible license helps contributors and users understand the project’s published reuse expectations before they invest time.",
    completionDefinition:
      "A published license file matches the project’s actual reuse and contribution expectations.",
    guardrail: "This is educational guidance, not legal advice; review the choice with a qualified adviser when needed.",
    estimatedEffort: "Review when ready",
    guide: guide("Read how to improve a WelcomeScore result", "/guides/improve-repository-welcomescore"),
    externalAction: external("Open repository Community Profile", `${REPOSITORY_ROOT(result.repo)}/community`),
    evidence: checkEvidence(check, "no published license signal was found"),
  };
}

function issueSearchUrl(repo: string) {
  return `${REPOSITORY_ROOT(repo)}/issues?q=is%3Aopen+is%3Aissue+label%3A%22good+first+issue%22`;
}

function makeStarterIssueMove(result: ScoreResult): MoveDefinition {
  return {
    id: "starter-issue",
    journeyStage: "first-task",
    priority: 50,
    title: "Make one honestly scoped starter issue",
    summary: "Create a genuine newcomer task with context, scope, acceptance criteria, and a safe validation path.",
    whyItMatters:
      "A first contributor needs a bounded task with enough context to begin without private access or guesswork.",
    completionDefinition:
      "At least one real open newcomer issue explains the problem, scope, likely area, acceptance criteria, validation, and what is out of scope.",
    guardrail: "Do not publish placeholder issues or labels to change a score. Keep starter work real and maintained.",
    estimatedEffort: "15–30 min",
    guide: guide("Read the honest good-first-issues guide", "/guides/honest-good-first-issues"),
    artifact: artifact("Build an editable issue brief", "starter-issue-brief"),
    externalAction: external("Review the issue list on GitHub", issueSearchUrl(result.repo)),
    evidence: [
      {
        label: "Open newcomer issues",
        observed: "0 currently found in this audit",
      },
    ],
  };
}

function makeStarterIssueQualityMove(result: ScoreResult): MoveDefinition {
  return {
    id: "starter-issue-quality",
    journeyStage: "first-task",
    priority: 60,
    title: "Keep starter issues clear and current",
    summary: "Review the current newcomer tasks so each one has a bounded outcome and accurate context.",
    whyItMatters:
      "A small set of accurate starter tasks gives contributors a real choice without creating noise or hidden complexity.",
    completionDefinition:
      "Every labelled starter issue still has a clear outcome, practical validation path, and no hidden private dependency.",
    guardrail: "More labels are not automatically better. Update or remove stale tasks instead of inflating the count.",
    estimatedEffort: "10–15 min",
    guide: guide("Read the honest good-first-issues guide", "/guides/honest-good-first-issues"),
    artifact: artifact("Build an editable issue brief", "starter-issue-brief"),
    externalAction: external("Review current starter issues", issueSearchUrl(result.repo)),
    evidence: [
      {
        label: "Open newcomer issues",
        observed: `${result.goodFirstIssueCount} currently found in this audit`,
      },
    ],
  };
}

function makeMaintenanceClarityMove(result: ScoreResult): MoveDefinition {
  const check = checkByLabel(result.checks, CHECK_LABELS.recentActivity);

  return {
    id: "maintenance-clarity",
    journeyStage: "maintenance",
    priority: 70,
    title: "Explain the project’s current maintenance path",
    summary: "Share a factual status note so contributors understand what is active, paused, or best discussed first.",
    whyItMatters:
      "A repository can be quiet by design, but transparent current context helps contributors choose a safe and useful next step.",
    completionDefinition:
      "The repository explains its current maintenance context and a public route for safely discussing work when needed.",
    guardrail: "Do not create cosmetic commits. A transparent status note is better than artificial activity.",
    estimatedEffort: "10–15 min",
    guide: guide("Read how to improve a WelcomeScore result", "/guides/improve-repository-welcomescore"),
    artifact: artifact("Build an editable maintenance note", "maintenance-status-note"),
    externalAction: external("Open repository issues", `${REPOSITORY_ROOT(result.repo)}/issues`),
    evidence: checkEvidence(check, "no recent public activity signal was found"),
  };
}

function makeMaintainThePathMove(result: ScoreResult): MoveDefinition {
  return {
    id: "maintain-the-path",
    journeyStage: "maintenance",
    priority: 90,
    title: "Keep the contributor path honest and current",
    summary: "Review the first-contributor journey after meaningful project changes rather than chasing a higher score.",
    whyItMatters:
      "This audit observes visible contributor signals. Keeping those signals accurate is more useful than treating the result as a certification.",
    completionDefinition:
      "A newcomer can still follow the published setup, contribution, conduct, license, and starter-work path as the project changes.",
    guardrail: "A high score is not a quality, safety, legal, or endorsement certification.",
    estimatedEffort: "Review when ready",
    guide: guide("Read the contributor onboarding checklist", "/guides/open-source-contributor-onboarding-checklist"),
    externalAction: external("Open repository Community Profile", `${REPOSITORY_ROOT(result.repo)}/community`),
    evidence: [
      {
        label: "Audit result",
        observed: `${result.score}/100 with all current contributor checks visible`,
      },
    ],
  };
}

export function resolveNextUsefulMove(result: ScoreResult): NextUsefulMovePlan {
  const candidates: MoveDefinition[] = [];

  if (checkFailed(result.checks, CHECK_LABELS.readmeSetup)) {
    candidates.push(makeReadmeSetupMove(result));
  }
  if (checkFailed(result.checks, CHECK_LABELS.contributing)) {
    candidates.push(makeContributingMove(result));
  }
  if (checkFailed(result.checks, CHECK_LABELS.conduct)) {
    candidates.push(makeConductMove(result));
  }
  if (checkFailed(result.checks, CHECK_LABELS.license)) {
    candidates.push(makeLicenseMove(result));
  }
  if (result.goodFirstIssueCount === 0) {
    candidates.push(makeStarterIssueMove(result));
  } else if (result.goodFirstIssueCount < 10) {
    candidates.push(makeStarterIssueQualityMove(result));
  }
  if (checkFailed(result.checks, CHECK_LABELS.recentActivity)) {
    candidates.push(makeMaintenanceClarityMove(result));
  }
  if (candidates.length === 0) {
    candidates.push(makeMaintainThePathMove(result));
  }

  const moves = candidates.sort((left, right) => left.priority - right.priority);

  return {
    version: 1,
    repo: result.repo,
    score: result.score,
    grade: result.grade,
    primary: moves[0],
    secondary: moves.slice(1, 3),
    applicableMoveIds: moves.map((move) => move.id),
    generatedFrom: "current-audit-result",
  };
}

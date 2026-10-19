import type {
  EffortBand,
  EvidenceItem,
  NextUsefulMove,
} from "@/lib/report/types";
import { buildIssueDraft, sanitizeIssueContent } from "./issueDraft";
import { buildPatchPlan } from "./patchPlan";
import { formatAcceptanceCriteria } from "./acceptance";

export type PrioritizedMoveCandidate = {
  id: string;
  priority: number;
  title: string;
  whyItMatters: string;
  smallestSafeNextStep: string;
  expectedOutcome: string;
  effort: EffortBand;
  evidenceIds: string[];
  acceptanceCriteria: string[];
  suggestedFiles?: string[];
  limitations?: string[];
};

export type MoveSelectorOptions = {
  repoFullName: string;
  hasCiTestJob?: boolean;
  hasPackageMetadata?: boolean;
  hasIssueTemplates?: boolean;
  hasDefaultBranchClarity?: boolean;
  hasReleaseNotes?: boolean;
};

export function selectNextUsefulMove(
  checks: readonly EvidenceItem[],
  options: MoveSelectorOptions,
): NextUsefulMove {
  const checkMap = new Map(checks.map((c) => [c.id, c]));
  const candidates: PrioritizedMoveCandidate[] = [];

  const checkFailed = (id: string) => {
    const item = checkMap.get(id);
    return item ? item.status === "missing" || item.status === "partial" : false;
  };

  const checkIsUnknown = (id: string) => {
    const item = checkMap.get(id);
    return item ? item.status === "unknown" : false;
  };

  // 1. README setup (Priority 10)
  if (checkFailed("readme-setup")) {
    candidates.push({
      id: "readme-setup",
      priority: 10,
      title: "Write a setup path a newcomer can finish",
      whyItMatters:
        "A first contributor needs a reliable route from clone to a working local baseline before they can evaluate or change the project.",
      smallestSafeNextStep:
        "Add a ## Setup section to README.md documenting runtime prerequisites, install command, and run command.",
      expectedOutcome:
        "A newcomer can find prerequisites, install, start, and expected-result instructions without private credentials.",
      effort: "medium",
      evidenceIds: ["readme-setup"],
      acceptanceCriteria: [
        "Prerequisites (Node version, package manager) documented",
        "Verified local install and start commands tested",
        "Expected visible output or address documented",
      ],
      suggestedFiles: ["README.md"],
      limitations: ["Automated scanners check for common setup heading patterns."],
    });
  }

  // 2. CONTRIBUTING.md (Priority 20)
  if (checkFailed("contributing-guide")) {
    candidates.push({
      id: "contributing-guide",
      priority: 20,
      title: "Make contribution expectations visible",
      whyItMatters:
        "A willing contributor should not have to guess about project scope, review expectations, or where to find safe starting work.",
      smallestSafeNextStep:
        "Create CONTRIBUTING.md in the repository root explaining the local development loop and PR process.",
      expectedOutcome:
        "A public contribution guide explains local baseline setup, work selection, validation, and review boundaries.",
      effort: "medium",
      evidenceIds: ["contributing-guide"],
      acceptanceCriteria: [
        "CONTRIBUTING.md created in repository root",
        "Local test and lint instructions specified",
        "Branching and PR guidelines clearly stated",
      ],
      suggestedFiles: ["CONTRIBUTING.md"],
      limitations: ["Presence of file is verified; content quality requires human review."],
    });
  }

  // 3. CODE_OF_CONDUCT.md (Priority 30)
  if (checkFailed("code-of-conduct")) {
    candidates.push({
      id: "code-of-conduct",
      priority: 30,
      title: "Publish participation and reporting boundaries",
      whyItMatters:
        "New contributors need to know collaboration standards and where to raise concerns without exposing sensitive information publicly.",
      smallestSafeNextStep:
        "Add CODE_OF_CONDUCT.md with a monitored private reporting email address.",
      expectedOutcome:
        "A public code of conduct explains expected behavior, unacceptable conduct, and a monitored reporting route.",
      effort: "small",
      evidenceIds: ["code-of-conduct"],
      acceptanceCriteria: [
        "CODE_OF_CONDUCT.md added to repository root",
        "Monitored contact route or reporting email specified",
      ],
      suggestedFiles: ["CODE_OF_CONDUCT.md"],
      limitations: ["Requires a designated maintainer who actively monitors the reporting route."],
    });
  }

  // 4. LICENSE (Priority 40)
  if (checkFailed("license")) {
    candidates.push({
      id: "license",
      priority: 40,
      title: "Clarify how the work can be used",
      whyItMatters:
        "A visible license helps contributors and users understand published reuse expectations before investing time.",
      smallestSafeNextStep:
        "Add an OSI-approved license file (e.g., MIT, Apache-2.0) matching project intent.",
      expectedOutcome:
        "A published license file matches the project's actual reuse and contribution expectations.",
      effort: "small",
      evidenceIds: ["license"],
      acceptanceCriteria: [
        "Recognized open-source license file published in repository root",
        "License field in package.json matches root file",
      ],
      suggestedFiles: ["LICENSE", "package.json"],
      limitations: ["Educational guidance only, not formal legal advice."],
    });
  }

  // 5. CI / Test Workflow (Priority 45)
  if (options.hasCiTestJob === false || checkFailed("cicd-tests") || checkFailed("cicd-workflows")) {
    candidates.push({
      id: "ci-test-workflow",
      priority: 45,
      title: "Add automated CI test workflow",
      whyItMatters:
        "Automated CI validation gives contributors immediate feedback and prevents regressions from entering the default branch.",
      smallestSafeNextStep:
        "Create .github/workflows/test.yml that runs test and lint commands on pull requests.",
      expectedOutcome:
        "Pull requests and pushes to default branch automatically run project tests in CI.",
      effort: "medium",
      evidenceIds: ["cicd-tests", "cicd-workflows"].filter((id) => checkMap.has(id)),
      acceptanceCriteria: [
        "GitHub Actions workflow file created in .github/workflows/",
        "Runs on pull_request and push to default branch",
        "Executes verified npm test or equivalent runner",
      ],
      suggestedFiles: [".github/workflows/test.yml"],
      limitations: ["Detects GitHub Actions workflows; external CI providers may require manual signal correction."],
    });
  }

  // 6. Good First Issues (Priority 50)
  if (checkFailed("starter-issues")) {
    candidates.push({
      id: "starter-issue-quality",
      priority: 50,
      title: "Make one honestly scoped starter issue",
      whyItMatters:
        "A first contributor needs a bounded task with enough context to begin without private access or guesswork.",
      smallestSafeNextStep:
        "Create an open issue labelled 'good first issue' with explicit acceptance criteria and validation steps.",
      expectedOutcome:
        "At least one real open newcomer issue explains problem, scope, validation, and what is out of scope.",
      effort: "small",
      evidenceIds: ["starter-issues"],
      acceptanceCriteria: [
        "Issue tagged with good-first-issue or beginner-friendly label",
        "Clear problem, scope, acceptance criteria, and validation commands specified",
      ],
      suggestedFiles: [".github/ISSUE_TEMPLATE/good_first_issue.md"],
      limitations: ["Scans open issues with standard beginner labels."],
    });
  }

  // 7. Package Metadata (Priority 55)
  if (options.hasPackageMetadata === false || checkFailed("package-metadata") || checkFailed("package-exports")) {
    candidates.push({
      id: "package-metadata",
      priority: 55,
      title: "Complete package metadata and explicit exports",
      whyItMatters:
        "Explicit package metadata, engines range, and entry points prevent subtle runtime and installation discrepancies.",
      smallestSafeNextStep:
        "Add engines.node and export mappings to package.json.",
      expectedOutcome:
        "package.json declares description, license, engines.node, and explicit exports.",
      effort: "small",
      evidenceIds: ["package-metadata", "package-exports"].filter((id) => checkMap.has(id)),
      acceptanceCriteria: [
        "engines.node declared in package.json",
        "Explicit exports defined for package entry points",
      ],
      suggestedFiles: ["package.json"],
      limitations: ["Evaluates standard package.json fields."],
    });
  }

  // 8. Issue Templates (Priority 60)
  if (options.hasIssueTemplates === false) {
    candidates.push({
      id: "issue-templates",
      priority: 60,
      title: "Add GitHub issue templates",
      whyItMatters:
        "Structured templates help new contributors provide reproduction steps, environment details, and clear expectations.",
      smallestSafeNextStep:
        "Add bug report and feature request templates in .github/ISSUE_TEMPLATE/.",
      expectedOutcome:
        "Incoming issues follow structured, maintainable prompts.",
      effort: "small",
      evidenceIds: [],
      acceptanceCriteria: [
        "Bug report and feature request templates created under .github/ISSUE_TEMPLATE/",
      ],
      suggestedFiles: [
        ".github/ISSUE_TEMPLATE/bug_report.md",
        ".github/ISSUE_TEMPLATE/feature_request.md",
      ],
      limitations: ["Checked when inspecting .github directory."],
    });
  }

  // 9. Default Branch Clarity (Priority 65)
  if (options.hasDefaultBranchClarity === false) {
    candidates.push({
      id: "default-branch-clarity",
      priority: 65,
      title: "Clarify default branch and contribution flow",
      whyItMatters:
        "Clear branch guidance prevents contributors from accidentally basing work on obsolete or protected branches.",
      smallestSafeNextStep:
        "Mention the target branch and feature branch naming convention in CONTRIBUTING.md.",
      expectedOutcome:
        "Contributors know which branch to base PRs on and how to submit changes.",
      effort: "small",
      evidenceIds: [],
      acceptanceCriteria: [
        "Default branch referenced in contribution documentation",
      ],
      suggestedFiles: ["CONTRIBUTING.md"],
      limitations: ["Advisory recommendation."],
    });
  }

  // 10. Release Guidance (Priority 70)
  if (options.hasReleaseNotes === false) {
    candidates.push({
      id: "release-guidance",
      priority: 70,
      title: "Add release notes and changelog guidance",
      whyItMatters:
        "A visible release history helps contributors track progress and understand when fixes are published.",
      smallestSafeNextStep:
        "Document the release cadence or create a CHANGELOG.md file.",
      expectedOutcome:
        "Contributors can verify which changes are included in each release.",
      effort: "small",
      evidenceIds: [],
      acceptanceCriteria: [
        "CHANGELOG.md created or release notes process documented in CONTRIBUTING.md",
      ],
      suggestedFiles: ["CHANGELOG.md"],
      limitations: ["Advisory documentation guidance."],
    });
  }

  // 11. Uncertain or False Signals (Priority 80)
  const unknownChecks = checks.filter((c) => checkIsUnknown(c.id));
  if (unknownChecks.length > 0) {
    const unknownLabels = unknownChecks.map((c) => c.label).join(", ");
    candidates.push({
      id: "uncertain-signal",
      priority: 80,
      title: "Verify uncertain repository health signals",
      whyItMatters:
        "Some checks could not be definitively observed due to rate limits or non-standard configurations.",
      smallestSafeNextStep:
        "Review uncertain signals and document custom repository conventions if appropriate.",
      expectedOutcome:
        "Repository conventions are documented or verified.",
      effort: "small",
      evidenceIds: unknownChecks.map((c) => c.id),
      acceptanceCriteria: [
        `Review observed status of ${unknownLabels}`,
        "Submit a signal correction if a convention was unobserved",
      ],
      suggestedFiles: ["README.md", "docs/CONVENTIONS.md"],
      limitations: ["Uncertain signals are excluded from negative scoring."],
    });
  }

  // Deterministic fallback: Maintain existing path (Priority 90)
  if (candidates.length === 0) {
    candidates.push({
      id: "maintain-the-path",
      priority: 90,
      title: "Keep the contributor path honest and current",
      whyItMatters:
        "This audit observes visible contributor readiness signals. Keeping those signals accurate is more valuable than treating score as a certification.",
      smallestSafeNextStep:
        "Review contributor onboarding after meaningful project changes rather than chasing vanity metrics.",
      expectedOutcome:
        "Newcomers continue to have a reliable setup, contribution, and starter task journey as the codebase evolves.",
      effort: "small",
      evidenceIds: checks.map((c) => c.id),
      acceptanceCriteria: [
        "All contributor readiness documents reviewed during regular maintenance",
      ],
      suggestedFiles: ["CONTRIBUTING.md", "README.md"],
      limitations: ["A high score is not a security guarantee or legal certification."],
    });
  }

  // Deterministic tie-breaking: lower priority number first, then alphabetical id
  candidates.sort((a, b) => {
    if (a.priority !== b.priority) {
      return a.priority - b.priority;
    }
    return a.id.localeCompare(b.id);
  });

  const selected = candidates[0];
  const cleanRepo = sanitizeIssueContent(options.repoFullName);

  return {
    id: selected.id,
    title: selected.title,
    whyItMatters: selected.whyItMatters,
    evidenceIds: selected.evidenceIds,
    effort: selected.effort,
    expectedOutcome: selected.expectedOutcome,
    acceptanceCriteria: formatAcceptanceCriteria([
      ...selected.acceptanceCriteria,
      `Smallest next step: ${selected.smallestSafeNextStep}`,
    ]),
    suggestedFiles: selected.suggestedFiles,
    issueDraft: buildIssueDraft(selected.id, cleanRepo),
    patchPlan: buildPatchPlan(selected.id),
    limitations: selected.limitations ?? [
      "Generated from deterministic audit evidence; review all drafts before opening issues or applying patches.",
    ],
  };
}

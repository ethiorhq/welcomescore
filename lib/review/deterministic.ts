import { selectNonRepeatingVariant, type VariantHistory } from "@/lib/variation";
import type { AlgofoxReview, AlgofoxReviewMode, TrustedReviewContext } from "@/lib/review/types";

export type DeterministicReviewResult = {
  review: AlgofoxReview;
  variationHistory: VariantHistory;
};

type ReviewCopy = {
  roastText: readonly string[];
  motivationText: readonly string[];
};

const FOCUS_COPY: Record<string, ReviewCopy> = {
  "CONTRIBUTING.md": {
    roastText: [
      "No CONTRIBUTING.md. New contributors are currently expected to reverse-engineer the workflow from vibes alone.",
      "Zero contribution docs. A first pull request should not begin with guessing the project’s route map.",
      "No CONTRIBUTING.md found. The onboarding process is currently: inspect, infer, and hope.",
      "Contributions may be possible, but the path to one is still doing an excellent impression of a locked door.",
    ],
    motivationText: [
      "Add a short CONTRIBUTING.md covering issue selection, local setup, checks, and the first pull-request steps.",
      "Publish a contributor guide with the smallest useful path: choose a task, make a change, run checks, open a PR.",
      "A focused CONTRIBUTING.md can turn the first contribution from guesswork into a repeatable workflow.",
      "Document the contributor path in a few concrete steps so a newcomer knows where to start and what good looks like.",
    ],
  },
  LICENSE: {
    roastText: [
      "No LICENSE file. Forking or reusing this code currently requires a very confident game of ‘probably fine.’",
      "Missing a license. The repository is all rights reserved by accident unless the rules say otherwise.",
      "No license detected. A contributor asking whether they can use the work still has no documented answer.",
      "The code is visible, but its reuse terms are not. That leaves the contributor path legally unfinished.",
    ],
    motivationText: [
      "Choose and add an appropriate LICENSE so contributors can understand the reuse and contribution terms immediately.",
      "Add a clear LICENSE file, then mention it in the README so the project’s sharing terms are easy to find.",
      "A published license removes a basic contributor question before anyone has to ask it.",
      "Document the project’s reuse terms with a LICENSE to make the repository’s invitation to collaborate complete.",
    ],
  },
  "Good-first-issue labels": {
    roastText: [
      "Zero labeled entry points. A developer ready to help still has no clearly marked place to begin.",
      "No beginner-friendly issues are tagged. Newcomers are left to estimate scope from the whole tracker.",
      "No good-first-issue labels. The welcome mat may exist, but it is not labeled as one.",
      "The issue tracker has work, but not a clearly signposted first step for a new contributor.",
    ],
    motivationText: [
      "Label one or two scoped tasks as good first issues and add enough context for a newcomer to start confidently.",
      "Create a small first-contribution lane: choose an approachable issue, add acceptance notes, and apply a clear label.",
      "A few well-scoped good-first-issue labels give new contributors a practical starting point without reading the whole tracker.",
      "Mark a low-risk task with a good-first-issue label and explain the expected outcome in the issue itself.",
    ],
  },
  "README setup section": {
    roastText: [
      "No install or setup section in the README. Step one of contributing is apparently telepathy.",
      "The README does not explain how to run the project, so setup remains an undocumented prerequisite.",
      "No clear setup path was found. A contributor should not need source-code archaeology to reach a first run.",
      "The project introduces itself, then leaves the local run command offstage when a newcomer needs it most.",
    ],
    motivationText: [
      "Add a short README setup path with prerequisites, install commands, and one successful local run.",
      "Document the smallest working setup sequence so a newcomer can move from clone to first run without guessing.",
      "A concise prerequisites-and-run section will make the README useful at the exact moment a contributor needs it.",
      "Show the first successful setup in the README, including the command a contributor can use to confirm it worked.",
    ],
  },
  "CODE_OF_CONDUCT.md": {
    roastText: [
      "No code of conduct was detected. The community path is missing its documented expectations.",
      "The repository has no visible code of conduct, leaving contributor standards to be inferred instead of stated.",
      "A newcomer can find the code, but not the project’s documented community guidelines.",
      "The contributor path is more complete with clear community standards than with an unwritten rulebook.",
    ],
    motivationText: [
      "Add a code of conduct and link it from the README so community expectations are visible before participation begins.",
      "Publish clear contributor standards in a CODE_OF_CONDUCT.md and make the document easy to locate.",
      "A short, discoverable code of conduct gives contributors a documented baseline for constructive participation.",
      "Document community expectations alongside the technical workflow to make the welcome signal more complete.",
    ],
  },
  "Recently active": {
    roastText: [
      "The audit found no recent pushes. A newcomer cannot easily tell whether this contributor path is currently staffed.",
      "Recent activity is not visible in the audit window, so the repository’s maintenance signal is quieter than it needs to be.",
      "The project may have a path in place, but a lack of recent pushes leaves its current momentum unclear to newcomers.",
      "No recent push signal was detected. A small maintenance update would make the repository’s present state easier to read.",
    ],
    motivationText: [
      "Make one visible maintenance update and respond to a newcomer-facing issue to refresh the project’s activity signal.",
      "A current release note, documentation improvement, or triaged newcomer issue can show that the contribution path is active.",
      "Refresh the public maintenance signal with a small, useful update that a new contributor can see and build on.",
      "Keep the contributor path current with a visible update and a clear response on an approachable issue.",
    ],
  },
};

const COMBO_COPY: Record<string, ReviewCopy> = {
  "CONTRIBUTING.md|Good-first-issue labels": {
    roastText: [
      "No contribution guide and no labeled first task. The welcome path begins with archaeology and ends in guesswork.",
      "CONTRIBUTING.md and good-first-issue labels are both missing, so a newcomer gets neither a route nor a first stop.",
      "The repo invites help without a contribution map or marked starting task. That is a scavenger hunt, not onboarding.",
    ],
    motivationText: [
      "Pair a short CONTRIBUTING.md with one scoped good-first-issue so a newcomer can choose a task and submit with confidence.",
      "Document the first-PR workflow, then label one approachable task to connect the instructions to real work.",
      "Create a contribution guide and a visible starter issue together; each makes the other immediately more useful.",
    ],
  },
  "LICENSE|README setup section": {
    roastText: [
      "The repository does not yet explain either how to run the project or the terms for reusing it. Two essentials are still offstage.",
      "Setup instructions and a license are both missing, so contributors lack a clear local start and clear reuse terms.",
      "Before a newcomer can confidently use or contribute to the code, the README needs a setup path and the repo needs a license.",
    ],
    motivationText: [
      "Add a small setup section and an appropriate LICENSE first; together they answer two of a newcomer’s earliest questions.",
      "Publish the local run steps beside a clear license so contributors can start the project and understand its terms.",
      "Make the opening path concrete: document one successful setup and add the project’s reuse terms in a LICENSE file.",
    ],
  },
  "README setup section|CONTRIBUTING.md": {
    roastText: [
      "The repository has neither a local setup route nor a contribution guide, so the first PR still starts before the project can run.",
      "No setup section and no contribution guide means a newcomer is missing both the first run and the path after it.",
      "The contributor journey has two blank pages: how to run the project and how to submit a change.",
    ],
    motivationText: [
      "Write the first local run in the README, then link it to a CONTRIBUTING.md that explains how to turn that run into a PR.",
      "Connect setup to contribution: document prerequisites and commands, then give a short guide for selecting and submitting work.",
      "A README setup path plus CONTRIBUTING.md will create a coherent route from clone to first pull request.",
    ],
  },
  "LICENSE|CONTRIBUTING.md": {
    roastText: [
      "The repository is missing both the reuse terms and the contribution route. Collaboration needs each of those basics stated plainly.",
      "No license and no contribution guide leaves newcomers without a documented answer to either ‘may I?’ or ‘how do I?’",
      "The project is inviting collaboration with two key signs still missing: the license terms and the contribution instructions.",
    ],
    motivationText: [
      "Add an appropriate LICENSE and a focused CONTRIBUTING.md so reuse rules and first-PR steps are equally clear.",
      "Pair the project’s license with a concise contribution guide to turn an informal invitation into a usable workflow.",
      "Document both the collaboration terms and the contribution steps; that gives newcomers a clear first decision and next action.",
    ],
  },
};

const CELEBRATION_COPY: ReviewCopy = {
  roastText: [
    "A contributor-ready score with no obvious gaps? Algofox has checked twice and is officially impressed.",
    "This contributor path is unusually easy to applaud: the practical welcome signals are all in place.",
    "The audit found a repository that treats a first contribution like a planned experience, not a lucky accident.",
    "The welcome mat is doing its job here: clear docs, visible signals, and a path a newcomer can follow.",
  ],
  motivationText: [
    "Keep this momentum by reviewing newcomer issues and refreshing contributor docs as the project evolves.",
    "You have built a warm contributor path. Periodic doc reviews will help it stay that way as the codebase changes.",
    "Maintain the standard by keeping starter issues current and treating documentation as part of the contributor experience.",
    "This is a strong foundation. Small, regular checks of setup steps and starter tasks will protect it over time.",
  ],
};

const GENERIC_COPY: ReviewCopy = {
  roastText: [
    "The audit found a contributor path with room to become clearer, shorter, and easier to enter.",
    "There is useful groundwork here, but the first-contributor experience still has a few avoidable detours.",
    "The repository can make its welcome signal more practical by turning its remaining gaps into visible guidance.",
    "A newcomer should need fewer assumptions than this audit currently asks them to make.",
  ],
  motivationText: [
    "Tackle the most visible contributor gap first, then rerun the audit to measure the improvement.",
    "One focused contributor-facing improvement can make the next first contribution substantially easier.",
    "Choose the clearest missing signal, make it visible, and build the rest of the path from there.",
    "Improve one newcomer-facing detail at a time; practical documentation changes compound quickly.",
  ],
};

export function generateDeterministicReview(
  context: TrustedReviewContext,
  variationHistory: VariantHistory = {},
): DeterministicReviewResult {
  const focusChecks = context.focusChecks.map((check) => check.label);
  const focusKey = focusChecks.join("|");
  const copy = copyFor(focusKey, context);
  const mode = modeForScore(context.score);
  const roastSelection = selectNonRepeatingVariant(`roast:${mode}:${focusKey || "celebration"}`, copy.roastText, variationHistory);
  const motivationSelection = selectNonRepeatingVariant(
    `motivation:${mode}:${focusKey || "celebration"}`,
    copy.motivationText,
    roastSelection.history,
  );

  return {
    review: withProvider({
      mode,
      spriteState: stateForMode(mode),
      headline: headlineForMode(mode),
      roastText: roastSelection.value,
      motivationText: motivationSelection.value,
      focusChecks,
    }),
    variationHistory: motivationSelection.history,
  };
}

function copyFor(focusKey: string, context: TrustedReviewContext) {
  if (context.score >= 85) {
    return CELEBRATION_COPY;
  }

  return COMBO_COPY[focusKey] ?? FOCUS_COPY[focusKey] ?? FOCUS_COPY[context.focusChecks[0]?.label] ?? GENERIC_COPY;
}

function modeForScore(score: number): AlgofoxReviewMode {
  if (score >= 85) {
    return "celebration";
  }

  return score < 50 ? "tough-love" : "motivation";
}

function stateForMode(mode: AlgofoxReviewMode): AlgofoxReview["spriteState"] {
  return mode === "celebration" ? "jumping" : mode === "tough-love" ? "failed" : "review";
}

function headlineForMode(mode: AlgofoxReviewMode) {
  if (mode === "celebration") {
    return "Contributor-ready momentum";
  }

  return mode === "tough-love" ? "A clear path upward" : "Foundations worth building on";
}

function withProvider(review: Omit<AlgofoxReview, "schemaVersion" | "provider">): AlgofoxReview {
  return {
    schemaVersion: 1,
    provider: "rule-engine",
    ...review,
  };
}

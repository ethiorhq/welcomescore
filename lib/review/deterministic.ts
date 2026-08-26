import type { AlgofoxReview, TrustedReviewContext } from "@/lib/review/types";

export function generateDeterministicReview(context: TrustedReviewContext): AlgofoxReview {
  const focusChecks = context.focusChecks.map((check) => check.label);
  const primaryFocus = focusChecks[0];

  if (context.score >= 85) {
    return withProvider({
      mode: "celebration",
      spriteState: "jumping",
      headline: "Contributor-ready momentum",
      roastText: `A ${context.score}/100 in ${context.primaryLanguage}? This repository has made the welcome mat suspiciously hard to criticize.`,
      motivationText:
        "Keep the contributor path polished by reviewing newcomer issues and documentation as the project evolves.",
      focusChecks,
    });
  }

  if (context.score >= 75) {
    return withProvider({
      mode: "motivation",
      spriteState: "review",
      headline: "A strong welcome is taking shape",
      roastText: `${context.score}/100 is a solid contributor signal. Algofox only found a couple of details trying to hide behind the README.`,
      motivationText: actionForFocus(primaryFocus, "A small final pass can make the contributor path feel complete."),
      focusChecks,
    });
  }

  if (context.score < 50) {
    return withProvider({
      mode: "tough-love",
      spriteState: "failed",
      headline: "A clear path upward",
      roastText: roastForFocus(primaryFocus, context),
      motivationText: actionForFocus(
        primaryFocus,
        "Start with one visible contributor signal, then rerun the audit to see progress.",
      ),
      focusChecks,
    });
  }

  return withProvider({
    mode: "motivation",
    spriteState: "review",
    headline: "Foundations worth building on",
    roastText: roastForFocus(primaryFocus, context),
    motivationText: actionForFocus(
      primaryFocus,
      "Tackle the most visible contributor gap first, then build from there.",
    ),
    focusChecks,
  });
}

function withProvider(review: Omit<AlgofoxReview, "schemaVersion" | "provider">): AlgofoxReview {
  return {
    schemaVersion: 1,
    provider: "rule-engine",
    ...review,
  };
}

function roastForFocus(focus: string | undefined, context: TrustedReviewContext) {
  switch (focus) {
    case "LICENSE":
      return `A ${context.score}/100 with no LICENSE is a bold invitation to contribute without explaining what anyone may legally do next.`;
    case "README setup section":
      return "The README opens the door, then quietly forgets to explain how a first-time contributor gets the project running.";
    case "CONTRIBUTING.md":
      return "Contributors are welcome in spirit, but the repository still makes them improvise the route map on arrival.";
    case "CODE_OF_CONDUCT.md":
      return "A community path without a code of conduct leaves the welcome sign doing more emotional labor than it should.";
    case "Good-first-issue labels":
      return context.goodFirstIssueCount > 0
        ? "There are newcomer issues, but their labels are not yet doing the full job of guiding a first contribution."
        : "New contributors are ready to help; the issue tracker has not yet left them a clear first task.";
    case "Recently active":
      return "The contributor path looks promising, but recent activity is keeping the welcome signal quieter than it needs to be.";
    default:
      return `At ${context.score}/100, this ${context.primaryLanguage} repository has room to make first contributions less of an archaeological dig.`;
  }
}

function actionForFocus(focus: string | undefined, fallback: string) {
  switch (focus) {
    case "LICENSE":
      return "Add an appropriate LICENSE so contributors know how they can use and improve the work.";
    case "README setup section":
      return "Add a short setup path to the README: prerequisites, install command, and one first successful run.";
    case "CONTRIBUTING.md":
      return "Add CONTRIBUTING.md with a small, concrete path from issue selection to a first pull request.";
    case "CODE_OF_CONDUCT.md":
      return "Add a clear code of conduct so contributors understand the community standards before they participate.";
    case "Good-first-issue labels":
      return "Mark one or two scoped tasks with a clear good-first-issue label and enough context to start confidently.";
    case "Recently active":
      return "Refresh the contributor path with a visible maintenance update and a response to a newcomer-facing issue.";
    default:
      return fallback;
  }
}

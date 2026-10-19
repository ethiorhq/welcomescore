import type { PatchPlanSafety } from "@/lib/report/types";

export type PatchPlan = {
  files: string[];
  operations: string[];
  safety: PatchPlanSafety;
};

export function buildPatchPlan(moveId: string): PatchPlan | undefined {
  switch (moveId) {
    case "contributing-guide":
      return {
        files: ["CONTRIBUTING.md"],
        operations: [
          "Create CONTRIBUTING.md from reviewed starter template",
          "Add local install, test, and branch contribution instructions",
        ],
        safety: "low-risk",
      };

    case "readme-setup":
      return {
        files: ["README.md"],
        operations: [
          "Insert ## Setup section with verified local commands",
          "Document runtime prerequisites and port/address expectations",
        ],
        safety: "review-required",
      };

    case "code-of-conduct":
      return {
        files: ["CODE_OF_CONDUCT.md"],
        operations: [
          "Create CODE_OF_CONDUCT.md from standard Contributor Covenant template",
          "Specify monitored contact route and enforcement guidelines",
        ],
        safety: "low-risk",
      };

    case "license":
      return {
        files: ["LICENSE", "package.json"],
        operations: [
          "Add standard open-source license file in repository root",
          "Ensure package.json license field matches chosen license",
        ],
        safety: "review-required",
      };

    case "ci-test-workflow":
      return {
        files: [".github/workflows/test.yml"],
        operations: [
          "Create GitHub Actions CI workflow to run test script on push and pull_request",
          "Configure actions/checkout and actions/setup-node steps",
        ],
        safety: "low-risk",
      };

    case "starter-issue-quality":
    case "starter-issue":
      return {
        files: [".github/ISSUE_TEMPLATE/good_first_issue.md"],
        operations: [
          "Create or update starter issue template with required context sections",
          "Include clear problem, scope, validation, and acceptance criteria sections",
        ],
        safety: "low-risk",
      };

    case "package-metadata":
      return {
        files: ["package.json"],
        operations: [
          "Add missing description, repository, and engines fields",
          "Define explicit entry points in exports map",
        ],
        safety: "review-required",
      };

    case "default-branch-clarity":
      return {
        files: ["CONTRIBUTING.md"],
        operations: [
          "Document default branch name in contribution guide",
          "Explain feature branch naming and rebase/merge convention",
        ],
        safety: "low-risk",
      };

    case "issue-templates":
      return {
        files: [
          ".github/ISSUE_TEMPLATE/bug_report.md",
          ".github/ISSUE_TEMPLATE/feature_request.md",
          ".github/ISSUE_TEMPLATE/good_first_issue.md",
        ],
        operations: [
          "Create standard GitHub issue templates to structure incoming reports",
        ],
        safety: "low-risk",
      };

    case "release-guidance":
      return {
        files: ["CHANGELOG.md"],
        operations: [
          "Create CHANGELOG.md documenting released versions",
          "Add release notes section to CONTRIBUTING.md",
        ],
        safety: "low-risk",
      };

    case "uncertain-signal":
      return {
        files: ["README.md", "docs/CONVENTIONS.md"],
        operations: [
          "Document non-standard project structure or tooling conventions",
          "Add clarification link for automated scanners",
        ],
        safety: "review-required",
      };

    default:
      return undefined;
  }
}

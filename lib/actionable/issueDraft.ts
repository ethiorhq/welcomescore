export type IssueDraft = {
  title: string;
  body: string;
  labels: string[];
};

export function sanitizeIssueContent(value: string): string {
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/<\/?[a-zA-Z][^>]*>/g, "")
    .trim();
}

export function buildIssueDraft(
  moveId: string,
  repoFullName: string,
  observedDetails?: string,
): IssueDraft | undefined {
  const cleanRepo = sanitizeIssueContent(repoFullName);
  const cleanDetails = observedDetails ? sanitizeIssueContent(observedDetails) : "";

  switch (moveId) {
    case "contributing-guide":
      return {
        title: "docs: Add CONTRIBUTING.md contributor guide",
        body: `## Summary\nProvide a visible contributor guide explaining local development, workflow, and PR expectations for ${cleanRepo}.\n\n${
          cleanDetails ? `### Observed Context\n${cleanDetails}\n\n` : ""
        }### Acceptance Criteria\n- [ ] \`CONTRIBUTING.md\` added to repository root\n- [ ] Local install, test, and verification commands documented\n- [ ] Clear pull request instructions for first-time contributors\n\n*Drafted by WelcomeScore deterministic review.*`,
        labels: ["documentation", "good first issue"],
      };

    case "readme-setup":
      return {
        title: "docs: Add local setup instructions to README",
        body: `## Problem\nNew contributors cannot easily get started without documented prerequisites and setup steps for ${cleanRepo}.\n\n${
          cleanDetails ? `### Observed Context\n${cleanDetails}\n\n` : ""
        }### Acceptance Criteria\n- [ ] Prerequisites (Node version, package manager) documented\n- [ ] Verified local install and start commands tested\n- [ ] Expected visible output or port documented\n- [ ] No private secrets or credentials required\n\n*Drafted by WelcomeScore deterministic review.*`,
        labels: ["documentation", "good first issue"],
      };

    case "code-of-conduct":
      return {
        title: "docs: Add CODE_OF_CONDUCT.md community standard",
        body: `## Summary\nEstablish clear community participation expectations and a monitored contact route for ${cleanRepo}.\n\n### Acceptance Criteria\n- [ ] \`CODE_OF_CONDUCT.md\` added to repository root\n- [ ] Monitored reporting email or process specified\n- [ ] Enforcement guidelines outlined\n\n*Drafted by WelcomeScore deterministic review.*`,
        labels: ["governance"],
      };

    case "license":
      return {
        title: "docs: Clarify repository LICENSE",
        body: `## Summary\nPublish an open-source license so contributors and downstream users understand usage and distribution rights for ${cleanRepo}.\n\n### Acceptance Criteria\n- [ ] Open-source license file (e.g. MIT, Apache-2.0) published in repository root\n- [ ] \`package.json\` license field matches file\n\n*Drafted by WelcomeScore deterministic review.*`,
        labels: ["governance"],
      };

    case "ci-test-workflow":
      return {
        title: "ci: Add automated test workflow in GitHub Actions",
        body: `## Problem\nAutomated tests are not currently verified on incoming pull requests for ${cleanRepo}.\n\n${
          cleanDetails ? `### Observed Context\n${cleanDetails}\n\n` : ""
        }### Acceptance Criteria\n- [ ] \`.github/workflows/test.yml\` workflow configured\n- [ ] Runs on pull_request and push to default branch\n- [ ] Runs test command against supported Node versions\n\n*Drafted by WelcomeScore deterministic review.*`,
        labels: ["ci", "tooling"],
      };

    case "starter-issue-quality":
    case "starter-issue":
      return {
        title: "chore: Scope and label a beginner-friendly starter issue",
        body: `## Summary\nCreate at least one well-scoped task with clear acceptance criteria for first-time contributors to ${cleanRepo}.\n\n### Acceptance Criteria\n- [ ] Issue describes a small, self-contained change\n- [ ] Likely files to inspect are linked\n- [ ] Clear validation steps provided\n- [ ] Label with \`good first issue\`\n\n*Drafted by WelcomeScore deterministic review.*`,
        labels: ["good first issue", "help wanted"],
      };

    case "package-metadata":
      return {
        title: "chore: Complete package metadata and explicit exports",
        body: `## Summary\nEnsure \`package.json\` includes complete metadata, engines range, and explicit exports for ${cleanRepo}.\n\n${
          cleanDetails ? `### Observed Context\n${cleanDetails}\n\n` : ""
        }### Acceptance Criteria\n- [ ] \`name\`, \`version\`, \`description\`, and \`license\` fields present\n- [ ] \`engines.node\` specified\n- [ ] Explicit entry points declared in \`exports\`\n\n*Drafted by WelcomeScore deterministic review.*`,
        labels: ["tooling"],
      };

    case "default-branch-clarity":
      return {
        title: "chore: Clarify default branch and branch protection",
        body: `## Summary\nEnsure the repository default branch is clearly documented in contribution guidelines for ${cleanRepo}.\n\n### Acceptance Criteria\n- [ ] Default branch specified in \`CONTRIBUTING.md\`\n- [ ] PR instructions reference target branch\n\n*Drafted by WelcomeScore deterministic review.*`,
        labels: ["documentation"],
      };

    case "issue-templates":
      return {
        title: "chore: Add GitHub issue templates",
        body: `## Summary\nAdd structured GitHub issue templates under \`.github/ISSUE_TEMPLATE/\` to guide bug reports, features, and first-time contribution questions for ${cleanRepo}.\n\n### Acceptance Criteria\n- [ ] Bug report template created\n- [ ] Feature / improvement template created\n- [ ] Good-first-issue template created\n\n*Drafted by WelcomeScore deterministic review.*`,
        labels: ["tooling", "good first issue"],
      };

    case "release-guidance":
      return {
        title: "docs: Add release and changelog documentation",
        body: `## Summary\nDocument how versions are tagged, released, and communicated to contributors for ${cleanRepo}.\n\n### Acceptance Criteria\n- [ ] \`CHANGELOG.md\` or GitHub Releases process documented\n- [ ] Versioning convention (e.g. SemVer) stated in \`CONTRIBUTING.md\`\n\n*Drafted by WelcomeScore deterministic review.*`,
        labels: ["documentation"],
      };

    case "uncertain-signal":
      return {
        title: "chore: Verify and clarify repository health signals",
        body: `## Summary\nReview and document any non-standard conventions or ambiguous signals observed during WelcomeScore repository audit for ${cleanRepo}.\n\n${
          cleanDetails ? `### Observed Context\n${cleanDetails}\n\n` : ""
        }### Acceptance Criteria\n- [ ] Review signal observation with project maintainers\n- [ ] Document repository conventions or submit signal correction\n\n*Drafted by WelcomeScore deterministic review.*`,
        labels: ["maintenance"],
      };

    default:
      return undefined;
  }
}

import { REPORT_SCHEMA_VERSION, CURRENT_TOOL_VERSION } from "./version";
import type { WelcomeScoreReport } from "./types";

export const validReportFixture: WelcomeScoreReport = {
  schemaVersion: REPORT_SCHEMA_VERSION,
  toolVersion: CURRENT_TOOL_VERSION,
  repository: {
    owner: "ethiorhq",
    name: "welcomescore",
    fullName: "ethiorhq/welcomescore",
    defaultBranch: "main",
    source: "github",
  },
  analyzedAt: "2026-10-20T01:30:00.000Z",
  analyzedCommit: "7b4a2f8c9d1e3a5f6b8c0d2e4f6a8b0c2d4e6f8a",
  score: 85,
  grade: "B",
  coverage: {
    observed: 6,
    possible: 6,
    percentage: 100,
  },
  checks: [
    {
      id: "contributing-guide",
      category: "documentation",
      label: "CONTRIBUTING.md",
      status: "pass",
      points: 20,
      maxPoints: 20,
      explanation: "CONTRIBUTING.md was detected in the repository root.",
      sourceUrl: "https://github.com/ethiorhq/welcomescore/blob/main/CONTRIBUTING.md",
      sourcePath: "CONTRIBUTING.md",
      observedAt: "2026-10-20T01:30:00.000Z",
      confidence: "high",
      limitations: ["File existence verified at repository root."],
    },
    {
      id: "code-of-conduct",
      category: "governance",
      label: "CODE_OF_CONDUCT.md",
      status: "pass",
      points: 15,
      maxPoints: 15,
      explanation: "CODE_OF_CONDUCT.md was detected in the repository root.",
      sourceUrl: "https://github.com/ethiorhq/welcomescore/blob/main/CODE_OF_CONDUCT.md",
      sourcePath: "CODE_OF_CONDUCT.md",
      observedAt: "2026-10-20T01:30:00.000Z",
      confidence: "high",
    },
    {
      id: "readme-setup",
      category: "documentation",
      label: "README setup section",
      status: "pass",
      points: 15,
      maxPoints: 15,
      explanation: "README contains installation and getting started sections.",
      sourceUrl: "https://github.com/ethiorhq/welcomescore/blob/main/README.md",
      sourcePath: "README.md",
      observedAt: "2026-10-20T01:30:00.000Z",
      confidence: "high",
    },
    {
      id: "license",
      category: "governance",
      label: "LICENSE",
      status: "pass",
      points: 10,
      maxPoints: 10,
      explanation: "Valid Apache-2.0 license file found.",
      sourceUrl: "https://github.com/ethiorhq/welcomescore/blob/main/LICENSE",
      sourcePath: "LICENSE",
      observedAt: "2026-10-20T01:30:00.000Z",
      confidence: "high",
    },
    {
      id: "starter-issues",
      category: "contributor-path",
      label: "Good-first-issue labels",
      status: "partial",
      points: 10,
      maxPoints: 25,
      explanation: "4 open starter issues found.",
      sourceUrl: "https://github.com/ethiorhq/welcomescore/issues?q=is%3Aopen+label%3A%22good+first+issue%22",
      observedAt: "2026-10-20T01:30:00.000Z",
      confidence: "high",
    },
    {
      id: "recent-activity",
      category: "activity",
      label: "Recently active",
      status: "pass",
      points: 15,
      maxPoints: 15,
      explanation: "Pushed to default branch within the last 3 months.",
      sourceUrl: "https://github.com/ethiorhq/welcomescore/commits/main",
      observedAt: "2026-10-20T01:30:00.000Z",
      confidence: "high",
    },
  ],
  nextUsefulMove: {
    id: "starter-issue-quality",
    title: "Keep starter issues clear and current",
    whyItMatters: "Review the current newcomer tasks so each one has a bounded outcome.",
    evidenceIds: ["starter-issues"],
    effort: "small",
    expectedOutcome: "Curate beginner tasks with clear validation paths.",
    acceptanceCriteria: ["Review open beginner issues on GitHub"],
    suggestedFiles: [".github/ISSUE_TEMPLATE/good_first_issue.md"],
    issueDraft: {
      title: "chore: Review and refresh good-first-issue candidates",
      body: "## Task\nReview and tag real beginner-friendly issues for newcomers.",
      labels: ["good first issue"],
    },
    patchPlan: {
      files: [".github/ISSUE_TEMPLATE/good_first_issue.md"],
      operations: ["Update starter issue template with required context sections"],
      safety: "low-risk",
    },
    limitations: ["Draft generated from audit evidence."],
  },
  goodFirstIssues: [
    {
      title: "docs: Clarify contributing guidelines for test commands",
      url: "https://github.com/ethiorhq/welcomescore/issues/12",
    },
  ],
  limitations: [
    "Deterministic public metadata check; not a code-quality guarantee.",
  ],
  publicLinks: {
    report: "https://welcomescore.vercel.app/report/ethiorhq/welcomescore",
    badge: "https://welcomescore.vercel.app/api/badge?repo=ethiorhq%2Fwelcomescore",
    repository: "https://github.com/ethiorhq/welcomescore",
  },
};

export const minimalValidReportFixture: WelcomeScoreReport = {
  schemaVersion: REPORT_SCHEMA_VERSION,
  toolVersion: CURRENT_TOOL_VERSION,
  repository: {
    owner: "org",
    name: "repo",
    fullName: "org/repo",
    defaultBranch: "main",
    source: "github",
  },
  analyzedAt: "2026-10-20T00:00:00.000Z",
  score: 0,
  grade: "F",
  coverage: {
    observed: 1,
    possible: 1,
    percentage: 100,
  },
  checks: [
    {
      id: "contributing-guide",
      category: "documentation",
      label: "CONTRIBUTING.md",
      status: "missing",
      points: 0,
      maxPoints: 20,
      explanation: "No contributing guide found.",
      observedAt: "2026-10-20T00:00:00.000Z",
      confidence: "high",
    },
  ],
  nextUsefulMove: null,
  goodFirstIssues: [],
  limitations: ["Audit check."],
  publicLinks: {
    report: "https://welcomescore.vercel.app/report/org/repo",
    badge: "https://welcomescore.vercel.app/api/badge?repo=org%2Frepo",
    repository: "https://github.com/org/repo",
  },
};

export const unknownEvidenceReportFixture: WelcomeScoreReport = {
  ...validReportFixture,
  coverage: {
    observed: 5,
    possible: 6,
    percentage: 83,
  },
  checks: [
    ...validReportFixture.checks.slice(0, 5),
    {
      id: "recent-activity",
      category: "activity",
      label: "Recently active",
      status: "unknown",
      points: 0,
      maxPoints: 15,
      explanation: "Activity could not be observed due to upstream rate limits.",
      observedAt: "2026-10-20T01:30:00.000Z",
      confidence: "low",
      limitations: ["Activity status unverified."],
    },
  ],
};

export const futureSchemaReportFixture = {
  ...validReportFixture,
  schemaVersion: "99.0",
};

export const malformedReportFixture = {
  schemaVersion: REPORT_SCHEMA_VERSION,
  toolVersion: "",
  score: 150, // out of range
  repository: {
    owner: "",
  },
};

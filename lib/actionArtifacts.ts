import {
  CODE_OF_CONDUCT_TEMPLATE,
  CONTRIBUTING_TEMPLATE,
} from "@/lib/templates";
import type { ActionArtifactId } from "@/lib/nextUsefulMove";

export type ActionArtifact = {
  id: ActionArtifactId;
  title: string;
  summary: string;
  guardrail: string;
  copyLabel: string;
  content: string;
};

export const ACTION_ARTIFACTS: Record<ActionArtifactId, ActionArtifact> = {
  "readme-setup-outline": {
    id: "readme-setup-outline",
    title: "README setup outline",
    summary: "Edit this outline to match commands and expectations you have personally verified.",
    guardrail: "Run every published command yourself and never include secrets, private URLs, or production credentials.",
    copyLabel: "Copy editable outline",
    content: `## Setup

### Prerequisites
- [Supported runtime and version]
- [Package manager and version]
- [Any safe local dependency]

### Install
\`\`\`bash
[install command you have verified]
\`\`\`

### Configure safely
1. Copy \`[example environment file]\` to \`[local environment file]\` if needed.
2. Add only your own local values.
3. Do not commit secrets, tokens, cookies, private keys, or production credentials.

### Run locally
\`\`\`bash
[start command you have verified]
\`\`\`

Open [expected local address] and confirm [expected visible result or command output].

### Troubleshooting
- If [common failure] happens, [safe factual recovery step].
- If an optional service is unavailable, [what still works locally].
- For a reproducible non-sensitive problem, open [public support route] with [safe diagnostic details].
`,
  },
  "contributing-guide": {
    id: "contributing-guide",
    title: "CONTRIBUTING.md outline",
    summary: "Start from a focused contribution guide, then replace all placeholders with real project practice.",
    guardrail: "Do not promise a merge, mentoring, payment, or response time that the maintainers cannot reliably provide.",
    copyLabel: "Copy editable CONTRIBUTING outline",
    content: CONTRIBUTING_TEMPLATE,
  },
  "code-of-conduct": {
    id: "code-of-conduct",
    title: "Code of Conduct outline",
    summary: "Use this as a starting point only after choosing a responsible reporting route and enforcement process.",
    guardrail: "Choose a reporting route that a responsible contact actually monitors; this outline is not legal advice or a complete compliance program.",
    copyLabel: "Copy editable conduct outline",
    content: CODE_OF_CONDUCT_TEMPLATE,
  },
  "starter-issue-brief": {
    id: "starter-issue-brief",
    title: "Honest starter issue brief",
    summary: "Use this only for a real, maintained task that a newcomer can understand without private access.",
    guardrail: "Do not create placeholder issues or apply a newcomer label to unclear, blocked, security-sensitive, or oversized work.",
    copyLabel: "Copy editable issue brief",
    content: `## [Short, specific task title]

### Problem
[Explain the user or maintainer problem in plain language.]

### In scope
- [Small, independently useful outcome]
- [Likely file, component, or document to inspect]
- [Expected behavior after the change]

### Out of scope
- [Related work that is deliberately not part of this starter task]
- [Large refactors, architecture decisions, or private-system work]

### Acceptance criteria
- [Observable criterion 1]
- [Observable criterion 2]
- [Required documentation, test, or accessibility update if applicable]

### Validation
- [Safe command or manual check a contributor can run]
- [Expected result]

### Getting help
[Name a public issue/discussion route or maintainer process for questions before work begins.]

### Safety boundary
Do not use private credentials, production access, private repositories, or sensitive data to complete this issue.
`,
  },
  "maintenance-status-note": {
    id: "maintenance-status-note",
    title: "Maintenance status note",
    summary: "A clear, factual note can help contributors understand a quiet or changing project without simulating activity.",
    guardrail: "Do not create cosmetic commits or claim availability that the project cannot maintain.",
    copyLabel: "Copy editable maintenance note",
    content: `## Project status

[Describe the project’s current public maintenance state in one factual paragraph.]

### What is currently active
- [Area that is actively maintained]
- [Type of contribution that is currently useful]

### What is paused or needs discussion first
- [Area that is paused, experimental, or not currently accepting large changes]
- [Public route for asking before beginning ambiguous work]

### How to contribute safely
1. Read [README / CONTRIBUTING link].
2. Choose a currently open, scoped issue when one is available.
3. Keep changes focused and do not include secrets, private data, or production access details.

### Updating this note
[State when maintainers plan to review this status, if they have a real review cadence.]
`,
  },
};

export function actionArtifactById(id: ActionArtifactId) {
  return ACTION_ARTIFACTS[id];
}

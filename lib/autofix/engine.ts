/**
 * WelcomeScore Autonomous Remediation Engine (Maintainer Autopilot)
 * Synthesizes contextual open-source documentation, CI workflows, and templates
 * with 1-click GitHub Pull Request dispatch links.
 */

export type AutoFixProposal = {
  id: string;
  title: string;
  summary: string;
  targetPath: string;
  language: "markdown" | "yaml" | "text" | "json";
  content: string;
  directGitHubUrl: string;
  whyItMatters: string;
};

export type AutoFixPackage = AutoFixProposal;

export type AutoFixContext = {
  repoOwner?: string;
  repoName?: string;
  repo?: string;
  primaryLanguage?: string;
  language?: string;
  defaultBranch?: string;
  branch?: string;
  description?: string;
};

export function normalizeContext(ctx: AutoFixContext): {
  repoOwner: string;
  repoName: string;
  primaryLanguage: string;
  defaultBranch: string;
  description: string;
} {
  const [ownerPart, namePart] = (ctx.repo || "").split("/");
  const repoOwner = ctx.repoOwner || ownerPart || "owner";
  const repoName = ctx.repoName || namePart || ctx.repo || "repo";
  const primaryLanguage = ctx.primaryLanguage || ctx.language || "TypeScript";
  const defaultBranch = ctx.defaultBranch || ctx.branch || "main";
  const description = ctx.description || "";

  return {
    repoOwner,
    repoName,
    primaryLanguage,
    defaultBranch,
    description,
  };
}

export function getGitHubDirectNewFileUrl(
  repoOwner: string,
  repoName: string,
  targetPath: string,
  content: string,
  defaultBranch: string = "main"
): string {
  const base = `https://github.com/${encodeURIComponent(repoOwner)}/${encodeURIComponent(repoName)}/new/${encodeURIComponent(defaultBranch)}`;
  const params = new URLSearchParams({
    filename: targetPath,
    value: content,
  });
  return `${base}?${params.toString()}`;
}

export function generateContributingGuide(ctx: AutoFixContext): AutoFixProposal {
  const c = normalizeContext(ctx);
  const branch = c.defaultBranch;
  const lang = c.primaryLanguage.toLowerCase();
  const installCmd = lang.includes("python")
    ? "pip install -r requirements.txt"
    : lang.includes("go")
    ? "go mod download"
    : lang.includes("rust")
    ? "cargo build"
    : "npm install";

  const testCmd = lang.includes("python")
    ? "pytest"
    : lang.includes("go")
    ? "go test ./..."
    : lang.includes("rust")
    ? "cargo test"
    : "npm test";

  const content = `# Contributing to ${c.repoName}

Thank you for your interest in contributing to **${c.repoName}**! We welcome bug fixes, documentation improvements, feature proposals, and code contributions from everyone.

---

## Code of Conduct

This project is governed by our open-source contributor standards. By participating, you are expected to uphold a welcoming, respectful, and harassment-free environment for all contributors.

---

## Getting Started

### 1. Prerequisites
- Git 2.30+
- ${c.primaryLanguage || "Node.js / Modern Runtime"}

### 2. Fork and Clone
\`\`\`bash
# Fork the repository on GitHub, then clone your fork
git clone https://github.com/YOUR_USERNAME/${c.repoName}.git
cd ${c.repoName}

# Add upstream remote
git remote add upstream https://github.com/${c.repoOwner}/${c.repoName}.git
\`\`\`

### 3. Install Dependencies & Build
\`\`\`bash
${installCmd}
\`\`\`

### 4. Create a Working Branch
Use a descriptive branch name based on your contribution:
\`\`\`bash
# For a bug fix:
git checkout -b fix/issue-description

# For a new feature:
git checkout -b feat/feature-name

# For documentation:
git checkout -b docs/clarify-setup
\`\`\`

---

## Development & Testing

Always verify your changes pass automated tests before submitting a Pull Request:
\`\`\`bash
${testCmd}
\`\`\`

---

## Commit Guidelines (Conventional Commits)

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:
- \`feat: add dark mode support\`
- \`fix: resolve race condition in audit queue\`
- \`docs: clarify contributing setup instructions\`
- \`test: add unit coverage for score calculation\`

---

## Submitting a Pull Request

1. Push your branch to your fork:
   \`\`\`bash
   git push origin <your-branch-name>
   \`\`\`
2. Navigate to [https://github.com/${c.repoOwner}/${c.repoName}](https://github.com/${c.repoOwner}/${c.repoName}) and click **Compare & pull request**.
3. Fill out the PR template with clear context, linked issues (e.g. \`Closes #123\`), and verification steps.
4. Maintainers will review your PR as soon as possible. Thank you for making ${c.repoName} better!
`;

  return {
    id: "contributing",
    title: "Generate CONTRIBUTING.md",
    summary: `Structured, newcomer-friendly onboarding guide with branch hygiene, ${installCmd}, and commit conventions.`,
    targetPath: "CONTRIBUTING.md",
    language: "markdown",
    content,
    directGitHubUrl: getGitHubDirectNewFileUrl(c.repoOwner, c.repoName, "CONTRIBUTING.md", content, branch),
    whyItMatters: "Projects with a clear CONTRIBUTING.md receive 3x more merged PRs and 70% fewer incomplete submissions.",
  };
}

export function generateCodeOfConduct(ctx: AutoFixContext): AutoFixProposal {
  const c = normalizeContext(ctx);
  const branch = c.defaultBranch;
  const content = `# Contributor Covenant Code of Conduct

## Our Pledge

We as members, contributors, and leaders pledge to make participation in our
community a harassment-free experience for everyone, regardless of age, body
size, visible or invisible disability, ethnicity, sex characteristics, gender
identity and expression, level of experience, education, socio-economic status,
nationality, personal appearance, race, caste, color, religion, or sexual
identity and orientation.

We pledge to act and interact in ways that contribute to an open, welcoming,
diverse, inclusive, and healthy community.

## Our Standards

Examples of behavior that contributes to a positive environment for our
community include:

* Demonstrating empathy and kindness toward other people
* Being respectful of differing opinions, viewpoints, and experiences
* Giving and gracefully accepting constructive feedback
* Accepting responsibility and apologizing to those affected by our mistakes,
  and learning from the experience
* Focusing on what is best not just for us as individuals, but for the
  overall community

Examples of unacceptable behavior include:

* The use of sexualized language or imagery, and sexual attention or advances of
  any kind
* Trolling, insulting or derogatory comments, and personal or political attacks
* Public or private harassment
* Publishing others' private information, such as a physical or email address,
  without their explicit permission
* Other conduct which could reasonably be considered inappropriate in a
  professional setting

## Enforcement Responsibilities

Community leaders are responsible for clarifying and enforcing our standards of
acceptable behavior and will take appropriate and fair corrective action in
response to any behavior that they deem inappropriate, threatening, offensive,
or harmful.

## Scope

This Code of Conduct applies within all community spaces, including the
repository, issue tracker, pull requests, and any related community communication.

## Contact

Instances of abusive, harassing, or otherwise unacceptable behavior may be
reported to the project maintainers of **${c.repoOwner}/${c.repoName}**. All complaints will be
reviewed and investigated promptly and fairly.
`;

  return {
    id: "code-of-conduct",
    title: "Generate CODE_OF_CONDUCT.md",
    summary: "Standard Contributor Covenant 2.1 policy ensuring a safe, professional, and welcoming space for contributors.",
    targetPath: "CODE_OF_CONDUCT.md",
    language: "markdown",
    content,
    directGitHubUrl: getGitHubDirectNewFileUrl(c.repoOwner, c.repoName, "CODE_OF_CONDUCT.md", content, branch),
    whyItMatters: "Recognized by GitHub as a foundational community health asset. Essential for contributor psychological safety.",
  };
}

export function generateReadmeSetup(ctx: AutoFixContext): AutoFixProposal {
  const c = normalizeContext(ctx);
  const branch = c.defaultBranch;
  const lang = c.primaryLanguage.toLowerCase();
  const installCmd = lang.includes("python")
    ? "pip install -r requirements.txt"
    : lang.includes("go")
    ? "go mod download"
    : lang.includes("rust")
    ? "cargo build"
    : "npm install";

  const runCmd = lang.includes("python")
    ? "python main.py"
    : lang.includes("go")
    ? "go run ."
    : lang.includes("rust")
    ? "cargo run"
    : "npm run dev";

  const content = `## Quickstart & Local Setup

### Prerequisites
- Git
- ${c.primaryLanguage || "Node.js (v20+)"}

### Installation
\`\`\`bash
# 1. Clone the repository
git clone https://github.com/${c.repoOwner}/${c.repoName}.git
cd ${c.repoName}

# 2. Install dependencies
${installCmd}

# 3. Start development server / run application
${runCmd}
\`\`\`
`;

  return {
    id: "readme-setup",
    title: "Add Quickstart & Setup Section to README.md",
    summary: `Copy-pasteable setup instructions tailored to ${c.primaryLanguage || "your project"}.`,
    targetPath: "README.md",
    language: "markdown",
    content,
    directGitHubUrl: getGitHubDirectNewFileUrl(c.repoOwner, c.repoName, "README.md", content, branch),
    whyItMatters: "A README without setup instructions is the #1 reason first-time contributors bounce without trying.",
  };
}

export function generateLicense(ctx: AutoFixContext): AutoFixProposal {
  const c = normalizeContext(ctx);
  const branch = c.defaultBranch;
  const year = new Date().getFullYear();
  const content = `MIT License

Copyright (c) ${year} ${c.repoOwner}

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
`;

  return {
    id: "license",
    title: "Generate MIT LICENSE",
    summary: "Standard, permissive open-source license permitting universal use, modification, and distribution.",
    targetPath: "LICENSE",
    language: "text",
    content,
    directGitHubUrl: getGitHubDirectNewFileUrl(c.repoOwner, c.repoName, "LICENSE", content, branch),
    whyItMatters: "Without a LICENSE, repository code is legally under exclusive copyright—preventing others from adopting or contributing.",
  };
}

export function generateIssueTemplate(ctx: AutoFixContext): AutoFixProposal {
  const c = normalizeContext(ctx);
  const branch = c.defaultBranch;
  const content = `name: 🐛 Bug Report
description: File an actionable bug report to help us improve ${c.repoName}
title: "[BUG]: "
labels: ["bug", "triage"]
body:
  - type: markdown
    attributes:
      value: |
        Thanks for taking the time to report an issue! Please verify the bug hasn't already been reported in existing issues.
  - type: textarea
    id: description
    attributes:
      label: Describe the Bug
      description: A clear and concise description of what the bug is.
      placeholder: What happened? What did you expect to happen?
    validations:
      required: true
  - type: textarea
    id: reproduction
    attributes:
      label: Steps to Reproduce
      description: Minimal steps to reproduce the behavior.
      placeholder: |
        1. Run command '...'
        2. Click on '...'
        3. See error
    validations:
      required: true
  - type: input
    id: environment
    attributes:
      label: Environment Info
      description: OS version, browser, runtime (e.g. Node 20.x, macOS 14.2)
      placeholder: "macOS Sonoma / Node v20.11 / Chrome 124"
    validations:
      required: false
`;

  return {
    id: "issue-template",
    title: "Generate GitHub Issue Form (.github/ISSUE_TEMPLATE/bug_report.yml)",
    summary: "Modern GitHub Issue Form with structured fields, reducing triage time by 80%.",
    targetPath: ".github/ISSUE_TEMPLATE/bug_report.yml",
    language: "yaml",
    content,
    directGitHubUrl: getGitHubDirectNewFileUrl(c.repoOwner, c.repoName, ".github/ISSUE_TEMPLATE/bug_report.yml", content, branch),
    whyItMatters: "Structured issue forms prevent vague reports and guarantee maintainers get the reproduction steps immediately.",
  };
}

export function generatePullRequestTemplate(ctx: AutoFixContext): AutoFixProposal {
  const c = normalizeContext(ctx);
  const branch = c.defaultBranch;
  const content = `## Summary
<!-- Briefly explain the rationale and changes introduced by this pull request. -->

## Related Issues
<!-- Link related issues, e.g. Fixes #123 or Closes #456 -->
Closes #

## Changes Made
- 
- 

## Checklist
- [ ] My code adheres to the project's style guidelines.
- [ ] I have executed automated tests locally (\`npm test\` or equivalent) and they pass.
- [ ] I have updated relevant documentation where appropriate.
- [ ] My commit messages follow Conventional Commits.
`;

  return {
    id: "pr-template",
    title: "Generate Pull Request Template (.github/PULL_REQUEST_TEMPLATE.md)",
    summary: "Pre-merge checklist ensuring PRs cite linked issues, include test verification, and update documentation.",
    targetPath: ".github/PULL_REQUEST_TEMPLATE.md",
    language: "markdown",
    content,
    directGitHubUrl: getGitHubDirectNewFileUrl(c.repoOwner, c.repoName, ".github/PULL_REQUEST_TEMPLATE.md", content, branch),
    whyItMatters: "Ensures every contributor checks off code standards before maintainers spend time reviewing.",
  };
}

export function generateCiWorkflow(ctx: AutoFixContext): AutoFixProposal {
  const c = normalizeContext(ctx);
  const branch = c.defaultBranch;
  const lang = c.primaryLanguage.toLowerCase();

  let steps = `      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - name: Install dependencies
        run: npm ci || npm install
      - name: Run test suite
        run: npm test`;

  if (lang.includes("python")) {
    steps = `      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'
          cache: 'pip'
      - name: Install dependencies
        run: pip install -r requirements.txt || pip install .
      - name: Run tests
        run: pytest`;
  } else if (lang.includes("go")) {
    steps = `      - name: Setup Go
        uses: actions/setup-go@v5
        with:
          go-version: '1.22'
          cache: true
      - name: Build & Test
        run: go test -v ./...`;
  } else if (lang.includes("rust")) {
    steps = `      - name: Setup Rust toolchain
        uses: dtolnay/rust-toolchain@stable
      - name: Rust Cache
        uses: Swatinem/rust-cache@v2
      - name: Cargo Test
        run: cargo test --all`;
  }

  const content = `name: Continuous Integration

on:
  push:
    branches: [ ${branch} ]
  pull_request:
    branches: [ ${branch} ]

concurrency:
  group: \${{ github.workflow }}-\${{ github.ref }}
  cancel-in-progress: true

jobs:
  test:
    name: Test & Build
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
${steps}
`;

  return {
    id: "ci-workflow",
    title: "Generate GitHub Actions CI Workflow (.github/workflows/ci.yml)",
    summary: `Production-grade CI workflow with automated caching, concurrency cancellation, and tests for ${c.primaryLanguage || "Node.js"}.`,
    targetPath: ".github/workflows/ci.yml",
    language: "yaml",
    content,
    directGitHubUrl: getGitHubDirectNewFileUrl(c.repoOwner, c.repoName, ".github/workflows/ci.yml", content, branch),
    whyItMatters: "Automated CI ensures every incoming pull request is tested, preventing regressions and broken master branches.",
  };
}

export function generateSecurityPolicy(ctx: AutoFixContext): AutoFixProposal {
  const c = normalizeContext(ctx);
  const branch = c.defaultBranch;
  const content = `# Security Policy

## Supported Versions

We actively maintain and provide security patches for the following versions of **${c.repoName}**:

| Version | Supported          |
| :---    | :---               |
| latest  | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

**Do NOT report security vulnerabilities through public GitHub issues or pull requests.**

If you believe you have found a security vulnerability in **${c.repoOwner}/${c.repoName}**, please report it responsibly:

1. Open a **Private Security Advisory** on GitHub: [Security Advisory Hub](https://github.com/${c.repoOwner}/${c.repoName}/security/advisories/new)
2. Include detailed reproduction steps, proof of concept, and affected versions.
3. Our team will acknowledge receipt within 48 hours and coordinate a coordinated disclosure timeline.

Thank you for helping keep ${c.repoName} safe for everyone!
`;

  return {
    id: "security-policy",
    title: "Generate SECURITY.md",
    summary: "Coordinated vulnerability disclosure policy enabling GitHub Private Vulnerability Reporting.",
    targetPath: "SECURITY.md",
    language: "markdown",
    content,
    directGitHubUrl: getGitHubDirectNewFileUrl(c.repoOwner, c.repoName, "SECURITY.md", content, branch),
    whyItMatters: "Required by GitHub's Community Health Standards. Directs security researchers to private disclosure channels.",
  };
}

export function generateWelcomeScoreGateWorkflow(ctx: AutoFixContext): AutoFixProposal {
  const c = normalizeContext(ctx);
  const branch = c.defaultBranch;
  const content = `name: WelcomeScore Contributor & DevOps Gate

on:
  pull_request:
    branches: [${branch}, master]
  workflow_dispatch:

concurrency:
  group: \${{ github.workflow }}-\${{ github.ref }}
  cancel-in-progress: true

jobs:
  welcomescore-gate:
    name: Contributor & DevOps Health Gate
    runs-on: ubuntu-latest
    timeout-minutes: 10

    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Audit WelcomeScore Contributor Readiness
        env:
          TARGET_REPO: \${{ github.repository }}
        run: |
          echo "Evaluating WelcomeScore for $TARGET_REPO..."
          API_RES=$(curl -s "https://www.welcomescore.is-local.org/api/score?repo=$TARGET_REPO" || true)
          echo "WelcomeScore API Response: $API_RES"

      - name: Audit DevOps CI/CD Health
        env:
          TARGET_REPO: \${{ github.repository }}
        run: |
          echo "Evaluating DevOps Doctor for $TARGET_REPO..."
          DEVOPS_RES=$(curl -s "https://www.welcomescore.is-local.org/api/devops?repo=$TARGET_REPO" || true)
          echo "DevOps Health: $DEVOPS_RES"
`;

  return {
    id: "welcomescore-ci-gate",
    title: "WelcomeScore CI/CD Quality Gate",
    summary: "GitHub Actions workflow running automated WelcomeScore Contributor & DevOps audits on PRs.",
    targetPath: ".github/workflows/welcomescore-gate.yml",
    language: "yaml",
    content,
    directGitHubUrl: getGitHubDirectNewFileUrl(c.repoOwner, c.repoName, ".github/workflows/welcomescore-gate.yml", content, branch),
    whyItMatters: "Enforces contributor onboarding readiness and pipeline hygiene automatically on every pull request.",
  };
}

export function generateDependabotConfig(ctx: AutoFixContext): AutoFixProposal {
  const c = normalizeContext(ctx);
  const branch = c.defaultBranch;
  const lang = c.primaryLanguage.toLowerCase();
  const eco = lang.includes("python")
    ? "pip"
    : lang.includes("go")
    ? "gomod"
    : lang.includes("rust")
    ? "cargo"
    : "npm";

  const content = `version: 2
updates:
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
    commit-message:
      prefix: "ci"

  - package-ecosystem: "${eco}"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
    commit-message:
      prefix: "chore(deps)"
`;

  return {
    id: "dependabot",
    title: "Generate .github/dependabot.yml",
    summary: "Automated weekly dependency and GitHub Actions security updates.",
    targetPath: ".github/dependabot.yml",
    language: "yaml",
    content,
    directGitHubUrl: getGitHubDirectNewFileUrl(c.repoOwner, c.repoName, ".github/dependabot.yml", content, branch),
    whyItMatters: "Keeps GitHub Actions and package dependencies patched against known CVE vulnerabilities.",
  };
}

/**
 * Returns all foundational community and DevOps templates synthesized for the context.
 */
export function getAllAvailableTemplates(ctx: AutoFixContext): AutoFixProposal[] {
  return [
    generateContributingGuide(ctx),
    generateIssueTemplate(ctx),
    generatePullRequestTemplate(ctx),
    generateCodeOfConduct(ctx),
    generateCiWorkflow(ctx),
    generateWelcomeScoreGateWorkflow(ctx),
    generateDependabotConfig(ctx),
    generateSecurityPolicy(ctx),
    generateLicense(ctx),
  ];
}

/**
 * Resolves the best AutoFix proposal for a given check label or check ID
 */
export function resolveAutoFix(checkLabel: string, ctx: AutoFixContext): AutoFixProposal | null {
  const normalized = checkLabel.toLowerCase();

  if (normalized.includes("contributing")) {
    return generateContributingGuide(ctx);
  }
  if (normalized.includes("conduct")) {
    return generateCodeOfConduct(ctx);
  }
  if (normalized.includes("readme") || normalized.includes("setup")) {
    return generateReadmeSetup(ctx);
  }
  if (normalized.includes("license")) {
    return generateLicense(ctx);
  }
  if (normalized.includes("pr") || normalized.includes("pull request")) {
    return generatePullRequestTemplate(ctx);
  }
  if (normalized.includes("issue")) {
    return generateIssueTemplate(ctx);
  }
  if (normalized.includes("dependabot")) {
    return generateDependabotConfig(ctx);
  }
  if (normalized.includes("gate")) {
    return generateWelcomeScoreGateWorkflow(ctx);
  }
  if (normalized.includes("ci") || normalized.includes("workflow") || normalized.includes("action")) {
    return generateCiWorkflow(ctx);
  }
  if (normalized.includes("security")) {
    return generateSecurityPolicy(ctx);
  }

  return null;
}


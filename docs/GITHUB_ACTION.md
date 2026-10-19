# WelcomeScore GitHub Action Documentation

## 1. Architecture Overview

`ethiorhq/welcomescore-action` provides an evidence-based repository audit inside GitHub Actions workflows.
It consumes the shared report engine and CLI, evaluates project readiness signals, produces structured artifacts, and optionally manages a single bot-owned pull-request comment.

```text
GitHub Actions Runner
       │
       ▼
actions/checkout@v4
       │
       ▼
ethiorhq/welcomescore-action@v1
       │
       ├── Reads allowlisted local repository metadata (package.json, workflows, community files)
       ├── Runs deterministic scoring & Next Useful Move engine
       ├── Writes .welcomescore/report.json (or .welcomescore/report.md)
       ├── Sets step outputs: score, grade, report-path, next-useful-move, report-url
       └── (Optional) Updates idempotent PR comment with marker: <!-- welcomescore-audit-comment -->
```

---

## 2. Security & Fork Safety Model

1. **Least-Privilege Permissions:**
   - Standard audit: requires only `contents: read`.
   - PR comment mode: requires `pull-requests: write`.
2. **Safe Fork Pull Requests:**
   - When a pull request originates from a fork, GitHub Actions defaults to read-only permissions for `GITHUB_TOKEN`.
   - If `comment-on-pr` is enabled on a fork PR without write permissions, the action logs a graceful warning and completes the audit without failing the build.
3. **No Untrusted Script Execution:**
   - The action does not invoke `npm run <untrusted>` or execute repository scripts. It evaluates static configurations and metadata.
4. **No Secrets Logged:**
   - Tokens and internal IDs are never printed to workflow step logs.

---

## 3. Workflow Configurations

### Baseline Audit (Recommended for CI)

```yaml
name: WelcomeScore Check

on:
  push:
    branches: [main]
  pull_request:

permissions:
  contents: read

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: ethiorhq/welcomescore-action@v1
        with:
          threshold: 80
          upload-report: true
```

### With Idempotent PR Comments

```yaml
name: WelcomeScore PR Audit

on:
  pull_request:

permissions:
  contents: read
  pull-requests: write

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: ethiorhq/welcomescore-action@v1
        with:
          threshold: 80
          comment-on-pr: true
```

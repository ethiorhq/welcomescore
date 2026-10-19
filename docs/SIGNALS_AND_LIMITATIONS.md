# WelcomeScore Signals, Methodology & Limitations

## 1. Core Principles

WelcomeScore evaluates public repository readiness for first-time contributors and open-source maintainers.
Every signal adheres to three strict guidelines:
1. **Deterministic and Server-Side:** No AI provider ever modifies or computes the numeric score.
2. **Evidence-Bound:** Every check cites what was observed, where it was observed, and at what timestamp.
3. **Transparent Limitations:** Missing signals are educational maintainer observations, not security findings, pass/fail certifications, or endorsements.

---

## 2. Signal Catalog

| Signal ID | Category | Max Points | What is Checked | Limitations & Edge Cases |
|---|---|---|---|---|
| `readme-setup` | Documentation | 15 | Detects `## Install`, `## Setup`, `## Quickstart`, or `## Getting Started` headings in `README.md`. | Requires conventional heading keywords; custom setup guides located in subdirectories or separate wiki docs are not automatically indexed. |
| `contributing-guide` | Documentation | 20 | Confirms the existence of `CONTRIBUTING.md` in the repository root or `.github/`. | Evaluates file presence; cannot judge whether maintainers actively follow the written guidelines. |
| `code-of-conduct` | Governance | 15 | Confirms the existence of `CODE_OF_CONDUCT.md` in the repository root or `.github/`. | Evaluates presence of standard conduct documentation; does not guarantee private reporting adherence. |
| `license` | Governance | 10 | Checks GitHub's SPDX license catalog or detects standard `LICENSE`/`COPYING` root files. | Custom or proprietary licenses not recognized by SPDX may register as missing without a correction. |
| `starter-issues` | Contributor Path | 25 | Scans open issues for labels matching `good first issue`, `good-first-issue`, `help wanted`, or `beginner friendly`. Max points reached at 10 open curated issues. | Label presence does not guarantee an issue is actually beginner-friendly; issues may become stale. |
| `recent-activity` | Activity | 15 | Verifies that a commit has been pushed to the default branch within the last 3 months. | Stable, completed libraries may be quiet by design. Quiet repositories should add a maintenance status note. |
| `package-metadata` | Package Telemetry | 35 | Evaluates `name`, `version`, `description`, `license`, `engines.node`, `packageManager`, and publish `files` allowlist. | Applies specifically to JavaScript and TypeScript projects with a root `package.json`. |
| `tooling-infrastructure` | Tooling | 25 | Checks for `tsconfig.json`, ESLint/Biome configs, test runner scripts, and Node version pins (`.nvmrc`, `volta`). | Non-standard build setups may require signal clarification. |
| `cicd-readiness` | CI/CD | 25 | Checks `.github/workflows/` for automated test execution, Node.js setup actions, and bundle-size or publish pipelines. | Third-party CI systems (CircleCI, GitLab CI, Buildkite) running outside GitHub Actions require signal reporting. |

---

## 3. Evidence Status Definitions

- **`pass`:** The artifact or signal was detected and meets all verification criteria. Full points awarded.
- **`partial`:** An incomplete signal was detected (e.g. 3 good-first-issues found instead of 10; or starter issue template present without active issue labels). Proportionate points awarded.
- **`missing`:** The signal was evaluated and not found in conventional locations. Zero points awarded.
- **`unknown`:** Upstream GitHub API rate limits, network timeouts, or missing public permissions prevented evaluation. Zero points awarded, excluded from negative score penalties, and marked for review.

---

## 4. Prioritization of Next Useful Move

When multiple improvements are available, WelcomeScore deterministically selects **one primary Next Useful Move** based on maintainer and contributor journey impact:

```
[Priority 10]  README Setup (First-run barrier: without local setup, newcomers cannot run the project)
      │
[Priority 20]  CONTRIBUTING.md (Participation barrier: without rules, newcomers hesitate to open PRs)
      │
[Priority 30]  CODE_OF_CONDUCT.md (Safety barrier: community expectations and private reporting route)
      │
[Priority 40]  LICENSE (Legal barrier: clarity on reuse and contribution licensing)
      │
[Priority 45]  CI / Test Workflow (Quality barrier: automated feedback on contributions)
      │
[Priority 50]  Starter Issues (Task barrier: availability of honestly scoped first tasks)
      │
[Priority 55]  Package Metadata (Packaging & exports clarity)
      │
[Priority 60]  Issue Templates (Structured bug and feature intake)
      │
[Priority 65]  Default Branch Clarity (Target branch contribution guidance)
      │
[Priority 70]  Release Guidance (Changelog & versioning notes)
      │
[Priority 80]  Uncertain Signals (Documenting custom conventions)
      │
[Priority 90]  Maintain The Path (All checks pass: maintain existing contributor experience)
```

Tie-breaking is strictly deterministic: lowest priority number first, followed by alphabetical move ID.

---

## 5. False Signals and Corrections

No automated scanner is infallible. Conventions differ across repositories:
- A repository may run tests via an external CI provider rather than GitHub Actions.
- A repository may hold community files in an organization-level `.github` repository.
- A repository may have an intentional proprietary or custom license.

Maintainers can submit a signal correction via the **"Report an incorrect signal"** flow on any public report page or via `POST /api/corrections`. Reviewed corrections are incorporated into regression test suites and documented conventions.

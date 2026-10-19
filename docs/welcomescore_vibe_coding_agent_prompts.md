# WelcomeScore — Vibe Coding Agent Prompt Pack

## How to use this document

Give the prompts to the coding agent one at a time. Do not paste every phase in one message. The agent must finish the inspection and planning phase before implementing code.

The agent is working on the existing `ethiorhq/welcomescore` repository. It must modify the current system incrementally rather than creating a parallel toy application.

Current production website:

`https://welcomescore.vercel.app`

Future intended domain:

`https://welcomescore.js.org`

Do not change the canonical URL to `.js.org` until the owner confirms that JS.ORG DNS delegation and Vercel verification are complete.

Current product includes the Next.js web app, `@ethiorhq/welcomescore` CLI, score and JavaScript Health tools, Hall of Fame, Dev Lounge, AI-assisted moderation, Algofox review, guides/SEO, Supabase persistence, and an Android client foundation under `android/`.

---

# Prompt 1 — Inspect and freeze the baseline

You are the lead maintainer of the existing `ethiorhq/welcomescore` monorepo. Inspect before editing.

Read the root package files, lockfile, Next.js configuration, Tailwind configuration, TypeScript configuration, current app routes, `lib/scoreRepo.ts`, `lib/jsHealth/`, `packages/cli/`, API routes, Supabase migrations, `app/components/NextUsefulMoveCard.tsx`, `app/components/ScoreCard.tsx`, `app/components/SiteFooter.tsx`, current GitHub workflows, README, legal pages, and the `android/` directory.

Create `docs/GROWTH_BASELINE.md` with:

- existing routes and capabilities
- existing API contracts
- current CLI commands and outputs
- current database tables and migrations
- current public/private data boundaries
- current design system
- existing tests and build commands
- missing pieces for the growth architecture
- files that must not be modified or exposed
- proposed implementation order

Run the current web lint, build, and test commands. Run available CLI checks and Android checks without pretending unavailable tooling passed.

Do not implement features in this prompt. Do not push or deploy. Stop after the baseline report.

---

# Prompt 2 — Establish the report schema and shared evidence contract

Using `docs/GROWTH_BASELINE.md` and `docs/welcomescore_growth_build_architecture.md`, implement the versioned WelcomeScore report contract.

Create a shared report model that can be consumed by:

- Next.js web UI
- `@ethiorhq/welcomescore` CLI
- GitHub Action
- native Android client
- public JSON report endpoint

The report must include:

- schema version
- tool version
- repository identity
- default branch
- analysis timestamp
- optional analyzed commit
- score and grade
- coverage
- evidence items
- evidence status
- points/max points
- source links/paths
- confidence
- limitations
- Next Useful Move
- public report/badge/repository links

Do not duplicate score logic. Reuse the existing JavaScript Health/scoring engine wherever possible and add adapters around it.

Add schema fixtures and tests for valid reports, missing optional fields, unknown statuses, and future-version rejection behavior.

Create/update:

- `lib/report/types.ts`
- `lib/report/schema.ts`
- `lib/report/version.ts`
- `lib/report/serialize.ts`
- `docs/REPORT_SCHEMA.md`

Run web tests, lint, and build. Report exact results. Do not push.

---

# Prompt 3 — Build the evidence and Next Useful Move engine

Implement the first production version of an evidence-backed Next Useful Move engine.

Use deterministic evidence from the existing repository checks. Start with these moves:

1. Add or improve `CONTRIBUTING.md`.
2. Add a useful setup section to `README.md`.
3. Add `CODE_OF_CONDUCT.md`.
4. Add or clarify the license.
5. Add CI tests or make the existing workflow discoverable.
6. Improve good-first-issue quality and documentation.
7. Clarify default branch/package metadata.
8. Add release/changelog guidance.
9. Improve issue templates.
10. Correct a stale or uncertain signal.

Each move must contain:

- title
- evidence IDs
- why it matters
- expected outcome
- smallest safe next step
- acceptance criteria
- effort band
- suggested files
- optional issue draft
- optional patch plan
- limitations

The engine must never invent that a file exists or that a workflow is healthy. If a signal is unavailable, use `unknown` and explain why.

AI may help rewrite an evidence-backed explanation but may not change the numeric score or invent facts.

Create/update:

- `lib/actionable/nextUsefulMove.ts`
- `lib/actionable/issueDraft.ts`
- `lib/actionable/patchPlan.ts`
- `lib/actionable/acceptance.ts`
- `docs/SIGNALS_AND_LIMITATIONS.md`

Add tests for deterministic move selection, tie-breaking, unknown evidence, and safe output encoding.

---

# Prompt 4 — Add the public report and improvement page

Create a public report experience for `owner/repo`.

Add a typed API route and page for the versioned report. The page must show:

- repository name and link
- score and grade
- analysis time
- default branch/commit when available
- evidence breakdown
- confidence and coverage
- explicit limitations
- Next Useful Move
- copyable issue draft
- patch-plan preview
- CLI command
- GitHub Action setup
- badge/share actions
- correction/report-incorrect-signal action

Do not present the result as a security certification, package-safety guarantee, legal opinion, or popularity ranking.

Reuse the existing dark WelcomeScore system:

- base `#12141C`
- surface `#1B1E29`
- text `#F2EEE6`
- muted `#8B8F9E`
- accent `#E8A23D`
- good `#7A9B76`

Keep the logo as `WelcomeScore .js.org` and use the existing radius convention. Keep animation restrained.

Add responsive behavior for 320px–desktop widths. Keep the footer global.

Create/update:

- `app/api/report/route.ts`
- `app/report/[owner]/[repo]/page.tsx`
- `app/components/EvidencePanel.tsx`
- `app/components/ReportFreshness.tsx`
- `app/components/NextUsefulMoveCard.tsx`
- `docs/PUBLIC_REPORT_SPEC.md`

Run the build and test the page with a known public repository and an invalid repository.

---

# Prompt 5 — Implement correction and appeal flow

Add a safe “Report an incorrect signal” flow.

The form should allow a maintainer or visitor to identify:

- report URL/repository
- evidence ID
- reason category
- short explanation
- optional public source link

Add rate limiting, input validation, abuse protection, and privacy boundaries. Do not expose private moderation tables or raw submissions publicly.

Create a Supabase migration only if the existing schema cannot support this. Use RLS and store the minimum data needed.

Add a private maintainer triage view only if the existing authorization model supports it. Otherwise create a documented admin workflow without inventing insecure access.

A resolved correction must be able to become:

- a scoring rule change
- a regression fixture
- a documented limitation
- a rejected correction with an explanation

Create/update:

- `app/api/corrections/route.ts`
- `lib/corrections/types.ts`
- `lib/corrections/repository.ts`
- `lib/corrections/triage.ts`
- Supabase migration if required
- `docs/CORRECTIONS.md`

Add tests for validation, rate limits, duplicate corrections, and safe error responses.

Do not auto-change a score from an unreviewed user submission.

---

# Prompt 6 — Upgrade CLI outputs and safe fixes

Upgrade `@ethiorhq/welcomescore` to consume the shared report contract.

Implement or complete:

```bash
npx @ethiorhq/welcomescore
npx @ethiorhq/welcomescore --ci --threshold=80
npx @ethiorhq/welcomescore --format=json
npx @ethiorhq/welcomescore --format=markdown --output=.welcomescore/report.md
npx @ethiorhq/welcomescore --fix --dry-run
npx @ethiorhq/welcomescore --fix
```

Requirements:

- terminal output remains readable
- JSON is stable and versioned
- Markdown is suitable for a repository issue or report
- CI exits nonzero only when the explicit failure condition is met
- no source files are uploaded by default
- no existing file is overwritten by `--fix`
- `--dry-run` shows planned changes
- generated templates are professional and attributed correctly
- no license, policy, or legal boilerplate is falsely presented as legal advice
- add tests for exit codes, output formats, empty projects, and dry-run behavior

Update the CLI README with examples and limitations.

Run CLI build, tests, package checks, and the root web checks.

---

# Prompt 7 — Build the first-party GitHub Action

Create a first-party GitHub Action for WelcomeScore that uses the shared CLI/report engine.

The action should support:

```yaml
- uses: ethiorhq/welcomescore-action@v1
  with:
    threshold: 80
    comment-on-pr: false
    upload-report: true
    format: json
```

Implement:

- `action.yml`
- action source/build files
- README and examples
- report artifact output
- score/grade/report-path outputs
- optional threshold failure
- optional single bot-owned PR comment
- idempotent comment updates
- safe fork PR behavior
- least-privilege permissions documentation
- pinned dependencies where applicable
- no automatic issue/PR creation
- no secrets in logs

The Action must not execute arbitrary repository scripts. It may inspect repository files through the supported CLI engine.

Test the action logic locally with fixtures and document the real GitHub validation steps. Do not publish the Action or push changes.

Create/update:

- `actions/welcomescore/action.yml`
- `actions/welcomescore/README.md`
- `docs/GITHUB_ACTION.md`
- `.github/workflows/welcomescore-self-check.yml` only if it is safe and does not create recursion

---

# Prompt 8 — Add improvement history and maintainer workspace

Implement a privacy-safe improvement timeline.

For public repositories, show only public evidence and optional public history. A report must be tied to an analysis time and, where available, the default branch commit.

Display:

- previous/current score
- changed signals
- completed Next Useful Moves
- remaining next move
- coverage/confidence change
- report generation times

Do not create a competitive ranking feed. The purpose is progress and maintainability.

Add a maintainer workspace only if authentication and data deletion already exist safely. Otherwise start with public report history and local browser state. Do not create a large account system for a feature that can work anonymously.

Create/update the required migration, repository functions, page, and tests. Document retention and deletion behavior.

---

# Prompt 9 — Improve README, badges, guides, and SEO distribution

Make WelcomeScore discoverable through useful documentation rather than thin marketing pages.

Update the repository README with:

- one-sentence positioning
- CLI install/run example
- GitHub Action example
- report schema link
- badge example linking to an evidence page
- privacy boundary
- limitations
- contribution path
- current production URL

Improve public guides around:

- writing a CONTRIBUTING.md that developers can use
- repository onboarding checklist
- responsible good-first-issue design
- GitHub Actions repository health check
- JavaScript package metadata
- interpreting a readiness score

Each guide must contain an answer, example, copyable artifact, and link to the appropriate tool. Do not generate dozens of shallow SEO pages.

Verify:

- metadata titles/descriptions
- canonical URLs
- Open Graph image
- Twitter card
- sitemap
- robots
- `llms.txt`
- internal links
- no `.js.org` canonical change before activation

---

# Prompt 10 — Add the website Android app CTA

The native Android client exists under `android/`. Add a safe website entry point for the native app.

Create a reusable `AndroidAppDownloadCard` or equivalent component.

Use configuration:

```text
NEXT_PUBLIC_ANDROID_APP_URL=
NEXT_PUBLIC_ANDROID_APP_VERSION=
```

If no official URL is configured, show a restrained “Android app coming soon” message or hide the download action. Never link to an unsigned debug APK.

If an official URL is configured, show:

```text
Get the Android app
```

Keep the PWA install guidance separate from the native Android download option. Do not confuse “Add to Home screen” with the native application.

Document Play Store, internal testing, signed APK, versioning, rollback, and update policy in `docs/ANDROID_DISTRIBUTION_PLAN.md`.

---

# Prompt 11 — Test, harden, and prepare release

Run all available checks:

```bash
npm ci
npm run lint
npm run build
npm test
npm run cli:build
npm run cli:test
npm run cli:check
npm run cli:pack:check
```

If the Android environment is available:

```bash
cd android
./gradlew test
./gradlew lint
./gradlew assembleDebug
```

Test:

- valid repository
- invalid repository
- GitHub rate limit
- missing optional signals
- correction submission
- duplicate correction
- report serialization
- CLI JSON/Markdown/CI modes
- Action artifact and comment idempotence
- mobile report page
- badge URL
- Hall of Fame existing behavior
- Dev Lounge existing behavior
- no private data in public report
- no secret values in logs or bundles

Fix regressions. Do not hide failures by disabling lint or type checking.

Create:

- `docs/GROWTH_IMPLEMENTATION_STATUS.md`
- `docs/RELEASE_CHECKLIST.md`

The status report must list exact files, commands, results, known limitations, and remaining manual steps.

Do not push, publish npm, publish the GitHub Action, change Vercel, change DNS, or modify the JS.ORG PR without explicit owner approval.

---

# Agent operating rules for every phase

Inspect before editing. Keep changes small and reviewable. Preserve existing features. Use the existing design system. Do not expose secrets. Do not make unsupported legal or security claims. Do not automatically create social activity. Do not use fake stars, fake reviews, mass comments, forced badges, dark patterns, or spam.

When blocked, report the exact blocker and continue with safe independent work. Never claim a build, test, deployment, endpoint, or Android release succeeded unless it was actually run and verified.

At the end of every phase, report:

- files changed
- commands run
- exact results
- new environment variables, without values
- database migrations required
- manual steps for the owner
- whether the next phase is safe to begin

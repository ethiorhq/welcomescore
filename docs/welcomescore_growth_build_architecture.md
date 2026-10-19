# WelcomeScore Growth Build — Production Architecture Blueprint

## 1. Architectural objective

WelcomeScore should evolve into an evidence-based maintainer control plane for JavaScript and TypeScript repositories. The product must help a maintainer discover the next useful improvement, apply or draft a safe change, verify progress, and publish a portable report that works inside GitHub, npm, CI, documentation, and the native Android client.

The architecture must grow the current product without destabilizing the existing platform. The current web application, CLI, Vercel deployment, Supabase persistence, GitHub integration, Hall of Fame, Dev Lounge, moderation, badges, guides, SEO, and Android client foundation remain part of one product system.

The principal rule is: **one evidence engine, many clients and artifacts**.

The score and evidence logic must not be independently reimplemented in the web dashboard, CLI, GitHub Action, or Android app. They should consume a versioned report contract produced by shared deterministic logic.

## 2. Existing system to preserve

The current production system contains:

- Next.js 14 App Router web application.
- TypeScript and Tailwind CSS.
- Framer Motion for restrained interface motion.
- Vercel deployment.
- Supabase PostgreSQL/Realtime integrations.
- Server-side GitHub repository inspection.
- `@ethiorhq/welcomescore` npm CLI.
- Repository score and badge endpoints.
- JavaScript Health engine.
- Hall of Fame persistence and status flows.
- Dev Lounge messages, replies, mentions, reactions, reporting, verification, rate limiting, and AI-assisted moderation.
- Algofox review flow with server-side providers and deterministic fallback.
- Guides, FAQ, How it Works, legal pages, sitemap, robots, `llms.txt`, Open Graph images, and metadata.
- Native Android project under `android/`, consuming the web backend.

Do not replace this with a new framework, database, social platform, or authentication system unless a written migration decision proves it is necessary.

## 3. System context

```text
                         ┌──────────────────────────────┐
                         │  Maintainer / Contributor     │
                         └──────────────┬───────────────┘
                                        │
                 ┌──────────────────────┼──────────────────────┐
                 │                      │                      │
          Next.js Web UI          Native Android         CLI / CI
          Vercel deployment       Kotlin + Compose       npm / Action
                 │                      │                      │
                 └──────────────────────┼──────────────────────┘
                                        │ HTTPS JSON contracts
                         ┌──────────────▼───────────────┐
                         │ WelcomeScore Application API  │
                         │ Next.js route handlers         │
                         └───────┬─────────────┬─────────┘
                                 │             │
                   ┌─────────────▼───┐   ┌────▼─────────────┐
                   │ Evidence/Report │   │ Community/API    │
                   │ Engine           │   │ Gateway          │
                   └─────────────┬───┘   └────┬─────────────┘
                                 │             │
                  ┌──────────────▼───┐   ┌────▼──────────────┐
                  │ GitHub public API │   │ Supabase          │
                  │ server-side only  │   │ Postgres/Realtime │
                  └──────────────────┘   └───────────────────┘
```

External AI providers remain behind server-only provider adapters. The Android app, browser, CLI, and GitHub Action must never call Groq or Gemini directly.

## 4. Repository structure

The implementation should extend the current repository with these bounded areas:

```text
app/
  api/
    report/route.ts
    report/[owner]/[repo]/route.ts
    corrections/route.ts
    actionable/route.ts
    action-preview/route.ts
    github-action/route.ts          # only if server support is required
  report/
    [owner]/[repo]/page.tsx
  improve/
    [owner]/[repo]/page.tsx
  components/
    EvidencePanel.tsx
    ReportFreshness.tsx
    NextUsefulMoveCard.tsx
    ActionDraftModal.tsx
    ImprovementTimeline.tsx
    CorrectionForm.tsx
    AndroidAppDownloadCard.tsx

actions/
  welcomescore/
    action.yml
    README.md
    src/
      entrypoint.ts
      inputs.ts
      outputs.ts
      comment.ts
      artifact.ts

lib/
  report/
    schema.ts
    version.ts
    normalize.ts
    hash.ts
    serialize.ts
    types.ts
  jsHealth/
    engine.ts
    evidence.ts
    signals.ts
    remediation.ts
    limitations.ts
  actionable/
    nextUsefulMove.ts
    issueDraft.ts
    patchPlan.ts
    acceptance.ts
  corrections/
    types.ts
    repository.ts
    triage.ts
  github/
    comments.ts
    workflow.ts
    links.ts
  share/
    reportReceipt.ts

packages/cli/src/
  report-schema.ts
  commands/report.ts
  commands/ci.ts
  commands/fix.ts
  reporters/json.ts
  reporters/markdown.ts
  reporters/sarif.ts
  reporters/terminal.ts

supabase/migrations/
  YYYYMMDD_report_schema_and_corrections.sql
  YYYYMMDD_improvement_events.sql

docs/
  REPORT_SCHEMA.md
  SIGNALS_AND_LIMITATIONS.md
  GITHUB_ACTION.md
  CONTRIBUTOR_PATH.md
  CORRECTIONS.md
  ANDROID_BACKEND_CONTRACT.md
```

Do not create duplicate scoring logic in `actions/`, Android, or the UI. The Action may invoke a packaged CLI or a shared engine build, but it must produce the same report schema.

## 5. Core domain model

### Repository identity

```ts
export type RepositoryRef = {
  owner: string;
  name: string;
  fullName: string;
  defaultBranch: string;
  source: "github";
};
```

### Evidence item

```ts
export type EvidenceItem = {
  id: string;
  category: string;
  label: string;
  status: "pass" | "partial" | "missing" | "unknown";
  points: number;
  maxPoints: number;
  explanation: string;
  sourceUrl?: string;
  sourcePath?: string;
  observedAt: string;
  confidence: "high" | "medium" | "low";
  limitations?: string[];
};
```

### Next Useful Move

```ts
export type NextUsefulMove = {
  id: string;
  title: string;
  whyItMatters: string;
  evidenceIds: string[];
  effort: "small" | "medium" | "large";
  expectedOutcome: string;
  acceptanceCriteria: string[];
  suggestedFiles?: string[];
  issueDraft?: {
    title: string;
    body: string;
    labels: string[];
  };
  patchPlan?: {
    files: string[];
    operations: string[];
    safety: "low-risk" | "review-required";
  };
};
```

### Versioned report

```ts
export type WelcomeScoreReport = {
  schemaVersion: "1.0";
  toolVersion: string;
  repository: RepositoryRef;
  analyzedAt: string;
  analyzedCommit?: string;
  score: number;
  grade: string;
  coverage: {
    observed: number;
    possible: number;
    percentage: number;
  };
  checks: EvidenceItem[];
  nextUsefulMove: NextUsefulMove | null;
  goodFirstIssues: { title: string; url: string }[];
  limitations: string[];
  publicLinks: {
    report: string;
    badge: string;
    repository: string;
  };
};
```

The report schema must be versioned. Any breaking change requires a new schema version, migration notes, fixture updates, and compatibility handling in the CLI, web app, Action, and Android client.

## 6. Evidence engine boundaries

The evidence engine should be deterministic wherever possible. It may inspect public GitHub metadata, repository paths, package metadata, labels, workflow names, default branch, issue search results, and selected public signals already permitted by the privacy policy.

Every check must answer:

- What was observed?
- Where was it observed?
- When was it observed?
- Why does it affect the score?
- What could the engine not observe?
- How can a maintainer correct a false signal?

AI may help write a concise explanation, classify a suggested remediation, or prioritize among evidence-backed actions. AI must not invent missing files, infer private behavior, or silently alter the numeric score without a documented deterministic rule.

## 7. API architecture

Use route handlers with typed input validation and explicit response envelopes.

Recommended public report response:

```ts
{
  "ok": true,
  "report": WelcomeScoreReport
}
```

Recommended error response:

```ts
{
  "ok": false,
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many checks right now — try again in a few minutes",
    "retryAfterSeconds": 120
  }
}
```

Recommended routes:

- `GET /api/report?repo=owner/name` for the versioned complete report.
- `GET /api/report/owner/name` if a path-based public URL is useful.
- `GET /api/actionable?repo=owner/name` for the current Next Useful Move.
- `POST /api/corrections` for a correction request with rate limiting and abuse controls.
- `GET /api/report/owner/name/history` only for public/opt-in history.
- `GET /api/badge?repo=owner/name` for the visual badge.
- `GET /badge/owner/name.svg` for the SVG badge.

Do not create a route that exposes raw GitHub responses, private moderation events, service-role data, or provider secrets.

## 8. Data architecture

Supabase should store only data that provides durable product value. Keep public and private data separated.

Suggested public/operational tables:

- `public_audit_reports`: normalized report summaries and schema version.
- `public_audit_checks`: evidence items for public report pages.
- `improvement_events`: observed or maintainer-confirmed improvements.
- `report_corrections`: correction requests and resolution metadata.
- `action_runs`: GitHub Action run metadata with no secrets.

Suggested columns should include:

- UUID primary key.
- repository full name.
- commit SHA or observed branch reference where available.
- schema version.
- tool version.
- created/updated timestamps.
- public/private classification.
- retention or deletion policy.

Do not store raw repository manifests, full GitHub payloads, message bodies, tokens, or AI prompts unless an existing documented privacy boundary explicitly allows the data. Use RLS for every table. The Android client must use public/publishable access only and must not receive the service role key.

## 9. GitHub Action architecture

The Action should be a thin integration layer over the CLI/report engine.

Inputs:

- `repo` defaulting to the current repository.
- `threshold` optional.
- `comment-on-pr` default false initially.
- `upload-report` default true.
- `format` default `json`.
- `fail-on` with values `never`, `threshold`, or `missing-next-move`.

Outputs:

- `score`.
- `grade`.
- `report-path`.
- `next-useful-move`.
- `report-url` if generated.

Security defaults:

- least-privilege permissions.
- no write permission unless the user explicitly enables PR comments.
- no automatic issue or PR creation.
- pinned action dependencies.
- no execution of repository-provided scripts beyond clearly documented commands.
- safe handling of fork pull requests.
- no secrets in logs.

Use GitHub artifacts for reports. Update a single bot-owned PR comment if enabled rather than creating comment spam. GitHub’s workflow status badge model shows why repository-native status artifacts are useful, but WelcomeScore must present evidence and limitations rather than an unexplained pass/fail claim. [1]

## 10. CLI architecture

The CLI remains useful without the website.

Required commands/modes:

```text
npx @ethiorhq/welcomescore
npx @ethiorhq/welcomescore --ci --threshold=80
npx @ethiorhq/welcomescore --format=json
npx @ethiorhq/welcomescore --format=markdown --output=.welcomescore/report.md
npx @ethiorhq/welcomescore --fix --dry-run
npx @ethiorhq/welcomescore --fix
```

The CLI must:

- exit nonzero only under explicit CI failure conditions.
- never overwrite files in `--fix` mode.
- show a diff or planned operation before writing.
- support no-color mode.
- remain usable in terminals and CI logs.
- share fixtures with the web report and Action.
- avoid uploading project source files.

## 11. UI architecture

The web UI should focus on a sequence:

1. Check a repository.
2. See evidence.
3. Understand the limitation.
4. Take one useful next step.
5. Generate or copy a safe artifact.
6. See improvement later.

The score should not visually dominate every screen. The Next Useful Move should have equal or greater practical prominence.

New components should follow the existing restrained dark system:

- base `#12141C`.
- surface `#1B1E29`.
- text `#F2EEE6`.
- muted `#8B8F9E`.
- accent `#E8A23D`.
- good `#7A9B76`.
- existing radius convention.
- IBM Plex Mono for technical values and logo.
- IBM Plex Sans for readable prose.

No red error redesign, no excessive animation, no fake urgency, and no dark patterns.

## 12. Android architecture

The native Android client should consume stable public JSON contracts:

```text
Compose UI → ViewModel → Use Case → Repository → Retrofit/Ktor → Vercel API → GitHub/Supabase
```

The Android client should initially prioritize:

- public repository score lookup.
- JavaScript Health lookup.
- public report history where available.
- Hall of Fame browsing.
- safe public sharing.
- review of Next Useful Move.

Posting, reporting, verification, and Dev Lounge writes should remain disabled or use a secure web handoff until the mobile security contract is verified. Never bypass browser verification simply to make a demo work.

## 13. Security and privacy architecture

Threat model:

- GitHub API abuse and rate exhaustion.
- automated score scraping.
- spam corrections.
- malicious repository names or issue titles.
- prompt injection through public repository content.
- bot-generated Lounge content.
- Android reverse engineering.
- stale or misleading badges.
- accidental disclosure of private community data.

Controls:

- server-side GitHub calls.
- input validation for owner/repo.
- rate limits by salted network bucket and account/context where available.
- signed proofs and Turnstile for protected community writes.
- safe output encoding.
- strict AI moderation boundary.
- no secrets in client bundles.
- cache only safe public results with timestamps.
- correction and appeal path.
- audit logs for moderation kept private and retention-limited.

## 14. Quality and observability

Add tests for:

- report schema fixtures.
- score determinism.
- evidence source links.
- rate-limit responses.
- malformed GitHub data.
- owner/repo parsing.
- Action comment idempotence.
- JSON/Markdown/SARIF serialization.
- false-positive corrections.
- mobile API state handling.

Server logs should record safe metadata only:

- route.
- provider/engine name where relevant.
- response status.
- duration bucket.
- error code.
- request correlation ID.

Never log tokens, full message content, raw GitHub payloads, or AI prompts containing personal data.

## 15. Rollout sequence

Release in this order:

1. Report schema and fixtures.
2. Shared evidence normalization.
3. CLI JSON/Markdown output.
4. Web public report page.
5. Next Useful Move and correction loop.
6. GitHub Action in opt-in mode.
7. README/badge improvements.
8. Public improvement timeline.
9. Android read-only report integration.
10. Community and event enhancements.

Each step should ship behind a feature flag or isolated route when feasible. Deploy to preview, run the full web and CLI test suites, then enable for a small set of repositories before broad promotion.

## 16. Success criteria

The architecture is working when:

- one score/evidence engine powers web, CLI, Action, and Android.
- a maintainer can get a useful result without creating an account.
- every score claim has evidence and limitations.
- a maintainer can complete one improvement from the result page.
- the Action produces a stable artifact and non-spammy PR output.
- correction reports become regression tests.
- private community data never enters public reports.
- the product’s growth is measured by completed improvements and repeat workflow use, not only stars.

## Reference

[1]: https://docs.github.com/actions/managing-workflow-runs/adding-a-workflow-status-badge "GitHub — Adding a workflow status badge"

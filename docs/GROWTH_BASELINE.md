# WelcomeScore Growth Baseline Report

**Date:** 2026-10-20  
**Repository:** `ethiorhq/welcomescore`  
**Current Production Deployment:** `https://welcomescore.vercel.app`  
**Target Domain (Pending JS.ORG delegation confirmation):** `https://welcomescore.js.org`  

---

## 1. Executive Summary

This baseline report captures the operational state, code contracts, architecture boundaries, and validation baseline of `ethiorhq/welcomescore` before implementing the planned growth features from:
- `docs/welcomescore_growth_strategy.md`
- `docs/welcomescore_growth_build_architecture.md`
- `docs/welcomescore_vibe_coding_agent_prompts.md`

All existing automated checks (web linting, TypeScript checking, web unit tests, Next.js production build, CLI check, CLI unit tests, CLI build, and npm pack check) have been run and verified.

---

## 2. Current Feature Inventory

1. **Next.js 14 Web Application (App Router)**
   - Technical foundation: Next.js 14.2.16, React 18, TypeScript 5, Tailwind CSS 3.4.1, Framer Motion 13.
   - Design system tokens: `base` (`#12141C`), `surface` (`#1B1E29`), `text` (`#F2EEE6`), `muted` (`#8B8F9E`), `accent` (`#E8A23D`), `good` (`#7A9B76`).
   - Fonts: IBM Plex Mono (technical values, logo) and IBM Plex Sans (body prose).
2. **Public GitHub Repository Scoring (`lib/scoreRepo.ts`)**
   - Deterministic server-side evaluation of public GitHub repositories without requiring authentication.
   - Checks: `CONTRIBUTING.md` (20 pts), `CODE_OF_CONDUCT.md` (15 pts), `README setup section` (15 pts), `LICENSE` (10 pts), `Good-first-issue labels` (up to 25 pts), `Recently active` (15 pts). Max score: 100.
   - Grades: `A` (>=90), `B` (>=75), `C` (>=60), `D` (>=40), `F` (<40).
3. **JavaScript Health Engine (`lib/jsHealth/`)**
   - In-depth telemetry across 4 categories:
     - Package telemetry (max 35 pts)
     - Tooling infrastructure (max 25 pts)
     - CI/CD readiness (max 25 pts)
     - Contributor health (max 15 pts)
   - Evaluates `package.json`, exports/types, engines, packageManager, publish file allowlist, tsconfig, linting/formatting configs, test runners, Node version pins (.nvmrc/volta), GitHub Actions workflows, CI test jobs, bundle size tracking, npm release workflows, contributor guides, code of conduct, and starter issues.
   - Remediation engine (`lib/jsHealth/remediation.ts`) provides concrete remediation actions and template definitions.
4. **Next Useful Move Engine (`lib/nextUsefulMove.ts`)**
   - Prioritized move selector based on audit findings:
     - Priority 10: `readme-setup`
     - Priority 20: `contributing-guide`
     - Priority 30: `code-of-conduct`
     - Priority 40: `license`
     - Priority 50: `starter-issue`
     - Priority 60: `starter-issue-quality`
     - Priority 70: `maintenance-clarity`
     - Priority 90: `maintain-the-path`
   - Generates primary and secondary move recommendations with effort estimates and guide links.
   - Paired with `lib/actionArtifacts.ts` for copyable outlines (README setup outline, CONTRIBUTING outline, Code of Conduct outline, starter issue brief, maintenance status note).
   - Local return workspace (`lib/useLocalReturnWorkspace.ts`) saves maintainer progress anonymously in `localStorage`.
5. **Algofox Review System (`lib/review/`)**
   - Server-side AI review with deterministic rule fallback (`lib/review/deterministic.ts`).
   - Adapters for Groq (`openai/gpt-oss-20b`) and Gemini (`gemini-3.7-flash`).
   - AI outputs never change numeric scores; review responses are cached in `review_cache` and rate-limited via `review_rate_limits`.
6. **Hall of Fame (`lib/leaderboard.ts`, `app/leaderboard/`)**
   - Displays eligible repositories (score >= 75, stars >= 5 or forks >= 2, has README & license).
   - Backed by Supabase `repo_evaluations` table with freshness tracking (fresh <= 7d, stale <= 30d, expired > 30d).
7. **Dev Lounge (`lib/lounge*`, `app/lounge/`, `app/api/lounge/*`)**
   - Structured developer discussion around audit contexts.
   - Cloudflare Turnstile token validation and signed human interaction proofs (`v1.{time}.{nonce}.{sessionHash}`).
   - HMAC-signed temporary audit context (`LOUNGE_CONTEXT_SIGNING_SECRET`).
   - Rate limiting using salted network hash buckets (`LOUNGE_ABUSE_SALT`).
   - Multi-tier moderation (heuristic secrets/profanity filters + LLM-based categorization via Groq/Gemini + automatic hiding for severe infractions).
8. **Share With Purpose (`lib/shareReceipt.ts`, `app/share/`)**
   - Issues 21-day HMAC-SHA256 signed public audit receipts (`SHARE_RECEIPT_SIGNING_SECRET`).
9. **Scoped CLI (`packages/cli/`)**
   - `@ethiorhq/welcomescore` npm package with interactive Ink/React UI, human text reporter, JSON reporter, Markdown reporter, and CI mode (`--threshold`).
   - `--fix` and `--dry-run` modes to create absent low-risk template files without overwriting existing files.
10. **Guides, Policies, SEO & PWA**
    - High-signal guides (`/guides/*`), RSS feed (`/guides/rss.xml`), sitemap, robots, `llms.txt`, PWA manifest, service worker (`public/sw.js`).

---

## 3. Current Route & API Inventory

### Web Pages
| Path | Kind | Purpose |
|---|---|---|
| `/` | Static | Audit homepage and repository check form |
| `/check/[owner]/[repo]` | Dynamic | Audit result page with ScoreCard and Next Useful Move |
| `/compare` | Static | Side-by-side repository comparison |
| `/leaderboard` | Dynamic | Hall of Fame listing |
| `/lounge` | Static | Dev Lounge community discussions |
| `/js` | Static | JavaScript Health audit dashboard |
| `/guides` | Static | Developer guides catalog |
| `/guides/[slug]` | SSG | Guide article pages |
| `/how-it-works` | Static | Methodology and scoring explanation |
| `/faq` | Static | Frequently asked questions |
| `/privacy` | Static | Privacy policy |
| `/terms` | Static | Terms and conditions |
| `/dev-lounge-policy` | Static | Community conduct and moderation rules |
| `/share/receipt/[token]` | Dynamic | Signed audit receipt view |

### API Route Handlers
| Route | Method | Purpose | Cache Policy |
|---|---|---|---|
| `/api/score` | GET | Direct repository audit | `no-store` |
| `/api/js-health` | GET | JavaScript health evaluation | `s-maxage=300, stale-while-revalidate=86400` |
| `/api/badge` | GET | Dynamic PNG badge (`ImageResponse`) | `s-maxage=300, stale-while-revalidate=300` |
| `/api/badge/[owner]/[repo]` | GET | Redirects to `/api/badge?repo=...` | `308 redirect` |
| `/badge/[owner]/[repo].svg` | GET | Dynamic SVG badge | `s-maxage=300` |
| `/api/leaderboard` | GET | Top 50 leaderboard entries | `no-store` |
| `/api/leaderboard/add` | POST | Add eligible repository | `no-store` |
| `/api/leaderboard/status` | GET | Check if repository is in Hall of Fame | `no-store` |
| `/api/leaderboard/refresh` | POST | Refresh existing leaderboard entry | `no-store` |
| `/api/review` | POST | Algofox review generation | `no-store` |
| `/api/lounge/messages` | GET / POST | Dev Lounge messages and thread root | `no-store` |
| `/api/lounge/reactions` | POST | Dev Lounge emoji reactions | `no-store` |
| `/api/lounge/reports` | POST | Dev Lounge message reporting | `no-store` |
| `/api/lounge/context/audit` | POST | Prepare signed audit context | `no-store` |
| `/api/lounge/context/hall` | POST | Prepare Hall of Fame context | `no-store` |
| `/api/lounge/verification` | POST | Issue human proof after Turnstile | `no-store` |
| `/api/lounge/answers` | POST | Moderate and store replies | `no-store` |
| `/api/lounge/health` | GET | Supabase & Lounge health check | `no-store` |
| `/api/share/receipt` | POST | Generate signed audit receipt | `no-store` |

---

## 4. Current Score and Report Data Shape

### `ScoreResult` (`lib/scoreRepo.ts`)
```ts
export type Check = {
  label: string;
  passed: boolean;
  points: number;
  maxPoints?: number;
};

export type GoodFirstIssue = {
  title: string;
  url: string;
};

export type ScoreResult = {
  repo: string;
  score: number;
  grade: string;
  checks: Check[];
  defaultBranch: string;
  starsCount: number;
  forksCount: number;
  primaryLanguage: string;
  hasReadme: boolean;
  hasLicense: boolean;
  isEligibleForLeaderboard: boolean;
  goodFirstIssueCount: number;
  goodFirstIssues: GoodFirstIssue[];
};
```

### `JsHealthReport` (`lib/jsHealth/types.ts`)
```ts
export type JsHealthReport = {
  schemaVersion: 1;
  subject: {
    kind: "local" | "github";
    name: string;
    repository?: string;
  };
  generatedAt: string;
  score: number;
  grade: "A" | "B" | "C" | "D";
  categories: JsHealthCategory[];
  checks: JsHealthCheck[];
  limitations: string[];
};
```

---

## 5. Current CLI Commands & Capabilities

The scoped package `@ethiorhq/welcomescore` (version `0.1.0`) provides:

```bash
# Human terminal output (interactive Ink UI if TTY, text summary otherwise)
npx @ethiorhq/welcomescore

# Quiet CI mode with exit code (0 = passed threshold, 1 = below threshold, 2 = usage error)
npx @ethiorhq/welcomescore --ci --threshold=80

# Machine-readable output
npx @ethiorhq/welcomescore --format=json # or --json
npx @ethiorhq/welcomescore --format=markdown # or --markdown

# Safe automated template fixes (creates absent files only; never overwrites)
npx @ethiorhq/welcomescore --fix --dry-run
npx @ethiorhq/welcomescore --fix

# Flags supported:
# --cwd <path>
# --ci
# --threshold <score> (default: 80)
# --json
# --markdown
# --details
# --fix
# --dry-run
# --github
# --no-color
```

---

## 6. Current Android Status

- **Status:** **Unavailable in repository.**
- **Investigation:** No `android/` directory exists in the project workspace or on the host filesystem.
- **Tools:** Android SDK / Gradle (`./gradlew`) are not present in this workspace.
- **Strategy:** All backend contracts, public report endpoints, and the website `AndroidAppDownloadCard` will be implemented cleanly following the blueprint without pretending native Android builds succeeded. The Android CTA will show "Android app coming soon" or remain hidden if `NEXT_PUBLIC_ANDROID_APP_URL` is empty.

---

## 7. Current Supabase Tables & Migrations

Migrations under `supabase/migrations/`:
1. `20260826_algofox_review_engine.sql`:
   - `public.review_cache` (id, repo_path, context_hash, review_version, score, payload, provider_used, created_at, expires_at)
   - `public.review_rate_limits` (bucket, request_count, window_started_at, updated_at)
   - `public.consume_review_rate_limit()` stored procedure
2. `20260826_dev_lounge.sql`:
   - `public.lounge_messages`
   - `public.lounge_rate_limits`
3. `20260826_dev_lounge_reactions.sql`:
   - `public.lounge_reactions`
4. `20260826_dev_lounge_replies.sql`:
   - Parent message relationships and reply columns
5. `20260827_dev_lounge_high_signal.sql`:
   - Moderation states, verification columns, community context
6. `20260828_dev_lounge_moderation_and_verification.sql`:
   - `public.lounge_reports`
   - Automated moderation classification and audit columns
7. Pre-existing application table:
   - `public.repo_evaluations` (Hall of Fame storage)

---

## 8. Current Security & Privacy Boundaries

- **Public Repository Metadata Only:** The web auditor and public report engines only inspect allowlisted public metadata via GitHub's public API. No source code or credentials are ever stored.
- **Local CLI Boundary:** The CLI inspects local files on disk and does not upload source files, secrets, or environment variables to WelcomeScore servers.
- **Server-Side AI Providers:** Groq and Gemini API keys remain strictly server-side. No provider keys are exposed to client bundles or CLI binaries. AI prompts are sanitized and never contain user secrets.
- **Turnstile & Verification:** Dev Lounge community writes require valid Cloudflare Turnstile tokens and HMAC-signed human interaction proofs.
- **Rate Limiting:** Salted network hash buckets prevent scraping and abuse across Dev Lounge, review engine, and reporting endpoints.
- **Supabase RLS:** All tables have Row Level Security enabled. Anon clients only have read access to approved public views; all writes are mediated via server-side service-role route handlers.

---

## 9. Baseline Validation Command Results

| Command | Status | Output / Duration | Notes |
|---|---|---|---|
| `npm install --prefer-offline` | **PASS** | Exit 0 (555 packages audited) | Restored `node_modules` after initial `npm ci` ECONNRESET |
| `npm run lint` | **PASS** | Exit 0 | `No ESLint warnings or errors` |
| `npm test` | **PASS** | Exit 0 (7 test files, 35 tests passed) | Duration: 4.19s |
| `npm run build` | **PASS** | Exit 0 | Production Next.js build compiled successfully (31 static pages) |
| `npm run cli:check` | **PASS** | Exit 0 | `tsc --noEmit` in `@ethiorhq/welcomescore` passed |
| `npm run cli:test` | **PASS** | Exit 0 (1 test file, 4 tests passed) | Vitest CLI tests passed |
| `npm run cli:build` | **PASS** | Exit 0 | tsup build generated `dist/` ESM & DTS bundles |
| `npm run cli:pack:check` | **PASS** | Exit 0 | `npm pack --dry-run` succeeded; package size: 35.9 kB |
| `cd android; ./gradlew test` | **UNAVAILABLE** | Exit 1 (`android` directory does not exist) | Accurately recorded as unavailable |

---

## 10. Planned Files to Add or Modify Across Growth Phases

### Phase 1: Shared Report Contract
- Add `lib/report/types.ts`
- Add `lib/report/schema.ts`
- Add `lib/report/version.ts`
- Add `lib/report/serialize.ts`
- Add `lib/report/fixtures.ts`
- Add `lib/report/report.test.ts`
- Add `docs/REPORT_SCHEMA.md`

### Phase 2: Evidence-Backed Next Useful Move Engine
- Add/update `lib/actionable/nextUsefulMove.ts` (reusing and evolving `lib/nextUsefulMove.ts`)
- Add `lib/actionable/issueDraft.ts`
- Add `lib/actionable/patchPlan.ts`
- Add `lib/actionable/acceptance.ts`
- Add `lib/actionable/actionable.test.ts`
- Add `docs/SIGNALS_AND_LIMITATIONS.md`

### Phase 3: Public Report Experience
- Add `app/api/report/route.ts`
- Add `app/report/[owner]/[repo]/page.tsx`
- Add `app/components/EvidencePanel.tsx`
- Add `app/components/ReportFreshness.tsx`
- Add `app/components/ActionDraftModal.tsx`
- Update `app/components/NextUsefulMoveCard.tsx`
- Add `docs/PUBLIC_REPORT_SPEC.md`

### Phase 4: Correction and Trust Loop
- Add `app/api/corrections/route.ts`
- Add `lib/corrections/types.ts`
- Add `lib/corrections/repository.ts`
- Add `lib/corrections/triage.ts`
- Add `lib/corrections/corrections.test.ts`
- Add `supabase/migrations/20261020_report_corrections.sql`
- Add `docs/CORRECTIONS.md`

### Phase 5: Upgrade the CLI
- Update `packages/cli/src/report-schema.ts` (syncing with `lib/report/`)
- Update `packages/cli/src/reporters.ts` to output standard WelcomeScore report format
- Update `packages/cli/src/cli.ts` to support `--format=json`, `--format=markdown`, `--output`
- Update `packages/cli/test/cli.test.ts`

### Phase 6: First-Party GitHub Action
- Add `actions/welcomescore/action.yml`
- Add `actions/welcomescore/README.md`
- Add `actions/welcomescore/src/entrypoint.ts`
- Add `actions/welcomescore/src/comment.ts`
- Add `docs/GITHUB_ACTION.md`

### Phase 7: Improvement History
- Add `supabase/migrations/20261020_improvement_events.sql`
- Add `lib/improvement/timeline.ts`
- Add `app/components/ImprovementTimeline.tsx`

### Phase 8: Native Android Integration Contract
- Add `docs/ANDROID_BACKEND_CONTRACT.md`

### Phase 9: Website Distribution & Documentation
- Update `README.md`
- Add `docs/ANDROID_DISTRIBUTION_PLAN.md`
- Add `app/components/AndroidAppDownloadCard.tsx`
- Update `app/components/SiteFooter.tsx`

### Phase 10: Full Validation & Delivery Report
- Add `docs/GROWTH_IMPLEMENTATION_STATUS.md`
- Add `docs/RELEASE_CHECKLIST.md`
- Add `docs/SECURITY_REVIEW.md`

---

## 11. Identified Conflicts, Risks & Resolutions

1. **Android Directory Presence:**
   - *Conflict:* The prompt/blueprint mentions an existing native Android project under `android/`. In reality, no `android/` directory exists.
   - *Resolution:* Document this accurately. Implement the Android API contracts, documentation, and web CTA cleanly without generating dummy native Android code.
2. **Scoring Engine Unification:**
   - *Conflict:* The repository currently contains two scoring modules: `lib/scoreRepo.ts` (contributor readiness audit, 100 max) and `lib/jsHealth/engine.ts` (JavaScript package & ecosystem health, 100 max).
   - *Resolution:* Do not create a third competing scoring engine. Establish `WelcomeScoreReport` in `lib/report/` as the versioned, unified contract that packages the comprehensive evidence, score, checks, confidence, coverage, and Next Useful Move, with adapters that bridge `scoreRepo` and `jsHealth`.
3. **Domain Cutover Constraint:**
   - *Conflict:* The planned domain is `welcomescore.js.org`, but the JS.ORG delegation is still in progress.
   - *Resolution:* Retain `SITE_URL` defaulting to `https://welcomescore.vercel.app`. Keep the `.js.org` visual branding in headers/badges as an identity mark, but do not change canonical URLs, robots, sitemap, or Vercel production domains.
4. **Rate Limiting & GitHub API Limits:**
   - *Conflict:* Public audits consume GitHub API quota. Unauthenticated rate limit is 60 req/hr; authenticated with `GITHUB_TOKEN` is 5,000 req/hr.
   - *Resolution:* Maintain caching (`revalidate: 300`), enforce network-salted rate limits, and provide clean 429 error messages with `retryAfterSeconds`.

---

## 12. Verification & Next Phase Safety

Phase 0 inspection is complete and frozen. Baseline verification commands have run and passed with zero regressions. Phase 1 (Establishing the shared report contract) is safe to begin.

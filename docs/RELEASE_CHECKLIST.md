# WelcomeScore Production Release Checklist

## 1. Automated Verification Gates

Before tagging a release or deploying, every automated check must pass cleanly with exit code 0:

- [ ] `npm run lint` — ESLint passes with 0 errors and 0 warnings.
- [ ] `npm test` — All Vitest unit and integration suites pass (report contract, actionable moves, corrections, improvement timeline, CLI, action, lounge, jsHealth).
- [ ] `npm run build` — Next.js 14 App Router production bundle builds without errors or missing static parameters.
- [ ] `npm run cli:check` — CLI TypeScript typecheck (`tsc --noEmit`) passes with 0 errors.
- [ ] `npm run cli:test` — CLI tests pass across format (terminal, json, markdown), output files, and CI threshold evaluation.
- [ ] `npm run cli:build` — tsup builds clean CLI bundles (`dist/index.js`, `dist/bin.js`, `dist/index.d.ts`).
- [ ] `npm run cli:pack:check` — npm pack dry-run produces a clean tarball under 60 kB with only allowlisted distribution files.

---

## 2. Database Migrations (Supabase)

Run the following additive SQL migrations in order in the Supabase SQL Editor:

- [ ] `supabase/migrations/20261020_report_corrections.sql`
  - Creates `public.report_corrections` table with Row Level Security (RLS).
  - Confirms public anon/authenticated cannot read other users' correction submissions.
- [ ] `supabase/migrations/20261020_improvement_events.sql`
  - Creates `public.repo_improvement_events` table with Row Level Security (RLS).
  - Confirms public read access for timeline tracking.
  - Confirms write access restricted to `service_role` (server-side only).

Verification queries:
```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('report_corrections', 'repo_improvement_events');
```

---

## 3. Environment Variables Audit

Verify that all required environment variables are set in production (e.g. Vercel dashboard). **NEVER commit real secret values to Git.**

### Public / Client-Safe (Prefix: `NEXT_PUBLIC_`)
- `NEXT_PUBLIC_SITE_URL`: Production origin (`https://welcomescore.vercel.app`).
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: Supabase anon/publishable key.
- `NEXT_PUBLIC_ANDROID_APP_URL` (optional): Official Google Play or verified release URL.
- `NEXT_PUBLIC_ANDROID_APP_VERSION` (optional): Release version string.

### Server-Only Secrets (NEVER prefix with `NEXT_PUBLIC_`)
- `GITHUB_TOKEN`: Read-only GitHub PAT for raising unauthenticated API rate limits.
- `SUPABASE_URL`: Supabase project URL.
- `SUPABASE_SERVICE_ROLE_KEY`: Elevated key for server-side persistence (corrections, timeline, leaderboard).
- `GROQ_API_KEY` (optional): Server-only Groq key for structured Algofox reviews.
- `GEMINI_API_KEY` (optional): Server-only Gemini API key for structured reviews.
- `ALGOFOX_REVIEW_RATE_LIMIT_SALT` (optional): Random salt for privacy-preserving review rate limits.

---

## 4. JS.ORG Domain & DNS Safety Boundary

- [ ] **STRICT RULE**: Do NOT change canonical URL to `welcomescore.js.org` until the JS.ORG pull request is merged and Vercel confirms the domain status as "Valid / Ready".
- [ ] Verify `https://welcomescore.vercel.app` remains canonical until owner confirmation.

---

## 5. Artifacts and Publishing Guardrails

- [ ] CLI: Do not run `npm publish` without explicit owner approval. Verify `@ethiorhq` organization scope.
- [ ] GitHub Action: Do not push git tags (e.g. `v1`) without explicit owner review. Test locally using fixtures and input/output unit tests.
- [ ] Android Client: Never publish or link to debug APKs. Show "Android app coming soon" if signed URL is unavailable.

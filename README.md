# WelcomeScore

[![WelcomeScore](https://welcomescore.vercel.app/api/badge?repo=ethiorhq/welcomescore&v=3)](https://welcomescore.vercel.app/?repo=ethiorhq/welcomescore)

**WelcomeScore** gives a public GitHub repository a practical readiness score for first-time contributors. It checks the small signals that make a project easier to join: contributor documentation, a code of conduct, setup guidance, a license, beginner-friendly open issues, and recent activity.

> WelcomeScore is source-available under the project’s custom [Source-Available Attribution License](LICENSE), not an OSI-approved open-source license. Public derivatives must preserve the license, notices, and original-project attribution described in [ATTRIBUTION.md](ATTRIBUTION.md).

## Governance, community, and policies

| Resource | Purpose |
| --- | --- |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Reproducible local setup, standards, labels, validation, and pull requests. |
| [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) | Expected community behavior, reporting, and enforcement process. |
| [SECURITY.md](SECURITY.md) | Private, responsible vulnerability-reporting guidance. |
| [SUPPORT.md](SUPPORT.md) | The correct route for product and contributor questions. |
| [GOVERNANCE.md](GOVERNANCE.md) and [MAINTAINERS.md](MAINTAINERS.md) | Stewardship, decision principles, and maintainer duties. |
| [NOTICE](NOTICE), [ATTRIBUTION.md](ATTRIBUTION.md), and [TRADEMARKS.md](TRADEMARKS.md) | Copyright, permitted use, required original-project credit, and brand-use boundaries. |
| [How It Works](https://welcomescore.vercel.app/how-it-works), [FAQ](https://welcomescore.vercel.app/faq), [Privacy Policy](https://welcomescore.vercel.app/privacy), [Terms](https://welcomescore.vercel.app/terms), and [Dev Lounge Policy](https://welcomescore.vercel.app/dev-lounge-policy) | Public product, privacy, community-chat, and service-boundary information. |
| [Developer Guides](https://welcomescore.vercel.app/guides) | Original, practical tutorials for contributors and maintainers on onboarding, documentation, starter issues, audits, and community safety. |
| [Search Discovery Launch Checklist](docs/SEARCH_CONSOLE_LAUNCH_CHECKLIST.md) | A manual production checklist for Search Console, crawl assets, structured data, share previews, and honest measurement. |
| [robots.txt](https://welcomescore.vercel.app/robots.txt), [sitemap.xml](https://welcomescore.vercel.app/sitemap.xml), [Guide RSS](https://welcomescore.vercel.app/guides/rss.xml), and [llms.txt](https://welcomescore.vercel.app/llms.txt) | Canonical public-discovery assets. `llms.txt` is a truthful interoperability overview, not a Google ranking requirement. |

## Quick start and setup

Install the project dependencies and start the development server:

```bash
npm install
npm run dev
```

The application runs at [http://localhost:3005](http://localhost:3005).

## JavaScript and TypeScript maintainer health

[JavaScript Health](https://welcomescore.vercel.app/js) is a separate, deterministic 100-point review for JavaScript and TypeScript project foundations. It evaluates observable package telemetry, Node tooling, CI workflow signals, and contributor health. It is not a security audit, package-safety guarantee, code-quality certification, legal opinion, popularity ranking, or endorsement.

The companion package is published as [`@ethiorhq/welcomescore` on npm](https://www.npmjs.com/package/@ethiorhq/welcomescore) (current version `0.1.0`); its source lives in [`packages/cli`](packages/cli). Developers can run it directly in a local JavaScript/TypeScript project:

```bash
npx @ethiorhq/welcomescore
npx @ethiorhq/welcomescore --ci --threshold=80
npx @ethiorhq/welcomescore --fix --dry-run
```

Until publication, validate it from this repository:

```bash
npm run cli:check
npm run cli:test
npm run cli:build
npm run cli:pack:check
node packages/cli/dist/bin.js --ci --threshold=80
```

The CLI reads only the selected local project directory and does not upload source files, package manifests, environment values, or Git credentials to WelcomeScore. Its fix mode creates only absent low-risk templates; it never overwrites a file, edits `package.json`, installs dependencies, runs scripts, commits code, changes GitHub, or publishes a package.

### JavaScript Health endpoints

`GET /api/js-health?repo=owner/repo` returns a read-only summary of allowlisted public package metadata, configuration-file paths, workflow indicators, and starter-label evidence. It does not return raw manifests or workflow bodies.

`GET /badge/owner/repo.svg` returns a compact JavaScript Health SVG badge for a public repository README. For example:

```md
[![WelcomeScore JS Health](https://welcomescore.vercel.app/badge/ethiorhq/welcomescore.svg)](https://welcomescore.vercel.app/js)
```

## Optional GitHub token

WelcomeScore works with public repositories without authentication, but GitHub applies a lower API rate limit to unauthenticated requests. To raise that limit, create a local environment file and add a GitHub token:

```bash
cp .env.example .env.local
```

Then set the optional value in `.env.local`:

```bash
GITHUB_TOKEN=your_token_here
```

The token is used only by the server-side repository scoring requests and is never exposed to the browser.

## How scoring works

The score ranges from 0 to 100 and uses these checks:

| Check | Maximum points |
| --- | ---: |
| `CONTRIBUTING.md` | 20 |
| `CODE_OF_CONDUCT.md` | 15 |
| README setup or install section | 15 |
| License detected by GitHub | 10 |
| Beginner-friendly open issues | 25 |
| Activity within the last three months | 15 |

WelcomeScore returns a grade from **A** through **F** alongside the individual checks. A deliberate homepage or comparison audit requests current public GitHub data. Shareable PNG and SVG badge routes retain a short bounded GitHub-data cache so README embeds remain reliable.

## API routes

`GET /api/score?repo=owner/repo` returns the JSON score result. The `repo` parameter also accepts a full `github.com/owner/repo` URL.

`GET /api/badge?repo=owner/repo` returns the existing 600 × 315 PNG score badge suitable for sharing. Existing copied badge URLs remain supported.

### Dynamic SVG rank badges

`GET /api/badge/owner/repo?style=1` returns a compact, live SVG contributor-health badge suitable for a repository README. The badge recalculates from the same cached scoring pipeline used by the audit API and returns cache headers suitable for repeated README loads.

| Style | Query value | Purpose |
| --- | --- | --- |
| Minimal | `style=1` | Compact dual-segment README pill. |
| Tier shield | `style=2` | Contributor-signal tier with a neutral emblem; not a certification. |
| Metrics | `style=3` | One-line score, grade, and contributor-signal summary. |
| Dark glow | `style=4` | Developer-tool card with the WelcomeScore primary accent. |

Badge tiers are limited summaries of the published contributor-signal calculation; they are not a certification, quality claim, security assessment, legal opinion, or endorsement. The completed audit’s **Embed badge** action offers copy-ready Markdown and HTML for every style.

## Verify a production build

```bash
npm run build
```

## Community leaderboard

A public scan does **not** enter the [Hall of Fame](/leaderboard) automatically. When a repository meets the eligibility rules—a score of **75 or higher**, at least **5 stars or 2 forks**, plus both a `README.md` and a detected license—the completed audit shows an explicit **Add to Hall of Fame** action. Only that user action writes the public leaderboard evaluation to Supabase.

Leaderboard reads are served from the cached evaluation store. Evaluations remain fresh for seven days; entries aged between eight and 30 days are served immediately and rechecked opportunistically in the background; entries older than 30 days are refreshed on the next leaderboard visit. This preserves fast rankings while avoiding continuous GitHub polling.

Set these server-only variables in `.env.local` for local leaderboard persistence, and in the matching production environment for deployment:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

Never expose `SUPABASE_SERVICE_ROLE_KEY` to the browser or prefix it with `NEXT_PUBLIC_`.

Additional routes:

- `GET /api/leaderboard` returns the top 50 eligible cached evaluations.
- `POST /api/leaderboard/add?repo=owner/repo` adds a freshly verified eligible repository after an explicit user request.
- `POST /api/leaderboard/refresh?repo=owner/repo` refreshes an existing leaderboard entry through the scoring pipeline.
- `GET /check/owner/repo` opens a shareable full-audit route.

## Anonymous Dev Lounge

The [Dev Lounge](/lounge) is a lightweight, anonymous 24-hour chat for contributor questions, score celebrations, and practical open-source encouragement. A visitor receives a deterministic temporary developer handle and DiceBear avatar stored only in that browser’s local storage. The lounge never uses the leaderboard service-role credential in the browser.

Run `supabase/migrations/20260826_dev_lounge.sql` in the Supabase SQL Editor before using the lounge. The migration creates the `lounge_messages` table, enables Realtime, applies explicit read/insert-only RLS permissions, and schedules hourly deletion of expired messages. After updating to the reply-enabled lounge, run `supabase/migrations/20260826_dev_lounge_replies.sql` as well. It adds bounded, display-safe quoted-reply snapshots without granting browser clients update or delete access. For the current reaction controls, also run `supabase/migrations/20260826_dev_lounge_reactions.sql`; it enables four reaction choices, one anonymous reaction per browser session per message, and realtime reaction updates without creating browser update/delete access.

Set the following **browser-safe** values in `.env.local` and the matching Vercel environments:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_publishable_or_anon_key
```

Use a Supabase publishable or anon key only. Do not use `SUPABASE_SERVICE_ROLE_KEY` in a `NEXT_PUBLIC_` variable. Lounge messages are limited to 300 characters, locally filtered for basic spam/profanity, throttled to one send every three seconds per browser session, and automatically purged after 24 hours. Hover a message on desktop or swipe/long-press it on touch devices to reply; a quoted snapshot keeps the conversational context readable even after the original message expires. The chat follows fresh messages while a reader is near the bottom, otherwise presents an unread-message control. Every message also has a compact reaction picker with Helpful, Insightful, Celebrate, and Following choices.

## Algofox companion

WelcomeScore includes **Algofox**, the supplied cyber-fox sprite companion, as an optional visual guide. Algofox appears in the global bottom-right dock, the repository audit flow, the badge embed preview, and the Dev Lounge header. It uses the provided 8×9 WebP atlas and adapts its animation to focused audits, strong results, repositories still improving, badge review/copy actions, successful Lounge posts, and inactivity.

Algofox is deliberately non-authoritative: it never scans repositories, posts chat messages, adds Hall of Fame entries, plays audio, or triggers disruptive effects on its own. The dock can be hidden at any time, respects reduced-motion preferences, and keeps guidance inside the existing WelcomeScore dark palette.

## Algofox Review Engine

After an audit completes, visitors can explicitly select **Ask Algofox for a review**. The review endpoint rescans the public repository through the existing server-side score pipeline, then bases its response only on the six verified contributor checks, score, grade, repository language, license/readme flags, and beginner-issue count. It never receives README bodies, issue text, source code, browser-submitted metrics, or Hall of Fame/Lounge data.

`POST /api/review` accepts only this JSON body:

```json
{ "repo": "owner/repo" }
```

The endpoint always works in **deterministic mode** with concise, evidence-bound guidance. To enable an optional structured-provider pass, set one or both server-only provider keys and redeploy. Every provider response is validated again against the local audit evidence; an unavailable, invalid, or slow provider automatically falls back to the deterministic engine.

```bash
# Optional; never expose these values through NEXT_PUBLIC_ variables.
GROQ_API_KEY=your_key
GROQ_REVIEW_MODEL=openai/gpt-oss-120b
GEMINI_API_KEY=your_key
GEMINI_REVIEW_MODEL=gemini-3.7-flash

# Optional but recommended in deployed environments. Use a long random secret.
ALGOFOX_REVIEW_RATE_LIMIT_SALT=your_long_random_value
```

Gemini provider reviews use the [Gemini Interactions API](https://ai.google.dev/gemini-api/docs/interactions) with `store: false`, so each review is a one-shot request rather than a stored provider interaction. If the configured latest Flash model is unavailable, the server safely tries `gemini-3.6-flash` before returning to the deterministic review engine.

Run `supabase/migrations/20260826_algofox_review_engine.sql` once in the Supabase SQL Editor to enable the private review cache and server-side rate-limit accounting. The migration creates separate `review_cache` and `review_rate_limits` tables with RLS enabled and no browser grants; it does **not** modify `repo_evaluations`, Hall of Fame behavior, or Dev Lounge data. A valid provider review caches for seven days, and a deterministic review caches for 24 hours. Until the migration is applied, reviews continue to work safely without cache persistence.

The review summary presents constructive, evidence-bound guidance once. A separate **Technical roast** section provides the concise implementation-focused observation without duplicating the guidance. None of these interactions can automatically share, publish, add a Hall entry, or send a Dev Lounge message.

## Required Supabase migrations

For a full deployment, run each migration in `supabase/migrations` that has not already been applied, including the Dev Lounge migrations and `20260826_algofox_review_engine.sql`. Migrations are additive and written to be safe to re-run. Verify the new review migration with:

```sql
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in ('review_cache', 'review_rate_limits');

select jobid, jobname, schedule
from cron.job
where jobname = 'purge-expired-algofox-review-cache';
```

> The optional provider keys and the Supabase service-role key are deployment secrets. Keep them server-side, do not commit them, and never place them in variables prefixed with `NEXT_PUBLIC_`.

## Privacy and security notes

Review caching is keyed by a SHA-256 hash of a normalized, versioned audit context. If the optional rate-limit salt is set, a salted hash of the request IP is used only for the short review-rate-limit bucket; the raw IP is never stored. The cache has no public browser permissions. Review generation is user-triggered, and it remains fully separate from the explicit Hall of Fame write flow and the anonymous Dev Lounge.

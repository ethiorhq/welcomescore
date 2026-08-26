# WelcomeScore

[![WelcomeScore](https://welcomescore.vercel.app/api/badge?repo=ethiorhq/welcomescore&v=3)](https://welcomescore.vercel.app/?repo=ethiorhq/welcomescore)

**WelcomeScore** gives a public GitHub repository a practical readiness score for first-time contributors. It checks the small signals that make a project easier to join: contributor documentation, a code of conduct, setup guidance, a license, beginner-friendly open issues, and recent activity.

## Run locally

Install the project dependencies and start the development server:

```bash
npm install
npm run dev
```

The application runs at [http://localhost:3005](http://localhost:3005).

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

WelcomeScore returns a grade from **A** through **F** alongside the individual checks. Results use GitHub data cached for five minutes to reduce repeated API calls.

## API routes

`GET /api/score?repo=owner/repo` returns the JSON score result. The `repo` parameter also accepts a full `github.com/owner/repo` URL.

`GET /api/badge?repo=owner/repo` returns the existing 600 × 315 PNG score badge suitable for sharing. Existing copied badge URLs remain supported.

### Dynamic SVG rank badges

`GET /api/badge/owner/repo?style=1` returns a compact, live SVG contributor-health badge suitable for a repository README. The badge recalculates from the same cached scoring pipeline used by the audit API and returns cache headers suitable for repeated README loads.

| Style | Query value | Purpose |
| --- | --- | --- |
| Minimal | `style=1` | Compact dual-segment README pill. |
| Rank shield | `style=2` | Rank certification with a tier emblem. |
| Metrics | `style=3` | One-line score, grade, and rank summary. |
| Dark glow | `style=4` | Developer-tool card with the WelcomeScore primary accent. |

The rank framework is **Standard Repo** below 75, **Bronze Maintainer** from 75–84, **Silver Maintainer** from 85–94, and **Elite Maintainer** from 95–100. The completed audit’s **Embed badge** action offers copy-ready Markdown and HTML for every style.

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

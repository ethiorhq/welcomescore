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

`GET /api/badge?repo=owner/repo` returns a 600 × 315 PNG score badge suitable for sharing.

## Verify a production build

```bash
npm run build
```

## Community leaderboard

The [Hall of Fame](/leaderboard) is populated passively when someone checks a public repository. Each completed scan is cached in Supabase. A repository appears publicly only when it has a score of **75 or higher**, at least **5 stars or 2 forks**, and both a `README.md` and a detected license.

Leaderboard reads are served from the cached evaluation store. Evaluations remain fresh for seven days; entries aged between eight and 30 days are served immediately and rechecked opportunistically in the background; entries older than 30 days are refreshed on the next leaderboard visit. This preserves fast rankings while avoiding continuous GitHub polling.

Set these server-only variables in `.env.local` for local leaderboard persistence, and in the matching production environment for deployment:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

Never expose `SUPABASE_SERVICE_ROLE_KEY` to the browser or prefix it with `NEXT_PUBLIC_`.

Additional routes:

- `GET /api/leaderboard` returns the top 50 eligible cached evaluations.
- `POST /api/leaderboard/refresh?repo=owner/repo` refreshes one repository through the existing scoring pipeline.
- `GET /check/owner/repo` opens a shareable full-audit route.

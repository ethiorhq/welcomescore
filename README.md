# WelcomeScore

[![WelcomeScore](https://welcomescore.vercel.app/api/badge?repo=ethiorhq/welcomescore)](https://welcomescore.vercel.app/?repo=ethiorhq/welcomescore)

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

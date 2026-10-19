# WelcomeScore Security and Privacy Review

## 1. Executive Security Posture
WelcomeScore is architected as an evidence-based maintainer control plane for open-source JavaScript and TypeScript repositories. Its core commitment is **trust, transparency, and minimal data collection**.

---

## 2. Privacy Boundaries and Data Governance

### Public Repository Metadata Only
- WelcomeScore inspects only allowlisted, public repository metadata from GitHub (e.g. root documentation filenames, detected licenses, issue labels, commit shas, and package manifests).
- **Zero Source Code Storage**: WelcomeScore does not store, index, or retain private source code repositories.
- **Right to Be Forgotten**: The platform provides explicit deletion routines (`deleteRepoTimeline(repo)`) to allow maintainers to purge public historical audit records upon request.

### Zero Secrets in Client Bundles or Logs
- All elevated credentials (`SUPABASE_SERVICE_ROLE_KEY`, `GITHUB_TOKEN`, `GROQ_API_KEY`, `GEMINI_API_KEY`) reside exclusively in server-only runtime contexts (`process.env`).
- Never prefix sensitive credentials with `NEXT_PUBLIC_`.
- Server log outputs are sanitized; tokens and personal contact details are never logged or echoed to clients.

---

## 3. Database Security & Row Level Security (RLS)

All database tables in Supabase enforce Postgres Row Level Security (RLS) with explicit, least-privilege policies:

### `public.report_corrections`
- **Read**: Blocked from public and authenticated roles. Only `service_role` can view submissions. Maintainers cannot view other submitters' emails or notes.
- **Insert**: Public submission permitted through server-validated rate limits (5 submissions/hour/IP).
- **Update/Delete**: Strictly disabled.

### `public.repo_improvement_events`
- **Read**: Publicly readable (`SELECT true`) as it represents verified, public open-source project progress.
- **Insert**: Restricted strictly to `service_role` (server-side audit engine). Public users cannot forge timeline events.
- **Update/Delete**: Strictly disabled for public roles.

### `public.lounge_messages` & `lounge_reactions`
- Messages are auto-purged after 24 hours via pg_cron.
- Browser clients have insert-only capabilities with rate limits (1 message / 3 seconds).
- Quoted replies store bounded string snapshots to prevent persistent database bloating.

---

## 4. AI Provider Security & Non-Authoritative Guardrails

- **Deterministic Scoring Engine**: Numeric scores (0–100), letter grades (A–F), and evidence statuses are computed 100% deterministically by local TypeScript functions.
- **AI Never Modifies Scores**: Groq or Gemini models are never permitted to calculate, override, or silently manipulate scores or evidence check statuses.
- **Content Sanitization**: Repository content is strictly sanitized and length-capped before passing to providers. No secrets, cookies, or user identifiers are forwarded.
- **Fail-Safe Fallback**: If an AI provider call times out, encounters rate limits, or returns malformed output, the system seamlessly falls back to the deterministic local engine.

---

## 5. First-Party GitHub Action & CLI Security

### GitHub Action (`actions/welcomescore`)
- **Least Privilege**: Default permissions require only `contents: read`. PR commenting requires explicit opt-in with `pull-requests: write`.
- **Fork Safety**: In pull requests from public forks, write permissions are guarded to prevent token exposure.
- **Idempotent Comments**: Uses a unique HTML comment marker (`<!-- welcomescore-audit-comment -->`) to update a single bot comment instead of creating spam in pull request discussions.
- **No Automatic PRs or Issues**: The action never opens unsolicited PRs or issues.

### CLI (`@ethiorhq/welcomescore`)
- **Local Isolation**: Audits run entirely on the user's machine without transmitting code or environment variables to remote servers.
- **Non-Destructive Fix Mode**: `--fix` creates only missing, safe boilerplate files (e.g. basic `CONTRIBUTING.md` or `.github/ISSUE_TEMPLATE`). It never overwrites existing files, never modifies `package.json`, and never installs packages or executes shell scripts.
- **Dry-Run Preview**: `--fix --dry-run` previews all proposed changes without touching the disk.

---

## 6. Security Contact & Responsible Disclosure
Vulnerabilities should never be posted to public GitHub issues or community chat. Contact the maintainers privately according to the instructions in [`SECURITY.md`](../SECURITY.md).

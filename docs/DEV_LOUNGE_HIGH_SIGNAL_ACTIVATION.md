# Verified Dev Lounge Gateway Activation

This guide activates the **Priority 2 high-signal community upgrade** after the application release containing it has deployed successfully. Until these steps are completed, the Dev Lounge deliberately remains in its existing temporary-chat compatibility mode. No migration, setting, or test should create sample messages, reactions, reports, or Hall records.

> **The required sequence is deploy first, configure server-only values second, run the additive migration third, then verify read-only readiness.** Do not run the migration before the matching server routes are live.

## 1. Confirm the application release has deployed

Confirm the production deployment includes the following routes before changing Supabase:

| Route | Expected purpose |
|---|---|
| `/api/lounge/health` | Read-only readiness check. It never creates a message or rate event. |
| `/api/lounge/context/audit` | Explicit fresh-audit context preparation. It does not post a Lounge message. |
| `/api/lounge/context/hall` | Explicit Hall-pattern context preparation. It does not refresh or modify Hall data. |
| `/api/lounge/messages` | Server-validated temporary message submission. |
| `/api/lounge/reactions` | Server-validated one-reaction-per-session submission. |
| `/api/lounge/answers` | Question-author useful-answer mark and clear action. |
| `/api/lounge/reports` | Private reason-coded report submission. |

## 2. Configure server-only environment values

In the production deployment environment, confirm these variables are present for the application server. Apply them to **Production** and any Preview environments where you intend to test the verified Lounge.

| Variable | Required value | Exposure rule |
|---|---|---|
| `SUPABASE_URL` | Existing project Supabase URL | Server-only; never add a `NEXT_PUBLIC_` prefix. |
| `SUPABASE_SERVICE_ROLE_KEY` | Existing Supabase service-role key already used by Hall persistence | Server-only; never add a `NEXT_PUBLIC_` prefix or paste it into a browser. |
| `LOUNGE_CONTEXT_SIGNING_SECRET` | A newly generated long random secret | Server-only; never reuse a public key or expose it in client code. |

Generate the signing secret on your own trusted computer, then paste the output only into the deployment environment’s secret-value field:

```bash
openssl rand -base64 48
```

Do **not** put the generated output in `.env.example`, source files, Git history, the Lounge, screenshots, support messages, or issue reports. Redeploy after setting environment values so serverless functions receive them.

## 3. Apply the additive Supabase migration

Open the Supabase project SQL Editor and run the committed file exactly once:

```text
supabase/migrations/20260827_dev_lounge_high_signal.sql
```

The migration is idempotent and additive. It adds focused topics, parent links, verified public-context storage, idempotency, useful-answer marks, private reports, short-lived rate events, restrictive browser policies, read-only public policies, and retention cleanup jobs. It does not modify existing temporary Lounge content or any Hall entry.

The migration intentionally removes browser-side write grants only after the deployed server gateway exists. If the SQL Editor reports an error, stop there; do not partially rewrite policies by hand. Capture only the error code/message—never keys or secret values—and request assistance before retrying.

## 4. Verify readiness without creating community activity

After the migration is applied and the deployment has restarted, visit:

```text
https://welcomescore.vercel.app/api/lounge/health
```

The expected response is:

```json
{ "ready": true }
```

A `false` result means that the new environment values, message columns, or atomic rate function are not all available. In that state, do not test sending messages; resolve the configuration first.

Next, open the Dev Lounge. The information line should state:

> “Verified context and private safety reports are active. Every message is still your explicit choice.”

Verify only passive UI behavior at this stage: topic filter controls render, the composer offers the four focused topics, and no message appears solely from navigating, opening a badge dialog, loading Hall, or preparing a context.

## 5. Controlled live validation

Use a normal, clearly labelled test message only if you explicitly decide to create one. The test must be short, non-sensitive, and suitable for a 24-hour public temporary community. Do not create fake questions, answers, reactions, reports, Hall entries, or engagement merely to make the feature appear active.

| Check | Expected result |
|---|---|
| Opening `/lounge` | Read-only load; no new row, Hall refresh, GitHub request, or social action. |
| Preparing fresh audit context | Requires a named button click, performs one fresh public audit, returns no Lounge row, and displays a dated context only after success. |
| Preparing Hall context | Requires a named button click, reads an existing non-expired Hall entry, and never calls `/api/leaderboard/refresh`. |
| Sending | Requires topic, text, identity, and matching context where required. |
| Useful answer | Only the originating question’s anonymous session can mark one active direct reply. |
| Hide | Affects only the current browser and is reversible by clearing browser site data. |
| Report | Is private; it does not automatically remove a message or disclose content publicly. |
| Hall page | Loads ranking data without an automatic `POST` to a refresh endpoint. |

## 6. Operational handling

Private reports are intentionally not visible to public Lounge visitors. Initially, authorised ETHIOR operators can review them in the restricted Supabase dashboard. Treat every report as a signal to review context fairly, not proof of misconduct. Do not automate removal, accusations, or sanctions from report counts or keyword matching.

For a real security concern, direct the reporter to the project’s security process. Do not request credentials, proof-of-concept exploit detail, or private vulnerability information in the Lounge or report field.

## 7. Rollback

If the verified gateway needs to be paused after activation, do not re-grant browser writes casually. First investigate the server-side configuration and route logs without exposing secrets. Temporarily presenting the Lounge as unavailable is safer than allowing unvalidated anonymous direct writes. Any policy reversal should be a separate reviewed migration.

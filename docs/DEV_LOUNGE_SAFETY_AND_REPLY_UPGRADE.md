# Dev Lounge Safety, Replies, and Human-Verification Upgrade

## Purpose

This upgrade makes Dev Lounge replies navigable, preserves the anonymous and temporary nature of the community space, and adds layered safeguards against spam and abuse. It is deliberately designed as a community-safety feature rather than an engagement or reputation system.

## Interaction model

A reply stores an immutable, display-safe snapshot of its source message and a server-validated `parent_message_id`. The interface exposes the snapshot as a keyboard-accessible **Replying to @handle** control. Activating it follows this sequence:

1. It looks for the active source message in the current local message set.
2. If a topic filter excludes that source, it resets the filter to **All** and announces why.
3. It scrolls the Lounge message viewport to the source using smooth motion unless the visitor prefers reduced motion.
4. It moves focus to the source message, applies a brief accent highlight, and returns focus to the reply link when the highlight ends.
5. If the source expired or was moderated away, it explains that the temporary original is no longer available rather than fabricating a jump target.

Selecting **Reply** keeps the structural reply relationship and prepares a visual mention prefix such as `@PixelMaintainer `. The handle is plain text, is sanitized, does not identify a user, and does not create a notification, direct message, ranking, or account relationship.

## Layered protection model

| Layer | Decision | Data boundary |
|---|---|---|
| Server validation | Reject malformed identities, duplicate requests, secret-like content, repeated character floods, unsafe solicitation, and excessive URLs before a write. | Message content is processed only to decide whether the requested write is allowed. |
| First-party interaction proof | A short-lived signed proof is issued after the browser opens the Lounge, bound to the anonymous session, and requires a minimum dwell interval plus an empty honeypot field. | No raw IP address or browser fingerprint is persisted. |
| Network-aware rate limit | A server-generated salted network bucket constrains bursts without saving the original IP address. Session and network budgets are both enforced. | Only the salted, non-reversible bucket hash is stored temporarily. |
| Cloudflare Turnstile (optional, recommended) | When both required keys are configured, message and report submissions require a current Turnstile token that is validated server-side for the expected action and hostname. | The client receives only the public site key; the secret is never sent to the browser or Supabase. |
| Report review | A private report creates a structured moderation event. Existing configured server-side review providers may classify the reported public message into a constrained JSON decision. | Only the reported public message, report reason, and limited policy context are sent to the selected provider. No secrets, reporter identity, raw IP, or unrelated chat history is sent. |
| Enforcement | A deterministic block always prevents secrets and unsafe requests. AI can hide only high-confidence clear policy violations. Uncertain, provider-unavailable, or lower-confidence reports stay visible and are marked for owner review. | A private audit record stores the outcome, reason, confidence band, provider/model label, and timestamps; it does not duplicate message content. |

## AI moderation boundaries

The moderation request is event-driven when a visitor files a report. It is not a background polling process and does not automatically scan the Lounge. The server tries the configured Groq provider first and Gemini only as a fallback, using strict JSON output and short timeouts. The model may return only `allow`, `needs_review`, or `hide` with constrained policy categories and a confidence band.

Automatic hiding is restricted to a high-confidence `hide` decision for clear secrets, malicious or deceptive links, severe harassment or threats, explicit scam/solicitation, or other high-severity policy violations. A report alone never hides a message. When no provider is configured, a provider times out, the output fails validation, or the confidence is not high, the report is retained privately and the message remains visible. This avoids treating an AI prediction as an infallible judgment.

The Lounge does not provide personal accounts or private messages. A sender can request review or correction through the public project conduct process. Owners can inspect private structured moderation events through Supabase; these records are intentionally not exposed to browser clients.

## Database additions

The additive migration will:

- retain the existing message visibility values and add an index for moderation lookups;
- add `lounge_moderation_events`, readable only to the service role, with source-message reference, report reference, decision, policy category, confidence band, provider/model label, decision timestamp, expiry, and a unique report link;
- add a `moderation` action to short-lived `lounge_rate_events` so repeated reports cannot invoke provider reviews without limits;
- add a `lounge_network_bucket` action family to the rate-limit RPC constraint;
- maintain scheduled expiry of moderation metadata after the message/report operational window.

No migration seeds, edits, deletes, hides, unmasks, ranks, or reorders existing messages.

## Verification configuration

The integration supports two modes.

| Mode | Behaviour | Required configuration |
|---|---|---|
| Baseline protection | Signed interaction proof, honeypot, per-session and salted-network limits, and deterministic safety checks protect writes immediately. | `LOUNGE_CONTEXT_SIGNING_SECRET` plus `LOUNGE_ABUSE_SALT`. |
| Strong verification | Baseline protection plus Cloudflare Turnstile for every message and private report. The server rejects missing, expired, reused, wrong-action, or wrong-host tokens. | Baseline values plus `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`, and a comma-separated `TURNSTILE_ALLOWED_HOSTNAMES` list. |

The public site key is intentionally visible in browser source. `TURNSTILE_SECRET_KEY`, `LOUNGE_ABUSE_SALT`, AI provider keys, and all Supabase service-role credentials remain server-only. Cloudflare requires server-side Siteverify validation; rendering a widget without that validation is not treated as security.[1]

## Regression coverage

Tests will cover reply-target resolution and unavailable-source messaging, mention construction, signed proof validation and expiry, honeypot rejection, Turnstile action/hostname validation, moderation output validation, high-confidence hide enforcement, safe/uncertain no-hide behavior, and public-read exclusion for hidden messages.

## References

[1]: https://developers.cloudflare.com/turnstile/get-started/server-side-validation/ "Cloudflare Turnstile: server-side token validation"

## Turnstile implementation notes

Cloudflare’s current documentation states that client-side widget rendering is insufficient on its own: every token must be validated by the server through the Siteverify endpoint. Tokens are single-use and expire after five minutes. The server validation verifies the expected action and hostname against a comma-separated allowlist; it does not persist the raw visitor IP address. For this dynamic Lounge form, an explicit widget lifecycle is used so expired or failed tokens can be reset without reloading the chat.[1]

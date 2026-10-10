# PWA Security Review: WelcomeScore

**Status:** PASS

## 1. Secret Isolation
- **Verified:** Core library modules (`scoreRepo.ts`, `loungeGateway.ts`, `github.ts`) use the `server-only` package to prevent accidental client-side import of environment variables.
- **Verified:** Only `NEXT_PUBLIC_` prefixed variables are accessible to the client.

## 2. Service Worker Security
- **Data Leakage:** The Service Worker (`sw.js`) is configured to *never* cache `/api/` responses. This prevents private user data, Supabase session fragments, or authenticated GitHub responses from being stored in the browser's Cache Storage.
- **CSRF & Verification:** Service worker interception does not bypass existing CSRF protections, signed interaction proofs, or Turnstile verification.

## 3. UI Integrity
- **Install Hijacking:** The `InstallAppButton.tsx` only triggers the `prompt()` method in response to a direct user action (click), preventing automated "nagging" or clickjacking.
- **XSS Prevention:** All dynamic content in the Lounge and Audit routes continues to use React's default escaping. Image avatars in the lounge now use the `next/image` component for better optimization and security.

## 4. Input & Rate Limiting
- **Tap-Race Prevention:** Primary buttons (Audit Check, Lounge Send) include `disabled` states while processing to prevent duplicate submissions or server-side race conditions.
- **Rate Limiting:** Server-side rate limits for audits and lounge messages remain active and are not affected by PWA caching.

## 5. Offline Integrity
- **False Claims:** The app does not claim to support "Offline Audit". If the network is down, the UI gracefully informs the user that a connection is required for new scans.
- **Local Storage:** Contributor notes are stored in `localStorage` and are not synced to the PWA cache, maintaining standard browser isolation.

# PWA Caching and Offline Boundary: WelcomeScore

This document defines the boundaries between offline-available features and those requiring a live network connection.

## 1. Offline-Available Features (Cached Shell)
The following assets are cached using the Service Worker (v2) to provide an instant loading experience:
- **Core UI:** The "App Shell" (HTML, CSS, and JavaScript) for all primary routes.
- **Branding Assets:** Icons, fonts, and the Algofox spritesheet.
- **Static Content:** Privacy policy, terms, and guides.
- **Local Data:** Contributor notes and workspace state (stored in `localStorage`).

## 2. Online-Only Features (Network Required)
The following features require an active internet connection and are explicitly excluded from the Service Worker cache:
- **GitHub Audit:** Fetching repository signals, checks, and scores via the `/api/score` endpoint.
- **JavaScript Health Dashboard:** Real-time analysis of repository metadata.
- **Dev Lounge:** Joining the chat, sending messages, and seeing live reactions.
- **Hall of Fame:** Refreshing the leaderboard or adding new entries.
- **AI Reviews:** Generating Algofox reviews via external AI providers (Groq/Gemini).
- **Share Receipts:** Cryptographic verification of shared scores.

## 3. Caching Strategy
- **Pages:** Network-First. If a network request fails (offline), the app serves the cached version of the page shell.
- **Static Assets:** Stale-While-Revalidate. Loads from cache immediately while updating in the background.
- **API Exclusions:** All requests to `/api/*` and external database/AI hosts are strictly bypassed to ensure data integrity and security.

## 4. Cache Invalidation & Rollback
- **Versioning:** Current cache version is `welcomescore-cache-v2`.
- **Update Cycle:** A new Service Worker is registered on every site update. The `activate` event automatically purges stale caches from previous versions.
- **Rollback:** In the event of a corrupt cache, the Service Worker can be unregistered via the browser's developer tools, or a version bump in `sw.js` will force a refresh for all users.

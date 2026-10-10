# PWA Architecture: WelcomeScore

This document outlines the architectural decisions made to transform WelcomeScore into a high-quality Progressive Web App (PWA).

## 1. Hybrid App Shell
WelcomeScore uses Next.js (App Router) to deliver a hybrid experience.
- **Server-Side Rendering (SSR):** Initial page loads and dynamic badge generation.
- **Client-Side Navigation:** Smooth transitions between Audit, Compare, and Lounge views.
- **Offline Shell:** The Service Worker caches the core HTML, CSS, and JS to ensure the app UI loads instantly even without a network.

## 2. Service Worker Strategy (v2)
Implemented in `public/sw.js`, the service worker uses a tiered caching strategy:
- **Network-First (Pages):** Prioritizes fresh data for scores and community discussions. Falls back to cache if the user is offline.
- **Stale-While-Revalidate (Static Assets):** Provides instant loading for scripts, styles, and optimized images (like the Algofox spritesheet).
- **Hardened Boundary:** Explicitly ignores all `/api/*` routes and third-party database/AI endpoints to prevent caching sensitive or stale dynamic data.

## 3. Storage & Privacy
- **Zero-Auth Local Persistence:** User-specific data (Contributor Workspaces, Private Notes) is stored in `localStorage`.
- **Privacy First:** No private contributor data is sent to the server unless explicitly shared by the user (e.g., via the Share with Purpose flow).
- **Sanitization:** All stored data is treated as untrusted and rendered through React's escaping mechanism.

## 4. Mobile Ergonomics
- **Responsive Layout:** Tailwind-based grid and flex layouts that adapt from ultra-wide monitors to narrow mobile screens.
- **Touch-First Interactions:** 
  - 44px minimum tap targets.
  - Active `disabled` states during async operations to prevent "tap-race" conditions common on mobile networks.
  - `inputMode="search"` for optimized virtual keyboards on repository lookups.

## 5. Metadata & Identity
- **Dynamic Manifest:** `app/manifest.ts` generates the Web Manifest, defining the standalone display mode and theme colors.
- **Dynamic Assets:** `app/icon.tsx` and `app/apple-icon.tsx` use Next.js ImageResponse to generate compliant icons for various platforms (Android, iOS, Web).

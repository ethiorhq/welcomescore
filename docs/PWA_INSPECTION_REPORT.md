# PWA Inspection Report: WelcomeScore

**Date:** October 2023
**Inspector:** Maintainer Agent
**Status:** Pass (with minor lint warnings)

## 1. Project Audit
- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS
- **Branding:** Dark mode aesthetic (#12141C base, #E8A23D accent)
- **Current Production Domain:** `https://welcomescore.vercel.app`
- **Future Canonical Domain:** `https://welcomescore.js.org` (Pending DNS)

## 2. Existing PWA Features
- **Manifest:** `app/manifest.ts` exists.
- **Service Worker:** `public/sw.js` (v2) implemented with Network-First strategy for pages.
- **Icons:** `app/icon.tsx` and `app/apple-icon.tsx` generate dynamic branding icons.
- **Metadata:** `app/layout.tsx` contains basic viewport and theme color metadata.
- **Install Flow:** `app/components/PwaRegister.tsx` handles basic SW registration and a simple install prompt.

## 3. Missing or Suboptimal Features
- **Manifest Scope:** `scope: "/"` needs explicit definition (Fixed).
- **Install UI:** The current `PwaRegister.tsx` uses a fixed bottom bar. A more integrated "Install App" button/card on the homepage is requested.
- **Safe Area Support:** `globals.css` has basic safe-area padding, but specific layout components need verification.
- **Offline Boundary Documentation:** Need dedicated `docs/PWA_CACHING_AND_OFFLINE_BOUNDARY.md`.
- **Keyboard Optimization:** `inputMode="search"` is implemented but needs testing for "sticky" element interference.

## 4. Planned Changes
- **Hardening `app/manifest.ts`**: Ensure all metadata (categories, scope) matches Android PWA requirements.
- **New Component `InstallAppButton.tsx`**: A restrained, accessible install action for the homepage.
- **CSS Refinement**: Ensure no horizontal overflow at 320px and safe-area compatibility.
- **Lint Fixes**: Resolve `useEffect` dependency in `AuditHome.tsx` and `<img>` tags in `lounge/page.tsx`.

## 5. Risks
- **Service Worker Stale Data**: Mitigation through Network-First strategy and explicit API exclusion.
- **iOS Standalone Detection**: Using `window.navigator.standalone` as a fallback for the install UI.

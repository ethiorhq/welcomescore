# PWA Implementation Details: WelcomeScore

## 1. Core Manifest
The PWA manifest is served dynamically via `app/manifest.ts`. 
- **Display Mode:** `standalone` ensures a native-like experience without browser chrome.
- **Scope:** Explicitly set to `/` to cover all application routes.
- **Theme Color:** Locked to `#12141C` for seamless transition from the Android splash screen.

## 2. Dynamic Icon System
Instead of static files, we use Next.js `ImageResponse` in `app/icon.tsx` to generate branding-compliant icons:
- **Small (32x32):** Favicon usage.
- **Medium (192x192):** Android home screen.
- **Large (512x512):** Splash screens.
- **Maskable:** Includes a 10% safe-area padding for Android adaptive icons.

## 3. Installation Experience
- **Logic:** Handled by `InstallAppButton.tsx`.
- **Trigger:** Listens for the `beforeinstallprompt` event.
- **Fallback:** If the browser doesn't support the native prompt (e.g., iOS or some Android browsers), it shows a subtle text-based tip on how to manually "Add to Home screen".
- **Dismissal:** Respects user choice and doesn't nag; the prompt state is kept local to the component session.

## 4. Service Worker (sw.js)
- **Strategy:** Network-First. This ensures users always see the latest repository scores and lounge messages while having a cached shell for instant subsequent loads.
- **Isolation:** The service worker explicitly ignores `/api/` calls to ensure that dynamic data (scores, moderation, chat) is never served stale or insecurely.

## 5. Mobile Adjustments
- **Safe Areas:** Utilizes `env(safe-area-inset-bottom)` in the main layout to prevent the Android navigation bar or iOS home bar from obscuring content.
- **Tap Targets:** Buttons and links are sized to at least 44px where possible to meet ergonomic standards.
- **Overflow:** The root container uses `overflow-x-hidden` and balanced text wrapping to prevent horizontal scrolling on narrow devices (320px+).

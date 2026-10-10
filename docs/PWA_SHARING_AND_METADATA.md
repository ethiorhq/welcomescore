# PWA Sharing and Metadata: WelcomeScore

This document details the metadata and sharing strategies implemented to ensure WelcomeScore is social-ready and provides a native-like experience when installed.

## 1. Social Metadata (Open Graph & Twitter)
We use Next.js `Metadata` API to provide rich social previews.
- **Canonical URLs:** Managed via `metadataBase: new URL(SITE_URL)` in `layout.tsx`.
- **Dynamic OG Images:**
  - **Home:** `app/opengraph-image.tsx` provides the primary brand preview.
  - **Guides:** `app/guides/[slug]/opengraph-image.tsx` generates specific previews for each guide.
  - **Receipts:** `app/share/receipt/[token]/opengraph-image.tsx` generates a dynamic image showing the specific audit score and passed checks for social sharing.
- **Twitter Cards:** Set to `summary_large_image` to maximize visual impact.

## 2. PWA Branding & Identity
Identity is maintained through a combination of static and dynamic assets:
- **Web Manifest:** Defines `short_name`, `theme_color`, and `background_color` to match the "Dark Mode" aesthetic.
- **Dynamic Icons:** `app/icon.tsx` ensures icons are crisp at 192px and 512px.
- **Maskable Icons:** Specified in the manifest to support varied Android launcher shapes without clipping the "W" logo.
- **Apple Touch Icon:** `app/apple-icon.tsx` provides a 180x180 PNG specifically for iOS/Safari "Add to Home Screen".

## 3. Share with Purpose (Web Share API)
The "Share with Purpose" feature (`app/components/ShareWithPurposeModal.tsx`) leverages the native Web Share API where available:
- **Fallback:** If `navigator.share` is unavailable, the app falls back to a custom clipboard copy interaction.
- **Content:** Shares the repository name, the WelcomeScore, and a secure, signed receipt URL.
- **Verification:** The shared link leads to a verification page that uses cryptographic signing to prove the audit results haven't been tampered with.

## 4. Robots & Search
- **Sitemap:** Dynamically generated at `/sitemap.xml`.
- **Robots.txt:** Configured at `/robots.txt`.
- **AI Crawling:** `llms.txt` provided in the public directory to guide LLM-based crawlers and search engines.

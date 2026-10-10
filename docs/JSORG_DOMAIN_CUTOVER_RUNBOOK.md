# JS.ORG Domain Cutover Runbook: WelcomeScore

This runbook details the steps to migrate the production environment from `welcomescore.vercel.app` to the canonical `welcomescore.js.org` domain.

## 1. Pre-Cutover Checks
- [ ] **JS.ORG PR Status:** Verify that the pull request at `github.com/js-org/js.org` has been merged.
- [ ] **DNS Propagation:** Ensure DNS records for `welcomescore.js.org` are resolving to Vercel's edge network.
- [ ] **Backup:** Note the current stable Vercel deployment ID for immediate rollback if needed.

## 2. Vercel Domain Configuration
1.  Go to **Vercel Dashboard > Project Settings > Domains**.
2.  Add `welcomescore.js.org`.
3.  Wait for Vercel to verify the domain and issue an SSL certificate.
4.  Set `welcomescore.js.org` as the **Primary Domain**.
5.  Ensure `welcomescore.vercel.app` is set to redirect to the new primary domain.

## 3. Environment Variable Updates
Update the following environment variables in the Vercel Dashboard:
- `NEXT_PUBLIC_SITE_URL`: Change from `https://welcomescore.vercel.app` to `https://welcomescore.js.org`.
- `SITE_URL` (if separate): Change to `https://welcomescore.js.org`.
- **Note:** Trigger a new deployment for these changes to take effect.

## 4. Code Changes (Post-DNS Activation)
Once the domain is active, update the following in the codebase:
- `lib/site.ts`: Update the `SITE_URL` fallback.
- `app/layout.tsx`: Verify `metadataBase` picks up the updated `SITE_URL`.

## 5. Verification (Smoke Tests)
- [ ] **SSL:** Verify HTTPS works at `https://welcomescore.js.org`.
- [ ] **Canonical Tags:** Inspect `<link rel="canonical">` on the home page and audit pages.
- [ ] **Open Graph:** Use the [LinkedIn/Facebook Debugger](https://developers.facebook.com/tools/debug/) to verify OG images load from the new domain.
- [ ] **Service Worker:** Verify `sw.js` is served from the new domain and registers correctly.
- [ ] **Manifest:** Verify `/manifest.webmanifest` returns the correct identity.
- [ ] **Badges:** Check if existing badges (embedded on other sites) still resolve (they should via Vercel's redirect).
- [ ] **Sitemap/Robots:** Verify `sitemap.xml` and `robots.txt` use the new absolute URLs.
- [ ] **llms.txt:** Verify accessibility at `https://welcomescore.js.org/llms.txt`.

## 6. Search Engine & Social Update
- [ ] Update GitHub repository URL in the "About" section.
- [ ] Update social media profiles (Twitter, LinkedIn).
- [ ] Submit the new sitemap to Google Search Console.

## 7. Rollback Plan
If critical issues occur (e.g., SSL failure, broken redirects):
1.  In Vercel Domains, set `welcomescore.vercel.app` back to the Primary Domain.
2.  Revert the `NEXT_PUBLIC_SITE_URL` environment variable.
3.  Redeploy the previous stable build.
4.  Investigate DNS/SSL issues before attempting cutover again.

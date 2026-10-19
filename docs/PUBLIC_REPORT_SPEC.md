# WelcomeScore Public Report Specification

## 1. Purpose

The Public Report page (`/report/[owner]/[repo]`) is the primary public URL generated when an audit is executed by maintainers, GitHub Actions, or CLI users. It presents an evidence-backed evaluation of repository contributor readiness and highlights a single Next Useful Move.

---

## 2. Information Architecture

1. **Header & Navigation:**
   - Wordmark `WelcomeScore .js.org`
   - Breadcrumb navigation (`← Audits / owner / repo`)
2. **Freshness Banner (`<ReportFreshness />`):**
   - Exact audit timestamp (e.g. `Oct 20, 2026 at 01:30 AM UTC`)
   - Relative freshness label (`just now`, `5 minutes ago`)
   - Explicit disclaimer: "Point-in-time public audit · Not a continuous certification"
   - Recheck trigger button
3. **Repository Summary:**
   - Full repository name (`owner/repo`)
   - GitHub repository link
   - Default branch and analyzed commit SHA (first 7 characters)
   - Large numeric score (0–100) and letter grade (A, B, C, D, F)
   - Coverage breakdown: observed checks, possible checks, percentage
4. **Signature Feature: Next Useful Move:**
   - Move title and effort band (`small`, `medium`, `large`)
   - "Why it matters" impact explanation
   - Acceptance criteria checklist
   - Modal trigger for copyable GitHub Issue Draft
   - Modal trigger for Patch Plan preview
5. **Evidence Breakdown (`<EvidencePanel />`):**
   - Categorized by `Documentation`, `Governance`, `Contributor Path`, `Activity`
   - Status indicators (`pass`, `partial`, `missing`, `unknown`)
   - Points awarded vs max points
   - Direct links to source files on GitHub
   - "Report an incorrect signal" trigger
6. **Starter Issues:**
   - Direct list of open newcomer issues on GitHub
7. **Maintainer Workflows & Embedding:**
   - Local CLI snippet (`npx @ethiorhq/welcomescore`)
   - GitHub Action YAML snippet
   - README Markdown Badge snippet
8. **Methodology & Limitations:**
   - Explicit boundary note: not a security audit, quality certification, legal opinion, or popularity ranking.
9. **Global Footer (`<SiteFooter />`):**
   - Links to guides, FAQ, how it works, policies, and original project attribution.

---

## 3. Responsive Breakpoints

- **Mobile (320px–480px):** Single-column layout, wrapped badges, score stacked, scrollable code blocks, touch-friendly buttons (`min-h-[44px]`).
- **Tablet (640px–768px):** Two-column metrics and action blocks.
- **Desktop (1024px+):** Max-width 1152px (`max-w-6xl`), side-by-side header cards, comfortable reading measure.

---

## 4. API Endpoint Integration

The page is backed by `GET /api/report?repo=owner/repo`, which returns the standard `WelcomeScoreReport` (Schema version `1.0`).
Cache header: `Cache-Control: public, s-maxage=300, stale-while-revalidate=86400`.
Fresh audits bypass the cache using `&fresh=true`.

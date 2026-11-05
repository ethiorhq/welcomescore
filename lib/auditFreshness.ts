/**
 * Single source of truth for audit freshness and caching.
 *
 * Issue #1: the README and How It Works page must describe, accurately and
 * consistently, when a visitor sees current public GitHub data and when a
 * bounded cache may apply. Those docs must not drift from the code, so every
 * cache lifetime and `Cache-Control` header below is imported by the routes
 * and engines that actually use it — never re-typed as a literal.
 *
 * Verified against the implementation (2026-11-06):
 * - Direct audits (`GET /api/score`, homepage Check, Compare) call
 *   `scoreRepo(..., { fresh: true })`, which uses `cache: "no-store"` for
 *   GitHub fetches, and the route itself returns
 *   `Cache-Control: no-store, max-age=0`.
 * - All other server-side scoring uses the default GitHub fetch cache:
 *   `next: { revalidate: 300 }` — 5 minutes.
 * - SVG badges (`badgeResponse` in `lib/badgeEngine.ts`) return
 *   `public, max-age=0, s-maxage=300, stale-while-revalidate=86400`.
 *   A CDN may therefore serve a badge for up to 24 hours while it
 *   revalidates in the background, even though the underlying GitHub data
 *   is at most 5 minutes old at fetch time.
 * - The PNG badge (`GET /api/badge`) is the one exception: its
 *   `stale-while-revalidate` is 300 seconds, not 86400.
 * - Shareable reports (`GET /api/report`, `/report/[owner]/[repo]`) use
 *   the 5-minute GitHub fetch cache and return
 *   `public, s-maxage=300, stale-while-revalidate=86400`.
 *
 * Nothing here changes a scoring weight, an API behaviour, a cache
 * lifetime, or a visual design. Changing a value here intentionally
 * changes both the behaviour and the documented claim together, and
 * `lib/auditFreshness.test.ts` fails if the docs stop matching it.
 */

export const GITHUB_DATA_CACHE_SECONDS = 300;
export const GITHUB_DATA_CACHE_MINUTES = GITHUB_DATA_CACHE_SECONDS / 60;

export const DIRECT_AUDIT_CACHE_CONTROL = "no-store, max-age=0";

export const BADGE_SVG_CACHE_CONTROL =
  "public, max-age=0, s-maxage=300, stale-while-revalidate=86400";
export const BADGE_PNG_CACHE_CONTROL =
  "public, max-age=0, s-maxage=300, stale-while-revalidate=300";
export const SHAREABLE_REPORT_CACHE_CONTROL =
  "public, s-maxage=300, stale-while-revalidate=86400";

export const BADGE_SVG_STALE_WHILE_REVALIDATE_SECONDS = 86400;
export const BADGE_PNG_STALE_WHILE_REVALIDATE_SECONDS = 300;
export const SHAREABLE_REPORT_STALE_WHILE_REVALIDATE_SECONDS = 86400;

export type AuditSurface =
  | "direct-audit"
  | "shareable-report"
  | "badge-svg"
  | "badge-png";

export type AuditFreshness = {
  surface: AuditSurface;
  /** Plain-language label used in the README and How It Works. */
  label: string;
  /** What the visitor triggers. */
  triggeredBy: string;
  /** Is the GitHub data fetched fresh for this request? */
  githubDataFresh: boolean;
  /** How old the GitHub data can be when it is fetched. */
  githubDataMaxAgeSeconds: number;
  /** The exact response `Cache-Control` header, when one is set. */
  responseCacheControl: string;
  /** One accurate, non-technical sentence for docs and UI copy. */
  plainLanguage: string;
};

export const AUDIT_FRESHNESS: Record<AuditSurface, AuditFreshness> = {
  "direct-audit": {
    surface: "direct-audit",
    label: "Direct audit",
    triggeredBy: "Pressing Check on the homepage or Compare",
    githubDataFresh: true,
    githubDataMaxAgeSeconds: 0,
    responseCacheControl: DIRECT_AUDIT_CACHE_CONTROL,
    plainLanguage:
      "A direct audit requests current public GitHub data for that check and is not served from a cache.",
  },
  "shareable-report": {
    surface: "shareable-report",
    label: "Shareable report",
    triggeredBy: "Opening /report/owner/repo or GET /api/report",
    githubDataFresh: false,
    githubDataMaxAgeSeconds: GITHUB_DATA_CACHE_SECONDS,
    responseCacheControl: SHAREABLE_REPORT_CACHE_CONTROL,
    plainLanguage:
      "A shareable report may use public GitHub data cached for up to 5 minutes, and a cached copy may be served for up to 24 hours while a fresh copy is prepared in the background.",
  },
  "badge-svg": {
    surface: "badge-svg",
    label: "SVG badge",
    triggeredBy: "Embedding GET /api/badge/owner/repo or /badge/owner/repo.svg in a README",
    githubDataFresh: false,
    githubDataMaxAgeSeconds: GITHUB_DATA_CACHE_SECONDS,
    responseCacheControl: BADGE_SVG_CACHE_CONTROL,
    plainLanguage:
      "An SVG badge may use public GitHub data cached for up to 5 minutes, and a cached badge image may be served for up to 24 hours while a fresh copy is prepared in the background.",
  },
  "badge-png": {
    surface: "badge-png",
    label: "PNG badge",
    triggeredBy: "Embedding GET /api/badge?repo=owner/repo in a README",
    githubDataFresh: false,
    githubDataMaxAgeSeconds: GITHUB_DATA_CACHE_SECONDS,
    responseCacheControl: BADGE_PNG_CACHE_CONTROL,
    plainLanguage:
      "A PNG badge may use public GitHub data cached for up to 5 minutes, and a cached badge image may be served for up to 5 minutes while a fresh copy is prepared in the background.",
  },
};

export function describeAuditFreshness(surface: AuditSurface): AuditFreshness {
  return AUDIT_FRESHNESS[surface];
}

/** Parse the `s-maxage` and `stale-while-revalidate` values out of a header. */
export function parseCacheControl(header: string): {
  sMaxAgeSeconds: number | null;
  staleWhileRevalidateSeconds: number | null;
  noStore: boolean;
} {
  const sMaxAge = header.match(/s-maxage=(\d+)/);
  const staleWhileRevalidate = header.match(/stale-while-revalidate=(\d+)/);
  return {
    sMaxAgeSeconds: sMaxAge ? Number(sMaxAge[1]) : null,
    staleWhileRevalidateSeconds: staleWhileRevalidate
      ? Number(staleWhileRevalidate[1])
      : null,
    noStore: /(^|,\s*)no-store\b/.test(header),
  };
}

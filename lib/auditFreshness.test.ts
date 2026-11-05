import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  AUDIT_FRESHNESS,
  BADGE_PNG_CACHE_CONTROL,
  BADGE_SVG_CACHE_CONTROL,
  DIRECT_AUDIT_CACHE_CONTROL,
  GITHUB_DATA_CACHE_SECONDS,
  SHAREABLE_REPORT_CACHE_CONTROL,
  describeAuditFreshness,
  parseCacheControl,
} from "./auditFreshness";

const repoRoot = process.cwd();

function readRepoFile(relativePath: string): string {
  return readFileSync(path.join(repoRoot, relativePath), "utf8");
}

describe("auditFreshness — single source of truth (Issue #1)", () => {
  it("uses a 5-minute GitHub data cache for every non-direct surface", () => {
    expect(GITHUB_DATA_CACHE_SECONDS).toBe(300);
    expect(GITHUB_DATA_CACHE_SECONDS / 60).toBe(5);
    for (const surface of ["shareable-report", "badge-svg", "badge-png"] as const) {
      expect(AUDIT_FRESHNESS[surface].githubDataMaxAgeSeconds).toBe(300);
      expect(AUDIT_FRESHNESS[surface].githubDataFresh).toBe(false);
    }
  });

  it("marks only direct audits as fresh, with a no-store response", () => {
    const direct = describeAuditFreshness("direct-audit");
    expect(direct.githubDataFresh).toBe(true);
    expect(direct.githubDataMaxAgeSeconds).toBe(0);
    expect(direct.responseCacheControl).toBe("no-store, max-age=0");
    expect(parseCacheControl(DIRECT_AUDIT_CACHE_CONTROL).noStore).toBe(true);
  });

  it("keeps the SVG and PNG badge caches distinct — SVG may serve stale for 24 hours, PNG for 5 minutes", () => {
    expect(parseCacheControl(BADGE_SVG_CACHE_CONTROL)).toEqual({
      sMaxAgeSeconds: 300,
      staleWhileRevalidateSeconds: 86400,
      noStore: false,
    });
    expect(parseCacheControl(BADGE_PNG_CACHE_CONTROL)).toEqual({
      sMaxAgeSeconds: 300,
      staleWhileRevalidateSeconds: 300,
      noStore: false,
    });
    expect(BADGE_SVG_CACHE_CONTROL).not.toBe(BADGE_PNG_CACHE_CONTROL);
  });

  it("keeps the shareable report cache at 5 minutes, with 24-hour stale-while-revalidate", () => {
    expect(parseCacheControl(SHAREABLE_REPORT_CACHE_CONTROL)).toEqual({
      sMaxAgeSeconds: 300,
      staleWhileRevalidateSeconds: 86400,
      noStore: false,
    });
  });

  it("gives every surface one plain-language sentence that never promises real-time data", () => {
    for (const freshness of Object.values(AUDIT_FRESHNESS)) {
      expect(freshness.plainLanguage.length).toBeGreaterThan(20);
      expect(freshness.plainLanguage.toLowerCase()).not.toContain("real-time");
      expect(freshness.plainLanguage.toLowerCase()).not.toContain("realtime");
      expect(freshness.plainLanguage.toLowerCase()).not.toContain("live");
      expect(freshness.plainLanguage.toLowerCase()).not.toContain("guarantee");
    }
    // Only the direct audit may claim current data.
    expect(AUDIT_FRESHNESS["badge-svg"].plainLanguage).toContain("up to 5 minutes");
    expect(AUDIT_FRESHNESS["badge-svg"].plainLanguage).toContain("up to 24 hours");
    expect(AUDIT_FRESHNESS["badge-png"].plainLanguage).toContain("up to 5 minutes");
  });

  it("keeps the code using the shared constants, not re-typed literals", () => {
    const scoreRepo = readRepoFile("lib/scoreRepo.ts");
    expect(scoreRepo).toContain("GITHUB_DATA_CACHE_SECONDS");
    expect(scoreRepo).not.toMatch(/revalidate:\s*300/);

    const badgeEngine = readRepoFile("lib/badgeEngine.ts");
    expect(badgeEngine).toContain("BADGE_SVG_CACHE_CONTROL");
    expect(badgeEngine).not.toContain("stale-while-revalidate=86400");

    const scoreRoute = readRepoFile("app/api/score/route.ts");
    expect(scoreRoute).toContain("DIRECT_AUDIT_CACHE_CONTROL");
    expect(scoreRoute).toContain("fresh: true");

    const badgePngRoute = readRepoFile("app/api/badge/route.tsx");
    expect(badgePngRoute).toContain("BADGE_PNG_CACHE_CONTROL");

    const reportRoute = readRepoFile("app/api/report/route.ts");
    expect(reportRoute).toContain("SHAREABLE_REPORT_CACHE_CONTROL");
  });
});

describe("auditFreshness — docs drift guard (Issue #1)", () => {
  it("describes the direct-audit vs badge-cache difference consistently in the README and How It Works", () => {
    const readme = readRepoFile("README.md");
    const howItWorks = readRepoFile("app/how-it-works/page.tsx");

    for (const doc of [readme, howItWorks]) {
      // Both docs must name the two behaviours, not just one.
      expect(doc).toContain("Direct audit");
      expect(doc).toContain("badge");
      // The 5-minute GitHub-data cache must be stated in the same words.
      expect(doc).toContain("5 minutes");
      // The 24-hour stale badge/report window must be stated, so a reader
      // is not surprised when an embedded badge lags a direct audit.
      expect(doc).toContain("24 hours");
      // Neither doc may promise real-time GitHub indexing — the only
      // allowed mention is the explicit negation below.
      expect(doc).toContain("does not promise real-time GitHub indexing");
      expect(doc.toLowerCase()).not.toContain("provides real-time github");
      expect(doc.toLowerCase()).not.toContain("offers real-time github");
    }

    // The README must correct the old claim that badges recalculate from
    // "the same cached scoring pipeline used by the audit API" — the audit
    // API is fresh, badges are cached.
    expect(readme).not.toContain("same cached scoring pipeline used by the audit API");
  });
});

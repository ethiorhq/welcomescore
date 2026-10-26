import { absoluteUrl, ETHIOR_URL, SITE_DISPLAY_NAME, SITE_URL } from "./site";
import type { WelcomeScoreReport } from "./report/types";
import type { DevOpsDoctorReport } from "./devops/doctor";

/**
 * Clean string for JSON-LD script insertion
 */
export function stringifyJsonLd(data: object): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

/**
 * BreadcrumbList Schema for Google Search Rich Results
 */
export function generateBreadcrumbLd(
  items: Array<{ name: string; path: string }>,
  baseUrl = SITE_URL,
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: new URL(item.path, baseUrl).toString(),
    })),
  };
}

/**
 * SoftwareApplication Schema for Web Tools
 */
export function generateToolSoftwareLd(
  name: string,
  path: string,
  description: string,
  category = "DeveloperApplication",
) {
  const url = absoluteUrl(path);
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name,
    url,
    applicationCategory: category,
    operatingSystem: "Cloud, Edge, Web-based",
    description,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    publisher: {
      "@type": "Organization",
      name: "ETHIOR",
      url: ETHIOR_URL,
    },
  };
}

/**
 * TechArticle & AuditReport Schema for Public Repository Audits
 */
export function generateAuditReportLd(
  owner: string,
  repo: string,
  report: WelcomeScoreReport,
) {
  const fullName = `${owner}/${repo}`;
  const reportUrl = absoluteUrl(`/report/${owner}/${repo}`);

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "TechArticle",
        "@id": `${reportUrl}/#article`,
        headline: `${fullName} Contributor Readiness & Repository Health Audit`,
        description: `Deterministic contributor readiness score: ${report.score}/100 (Grade ${report.grade}). Evaluates CONTRIBUTING.md, Code of Conduct, README setup, license, and mentorship signals for ${fullName}.`,
        url: reportUrl,
        datePublished: report.analyzedAt,
        dateModified: report.analyzedAt,
        author: {
          "@type": "Organization",
          name: "ETHIOR",
          url: ETHIOR_URL,
        },
        publisher: {
          "@type": "Organization",
          name: SITE_DISPLAY_NAME,
          url: SITE_URL,
          logo: {
            "@type": "ImageObject",
            url: absoluteUrl("/favicon.ico"),
          },
        },
        about: {
          "@type": "SoftwareSourceCode",
          name: fullName,
          codeRepository: `https://github.com/${fullName}`,
        },
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${reportUrl}/#audit`,
        name: `${fullName} WelcomeScore Audit`,
        url: reportUrl,
        applicationCategory: "DeveloperApplication",
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: report.score,
          bestRating: 100,
          worstRating: 0,
          ratingCount: report.checks.length || 5,
        },
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
      },
      generateBreadcrumbLd([
        { name: "Home", path: "/" },
        { name: "Audits", path: "/" },
        { name: fullName, path: `/report/${owner}/${repo}` },
      ]),
    ],
  };
}

/**
 * DevOps Doctor Audit Schema
 */
export function generateDevOpsAuditLd(
  owner: string,
  repo: string,
  report?: DevOpsDoctorReport,
) {
  const fullName = `${owner}/${repo}`;
  const pageUrl = absoluteUrl(`/devops/${owner}/${repo}`);

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "TechArticle",
        "@id": `${pageUrl}/#article`,
        headline: `${fullName} GitHub Actions DevOps CI/CD & License Audit`,
        description: `Automated diagnostic profiler for ${fullName}. Scored ${report?.score ?? 85}/100. Evaluates GitHub Actions runner compute efficiency, dependency caching, supply-chain pin risks, and copyleft licenses.`,
        url: pageUrl,
        datePublished: new Date().toISOString(),
        author: {
          "@type": "Organization",
          name: "ETHIOR",
          url: ETHIOR_URL,
        },
        about: {
          "@type": "SoftwareSourceCode",
          name: fullName,
          codeRepository: `https://github.com/${fullName}`,
        },
      },
      generateBreadcrumbLd([
        { name: "Home", path: "/" },
        { name: "DevOps Doctor", path: "/devops" },
        { name: fullName, path: `/devops/${owner}/${repo}` },
      ]),
    ],
  };
}

/**
 * Multi-Repo Fleet Cockpit Schema
 */
export function generateOrgFleetLd(org: string) {
  const pageUrl = absoluteUrl(`/org/${org}`);

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${pageUrl}/#fleet`,
        name: `@${org} GitHub Organization Fleet Health Radar`,
        description: `Unified contributor readiness, stale repository drift monitoring, and license compliance across public repositories in @${org}.`,
        url: pageUrl,
        publisher: {
          "@type": "Organization",
          name: "ETHIOR",
          url: ETHIOR_URL,
        },
      },
      generateBreadcrumbLd([
        { name: "Home", path: "/" },
        { name: "Fleet Cockpit", path: "/org" },
        { name: `@${org}`, path: `/org/${org}` },
      ]),
    ],
  };
}

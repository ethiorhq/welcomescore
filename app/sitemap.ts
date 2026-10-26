import type { MetadataRoute } from "next";
import { GUIDES } from "@/lib/guides";
import { absoluteUrl, PUBLIC_ROUTE_PATHS } from "@/lib/site";

const CONTENT_UPDATED_AT = new Date("2026-10-26T00:00:00.000Z");

// Benchmark open-source ecosystems for programmatic audit indexation
const FEATURED_REPOSITORIES = [
  "ethiorhq/welcomescore",
  "facebook/react",
  "vercel/next.js",
  "tailwindlabs/tailwindcss",
  "expressjs/express",
  "microsoft/vscode",
  "nodejs/node",
  "vuejs/core",
  "angular/angular",
  "denoland/deno",
];

const FEATURED_ORGANIZATIONS = [
  "ethiorhq",
  "facebook",
  "vercel",
  "tailwindlabs",
  "expressjs",
  "microsoft",
  "nodejs",
  "vuejs",
  "angular",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const publicRoutes: MetadataRoute.Sitemap = PUBLIC_ROUTE_PATHS.map((path) => {
    let priority = 0.7;
    let changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] = "weekly";

    if (path === "/") {
      priority = 1.0;
      changeFrequency = "daily";
    } else if (
      path === "/how-it-works" ||
      path === "/compare" ||
      path === "/leaderboard" ||
      path === "/devops" ||
      path === "/org" ||
      path === "/templates"
    ) {
      priority = 0.9;
      changeFrequency = "daily";
    } else if (path === "/faq" || path === "/guides" || path === "/js") {
      priority = 0.8;
      changeFrequency = "weekly";
    } else {
      priority = 0.5;
      changeFrequency = "monthly";
    }

    return {
      url: absoluteUrl(path),
      lastModified: CONTENT_UPDATED_AT,
      changeFrequency,
      priority,
    };
  });

  const guideRoutes: MetadataRoute.Sitemap = GUIDES.map((guide) => ({
    url: absoluteUrl(`/guides/${guide.slug}`),
    lastModified: new Date(`${guide.updatedAt}T00:00:00.000Z`),
    changeFrequency: "weekly",
    priority: 0.85,
  }));

  const reportRoutes: MetadataRoute.Sitemap = FEATURED_REPOSITORIES.map((repo) => ({
    url: absoluteUrl(`/report/${repo}`),
    lastModified: CONTENT_UPDATED_AT,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const devopsRoutes: MetadataRoute.Sitemap = FEATURED_REPOSITORIES.map((repo) => ({
    url: absoluteUrl(`/devops/${repo}`),
    lastModified: CONTENT_UPDATED_AT,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const orgRoutes: MetadataRoute.Sitemap = FEATURED_ORGANIZATIONS.map((org) => ({
    url: absoluteUrl(`/org/${org}`),
    lastModified: CONTENT_UPDATED_AT,
    changeFrequency: "weekly",
    priority: 0.75,
  }));

  return [
    ...publicRoutes,
    ...guideRoutes,
    ...reportRoutes,
    ...devopsRoutes,
    ...orgRoutes,
  ];
}


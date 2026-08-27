import type { MetadataRoute } from "next";
import { GUIDES } from "@/lib/guides";
import { absoluteUrl, PUBLIC_ROUTE_PATHS } from "@/lib/site";

const CONTENT_UPDATED_AT = new Date("2026-08-27T00:00:00.000Z");

export default function sitemap(): MetadataRoute.Sitemap {
  const publicRoutes: MetadataRoute.Sitemap = PUBLIC_ROUTE_PATHS.map((path) => ({
    url: absoluteUrl(path),
    lastModified: CONTENT_UPDATED_AT,
  }));

  const guideRoutes: MetadataRoute.Sitemap = GUIDES.map((guide) => ({
    url: absoluteUrl(`/guides/${guide.slug}`),
    lastModified: new Date(`${guide.updatedAt}T00:00:00.000Z`),
  }));

  return [...publicRoutes, ...guideRoutes];
}

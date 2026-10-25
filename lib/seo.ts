import type { Metadata } from "next";
import { absoluteUrl, SITE_DESCRIPTION, SITE_DISPLAY_NAME, SITE_NAME } from "@/lib/site";

type PageMetadataOptions = {
  title: string;
  description: string;
  path: string;
  imagePath?: string;
  imageAlt?: string;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
};

export function pageMetadata({
  title,
  description,
  path,
  imagePath = "/opengraph-image",
  imageAlt = "ETHIOR WelcomeScore — contributor readiness auditor for public GitHub repositories",
  type = "website",
  publishedTime,
  modifiedTime,
}: PageMetadataOptions): Metadata {
  const canonical = absoluteUrl(path);
  const image = absoluteUrl(imagePath);

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    openGraph: {
      type,
      url: canonical,
      siteName: SITE_DISPLAY_NAME,
      title,
      description,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: imageAlt,
        },
      ],
      ...(type === "article"
        ? {
            publishedTime,
            modifiedTime,
          }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export const homepageMetadata = pageMetadata({
  title: "ETHIOR WelcomeScore — Is Your Repository Ready for First-Time Contributors?",
  description:
    "WelcomeScore by ETHIOR evaluates how ready a public GitHub repository is for first-time contributors with deterministic 5-pillar audits, onboarding checklists, and developer badges.",
  path: "/",
  imageAlt: "ETHIOR WelcomeScore — GitHub repository contributor readiness and onboarding audit",
});

export const DEFAULT_METADATA_DESCRIPTION = SITE_DESCRIPTION;
export { SITE_NAME };

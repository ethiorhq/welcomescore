import type { Metadata } from "next";
import TemplateStudioClient from "./TemplateStudioClient";

export const metadata: Metadata = {
  title: "Open-Source Community Template & CI Studio | ETHIOR WelcomeScore",
  description:
    "Tailor and 1-click dispatch GitHub CONTRIBUTING.md, issue forms, PR templates, Dependabot configs, and GitHub Actions CI workflows without OAuth tokens.",
  keywords: [
    "ETHIOR Template Studio",
    "GitHub Issue Template Generator",
    "CONTRIBUTING.md Generator",
    "Pull Request Template Generator",
    "GitHub Actions CI Generator",
    "Open Source Community Health Files",
    "DevOps Automation Studio",
    "WelcomeScore Studio",
  ],
  alternates: {
    canonical: "https://www.welcomescore.is-local.org/templates",
  },
  openGraph: {
    title: "Open-Source Community Template & CI Studio | ETHIOR WelcomeScore",
    description:
      "Interactive studio to generate, edit, and 1-click dispatch production-grade open source health files and CI workflows directly to GitHub.",
    url: "https://www.welcomescore.is-local.org/templates",
    siteName: "ETHIOR WelcomeScore",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Open-Source Community Template & CI Studio | ETHIOR WelcomeScore",
    description:
      "Generate and 1-click dispatch GitHub Actions, issue forms, and contributing guides with zero token overhead.",
  },
};

export default function TemplateStudioPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "ETHIOR WelcomeScore Template Studio",
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Cloud, Edge, All",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    description:
      "Tailor and 1-click dispatch GitHub CONTRIBUTING.md, issue forms, PR templates, Dependabot configs, and GitHub Actions CI workflows.",
    publisher: {
      "@type": "Organization",
      name: "ETHIOR",
      url: "https://www.welcomescore.is-local.org",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <TemplateStudioClient />
    </>
  );
}

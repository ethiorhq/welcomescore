import type { Metadata } from "next";
import TemplateStudioClient from "./TemplateStudioClient";
import { pageMetadata } from "@/lib/seo";
import { generateToolSoftwareLd, stringifyJsonLd } from "@/lib/schemaLd";

export const metadata: Metadata = {
  ...pageMetadata({
    title: "Open-Source Community Template & CI Studio | ETHIOR WelcomeScore",
    description:
      "Tailor and 1-click dispatch GitHub CONTRIBUTING.md, issue forms, PR templates, Dependabot configs, and GitHub Actions CI workflows without OAuth tokens.",
    path: "/templates",
  }),
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
};

const jsonLd = generateToolSoftwareLd(
  "ETHIOR WelcomeScore Template Studio",
  "/templates",
  "Tailor and 1-click dispatch GitHub CONTRIBUTING.md, issue forms, PR templates, Dependabot configs, and GitHub Actions CI workflows.",
);

export default function TemplateStudioPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: stringifyJsonLd(jsonLd) }}
      />
      <TemplateStudioClient />
    </>
  );
}


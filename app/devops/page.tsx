import type { Metadata } from "next";
import DevOpsDashboard from "./DevOpsDashboard";
import { pageMetadata } from "@/lib/seo";
import { generateToolSoftwareLd, stringifyJsonLd } from "@/lib/schemaLd";

export const metadata: Metadata = {
  ...pageMetadata({
    title: "ETHIOR DevOps CI/CD Pipeline Doctor & License Radar · WelcomeScore",
    description:
      "Diagnose GitHub Actions workflow bottlenecks, eliminate wasted runner minutes with automated dependency caching, audit copyleft license compliance, and generate 1-click CI optimization PRs.",
    path: "/devops",
  }),
  keywords: [
    "ETHIOR",
    "DevOps pipeline doctor",
    "GitHub Actions optimization",
    "CI CD cache optimizer",
    "runner minutes savings",
    "license compliance radar",
    "open source devops audit",
    "actions setup node cache",
    "devops score",
  ],
};

const jsonLd = generateToolSoftwareLd(
  "ETHIOR DevOps CI/CD Pipeline Doctor",
  "/devops",
  "Automated diagnostic profiler for GitHub Actions workflows, runner compute efficiency, supply-chain pinning, and open-source license compliance.",
);

export default function DevOpsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: stringifyJsonLd(jsonLd) }}
      />
      <DevOpsDashboard />
    </>
  );
}

import type { Metadata } from "next";
import OrgFleetDashboard from "./OrgFleetDashboard";

export const metadata: Metadata = {
  title: "ETHIOR Multi-Repo Fleet Cockpit · Organization Contributor Health Radar",
  description:
    "Monitor contributor readiness, stale repository drift, missing licenses, and DevOps performance across entire GitHub organizations in a single unified cockpit.",
  keywords: [
    "ETHIOR",
    "organization fleet audit",
    "multi repo contributor health",
    "github organization devops",
    "open source fleet management",
    "stale repo radar",
    "welcomescore org",
  ],
  openGraph: {
    title: "ETHIOR Multi-Repo Fleet Cockpit",
    description:
      "Audit contributor health and DevOps posture across all repositories of any GitHub organization.",
    type: "website",
    url: "https://www.welcomescore.is-local.org/org",
  },
  alternates: {
    canonical: "https://www.welcomescore.is-local.org/org",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "ETHIOR Multi-Repo Fleet Cockpit",
  url: "https://www.welcomescore.is-local.org/org",
  description:
    "Fleet-wide contributor health index, stale repository radar, and license compliance intelligence for GitHub organizations.",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Any",
  creator: {
    "@type": "Organization",
    name: "ETHIOR",
    url: "https://ethior.com",
  },
};

export default function OrgHubPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <OrgFleetDashboard />
    </>
  );
}

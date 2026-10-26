import type { Metadata } from "next";
import OrgFleetDashboard from "./OrgFleetDashboard";
import { pageMetadata } from "@/lib/seo";
import { generateToolSoftwareLd, stringifyJsonLd } from "@/lib/schemaLd";

export const metadata: Metadata = {
  ...pageMetadata({
    title: "ETHIOR Multi-Repo Fleet Cockpit · Organization Contributor Health Radar",
    description:
      "Monitor contributor readiness, stale repository drift, missing licenses, and DevOps performance across entire GitHub organizations in a single unified cockpit.",
    path: "/org",
  }),
  keywords: [
    "ETHIOR",
    "organization fleet audit",
    "multi repo contributor health",
    "github organization devops",
    "open source fleet management",
    "stale repo radar",
    "welcomescore org",
  ],
};

const jsonLd = generateToolSoftwareLd(
  "ETHIOR Multi-Repo Fleet Cockpit",
  "/org",
  "Fleet-wide contributor health index, stale repository radar, and license compliance intelligence for GitHub organizations.",
);

export default function OrgHubPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: stringifyJsonLd(jsonLd) }}
      />
      <OrgFleetDashboard />
    </>
  );
}


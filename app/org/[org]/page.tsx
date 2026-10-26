import type { Metadata } from "next";
import OrgFleetDashboard from "../OrgFleetDashboard";
import { aggregateOrgFleet } from "@/lib/org/fleetEngine";
import { pageMetadata } from "@/lib/seo";
import { generateOrgFleetLd, stringifyJsonLd } from "@/lib/schemaLd";

interface PageProps {
  params: Promise<{
    org: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { org } = await params;

  const baseMeta = pageMetadata({
    title: `${org} Organization Multi-Repo Fleet Audit · ETHIOR WelcomeScore`,
    description: `Fleet-wide contributor health index, stale repository radar, and license compliance intelligence for GitHub organization @${org}.`,
    path: `/org/${org}`,
  });

  return {
    ...baseMeta,
    keywords: [
      org,
      "ETHIOR",
      `${org} github organization`,
      `${org} open source fleet`,
      `${org} contributor readiness`,
      "fleet cockpit",
    ],
  };
}

export default async function OrgFleetPage({ params }: PageProps) {
  const { org } = await params;

  // Baseline initial fleet report for instant SSR render
  const initialReport = aggregateOrgFleet(org, [
    {
      name: "featured-project",
      full_name: `${org}/featured-project`,
      description: `Primary public repository for ${org}`,
      stargazers_count: 100,
      forks_count: 10,
      pushed_at: new Date().toISOString(),
      license: { spdx_id: "MIT" },
    },
  ]);

  const jsonLd = generateOrgFleetLd(org);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: stringifyJsonLd(jsonLd) }}
      />
      <OrgFleetDashboard
        initialOrg={org}
        initialReport={initialReport}
      />
    </>
  );
}


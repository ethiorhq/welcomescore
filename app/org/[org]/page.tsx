import type { Metadata } from "next";
import OrgFleetDashboard from "../OrgFleetDashboard";
import { aggregateOrgFleet } from "@/lib/org/fleetEngine";

interface PageProps {
  params: Promise<{
    org: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { org } = await params;

  return {
    title: `${org} Organization Multi-Repo Fleet Audit · ETHIOR WelcomeScore`,
    description: `Fleet-wide contributor health index, stale repository radar, and license compliance intelligence for GitHub organization @${org}.`,
    keywords: [
      org,
      "ETHIOR",
      `${org} github organization`,
      `${org} open source fleet`,
      `${org} contributor readiness`,
      "fleet cockpit",
    ],
    openGraph: {
      title: `${org} GitHub Fleet Health Cockpit · ETHIOR`,
      description: `Unified contributor readiness and DevOps audit across all public repositories in @${org}.`,
      type: "profile",
      url: `https://www.welcomescore.is-local.org/org/${org}`,
    },
    alternates: {
      canonical: `https://www.welcomescore.is-local.org/org/${org}`,
    },
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

  return (
    <OrgFleetDashboard
      initialOrg={org}
      initialReport={initialReport}
    />
  );
}

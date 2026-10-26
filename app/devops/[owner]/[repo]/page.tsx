import type { Metadata } from "next";
import DevOpsDashboard from "../../DevOpsDashboard";
import { diagnoseDevOps } from "@/lib/devops/doctor";
import { pageMetadata } from "@/lib/seo";
import { generateDevOpsAuditLd, stringifyJsonLd } from "@/lib/schemaLd";

interface PageProps {
  params: Promise<{
    owner: string;
    repo: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { owner, repo } = await params;
  const fullName = `${owner}/${repo}`;

  const baseMeta = pageMetadata({
    title: `${fullName} DevOps CI/CD & License Audit · ETHIOR WelcomeScore`,
    description: `Comprehensive DevOps pipeline analysis for ${fullName}. Audit GitHub Actions runner efficiency, dependency caching, supply-chain pin security, and license compliance.`,
    path: `/devops/${owner}/${repo}`,
    type: "article",
  });

  return {
    ...baseMeta,
    keywords: [
      fullName,
      owner,
      repo,
      "ETHIOR",
      `${repo} github actions`,
      `${repo} devops score`,
      `${repo} ci cd audit`,
      `${repo} license compliance`,
      "pipeline doctor",
    ],
  };
}

export default async function RepoDevOpsPage({ params }: PageProps) {
  const { owner, repo } = await params;
  const fullName = `${owner}/${repo}`;

  // Deterministic baseline diagnostic for SSR render
  const initialReport = diagnoseDevOps({
    repo: fullName,
    defaultBranch: "main",
    licenseSpdx: "MIT",
    workflowFiles: [],
  });

  const jsonLd = generateDevOpsAuditLd(owner, repo, initialReport);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: stringifyJsonLd(jsonLd) }}
      />
      <DevOpsDashboard
        initialRepo={fullName}
        initialReport={initialReport}
      />
    </>
  );
}


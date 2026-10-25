import type { Metadata } from "next";
import DevOpsDashboard from "../../DevOpsDashboard";
import { diagnoseDevOps } from "@/lib/devops/doctor";

interface PageProps {
  params: Promise<{
    owner: string;
    repo: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { owner, repo } = await params;
  const fullName = `${owner}/${repo}`;

  return {
    title: `${fullName} DevOps CI/CD & License Audit · ETHIOR WelcomeScore`,
    description: `Comprehensive DevOps pipeline analysis for ${fullName}. Audit GitHub Actions runner efficiency, dependency caching, supply-chain pin security, and license compliance.`,
    keywords: [
      fullName,
      "ETHIOR",
      `${repo} github actions`,
      `${repo} devops score`,
      `${repo} ci cd audit`,
      `${repo} license compliance`,
      "pipeline doctor",
    ],
    openGraph: {
      title: `${fullName} DevOps Pipeline Diagnostic · ETHIOR`,
      description: `Grade and billable runner efficiency diagnosis for ${fullName}.`,
      type: "article",
      url: `https://www.welcomescore.is-local.org/devops/${owner}/${repo}`,
    },
    alternates: {
      canonical: `https://www.welcomescore.is-local.org/devops/${owner}/${repo}`,
    },
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

  return (
    <DevOpsDashboard
      initialRepo={fullName}
      initialReport={initialReport}
    />
  );
}

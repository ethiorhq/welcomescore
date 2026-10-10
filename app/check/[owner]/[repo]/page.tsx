import { Metadata } from "next";
import AuditHome from "@/app/components/AuditHome";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: { owner: string; repo: string };
}): Promise<Metadata> {
  const repo = `${params.owner}/${params.repo}`;
  return pageMetadata({
    title: `${repo} — WelcomeScore Audit`,
    description: `View the contributor readiness audit for ${repo} on WelcomeScore.`,
    path: `/check/${params.owner}/${params.repo}`,
  });
}

export default function RepositoryAuditPage({
  params,
}: {
  params: { owner: string; repo: string };
}) {
  return <AuditHome initialRepository={`${params.owner}/${params.repo}`} />;
}

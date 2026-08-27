import AuditHome from "@/app/components/AuditHome";

export default function RepositoryAuditPage({
  params,
}: {
  params: { owner: string; repo: string };
}) {
  return <AuditHome initialRepository={`${params.owner}/${params.repo}`} />;
}

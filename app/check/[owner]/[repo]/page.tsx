import Home from "@/app/page";

export default function RepositoryAuditPage({
  params,
}: {
  params: { owner: string; repo: string };
}) {
  return <Home initialRepository={`${params.owner}/${params.repo}`} />;
}

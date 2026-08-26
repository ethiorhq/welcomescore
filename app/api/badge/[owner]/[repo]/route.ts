import {
  badgeResponse,
  createBadgeSvg,
  createErrorBadgeSvg,
  normalizeBadgeStyle,
} from "@/lib/badgeEngine";
import { parseRepository, scoreRepo } from "@/lib/scoreRepo";

export const runtime = "edge";
export const revalidate = 300;

export async function GET(
  request: Request,
  { params }: { params: { owner: string; repo: string } },
) {
  const repository = parseRepository(`${params.owner}/${params.repo}`);
  if (!repository) {
    return badgeResponse(createErrorBadgeSvg(), 400);
  }

  const { searchParams } = new URL(request.url);
  const style = normalizeBadgeStyle(searchParams.get("style"));

  try {
    const result = await scoreRepo(repository.owner, repository.repo);
    return badgeResponse(createBadgeSvg(result, style));
  } catch {
    return badgeResponse(createErrorBadgeSvg(), 404);
  }
}

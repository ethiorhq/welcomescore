import { evaluateJsHealth, readGitHubJsHealthSnapshot } from "@/lib/jsHealth";

export const runtime = "nodejs";
export const revalidate = 300;

type RouteContext = {
  params: { owner: string; repo: string };
};

export async function GET(_request: Request, context: RouteContext) {
  const owner = decodeURIComponent(context.params.owner);
  const repo = decodeURIComponent(context.params.repo).replace(/\.svg$/i, "");
  try {
    const report = evaluateJsHealth(await readGitHubJsHealthSnapshot(`${owner}/${repo}`));
    return svgResponse(renderBadge(`${owner}/${repo}`, `${report.score}/100`, report.grade));
  } catch {
    return svgResponse(renderBadge(`${owner}/${repo}`, "unavailable", ""));
  }
}

function renderBadge(repository: string, score: string, grade: string) {
  const rightWidth = Math.max(98, score.length * 9 + (grade ? 26 : 0));
  const totalWidth = 172 + rightWidth;
  const escapedRepository = escapeXml(repository.length > 34 ? `${repository.slice(0, 31)}…` : repository);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="28" role="img" aria-label="WelcomeScore JavaScript health signals for ${escapedRepository}: ${score}${grade ? `, grade ${grade}` : ""}">
  <title>WelcomeScore JavaScript health signals for ${escapedRepository}: ${score}${grade ? `, grade ${grade}` : ""}</title>
  <linearGradient id="g" x2="0" y2="100%"><stop stop-color="#1B1E29"/><stop offset="1" stop-color="#12141C"/></linearGradient>
  <rect width="${totalWidth}" height="28" rx="5" fill="url(#g)"/>
  <rect x="171" width="${rightWidth + 1}" height="28" rx="5" fill="#E8A23D"/>
  <rect x="171" width="7" height="28" fill="#E8A23D"/>
  <text x="10" y="12" fill="#F2EEE6" font-family="IBM Plex Mono, ui-monospace, monospace" font-size="10" font-weight="700">WelcomeScore JS</text>
  <text x="10" y="23" fill="#8B8F9E" font-family="IBM Plex Mono, ui-monospace, monospace" font-size="8">${escapedRepository}</text>
  <text x="${181}" y="18" fill="#12141C" font-family="IBM Plex Mono, ui-monospace, monospace" font-size="12" font-weight="700">${escapeXml(score)}${grade ? ` ${escapeXml(grade)}` : ""}</text>
</svg>`;
}

function svgResponse(body: string) {
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=86400",
    },
  });
}

function escapeXml(value: string) {
  return value.replace(/[<>&"']/g, (character) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" })[character] ?? character);
}

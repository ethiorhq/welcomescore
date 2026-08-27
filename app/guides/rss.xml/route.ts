import { GUIDES } from "@/lib/guides";
import { absoluteUrl, SITE_DESCRIPTION, SITE_DISPLAY_NAME } from "@/lib/site";

function escapeXml(value: string) {
  return value.replace(/[<>&'\"]/g, (character) => {
    const entities: Record<string, string> = {
      "<": "&lt;",
      ">": "&gt;",
      "&": "&amp;",
      "'": "&apos;",
      '"': "&quot;",
    };

    return entities[character] ?? character;
  });
}

export async function GET() {
  const items = GUIDES.map((guide) => {
    const url = absoluteUrl(`/guides/${guide.slug}`);
    const publicationDate = new Date(`${guide.publishedAt}T00:00:00.000Z`).toUTCString();

    return `
      <item>
        <title>${escapeXml(guide.title)}</title>
        <description>${escapeXml(guide.description)}</description>
        <link>${url}</link>
        <guid isPermaLink="true">${url}</guid>
        <pubDate>${publicationDate}</pubDate>
        <category>${escapeXml(guide.category)}</category>
      </item>`;
  }).join("");

  const xml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
  <channel>
    <title>${SITE_DISPLAY_NAME} Developer Guides</title>
    <description>${escapeXml(SITE_DESCRIPTION)}</description>
    <link>${absoluteUrl("/guides")}</link>
    <language>en</language>
    <lastBuildDate>${new Date("2026-08-27T00:00:00.000Z").toUTCString()}</lastBuildDate>${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
      "Content-Type": "application/rss+xml; charset=utf-8",
    },
  });
}

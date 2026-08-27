# WelcomeScore Search Discovery Launch Checklist

This checklist is for the canonical hosted WelcomeScore service at `https://welcomescore.vercel.app`. It is a publishing and verification workflow, not a promise of ranking, crawling frequency, or inclusion in any search result.

## 1. Confirm the live canonical surface

Before adding the site to Search Console, open the canonical homepage, guide index, one guide, `robots.txt`, `sitemap.xml`, the guide RSS feed, and `llms.txt`. Check that every page loads over HTTPS and that public links point to `https://welcomescore.vercel.app`, not a preview or deployment-specific URL.

| URL | Expected result |
| --- | --- |
| `/` | Unique title, description, canonical URL, and 1200×630 WelcomeScore share image. |
| `/guides` | Public guide index, RSS link metadata, and internal links to every published guide. |
| `/guides/{slug}` | One guide with a primary heading, byline, dates, visible table of contents, related guides, and article share image. |
| `/robots.txt` | Public paths allowed, `/api/` disallowed, and a root sitemap line. |
| `/sitemap.xml` | Only canonical fixed product/policy pages and published guide pages. |
| `/guides/rss.xml` | Valid RSS containing the published guide titles and canonical URLs. |
| `/llms.txt` | A truthful product summary and canonical resource links; it must not contain secrets or ranking claims. |

## 2. Verify the canonical domain in Google Search Console

Add and verify the URL-prefix property for `https://welcomescore.vercel.app/` in [Google Search Console](https://search.google.com/search-console/about). Use a verification method you control through the hosting or domain account. Do not add temporary verification tokens to a public repository without understanding the provider’s instructions.

After verification, submit `https://welcomescore.vercel.app/sitemap.xml` in the Sitemaps report. Search Console can show whether Google fetched the sitemap and whether it reports processing errors. A sitemap is a discovery hint, not a guarantee that every listed page will be crawled, indexed, or ranked.[1]

## 3. Inspect the launch URLs

Use Search Console’s URL Inspection tool on the homepage, `/guides`, and one representative guide. Confirm that the fetched page is crawlable, the selected canonical is the expected canonical URL, and no accidental `noindex` directive appears. Request indexing only after the final production content is deployed; repeatedly requesting indexing does not improve quality or guarantee speed.

The `/check/{owner}/{repo}` shareable audit routes intentionally carry `noindex` because they are arbitrary result pages. They remain shareable and usable, but they are not part of the editorial guide library or sitemap.

## 4. Validate structured data and social previews

Run the homepage, FAQ, and one guide through Google’s [Rich Results Test](https://search.google.com/test/rich-results). Confirm that structured data is valid and that it describes visible content only. The site uses `WebSite`, `Organization`, `FAQPage`, `Article`, and `BreadcrumbList` descriptions where they match the rendered page; valid markup does not guarantee a rich-result treatment.[2]

For sharing, open the homepage image route and a guide’s `/opengraph-image` route directly. Then test a normal page URL in the social platforms you actually use. Platforms cache previews independently, so a published image may take time to appear after a change. Do not change page titles or update dates only to force preview refreshes.

## 5. Establish an honest measurement baseline

In Search Console’s Performance report, record baseline impressions, clicks, click-through rate, and average position for the homepage, guide index, and individual guides. Revisit the report after enough data has accumulated to make comparisons meaningful. Review queries and landing pages for relevance, not merely volume.

If a guide receives little useful traffic, improve the page only when it can offer a clearer, more complete answer for its intended contributor or maintainer audience. Do not mass-produce variations, add keyword lists, or change dates without a meaningful content update. Helpful content, clear authorship, a visible purpose, internal linking, and accurate page metadata are more sustainable than search-engine-first tactics.[3]

## 6. Maintain the publishing system

When a new guide is added, give it one clear topic, a unique title and description, a visible author/byline, meaningful publication and review dates, related internal links, and an accurate article social card. Add the slug to the typed guide source so the route, sitemap, RSS feed, and metadata update together.

Review all public guides at least when product behavior, scoring rules, policy boundaries, or user-facing feature flows materially change. Update the guide’s review date only when its substantive content changes. Keep external factual claims sourced and avoid describing product behavior that is not live.

## References

[1] [Google Search Central — Build and submit a sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)

[2] [Google Search Central — Introduction to structured data markup](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data)

[3] [Google Search Central — Creating helpful, reliable, people-first content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content)

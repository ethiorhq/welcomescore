import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GUIDES, guideBySlug } from "@/lib/guides";
import { pageMetadata } from "@/lib/seo";
import { absoluteUrl, SITE_NAME } from "@/lib/site";

type GuidePageProps = {
  params: {
    slug: string;
  };
};

export function generateStaticParams() {
  return GUIDES.map(({ slug }) => ({ slug }));
}

export function generateMetadata({ params }: GuidePageProps): Metadata {
  const guide = guideBySlug(params.slug);

  if (!guide) {
    return {};
  }

  return pageMetadata({
    title: `${guide.title} | WelcomeScore`,
    description: guide.description,
    path: `/guides/${guide.slug}`,
    imagePath: `/guides/${guide.slug}/opengraph-image`,
    imageAlt: `${guide.title} — a WelcomeScore developer guide`,
    type: "article",
    publishedTime: guide.publishedAt,
    modifiedTime: guide.updatedAt,
  });
}

function jsonLd(value: object) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

export default function GuidePage({ params }: GuidePageProps) {
  const guide = guideBySlug(params.slug);

  if (!guide) {
    notFound();
  }

  const relatedGuides = guide.relatedSlugs
    .map((slug) => guideBySlug(slug))
    .filter((candidate): candidate is NonNullable<typeof candidate> => Boolean(candidate));

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.title,
    description: guide.description,
    datePublished: guide.publishedAt,
    dateModified: guide.updatedAt,
    author: {
      "@type": "Organization",
      name: "ETHIOR Editorial",
      url: "https://ethior.com",
    },
    publisher: {
      "@type": "Organization",
      name: "ETHIOR",
      url: "https://ethior.com",
    },
    mainEntityOfPage: absoluteUrl(`/guides/${guide.slug}`),
    image: absoluteUrl(`/guides/${guide.slug}/opengraph-image`),
    keywords: guide.keywords.join(", "),
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: SITE_NAME,
        item: absoluteUrl("/"),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Developer guides",
        item: absoluteUrl("/guides"),
      },
      {
        "@type": "ListItem",
        position: 3,
        name: guide.title,
        item: absoluteUrl(`/guides/${guide.slug}`),
      },
    ],
  };

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 pb-8 pt-10 sm:px-6 sm:pt-14">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbSchema) }} />

      <nav aria-label="Breadcrumb" className="font-mono text-xs text-muted">
        <Link className="text-link underline underline-offset-4" href="/">
          WelcomeScore
        </Link>
        <span aria-hidden="true"> / </span>
        <Link className="text-link underline underline-offset-4" href="/guides">
          Developer guides
        </Link>
        <span aria-hidden="true"> / </span>
        <span className="text-text">{guide.category}</span>
      </nav>

      <article className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_220px] lg:gap-14">
        <div className="max-w-3xl">
          <header className="border-b border-muted/25 pb-8">
            <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-accent">{guide.category}</p>
            <h1 className="mt-4 font-sans text-4xl font-semibold tracking-tight text-text sm:text-5xl">{guide.title}</h1>
            <p className="mt-5 text-lg leading-8 text-muted">{guide.summary}</p>
            <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2 font-mono text-xs text-muted">
              <span>By ETHIOR Editorial</span>
              <span aria-hidden="true">·</span>
              <time dateTime={guide.publishedAt}>Published {guide.publishedAt}</time>
              <span aria-hidden="true">·</span>
              <time dateTime={guide.updatedAt}>Reviewed {guide.updatedAt}</time>
              <span aria-hidden="true">·</span>
              <span>{guide.readingTime}</span>
            </div>
          </header>

          <div className="space-y-10 pt-9">
            {guide.sections.map((section) => (
              <section key={section.heading} id={section.heading.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")} className="scroll-mt-8">
                <h2 className="font-sans text-2xl font-semibold tracking-tight text-text">{section.heading}</h2>
                <div className="mt-4 space-y-4 text-base leading-7 text-muted">
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
                {section.checklist ? (
                  <ul className="mt-5 space-y-2 rounded-md border border-muted/25 bg-surface/55 p-4 text-sm leading-6 text-muted">
                    {section.checklist.map((item) => (
                      <li key={item} className="flex gap-3">
                        <span aria-hidden="true" className="font-mono font-bold text-good">✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
                {section.callout ? (
                  <aside className="mt-5 border-l-2 border-accent pl-4 font-sans text-sm leading-6 text-text">{section.callout}</aside>
                ) : null}
              </section>
            ))}
          </div>

          <section className="mt-12 rounded-md border border-muted/25 bg-surface/55 p-5">
            <h2 className="font-sans text-lg font-semibold text-text">About this guide</h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Written by ETHIOR Editorial for contributors and maintainers. This guide explains practical product and repository practices; it is not legal, security, employment, or financial advice. Review the project’s <Link className="text-link underline underline-offset-4" href="/how-it-works">How It Works</Link>, <Link className="text-link underline underline-offset-4" href="/privacy">Privacy Policy</Link>, and <Link className="text-link underline underline-offset-4" href="/terms">Terms &amp; Conditions</Link> for product boundaries.
            </p>
          </section>

          <section className="mt-8 rounded-md border border-accent/30 bg-accent/5 p-5">
            <h2 className="font-sans text-lg font-semibold text-text">Put the ideas into practice</h2>
            <p className="mt-2 text-sm leading-6 text-muted">Run a fresh public GitHub audit and use the visible contributor signals as a starting point—not as a certification of project quality or safety.</p>
            <Link className="mt-4 inline-flex rounded-md border border-accent/55 bg-accent px-4 py-2 font-mono text-sm font-bold text-base transition-colors duration-200 hover:bg-accent/90" href="/">
              Check a repository
            </Link>
          </section>
        </div>

        <aside className="lg:pt-1">
          <div className="rounded-md border border-muted/25 bg-surface/45 p-4 lg:sticky lg:top-6">
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-accent">On this page</p>
            <ol className="mt-4 space-y-3 text-sm leading-5 text-muted">
              {guide.sections.map((section, index) => {
                const id = section.heading.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
                return (
                  <li key={section.heading} className="flex gap-2">
                    <span className="font-mono text-xs text-muted">{String(index + 1).padStart(2, "0")}</span>
                    <a className="text-link underline underline-offset-4" href={`#${id}`}>{section.heading}</a>
                  </li>
                );
              })}
            </ol>
          </div>
        </aside>
      </article>

      {relatedGuides.length ? (
        <section aria-labelledby="related-guides" className="mt-14 max-w-3xl border-t border-muted/25 pt-8">
          <h2 id="related-guides" className="font-sans text-2xl font-semibold tracking-tight text-text">Continue learning</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {relatedGuides.map((related) => (
              <Link key={related.slug} className="rounded-md border border-muted/25 bg-surface/45 p-4 text-link no-underline transition-colors duration-200 hover:border-accent/45" href={`/guides/${related.slug}`}>
                <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-accent">{related.category}</span>
                <span className="mt-2 block font-sans text-sm font-semibold leading-6 text-text">{related.title}</span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}

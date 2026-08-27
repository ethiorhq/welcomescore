import type { Metadata } from "next";
import Link from "next/link";
import { GUIDES } from "@/lib/guides";
import { pageMetadata } from "@/lib/seo";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  ...pageMetadata({
    title: "Developer Guides for Contributor-Ready Repositories | WelcomeScore",
    description:
      "Practical, developer-first guides for onboarding contributors, writing useful project documentation, creating honest starter issues, and improving repository readiness.",
    path: "/guides",
    imagePath: "/opengraph-image",
    imageAlt: "WelcomeScore developer guides for contributor-ready repositories",
  }),
  alternates: {
    canonical: absoluteUrl("/guides"),
    types: {
      "application/rss+xml": absoluteUrl("/guides/rss.xml"),
    },
  },
};

export default function GuidesPage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 pb-8 pt-12 sm:px-6 sm:pt-16">
      <section className="max-w-3xl">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-accent">Developer guides</p>
        <h1 className="mt-4 font-sans text-4xl font-semibold tracking-tight text-text sm:text-5xl">
          Better first contributions start with clearer paths.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-muted sm:text-lg">
          Practical, evidence-led writing for contributors and maintainers who want to make public repositories easier to understand, safer to join, and more useful to improve.
        </p>
      </section>

      <section aria-label="Published WelcomeScore guides" className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {GUIDES.map((guide) => (
          <article
            key={guide.slug}
            className="group flex min-h-[260px] flex-col rounded-md border border-muted/25 bg-surface/55 p-5 transition-colors duration-200 hover:border-accent/45"
          >
            <div className="flex items-center justify-between gap-3 font-mono text-[11px] uppercase tracking-[0.12em] text-muted">
              <span className="text-accent">{guide.category}</span>
              <span>{guide.readingTime}</span>
            </div>
            <h2 className="mt-5 font-sans text-xl font-semibold leading-7 text-text">
              <Link className="text-link no-underline" href={`/guides/${guide.slug}`}>
                {guide.title}
              </Link>
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted">{guide.description}</p>
            <div className="mt-auto flex items-center justify-between gap-3 pt-6 font-mono text-xs text-muted">
              <span>ETHIOR Editorial</span>
              <Link className="text-link font-semibold no-underline" href={`/guides/${guide.slug}`}>
                Read guide <span aria-hidden="true">→</span>
              </Link>
            </div>
          </article>
        ))}
      </section>

      <section className="mt-10 rounded-md border border-accent/30 bg-accent/5 p-5 sm:flex sm:items-center sm:justify-between sm:gap-6">
        <div>
          <h2 className="font-sans text-lg font-semibold text-text">Want a practical view of your own repository?</h2>
          <p className="mt-1 text-sm leading-6 text-muted">Run a fresh public GitHub audit, then use the result as a starting point for real onboarding improvements.</p>
        </div>
        <Link className="mt-4 inline-flex rounded-md border border-accent/55 bg-accent px-4 py-2 font-mono text-sm font-bold text-base transition-colors duration-200 hover:bg-accent/90 sm:mt-0" href="/">
          Check a repository
        </Link>
      </section>
    </main>
  );
}

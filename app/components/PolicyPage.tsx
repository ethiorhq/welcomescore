import Link from "next/link";
import type { ReactNode } from "react";

export type PolicySection = {
  id: string;
  title: string;
  content: ReactNode;
};

export default function PolicyPage({
  eyebrow,
  title,
  description,
  effectiveDate,
  sections,
}: {
  eyebrow: string;
  title: string;
  description: string;
  effectiveDate: string;
  sections: PolicySection[];
}) {
  return (
    <main className="flex-1 bg-base px-4 py-10 text-text sm:px-6 sm:py-16">
      <div className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[12rem_minmax(0,1fr)] lg:gap-12">
        <aside className="lg:sticky lg:top-8 lg:self-start">
          <Link href="/" className="text-link font-sans text-sm underline underline-offset-4">
            ← Back to WelcomeScore
          </Link>
          <nav aria-label={`${title} sections`} className="mt-6 hidden border-l border-muted/25 pl-4 lg:block">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
              On this page
            </p>
            <ol className="mt-3 space-y-2">
              {sections.map((section) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="text-link font-sans text-xs leading-5 underline underline-offset-4"
                  >
                    {section.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </aside>

        <article className="min-w-0">
          <header className="border-b border-muted/20 pb-7">
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-accent">
              {eyebrow}
            </p>
            <h1 className="mt-3 font-mono text-3xl font-bold tracking-tight text-text sm:text-5xl">
              {title}
            </h1>
            <p className="mt-4 max-w-3xl font-sans text-base leading-7 text-muted sm:text-lg">
              {description}
            </p>
            <div className="mt-6 inline-flex rounded-md border border-muted/30 bg-surface/70 px-3 py-2 font-mono text-xs text-muted">
              Effective and last updated: {effectiveDate}
            </div>
          </header>

          <div className="mt-8 space-y-10">
            {sections.map((section, index) => (
              <section key={section.id} id={section.id} className="scroll-mt-8">
                <div className="flex items-baseline gap-3">
                  <span className="font-mono text-xs font-semibold text-accent">{String(index + 1).padStart(2, "0")}</span>
                  <h2 className="font-sans text-xl font-semibold text-text">{section.title}</h2>
                </div>
                <div className="mt-3 space-y-4 font-sans text-sm leading-7 text-muted">{section.content}</div>
              </section>
            ))}
          </div>
        </article>
      </div>
    </main>
  );
}

export function PolicyCallout({ children }: { children: ReactNode }) {
  return (
    <aside className="rounded-md border border-accent/30 bg-accent/10 px-4 py-3 font-sans text-sm leading-6 text-text">
      {children}
    </aside>
  );
}

export function PolicyTable({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-md border border-muted/25 bg-surface/70">
      <table className="min-w-full border-collapse text-left text-sm">
        {children}
      </table>
    </div>
  );
}

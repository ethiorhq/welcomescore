import Link from "next/link";
import { ETHIOR_URL, SITE_DISPLAY_NAME, SITE_URL, SOURCE_REPOSITORY_URL } from "@/lib/site";
import LocalWorkspaceFooterLink from "@/app/components/LocalWorkspaceFooterLink";

const FOOTER_LINKS = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/guides", label: "Developer guides" },
  { href: "/faq", label: "FAQ" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms & Conditions" },
  { href: "/dev-lounge-policy", label: "Dev Lounge Policy" },
] as const;

export default function SiteFooter() {
  return (
    <footer className="mx-auto mt-10 w-full max-w-6xl border-t border-muted/20 px-4 pt-6 text-center font-sans text-xs text-muted sm:px-6">
      <nav aria-label="Footer navigation" className="flex flex-wrap justify-center gap-x-4 gap-y-2">
        {FOOTER_LINKS.map(({ href, label }) => (
          <Link key={href} className="text-link underline underline-offset-4" href={href}>
            {label}
          </Link>
        ))}
        <LocalWorkspaceFooterLink />
      </nav>
      <p className="mt-4 leading-6">
        Built by{" "}
        <a className="text-link underline underline-offset-4" href={ETHIOR_URL}>
          ETHIOR
        </a>
        <span aria-hidden="true"> · </span>
        Original project:{" "}
        <a className="text-link underline underline-offset-4" href={SITE_URL}>
          {SITE_DISPLAY_NAME}
        </a>
        <span aria-hidden="true"> · </span>
        <a className="text-link underline underline-offset-4" href={SOURCE_REPOSITORY_URL}>
          Source on GitHub
        </a>
        <span aria-hidden="true"> · </span>
        <a className="text-link underline underline-offset-4" href="/guides/rss.xml">
          Guide RSS
        </a>
      </p>
    </footer>
  );
}

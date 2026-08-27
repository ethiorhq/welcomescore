import Link from "next/link";

const COMPANY_NAME = "ETHIOR";
const COMPANY_URL = "https://ethior.com";
const ORIGINAL_PROJECT_URL = "https://github.com/ethiorhq/welcomescore";
const LIVE_PRODUCT_URL = "https://welcomescore.vercel.app";

const FOOTER_LINKS = [
  { href: "/how-it-works", label: "How it works" },
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
      </nav>
      <p className="mt-4 leading-6">
        Built by{" "}
        <a className="text-link underline underline-offset-4" href={COMPANY_URL}>
          {COMPANY_NAME}
        </a>
        <span aria-hidden="true"> · </span>
        Original project:{" "}
        <a className="text-link underline underline-offset-4" href={LIVE_PRODUCT_URL}>
          WelcomeScore.js.org
        </a>
        <span aria-hidden="true"> · </span>
        <a className="text-link underline underline-offset-4" href={ORIGINAL_PROJECT_URL}>
          Source on GitHub
        </a>
      </p>
    </footer>
  );
}

const COMPANY_NAME = "ETHIOR";
const COMPANY_URL = "https://ethior.com";

// TODO: Replace placeholder destinations with published help and legal pages.
const FOOTER_LINKS = [
  "How it works",
  "FAQ",
  "Privacy Policy",
  "Terms & Conditions",
] as const;

export default function SiteFooter() {
  return (
    <footer className="mx-auto mt-10 w-full max-w-6xl border-t border-muted/20 px-4 pt-6 text-center font-sans text-xs text-muted sm:px-6">
      <nav
        aria-label="Footer navigation"
        className="flex flex-wrap justify-center gap-x-4 gap-y-2"
      >
        {FOOTER_LINKS.map((label) => (
          <a
            key={label}
            className="text-link underline underline-offset-4"
            href="#"
          >
            {label}
          </a>
        ))}
      </nav>
      <p className="mt-4">
        Built by{" "}
        <a className="text-link underline underline-offset-4" href={COMPANY_URL}>
          {COMPANY_NAME}
        </a>
      </p>
    </footer>
  );
}

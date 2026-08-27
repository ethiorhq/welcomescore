import type { Metadata } from "next";
import Link from "next/link";
import PolicyPage, { PolicyCallout, type PolicySection } from "@/app/components/PolicyPage";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "WelcomeScore FAQ: Audits, Badges, Reviews, and Privacy",
  description: "Clear answers to practical questions about WelcomeScore audits, badges, Algofox reviews, privacy, Hall of Fame, Dev Lounge, and product limits.",
  path: "/faq",
  imagePath: "/opengraph-image",
  imageAlt: "WelcomeScore frequently asked questions for public GitHub repository audits",
});

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What does a WelcomeScore measure?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "It measures six visible public contributor-readiness signals: a contribution guide, code of conduct, setup information, license, good-first-issue labels, and recent repository activity.",
      },
    },
    {
      "@type": "Question",
      name: "Does a high score mean a repository is safe or guaranteed to be welcoming?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. A score is a limited snapshot of documented public signals. It does not assess source-code quality, supply-chain risk, maintainers, response times, workplace conditions, commercial legitimacy, legal compliance, or whether a contribution will be accepted.",
      },
    },
    {
      "@type": "Question",
      name: "What does Ask Algofox for a review do?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "It creates a concise technical review using only the audit’s allowed contributor signals. The action is opt-in. It does not publish a message, add a Hall entry, access raw source code, or assess people.",
      },
    },
    {
      "@type": "Question",
      name: "Are repositories added to the Hall of Fame automatically?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. A qualifying result shows an explicit add action. Someone must deliberately choose that action before an eligible repository is written to the Hall of Fame.",
      },
    },
    {
      "@type": "Question",
      name: "Is the Dev Lounge private?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. It is an anonymous but public-in-context 24-hour discussion feature. Do not share credentials, personal data, financial information, private repository content, or security details.",
      },
    },
  ],
};

const sections: PolicySection[] = [
  {
    id: "audit-basics",
    title: "Audit basics",
    content: (
      <>
        <h3 className="font-sans text-base font-semibold text-text">What does a WelcomeScore measure?</h3>
        <p>It measures six visible public contributor-readiness signals: a contribution guide, code of conduct, setup information, license, good-first-issue labels, and recent repository activity. Read the full methodology on <Link className="text-link underline underline-offset-4" href="/how-it-works">How It Works</Link>.</p>
        <h3 className="font-sans text-base font-semibold text-text">Does a high score mean a repository is safe or guaranteed to be welcoming?</h3>
        <p>No. A score is a limited snapshot of documented public signals. It does not assess source-code quality, supply-chain risk, maintainers, response times, workplace conditions, commercial legitimacy, legal compliance, or whether a contribution will be accepted.</p>
        <h3 className="font-sans text-base font-semibold text-text">Why is my repository not found or incomplete?</h3>
        <p>The repository may be private, renamed, deleted, temporarily unavailable, malformed, rate-limited by GitHub, or missing public data needed for a check. Verify the `owner/repo` path and try again later.</p>
      </>
    ),
  },
  {
    id: "improving",
    title: "Improving an audit honestly",
    content: (
      <>
        <h3 className="font-sans text-base font-semibold text-text">How can I reach 100?</h3>
        <p>Use real contributor documentation, publish a meaningful code of conduct and license, describe a reproducible setup path, apply a good-first-issue label only to a genuinely approachable public issue, and maintain a truthful public activity signal. Do not create empty files or misleading issues solely to affect a score.</p>
        <h3 className="font-sans text-base font-semibold text-text">Why do good-first-issue labels matter?</h3>
        <p>They can give newcomers a scoped starting point. A trustworthy label has a clear outcome, enough context to begin safely, no hidden prerequisite, and a scope small enough for a first contribution. It is not a promise of mentoring, acceptance, or payment.</p>
        <h3 className="font-sans text-base font-semibold text-text">Will a change appear immediately?</h3>
        <p>Not always. WelcomeScore caches public scoring data briefly to reduce repeated GitHub requests. GitHub search and repository data can also take time to reflect a newly created file, label, or issue.</p>
      </>
    ),
  },
  {
    id: "reviews-and-badges",
    title: "Algofox reviews and badges",
    content: (
      <>
        <h3 className="font-sans text-base font-semibold text-text">What does Ask Algofox for a review do?</h3>
        <p>It creates a concise technical review using only the audit’s allowed contributor signals. The action is opt-in. It does not publish a message, add a Hall entry, access raw source code, or assess people.</p>
        <h3 className="font-sans text-base font-semibold text-text">Why can a review vary?</h3>
        <p>Equivalent evidence can be expressed in different concise ways. Deterministic guidance rotates bounded copy variants without repeating the immediately prior option for the same evidence context. Provider responses are validated against the audit before display.</p>
        <h3 className="font-sans text-base font-semibold text-text">Can I add a badge to my README?</h3>
        <p>Yes. The completed audit offers shareable badge formats that read the same scoring pipeline. A badge is not an endorsement, certification, warranty, or guarantee; it reflects the available audit data at the time it is generated.</p>
      </>
    ),
  },
  {
    id: "hall",
    title: "Hall of Fame",
    content: (
      <>
        <h3 className="font-sans text-base font-semibold text-text">Are repositories added automatically?</h3>
        <p>No. A qualifying result shows an explicit add action. Someone must deliberately choose that action before an eligible repository is written to the Hall of Fame.</p>
        <h3 className="font-sans text-base font-semibold text-text">Does appearing in the Hall of Fame mean ETHIOR endorses the repository?</h3>
        <p>No. The Hall of Fame reflects the product’s documented eligibility signals. It is not an endorsement, safety finding, commercial recommendation, employment recommendation, or guarantee.</p>
      </>
    ),
  },
  {
    id: "lounge",
    title: "Dev Lounge",
    content: (
      <>
        <h3 className="font-sans text-base font-semibold text-text">Is the Dev Lounge private?</h3>
        <p>No. It is an anonymous but public-in-context 24-hour discussion feature. Do not share credentials, personal data, financial information, private repository content, or security details.</p>
        <h3 className="font-sans text-base font-semibold text-text">Can I use the Lounge for hiring, deals, payments, or private services?</h3>
        <p>No. The Lounge is not a marketplace, recruiting service, payment platform, legal-advice channel, or escrow arrangement. Users are responsible for their own interactions and any decision to follow an external link or communicate elsewhere.</p>
        <h3 className="font-sans text-base font-semibold text-text">How do I report harmful content?</h3>
        <p>Use the project’s private reporting route described in the <Link className="text-link underline underline-offset-4" href="/dev-lounge-policy">Dev Lounge Policy</Link> and <Link className="text-link underline underline-offset-4" href="https://github.com/ethiorhq/welcomescore/blob/main/CODE_OF_CONDUCT.md">Code of Conduct</Link>. Do not repeat or amplify harmful content in a public issue.</p>
      </>
    ),
  },
  {
    id: "privacy",
    title: "Privacy, ownership, and forks",
    content: (
      <>
        <h3 className="font-sans text-base font-semibold text-text">What information does WelcomeScore process?</h3>
        <p>The service processes the public GitHub repository information needed for an audit and limited product data required for its documented features. The <Link className="text-link underline underline-offset-4" href="/privacy">Privacy Policy</Link> explains the actual data categories, retention, and third-party processing in more detail.</p>
        <h3 className="font-sans text-base font-semibold text-text">Can I fork or modify WelcomeScore?</h3>
        <p>WelcomeScore uses a source-available attribution license, not an OSI-approved open-source license. Permitted derivatives must retain the license, notices, and clear original-project attribution. See <Link className="text-link underline underline-offset-4" href="https://github.com/ethiorhq/welcomescore/blob/main/ATTRIBUTION.md">ATTRIBUTION.md</Link>.</p>
        <PolicyCallout>
          If you find a security vulnerability, do not use the Lounge or public issues. Follow the project’s private security-reporting guidance instead.
        </PolicyCallout>
      </>
    ),
  },
];

export default function FaqPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema).replace(/</g, "\\u003c") }}
      />
      <PolicyPage
        eyebrow="Developer reference"
        title="Frequently asked questions"
        description="Practical answers about repository audits, contribution signals, optional reviews, community features, and the boundaries of the service."
        effectiveDate="August 27, 2026"
        sections={sections}
      />
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import PolicyPage, { PolicyCallout, type PolicySection } from "@/app/components/PolicyPage";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "WelcomeScore Terms & Conditions",
  description: "The terms governing use of WelcomeScore audits, badges, optional reviews, Hall of Fame, Dev Lounge, and related project materials.",
  path: "/terms",
  imagePath: "/opengraph-image",
  imageAlt: "WelcomeScore Terms and Conditions",
});

const sections: PolicySection[] = [
  {
    id: "agreement",
    title: "Acceptance and scope",
    content: (
      <>
        <p>These Terms & Conditions govern your access to and use of the canonical hosted WelcomeScore service, including its public repository audit, shareable badges, optional Algofox review, Hall of Fame, Dev Lounge, and related pages. WelcomeScore is an ETHIOR project.</p>
        <p>By accessing or using the service, you agree to these terms, the <Link className="text-link underline underline-offset-4" href="/privacy">Privacy Policy</Link>, and the <Link className="text-link underline underline-offset-4" href="/dev-lounge-policy">Dev Lounge Policy</Link>. If you do not agree, do not use the service or community features. These terms apply to the canonical hosted product and do not automatically govern independent forks, third-party integrations, or external websites.</p>
      </>
    ),
  },
  {
    id: "service",
    title: "Service description and limits",
    content: (
      <>
        <p>WelcomeScore evaluates a defined set of public GitHub contributor-readiness signals. It may display a score, grade, checklist, optional evidence-bound review, badge, explicitly requested dated audit receipt, and eligibility-related Hall of Fame information. The service may use caches, public APIs, databases, and optional review providers to deliver these features.</p>
        <p>The service is provided for general informational and developer-productivity purposes. It is not a security audit, legal opinion, compliance review, investment analysis, employment recommendation, due-diligence report, warranty, endorsement, certification, or guarantee of repository quality, maintainer conduct, availability, safety, legality, or suitability.</p>
        <PolicyCallout>Do not rely on a score, badge, review, Hall entry, chat message, external link, or another user’s statement as the sole basis for a contribution, business decision, hiring decision, financial transaction, legal decision, security decision, or off-platform interaction.</PolicyCallout>
      </>
    ),
  },
  {
    id: "acceptable-use",
    title: "Acceptable use",
    content: (
      <>
        <p>You may use the service for lawful, respectful purposes and only submit public repository paths or content that you are permitted to provide. You must not interfere with the service, evade rate limits or access controls, probe for vulnerabilities without authorization, introduce malicious code, scrape or overload the service, impersonate another person, or use the service to violate law, platform rules, privacy, intellectual-property rights, or these terms.</p>
        <p>You must not submit credentials, tokens, passwords, private keys, payment details, personal data, private repository material, confidential information, exploit details, or unlawful or harmful content. Do not use the Dev Lounge for spam, scams, phishing, solicitation, recruiting, investment offers, paid services, transactions, or private deals. Do not use a badge, dated audit receipt, Hall reference, or sharing prompt to solicit artificial stars, forks, follows, votes, reciprocal engagement, or to make unsupported quality, safety, legal, or endorsement claims.</p>
      </>
    ),
  },
  {
    id: "community",
    title: "Dev Lounge and user interactions",
    content: (
      <>
        <p>The Dev Lounge is an anonymous, limited-retention community feature for practical contributor discussion. It is not private messaging, customer support, a marketplace, a recruiting platform, professional-advice service, payment system, escrow service, or moderation guarantee. Messages may be removed, restricted, or reported according to project policies and operational needs. Reply mentions are display text for conversation context only; they do not create notifications, identity verification, or private contact.</p>
        <p>You are solely responsible for content you submit, links you follow, people you choose to contact, information you disclose, and any off-platform interaction or agreement. WelcomeScore, ETHIOR, the original authors, maintainers, contributors, and service providers do not participate in, endorse, verify, guarantee, supervise, or assume responsibility for user-to-user communications, work offers, services, transactions, agreements, external links, conduct, losses, or harm arising from them.</p>
        <p>Private reports may trigger a constrained server-side AI safety assessment of the reported public message and report category. The assessment is not a legal or factual judgment. A report by itself does not remove content; automatic hiding is limited to clear, high-confidence serious policy violations, while uncertain reports remain available for owner review. You must not evade visitor verification, rate limits, or other safety controls. Use appropriate caution and independently verify any repository, identity, offer, service, payment request, or claim before acting. For conduct expectations, reporting, and correction requests, read the <Link className="text-link underline underline-offset-4" href="/dev-lounge-policy">Dev Lounge Policy</Link> and the project <Link className="text-link underline underline-offset-4" href="https://github.com/ethiorhq/welcomescore/blob/main/CODE_OF_CONDUCT.md">Code of Conduct</Link>.</p>
      </>
    ),
  },
  {
    id: "content",
    title: "Your content and public repositories",
    content: (
      <>
        <p>You retain any rights you have in content you submit, subject to the rights needed to operate the requested feature. By submitting content to a public community feature, you grant ETHIOR a non-exclusive, worldwide, royalty-free, limited license to host, display, reproduce, adapt for technical formatting and moderation, and remove that content as necessary to operate, secure, and improve the service for the applicable retention period.</p>
        <p>Public repository information is evaluated from public sources. You are responsible for confirming that you have a legitimate reason to submit a repository path and for interpreting any resulting information. A request to audit a repository does not create a relationship with its owner or maintainers.</p>
      </>
    ),
  },
  {
    id: "intellectual-property",
    title: "Intellectual property, badges, and attribution",
    content: (
      <>
        <p>WelcomeScore, WelcomeScore.js.org, ETHIOR, related logos, visual identity, software, documentation, and product content are protected by applicable intellectual-property laws. Except for the limited rights expressly granted in the project license or these terms, no rights are granted by implication.</p>
        <p>The public source repository is made available under a source-available attribution license. It is not an OSI-approved open-source license. Any permitted redistribution, derivative, or public deployment must retain the license, notices, and visible original-project attribution required by the license. See <Link className="text-link underline underline-offset-4" href="https://github.com/ethiorhq/welcomescore/blob/main/ATTRIBUTION.md">ATTRIBUTION.md</Link> for the practical attribution format.</p>
        <p>A generated badge may be used to display the relevant WelcomeScore result, provided you do not alter it to misrepresent the score, claim endorsement, or conceal the source of the result. An explicitly created Share With Purpose receipt is a limited, signed public snapshot with an expiry; it is not a current-state guarantee and must not be presented as a certificate. Badges, dated receipts, and Hall entries are informational outputs, not certifications.</p>
      </>
    ),
  },
  {
    id: "disclaimers",
    title: "Disclaimers",
    content: (
      <>
        <p>THE SERVICE IS PROVIDED “AS IS” AND “AS AVAILABLE.” TO THE MAXIMUM EXTENT PERMITTED BY LAW, ETHIOR DISCLAIMS ALL WARRANTIES, EXPRESS, IMPLIED, STATUTORY, OR OTHERWISE, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, NON-INFRINGEMENT, ACCURACY, SECURITY, AVAILABILITY, AND ERROR-FREE OR UNINTERRUPTED OPERATION.</p>
        <p>Public data, third-party APIs, review providers, caches, links, and user-generated content can be incomplete, stale, inaccurate, unavailable, altered, or misleading. A dated audit receipt reflects only the signed public snapshot and expires rather than updating itself. ETHIOR does not guarantee the accuracy, completeness, reliability, timing, availability, or security of any audit, review, badge, dated receipt, Hall entry, chat message, link, or third-party service.</p>
      </>
    ),
  },
  {
    id: "liability",
    title: "Limitation of liability",
    content: (
      <p>TO THE MAXIMUM EXTENT PERMITTED BY LAW, ETHIOR, ITS AFFILIATES, AUTHORS, MAINTAINERS, CONTRIBUTORS, LICENSORS, AND SERVICE PROVIDERS WILL NOT BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES, OR FOR LOSS OF DATA, PROFITS, REVENUE, BUSINESS, GOODWILL, OR OPPORTUNITY, ARISING OUT OF OR RELATED TO THE SERVICE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES. WHERE LIABILITY CANNOT BE EXCLUDED, IT IS LIMITED TO THE MINIMUM EXTENT PERMITTED BY APPLICABLE LAW.</p>
    ),
  },
  {
    id: "changes",
    title: "Changes, suspension, and termination",
    content: (
      <>
        <p>ETHIOR may update, modify, suspend, restrict, or discontinue any part of the service, policies, or features, including the Dev Lounge and review providers, when reasonably necessary for maintenance, security, safety, legal compliance, abuse prevention, or product evolution. ETHIOR may remove content or restrict access where it reasonably believes these terms, project policies, law, or platform rules have been violated.</p>
        <p>Material updates will be reflected through the effective date on the relevant public policy page and source repository. Your continued use after an effective update is subject to the updated terms to the extent permitted by law.</p>
      </>
    ),
  },
  {
    id: "contact",
    title: "Questions and reporting",
    content: (
      <p>For non-sensitive questions about these terms, use the canonical <Link className="text-link underline underline-offset-4" href="https://github.com/ethiorhq/welcomescore">WelcomeScore repository</Link>. For vulnerabilities, follow <Link className="text-link underline underline-offset-4" href="https://github.com/ethiorhq/welcomescore/blob/main/SECURITY.md">SECURITY.md</Link>. For conduct reports, use the project process in <Link className="text-link underline underline-offset-4" href="https://github.com/ethiorhq/welcomescore/blob/main/CODE_OF_CONDUCT.md">CODE_OF_CONDUCT.md</Link>.</p>
    ),
  },
];

export default function TermsPage() {
  return (
    <PolicyPage
      eyebrow="Legal and community"
      title="Terms & Conditions"
      description="The boundaries for using WelcomeScore, reading its audit outputs, participating in the Dev Lounge, and working with project materials."
      effectiveDate="August 27, 2026"
      sections={sections}
    />
  );
}

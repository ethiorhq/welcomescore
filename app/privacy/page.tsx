import type { Metadata } from "next";
import Link from "next/link";
import PolicyPage, { PolicyCallout, PolicyTable, type PolicySection } from "@/app/components/PolicyPage";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "WelcomeScore Privacy Policy: Public Audits and Community Data",
  description: "A transparent summary of public repository, review, Hall of Fame, and Dev Lounge data processed by WelcomeScore, including retention and user controls.",
  path: "/privacy",
  imagePath: "/opengraph-image",
  imageAlt: "WelcomeScore Privacy Policy for public repository audits and Dev Lounge data",
});

const sections: PolicySection[] = [
  {
    id: "scope",
    title: "Scope and plain-language summary",
    content: (
      <>
        <p>
          This Privacy Policy explains how WelcomeScore, an ETHIOR project, processes information when you use the hosted WelcomeScore service, including public repository audits, optional Algofox reviews, the Hall of Fame, and the Dev Lounge. It applies to the canonical hosted service and does not automatically apply to forks, third-party websites, linked services, or modified deployments.
        </p>
        <PolicyCallout>
          WelcomeScore is designed to evaluate public GitHub contributor signals. Do not submit secrets, personal data, private repository material, payment information, or security-vulnerability details to the service or the Dev Lounge.
        </PolicyCallout>
      </>
    ),
  },
  {
    id: "data",
    title: "Information the service processes",
    content: (
      <PolicyTable>
        <thead className="border-b border-muted/25 font-mono text-xs uppercase tracking-[0.12em] text-muted">
          <tr><th className="px-4 py-3 font-semibold">Feature</th><th className="px-4 py-3 font-semibold">Information processed</th><th className="px-4 py-3 font-semibold">Purpose</th></tr>
        </thead>
        <tbody className="divide-y divide-muted/15 text-muted">
          <tr><td className="px-4 py-3 font-mono text-text">Repository audit</td><td className="px-4 py-3">The repository path you enter and the public GitHub metadata needed for the six published checks, such as public files, README/setup signals, license metadata, issue-label results, and recent push status.</td><td className="px-4 py-3">To calculate and display the requested contributor-readiness score.</td></tr>
          <tr><td className="px-4 py-3 font-mono text-text">JavaScript Health</td><td className="px-4 py-3">For an explicit public GitHub check, the repository path and allowlisted public signals: root package metadata, selected configuration-file paths, workflow indicators, and starter-label names. The dashboard does not return raw manifests or workflow bodies, and it does not read local files. The optional CLI reads the selected local project directory but does not upload source files, package manifests, environment values, repository credentials, or analytics to WelcomeScore.</td><td className="px-4 py-3">To produce a requested JavaScript and TypeScript package-maintenance report.</td></tr>
          <tr><td className="px-4 py-3 font-mono text-text">Optional Algofox review</td><td className="px-4 py-3">A normalized audit context: repository path, score, grade, primary language, documented check outcomes, and permitted focus checks. The feature does not send raw README bodies, issue text, source code, browser-submitted metrics, Hall data, or Lounge data to a review provider.</td><td className="px-4 py-3">To generate an opt-in, evidence-bound review.</td></tr>
          <tr><td className="px-4 py-3 font-mono text-text">Review rate limit</td><td className="px-4 py-3">When enabled, a salted hash derived from a network identifier and a short request-count window. The raw IP address is not stored in the review-rate-limit record.</td><td className="px-4 py-3">To protect the opt-in review endpoint from excessive use.</td></tr>
          <tr><td className="px-4 py-3 font-mono text-text">Share With Purpose receipt</td><td className="px-4 py-3">Only after you explicitly create one: a signed, dated subset of public audit facts—repository path, score, grade, selected passed-check labels, selected open good-first-issue count, default branch, issue time, and expiry. It excludes raw README/code/issue content, browser identity, workspace notes, AI review content, Hall/Lounge data, and credentials.</td><td className="px-4 py-3">To provide a tamper-evident public link for the contributor context you chose to share.</td></tr>
          <tr><td className="px-4 py-3 font-mono text-text">Hall of Fame</td><td className="px-4 py-3">An eligible public repository’s audit information when a visitor explicitly chooses to add it.</td><td className="px-4 py-3">To display a public, eligibility-based ranking record.</td></tr>
          <tr><td className="px-4 py-3 font-mono text-text">Dev Lounge</td><td className="px-4 py-3">The anonymous message, quoted-reply snapshot, optional score card, reaction choice, temporary browser-generated developer handle/avatar, and session-scoped identifiers needed for the chat and one-reaction rule.</td><td className="px-4 py-3">To provide a lightweight 24-hour community discussion experience.</td></tr>
          <tr><td className="px-4 py-3 font-mono text-text">My Contributor Workspace</td><td className="px-4 py-3">A repository path, chosen contributor action, optional private note, local work state, return preference, and a small public-audit snapshot when you explicitly save a plan. This feature stores the information only in your current browser.</td><td className="px-4 py-3">To let you resume a private contributor plan and choose when to request a fresh public audit.</td></tr>
        </tbody>
      </PolicyTable>
    ),
  },
  {
    id: "retention",
    title: "Retention and deletion",
    content: (
      <>
        <p>Public GitHub scoring data, including explicit JavaScript Health requests, is cached briefly to reduce repeated upstream requests. JavaScript Health reports are generated from requested public signals and are not stored as an account profile or report history.</p>
        <p>Private review-cache entries store a normalized context hash and a validated review result. Deterministic review entries are retained for up to 24 hours; validated provider-review entries are retained for up to seven days. Cache retention can be shorter if an entry expires or is cleared through normal operations.</p>
        <p>Dev Lounge messages and related temporary chat records are designed to expire after 24 hours. Quoted-reply snapshots may remain only for the same limited retention period. Browser-local identity details are stored in your browser and can generally be removed by clearing the site’s local storage or browser data.</p>
        <p>My Contributor Workspace plans, including optional private notes and saved audit snapshots, remain only in the browser where you saved them. WelcomeScore does not receive, sync, sell, profile, or publish those workspace records. You can clear an individual plan, clear all plans from the workspace, or clear site storage through your browser.</p>
        <p>A Share With Purpose receipt is created only after an explicit request. It is a signed public URL, so anyone with the link can view its limited public-audit snapshot until its 21-day expiry. WelcomeScore does not create a receipt index, user share history, receipt-issuance log, or share/click analytics for this feature. An expired receipt no longer displays its score or audit facts.</p>
        <p>Public Hall of Fame records may remain available while they satisfy the service’s documented freshness and eligibility rules. Because they relate to public repositories, removal and correction requests should be made through the canonical project repository with enough public context to locate the record.</p>
      </>
    ),
  },
  {
    id: "sharing",
    title: "Service providers and public disclosure",
    content: (
      <>
        <p>WelcomeScore obtains public repository information from GitHub. The hosted application and permitted product data are operated through its deployment and database services. Optional review calls may use configured AI providers; the service sends only the constrained audit context described above, and uses a stateless provider setting where supported.</p>
        <p>Information submitted to the Dev Lounge is visible to other Lounge participants for its retention period. A Hall of Fame entry is public once a visitor explicitly adds an eligible repository. A Share With Purpose receipt is public only if a visitor explicitly creates and shares its link; opening the composer does not create it. External sharing websites are separate services governed by their own policies. WelcomeScore may disclose information where reasonably necessary to operate the service, protect users or infrastructure, investigate abuse or security concerns, comply with applicable law, or enforce the published terms.</p>
        <p>WelcomeScore does not sell a user’s private information through the application. However, external services and links are governed by their own terms and privacy practices. Review their policies before providing them any information.</p>
      </>
    ),
  },
  {
    id: "choices",
    title: "Your choices and responsibilities",
    content: (
      <>
        <p>You may choose not to submit a repository, request a JavaScript Health check, run the local CLI, request an optional review, save a private contributor plan, request a fresh audit, create or share a dated audit receipt, add an eligible Hall entry, post in the Lounge, attach a score card, react, or follow an external link. My Contributor Workspace does not set reminders or run checks on its own; you choose when to resume work or clear local plans. Do not use the Lounge for private conversations, personal information, credentials, transactions, recruiting, legal advice, security reports, or sensitive content.</p>
        <p>You are responsible for ensuring that you have permission to submit any repository path, message, score card, or other content. If you believe public content in a project-controlled feature is inaccurate, unlawful, infringing, or harmful, use the conduct and support routes described below. Do not post sensitive reports publicly.</p>
      </>
    ),
  },
  {
    id: "security",
    title: "Security and policy updates",
    content: (
      <>
        <p>No internet service can guarantee absolute security. WelcomeScore uses practical separation of browser-safe and server-only credentials, private review-cache permissions, and limited retention, but you should still avoid sharing sensitive information. For a suspected vulnerability, follow <Link className="text-link underline underline-offset-4" href="https://github.com/ethiorhq/welcomescore/blob/main/SECURITY.md">SECURITY.md</Link> rather than posting publicly.</p>
        <p>ETHIOR may update this policy as the product changes. Material updates will be reflected on this page and in the source repository. Continued use after an effective update is subject to the updated policy to the extent permitted by law.</p>
      </>
    ),
  },
  {
    id: "contact",
    title: "Questions and reports",
    content: (
      <p>For a non-sensitive policy question or correction request, use the canonical <Link className="text-link underline underline-offset-4" href="https://github.com/ethiorhq/welcomescore">WelcomeScore repository</Link>. For security reports, use the private route in <Link className="text-link underline underline-offset-4" href="https://github.com/ethiorhq/welcomescore/blob/main/SECURITY.md">SECURITY.md</Link>. For conduct concerns, use the process in <Link className="text-link underline underline-offset-4" href="https://github.com/ethiorhq/welcomescore/blob/main/CODE_OF_CONDUCT.md">CODE_OF_CONDUCT.md</Link>.</p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <PolicyPage
      eyebrow="Legal and privacy"
      title="Privacy Policy"
      description="A transparent account of the limited public repository, review, community, and operational data used to run WelcomeScore."
      effectiveDate="August 27, 2026"
      sections={sections}
    />
  );
}

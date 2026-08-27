import type { Metadata } from "next";
import Link from "next/link";
import PolicyPage, { PolicyCallout, PolicyTable, type PolicySection } from "@/app/components/PolicyPage";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "WelcomeScore Dev Lounge Policy: Safe Community Participation",
  description: "Community rules, privacy boundaries, temporary retention, and reporting guidance for WelcomeScore’s anonymous Dev Lounge.",
  path: "/dev-lounge-policy",
  imagePath: "/opengraph-image",
  imageAlt: "WelcomeScore Dev Lounge community safety policy",
});

const sections: PolicySection[] = [
  {
    id: "purpose",
    title: "Purpose and scope",
    content: (
      <>
        <p>The Dev Lounge is a lightweight, anonymous, 24-hour space for practical first-contributor questions, contributor encouragement, and score-card discussion. It is a community feature of WelcomeScore, not a private chat service.</p>
        <p>This policy applies to messages, reply snapshots, score-card attachments, reactions, visible developer handles and avatars, and related behavior in the Dev Lounge. It works alongside the project <Link className="text-link underline underline-offset-4" href="https://github.com/ethiorhq/welcomescore/blob/main/CODE_OF_CONDUCT.md">Code of Conduct</Link>, <Link className="text-link underline underline-offset-4" href="/terms">Terms & Conditions</Link>, and <Link className="text-link underline underline-offset-4" href="/privacy">Privacy Policy</Link>.</p>
      </>
    ),
  },
  {
    id: "safe-participation",
    title: "Participate safely",
    content: (
      <>
      <PolicyTable>
        <thead className="border-b border-muted/25 font-mono text-xs uppercase tracking-[0.12em] text-muted"><tr><th className="px-4 py-3 font-semibold">Use the Lounge for</th><th className="px-4 py-3 font-semibold">Do not use the Lounge for</th></tr></thead>
        <tbody className="divide-y divide-muted/15 text-muted">
          <tr><td className="px-4 py-3">Practical questions about first contributions, project documentation, newcomer-friendly workflows, and constructive open-source progress.</td><td className="px-4 py-3">Credentials, private keys, access tokens, passwords, personal data, payment details, private repository material, or security-vulnerability details.</td></tr>
          <tr><td className="px-4 py-3">Encouragement, concise lessons learned, and links that can be evaluated safely and independently.</td><td className="px-4 py-3">Scams, phishing, malware, impersonation, spam, harassment, hate, threats, doxxing, sexualized content, or deceptive links.</td></tr>
          <tr><td className="px-4 py-3">Public, respectful discussion about contributor experience.</td><td className="px-4 py-3">Recruiting, job offers, commercial services, investment pitches, transactions, payments, private deals, legal advice, medical advice, or emergency support.</td></tr>
        </tbody>
      </PolicyTable>
      <PolicyCallout>
        Never assume an anonymous handle, score card, link, or message verifies a person’s identity, skills, intent, project ownership, or legitimacy. Independently verify information before taking any action outside the Lounge.
      </PolicyCallout>
      </>
    ),
  },
  {
    id: "no-deals",
    title: "No deals, transactions, or off-platform responsibility",
    content: (
      <>
        <p>WelcomeScore does not host, broker, review, approve, escrow, insure, supervise, or guarantee any interaction between Lounge participants. The feature must not be used to arrange work, hire or recruit people, request payment, sell services, solicit investments, offer rewards, conduct trades, or move a user into a private or off-platform transaction.</p>
        <p>You are solely responsible for deciding whether to read, trust, contact, respond to, follow, download from, pay, hire, collaborate with, or otherwise interact with another user or external service. WelcomeScore, ETHIOR, the original authors, maintainers, contributors, and service providers are not responsible for user communications, external links, third-party content, agreements, transactions, representations, conduct, losses, or harm arising from them, to the maximum extent permitted by law.</p>
      </>
    ),
  },
  {
    id: "retention",
    title: "Anonymity, visibility, and retention",
    content: (
      <>
        <p>The Lounge uses a temporary browser-generated developer handle and avatar rather than a traditional user account. This does not make a message private, confidential, or anonymous against every possible technical or legal process. Do not publish information that you would not want visible to other Lounge participants.</p>
        <p>Messages and related chat records are designed to disappear after 24 hours. Reactions and reply snapshots are used to support the Lounge feature during its limited lifetime. Temporary technical records may be retained for security, rate limiting, abuse prevention, debugging, or legal obligations as described in the <Link className="text-link underline underline-offset-4" href="/privacy">Privacy Policy</Link>.</p>
      </>
    ),
  },
  {
    id: "moderation",
    title: "Moderation and enforcement",
    content: (
      <>
        <p>WelcomeScore may apply technical controls, remove content, limit interaction, suspend participation, preserve information needed for an investigation, or report conduct to a platform provider or relevant authority when reasonably necessary for safety, security, legal compliance, or enforcement of published policies.</p>
        <p>Moderation may be delayed, incomplete, or unavailable. The existence of the Lounge does not create a duty to monitor every message or guarantee that harmful, false, inappropriate, or unlawful content will be detected or removed. Do not rely on moderation as a substitute for your own judgment or safety precautions.</p>
      </>
    ),
  },
  {
    id: "reporting",
    title: "Reporting concerns",
    content: (
      <>
        <p>For harmful, abusive, fraudulent, or policy-violating content, preserve only the minimum necessary details and use the private reporting route on the canonical <Link className="text-link underline underline-offset-4" href="https://github.com/ethiorhq/welcomescore">WelcomeScore repository</Link>. Do not repost harmful material publicly or use the Lounge to report a security vulnerability.</p>
        <p>For a suspected security issue, follow <Link className="text-link underline underline-offset-4" href="https://github.com/ethiorhq/welcomescore/blob/main/SECURITY.md">SECURITY.md</Link>. For imminent danger, credible threats, or a crime in progress, contact the relevant local emergency service or platform safety channel first. WelcomeScore is not an emergency service.</p>
      </>
    ),
  },
  {
    id: "updates",
    title: "Changes to this policy",
    content: (
      <p>ETHIOR may update this policy to reflect product changes, safety requirements, legal obligations, or operational needs. The current version and effective date will be published on this page and in the source repository. Continued participation after an effective update is subject to the updated policy to the extent permitted by law.</p>
    ),
  },
];

export default function DevLoungePolicyPage() {
  return (
    <PolicyPage
      eyebrow="Community safety"
      title="Dev Lounge Policy"
      description="Clear, developer-friendly rules for using the temporary community chat safely, respectfully, and without private-deal risk."
      effectiveDate="August 27, 2026"
      sections={sections}
    />
  );
}

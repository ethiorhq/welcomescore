import type { Metadata } from "next";
import Link from "next/link";
import PolicyPage, { PolicyCallout, PolicyTable, type PolicySection } from "@/app/components/PolicyPage";

export const metadata: Metadata = {
  title: "How WelcomeScore works",
  description: "A transparent explanation of WelcomeScore’s public contributor-readiness audit, reviews, Hall of Fame, and Dev Lounge.",
};

const sections: PolicySection[] = [
  {
    id: "purpose",
    title: "What WelcomeScore measures",
    content: (
      <>
        <p>
          WelcomeScore provides a practical snapshot of how approachable a <strong className="font-semibold text-text">public GitHub repository</strong> appears to a first-time contributor. It looks for visible contributor signals that reduce uncertainty before a person invests time in a first issue or pull request.
        </p>
        <p>
          A score is not a certification, security assessment, legal opinion, employment recommendation, investment signal, endorsement, or guarantee that a repository is safe, maintained, welcoming, or suitable for a particular person. It is a structured prompt for maintainers to improve public onboarding information and for contributors to investigate further.
        </p>
        <PolicyCallout>
          WelcomeScore evaluates public project signals only. It does not inspect private repositories, source-code quality, dependencies, tests, maintainers, employment opportunities, commercial offers, transactions, or agreements between users.
        </PolicyCallout>
      </>
    ),
  },
  {
    id: "score",
    title: "The 100-point audit",
    content: (
      <>
        <p>The audit uses the same six documented checks for every eligible public repository.</p>
        <PolicyTable>
          <thead className="border-b border-muted/25 font-mono text-xs uppercase tracking-[0.12em] text-muted">
            <tr>
              <th className="px-4 py-3 font-semibold">Signal</th>
              <th className="px-4 py-3 font-semibold">Maximum</th>
              <th className="px-4 py-3 font-semibold">Why it helps a newcomer</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-muted/15 text-muted">
            <tr><td className="px-4 py-3 font-mono text-text">CONTRIBUTING.md</td><td className="px-4 py-3">20</td><td className="px-4 py-3">Explains how to choose work, prepare a change, and submit a pull request.</td></tr>
            <tr><td className="px-4 py-3 font-mono text-text">CODE_OF_CONDUCT.md</td><td className="px-4 py-3">15</td><td className="px-4 py-3">Makes community expectations visible before a person participates.</td></tr>
            <tr><td className="px-4 py-3 font-mono text-text">README setup section</td><td className="px-4 py-3">15</td><td className="px-4 py-3">Shows how a contributor can reach a first successful local run.</td></tr>
            <tr><td className="px-4 py-3 font-mono text-text">LICENSE</td><td className="px-4 py-3">10</td><td className="px-4 py-3">Clarifies that use and contribution are governed by published terms.</td></tr>
            <tr><td className="px-4 py-3 font-mono text-text">Good-first-issue labels</td><td className="px-4 py-3">25</td><td className="px-4 py-3">Provides visible, scoped entry points in the public issue tracker.</td></tr>
            <tr><td className="px-4 py-3 font-mono text-text">Recent activity</td><td className="px-4 py-3">15</td><td className="px-4 py-3">Offers a limited public signal that the repository has recent push activity.</td></tr>
          </tbody>
        </PolicyTable>
        <p>
          The total score ranges from 0 to 100 and is presented with a letter grade. The audit is intentionally limited: a high score does not prove that every issue is appropriate, that maintainers will respond, or that a contribution will be accepted. A lower score identifies visible opportunities; it does not judge a project or its people.
        </p>
      </>
    ),
  },
  {
    id: "data",
    title: "Where the audit data comes from",
    content: (
      <>
        <p>
          When you request an audit, WelcomeScore reads the public repository data necessary for the documented checks from GitHub. This can include public repository metadata, the default branch, the presence of contributor documents, license metadata, the public README, publicly searchable issue labels, and the repository’s publicly reported recent push date.
        </p>
        <p>
          To reduce unnecessary external requests, public scoring data is cached for a short period. Cached data can be stale, unavailable, rate-limited, incomplete, renamed, or differently interpreted by GitHub. If a repository is private, deleted, inaccessible, malformed, or temporarily unavailable, the audit may be unable to return a result.
        </p>
      </>
    ),
  },
  {
    id: "review",
    title: "Algofox review guidance",
    content: (
      <>
        <p>
          After an audit, a visitor may explicitly select <strong className="font-semibold text-text">Ask Algofox for a review</strong>. The review starts from the audit’s verified score signals and provides a short, technical, evidence-bound observation. It does not publish anything, add a Hall of Fame entry, post to the Dev Lounge, or inspect raw repository source code on your behalf.
        </p>
        <p>
          The review feature can use an optional provider or a deterministic evidence rule. Every accepted provider response is checked again against the audit’s allowed focus signals. Reviews are guidance, not a guarantee, professional advice, or an assessment of a project’s security, legal status, maintainers, or commercial suitability.
        </p>
      </>
    ),
  },
  {
    id: "community",
    title: "Hall of Fame and Dev Lounge",
    content: (
      <>
        <p>
          An audit never enters the Hall of Fame automatically. A repository must first satisfy the published eligibility criteria, and a visitor must then select the explicit add action. The Hall of Fame is a product feature, not an endorsement, quality certification, or business recommendation.
        </p>
        <p>
          The Dev Lounge is a lightweight anonymous 24-hour discussion space for practical contributor questions and encouragement. It is not a private channel, marketplace, professional-advice service, recruiting platform, escrow service, or moderation guarantee. Read the <Link className="text-link underline underline-offset-4" href="/dev-lounge-policy">Dev Lounge Policy</Link> before participating.
        </p>
      </>
    ),
  },
  {
    id: "improve",
    title: "How maintainers can improve a score honestly",
    content: (
      <>
        <p>
          The best improvements are real and useful: publish a contributor guide, document the local setup path, add a clear code of conduct and license, create accurately scoped starter issues, and keep the repository’s public maintenance signals current. Do not add empty files, misleading labels, fabricated issues, or superficial text solely to influence a score.
        </p>
        <p>
          The project repository provides a detailed <Link className="text-link underline underline-offset-4" href="https://github.com/ethiorhq/welcomescore/blob/main/CONTRIBUTING.md">contribution guide</Link>, including criteria for a trustworthy good-first-issue label.
        </p>
      </>
    ),
  },
];

export default function HowItWorksPage() {
  return (
    <PolicyPage
      eyebrow="Product guide"
      title="How WelcomeScore works"
      description="A transparent, evidence-bound audit for the public signals that make a first open-source contribution easier to begin."
      effectiveDate="August 27, 2026"
      sections={sections}
    />
  );
}

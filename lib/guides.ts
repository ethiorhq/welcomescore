export type GuideSection = {
  heading: string;
  paragraphs: string[];
  checklist?: string[];
  callout?: string;
};

export type Guide = {
  slug: string;
  title: string;
  description: string;
  summary: string;
  category: string;
  keywords: string[];
  publishedAt: string;
  updatedAt: string;
  readingTime: string;
  sections: GuideSection[];
  relatedSlugs: string[];
};

export const GUIDES: Guide[] = [
  {
    slug: "open-source-contributor-onboarding-checklist",
    title: "A practical open-source contributor onboarding checklist",
    description:
      "A calm, practical checklist for choosing a repository, preparing a local setup, selecting first work, and opening a useful first pull request.",
    summary:
      "Good contributor onboarding removes uncertainty before it asks a newcomer to write code. Use this checklist to decide whether a repository is ready for your first contribution and to prepare a respectful first change.",
    category: "Contributor workflow",
    keywords: ["open source contributor guide", "first contribution", "GitHub onboarding"],
    publishedAt: "2026-08-27",
    updatedAt: "2026-08-27",
    readingTime: "7 min read",
    sections: [
      {
        heading: "Start with public evidence, not promises",
        paragraphs: [
          "A welcoming repository makes its working agreement visible. Before cloning anything, read the README, contribution guide, code of conduct, license, and recent issues. These documents do not guarantee that a maintainer can respond immediately or accept a patch, but they show whether the project has created a clear path for participation.",
          "Look for a setup section you can reproduce, a concise explanation of how work is reviewed, and an issue whose expected outcome is understandable. If the repository asks you to contact someone privately before you can understand the task, or if the first step requires credentials you do not own, choose a smaller starting point or ask a public clarification question.",
        ],
        checklist: [
          "Read the README, CONTRIBUTING.md, CODE_OF_CONDUCT.md, and LICENSE.",
          "Check that recent activity and issue discussion give enough context to begin.",
          "Avoid publishing tokens, private keys, personal data, or private project material in an issue or pull request.",
        ],
      },
      {
        heading: "Choose a first task with a bounded outcome",
        paragraphs: [
          "A good first contribution has a small, independently valuable finish line. Examples include clarifying one setup step, adding a missing accessible label, correcting a reproducible documentation example, or covering a well-defined parsing edge case. A task is not beginner-friendly merely because it is labeled that way; it should explain the problem, likely files, acceptance criteria, and what is deliberately out of scope.",
          "If an issue is unclear, comment before beginning. State what you think the desired outcome is, which area you plan to inspect, and the smallest change you expect to make. This avoids duplicated work and gives maintainers an easy way to correct assumptions early.",
        ],
      },
      {
        heading: "Reproduce the setup before changing code",
        paragraphs: [
          "Treat the unmodified repository as your baseline. Install the documented dependencies, run the available checks, and verify that the application or test suite behaves as described before editing. Record only non-sensitive errors and environment details so you can explain a problem clearly if the setup does not work.",
          "Keep credentials in local environment files that are ignored by Git. A maintainer should never need your token, cookie, password, or provider key to understand a contribution. If a step depends on a secret or private system, ask whether there is a safe local substitute or a separate issue suitable for newcomers.",
        ],
        callout:
          "A first contribution should be easy to review, not merely easy to begin. Small scope, a clear before/after, and repeatable validation are more valuable than a large patch.",
      },
      {
        heading: "Write a pull request that respects reviewer time",
        paragraphs: [
          "Describe the problem in plain language, summarize the smallest change made, list validation you actually ran, and name any follow-up work you intentionally left out. Link the issue when one exists. Screenshots are useful for visible changes, but redact account data, tokens, private URLs, and unrelated browser tabs.",
          "A review request is not a demand for immediate feedback. Respond to questions constructively, keep discussion focused on the work, and be ready to revise or close a change if the repository’s priorities have moved. This is normal collaboration, not a failure.",
        ],
      },
    ],
    relatedSlugs: [
      "write-contributing-guide-developers-use",
      "honest-good-first-issues",
    ],
  },
  {
    slug: "write-contributing-guide-developers-use",
    title: "How to write a CONTRIBUTING.md developers will actually use",
    description:
      "A practical framework for a short, usable contributor guide: prerequisites, local setup, issue selection, pull requests, validation, and security boundaries.",
    summary:
      "A contribution guide succeeds when it turns a willing newcomer into a prepared collaborator without making them guess about setup, scope, review, or safety.",
    category: "Maintainer guide",
    keywords: ["CONTRIBUTING.md template", "open source maintainer", "contributor documentation"],
    publishedAt: "2026-08-27",
    updatedAt: "2026-08-27",
    readingTime: "8 min read",
    sections: [
      {
        heading: "Write for the first successful local run",
        paragraphs: [
          "The most important part of a contributor guide is the path from clone to a working baseline. State the supported runtime and package manager, show the exact installation and start commands, identify the default local URL, and explain any safe optional configuration. A newcomer should not have to infer which command starts the project or whether a failure is expected.",
          "Keep server-only credentials out of examples. If an integration is optional, say what works without it and where to place locally supplied values. A good guide distinguishes public configuration from secrets rather than asking contributors to copy a production environment.",
        ],
        checklist: [
          "Prerequisites and supported runtime versions.",
          "Clone, install, and local-start commands that were recently verified.",
          "A safe explanation of optional environment variables and never-commit rules.",
        ],
      },
      {
        heading: "Explain how work is selected and scoped",
        paragraphs: [
          "Tell contributors where issues live, what labels mean, and how to ask before starting ambiguous work. A useful good-first-issue definition describes a bounded outcome, relevant files, acceptance criteria, and excluded work. It does not promise mentoring, payment, or merge approval.",
          "Document the project principles that should guide decisions when no issue exists. For example, WelcomeScore keeps repository guidance evidence-bound, preserves explicit user actions, and avoids exposing secrets or adding surprising automation. Principles make review comments more predictable than undocumented preferences.",
        ],
      },
      {
        heading: "Make quality checks proportionate and explicit",
        paragraphs: [
          "List the commands a contributor should run before a pull request, and explain any known non-blocking warnings so people do not spend time chasing unrelated history. Keep the expected checks near the pull-request instructions rather than scattering them across several documents.",
          "Ask contributors to test the path they changed, including an invalid-input or safe-failure case when applicable. For user interfaces, a narrow mobile check and keyboard check often catch practical issues that a type checker cannot.",
        ],
      },
      {
        heading: "Define review, conduct, and security boundaries",
        paragraphs: [
          "Link to the code of conduct, security policy, support route, and license. Explain that security concerns belong in a private reporting channel, not in a public issue. Explain that public support threads must not contain credentials, private data, or sensitive operational details.",
          "A guide is also an expectation-setting tool. Describe the review path, ask contributors to keep changes focused, and make clear that maintainers may request revision, defer a proposal, or decline work that conflicts with current scope or safety boundaries.",
        ],
        callout:
          "The best contribution guide answers the question behind most newcomer hesitation: “What does a safe, useful next step look like here?”",
      },
    ],
    relatedSlugs: [
      "open-source-contributor-onboarding-checklist",
      "readme-setup-new-contributor",
    ],
  },
  {
    slug: "honest-good-first-issues",
    title: "How to create good-first issues that earn contributor trust",
    description:
      "A maintainer’s guide to defining honest, scoped newcomer tasks with clear context, acceptance criteria, and safety boundaries.",
    summary:
      "The good-first-issue label is valuable only when it signals a real, bounded task. Use it to create a trustworthy entry path, not to inflate activity or outsource an unclear problem.",
    category: "Maintainer guide",
    keywords: ["good first issue", "GitHub labels", "open source onboarding"],
    publishedAt: "2026-08-27",
    updatedAt: "2026-08-27",
    readingTime: "7 min read",
    sections: [
      {
        heading: "Define the outcome before applying the label",
        paragraphs: [
          "A strong starter issue describes what will be observably better when the work is complete. It should be possible for a contributor to understand the user or maintainer problem, locate a likely area of the codebase, and validate the result without access to private systems.",
          "Avoid labeling an issue that is really a product decision, a security investigation, a large refactor, or an untriaged report. Those tasks may be important, but calling them beginner-friendly transfers hidden complexity to the least informed participant.",
        ],
      },
      {
        heading: "Give enough context to begin safely",
        paragraphs: [
          "Include the problem statement, in-scope behavior, out-of-scope behavior, likely files or documents, and acceptance criteria. State whether screenshots, tests, documentation updates, or manual checks are expected. Link a related convention or example when one exists.",
          "Use plain language. A contributor should not have to decode internal shorthand, ask for credentials, or reconstruct architecture from unrelated files to understand the first step. If background is too large for the issue, create a smaller preparatory task instead.",
        ],
        checklist: [
          "One independently useful outcome.",
          "No private credentials, production access, or hidden dependency.",
          "Specific acceptance criteria and a practical validation path.",
          "A named maintainer or public thread for clarification when feasible.",
        ],
      },
      {
        heading: "Maintain labels after publishing",
        paragraphs: [
          "A label is a promise about scope, not a permanent decoration. Remove or revise it when an issue becomes blocked, receives a large design change, develops a security implication, or is already being actively worked on. Keeping stale starter labels harms newcomer trust more than having fewer labels.",
          "Do not create placeholder issues merely to affect a score or rank. A repository becomes more welcoming when the issues are genuinely useful and maintained, not when the counter is higher.",
        ],
      },
      {
        heading: "Review first contributions with the same care",
        paragraphs: [
          "When a contributor opens work on a starter issue, acknowledge the effort, review the defined outcome, and explain requested changes specifically. If the original scope was misleading, own the correction rather than blaming the contributor for missing context.",
          "An accepted pull request is not the only successful onboarding result. A clear response, a useful learning outcome, and an accurate next step can make the contributor’s next attempt much more effective.",
        ],
        callout:
          "Ten excellent starter issues are better than a hundred vague ones. Accuracy is part of being welcoming.",
      },
    ],
    relatedSlugs: [
      "write-contributing-guide-developers-use",
      "improve-repository-welcomescore",
    ],
  },
  {
    slug: "readme-setup-new-contributor",
    title: "Write a README setup path a new contributor can finish",
    description:
      "How to turn a README setup section into a repeatable newcomer path: prerequisites, commands, expected output, configuration boundaries, and recovery steps.",
    summary:
      "A setup section is a small contract with every future contributor. It should be specific enough to run, safe enough to share, and current enough to trust.",
    category: "Documentation",
    keywords: ["README setup guide", "developer onboarding", "local development setup"],
    publishedAt: "2026-08-27",
    updatedAt: "2026-08-27",
    readingTime: "6 min read",
    sections: [
      {
        heading: "Put setup where newcomers expect it",
        paragraphs: [
          "Use an explicit heading such as Quick start, Setup, Installation, or Getting started. Make it easy to find from the README’s opening section and keep the order practical: prerequisites, clone, install, configure safely, run, then verify.",
          "Do not assume a reader knows your package manager, runtime version, port, or required service. If there are multiple supported paths, name the recommended one first and explain when the alternatives are appropriate.",
        ],
      },
      {
        heading: "Show the smallest reproducible command sequence",
        paragraphs: [
          "Prefer a short code block that a contributor can run in order. Explain expected success: a local URL, a test result, or a visible screen. This gives a newcomer a way to distinguish a completed setup from a command that merely exited without an obvious result.",
          "When a configuration value is optional, say so. When it is required, say what category of value belongs there without exposing a secret. A public README should never contain live access tokens, production URLs that carry credentials, or instructions to copy private configuration.",
        ],
        checklist: [
          "Supported runtime and package manager.",
          "Install and start commands.",
          "Safe environment-file instructions.",
          "Expected local address or successful verification result.",
        ],
      },
      {
        heading: "Document predictable failure paths",
        paragraphs: [
          "A small troubleshooting section is often more valuable than a long architecture essay. Cover the failures a new contributor is most likely to see: an unsupported runtime, missing local environment file, unavailable optional integration, port conflict, or stale generated output.",
          "Keep troubleshooting factual. If you cannot reproduce an issue, describe what details a contributor should collect safely and where to ask. Do not ask them to paste secrets, browser cookies, raw provider responses, or private logs into a public issue.",
        ],
      },
      {
        heading: "Recheck the guide after meaningful changes",
        paragraphs: [
          "Setup documentation becomes untrustworthy quietly. Re-run it after changing the runtime, dependency manager, environment variables, startup command, core service integration, or public domain. A release checklist can make this verification routine rather than heroic.",
          "Short, verified setup instructions lower the barrier for everyone: contributors, reviewers, maintainers returning after time away, and users who want to understand how the project works.",
        ],
      },
    ],
    relatedSlugs: [
      "write-contributing-guide-developers-use",
      "open-source-contributor-onboarding-checklist",
    ],
  },
  {
    slug: "improve-repository-welcomescore",
    title: "How to use a WelcomeScore result to improve a repository",
    description:
      "A responsible way to read a WelcomeScore audit, prioritize visible contributor gaps, refresh the result, and avoid treating a score as a certification.",
    summary:
      "A WelcomeScore result is a practical starting point for improving public contributor signals. It is most useful when maintainers respond with real documentation and maintained starter work, not cosmetic score chasing.",
    category: "WelcomeScore guide",
    keywords: ["improve WelcomeScore", "GitHub contributor readiness", "repository onboarding"],
    publishedAt: "2026-08-27",
    updatedAt: "2026-08-27",
    readingTime: "6 min read",
    sections: [
      {
        heading: "Read the checklist before the grade",
        paragraphs: [
          "The individual checks explain more than the letter grade. A missing contribution guide means a newcomer may not know how to propose work. A missing setup section means they may not reach a local baseline. Missing starter issues means they may not find a safe place to begin. Treat each gap as a question about the contributor experience, not a directive to add an empty file.",
          "The audit is intentionally narrow. It does not measure code quality, security, maintainer responsiveness, legal compliance, employment opportunities, funding, community health, or whether a pull request will be accepted. Use it with your own judgment and the project’s real needs.",
        ],
      },
      {
        heading: "Improve signals in the order a newcomer experiences them",
        paragraphs: [
          "Start with a usable README setup section and CONTRIBUTING.md, then explain conduct and licensing, then create a small set of real newcomer tasks. This order gives someone enough context to understand and complete the work you label as approachable.",
          "Avoid score-only fixes. A placeholder code of conduct, copied license you do not understand, or vague issue labeled good first issue may change an output, but it will not make the repository more welcoming. Accurate files and maintained issues create the durable benefit.",
        ],
        checklist: [
          "Verify setup from a clean local environment.",
          "Write contribution expectations that match actual maintainer practice.",
          "Use a license and attribution notices that you understand and have reviewed as needed.",
          "Label only real, bounded starter tasks.",
        ],
      },
      {
        heading: "Request a fresh audit after meaningful changes",
        paragraphs: [
          "WelcomeScore treats a deliberate Check or Compare action as a fresh public GitHub audit. If you have just merged documentation or opened a starter issue, run the audit again after GitHub has made those public changes available. Shareable badges have their own short cache to remain reliable in repository READMEs.",
          "A refreshed result may still differ from your expectation if GitHub has not indexed a new issue, the file name differs from the documented signal, the setup heading is unclear, or a repository is temporarily rate-limited. Check the individual result pills and resolve the real source rather than repeatedly refreshing.",
        ],
      },
      {
        heading: "Use public recognition carefully",
        paragraphs: [
          "Hall of Fame eligibility is a product rule based on a fresh score plus real public repository signals. It is not an endorsement or certification. A high score should be an invitation to keep the onboarding path honest, current, and useful.",
          "If you choose an optional Algofox review, treat it as concise evidence-bound guidance. It is not a legal, security, hiring, financial, or quality assessment of the project or its maintainers.",
        ],
        callout:
          "The most reliable way to improve a result is to make the next contributor’s first hour clearer.",
      },
    ],
    relatedSlugs: [
      "honest-good-first-issues",
      "readme-setup-new-contributor",
    ],
  },
  {
    slug: "safe-open-source-dev-lounge",
    title: "How to use a developer community chat safely",
    description:
      "Practical community-chat guidance for open-source contributors: what to share, what never to share, how to assess links and offers, and when to report a concern.",
    summary:
      "Developer chat can make open-source work feel less isolating. It is safest when people keep discussions practical, avoid sensitive data, and treat anonymous messages and external offers with appropriate caution.",
    category: "Community safety",
    keywords: ["developer community safety", "open source chat", "contributor communication"],
    publishedAt: "2026-08-27",
    updatedAt: "2026-08-27",
    readingTime: "5 min read",
    sections: [
      {
        heading: "Use chat for practical, public-safe questions",
        paragraphs: [
          "Community chat works well for asking how to approach a public issue, sharing a small contributor lesson, celebrating a completed documentation improvement, or discussing a score card at a high level. Keep the question narrow enough that another person can answer without needing credentials, private data, or background they cannot safely access.",
          "The WelcomeScore Dev Lounge is temporary and anonymous, not private messaging. A temporary handle does not verify anyone’s identity, project ownership, skill, intent, or reliability.",
        ],
      },
      {
        heading: "Never share secrets or arrange private deals",
        paragraphs: [
          "Do not post passwords, API keys, tokens, private keys, session cookies, personal contact details, payment information, private repository material, vulnerability reports, or confidential work information. If a conversation needs any of these, stop and use the appropriate private, authorized channel instead.",
          "Do not use a community chat to recruit, sell services, request payment, solicit investment, offer jobs, negotiate contracts, or arrange off-platform deals. A message, score card, profile-like handle, or external link is not a verification or guarantee. Independently assess any person, link, offer, or claim before acting.",
        ],
        callout:
          "WelcomeScore, ETHIOR, maintainers, and contributors do not broker, verify, supervise, guarantee, or accept responsibility for user-to-user interactions or external services.",
      },
      {
        heading: "Keep discussion respectful and useful",
        paragraphs: [
          "Focus feedback on code, documentation, product behavior, and ideas rather than people. Avoid harassment, spam, deceptive links, impersonation, dogpiling, and repeated pressure for a response. If you reply to a message, quote only the context needed to keep the thread understandable.",
          "If you encounter harmful, fraudulent, or policy-violating content, do not amplify it in public. Preserve the minimum useful context and follow the reporting process in the Dev Lounge Policy or Code of Conduct. For a security concern, use the project’s private security route rather than a chat message.",
        ],
      },
      {
        heading: "Know the boundary of the feature",
        paragraphs: [
          "Community chat can encourage learning, but it is not customer support, emergency response, legal advice, financial advice, employment advice, a marketplace, or an escrow service. If you need help beyond a practical public question, use an appropriate verified channel.",
          "The safest contribution culture is one where people can ask basic questions without fear, while everyone protects privacy, treats claims cautiously, and respects boundaries.",
        ],
      },
    ],
    relatedSlugs: [
      "open-source-contributor-onboarding-checklist",
      "improve-repository-welcomescore",
    ],
  },
  {
    slug: "make-developer-docs-discoverable-without-gaming-search",
    title: "Make developer docs discoverable without gaming search",
    description:
      "A practical publishing guide for maintainers who want documentation and contributor guidance to be easier to find without keyword stuffing or empty SEO pages.",
    summary:
      "Search visibility starts with a useful page that answers a real developer question. Technical discovery work should make that answer easier to find and understand, not disguise thin content as expertise.",
    category: "Publishing guide",
    keywords: ["developer documentation SEO", "open source discoverability", "technical SEO for developers"],
    publishedAt: "2026-08-27",
    updatedAt: "2026-08-27",
    readingTime: "6 min read",
    sections: [
      {
        heading: "Write for the next real reader",
        paragraphs: [
          "Begin with a question that your intended audience actually has: how to run the project locally, how to choose a first contribution, what a score measures, or where to report a security concern. Answer it completely enough that the reader can take a sensible next step without searching for the same answer elsewhere.",
          "Do not start from a list of phrases you hope to rank for. Repeated keywords, generic introductions, copied summaries, and pages that exist only to create another URL make documentation harder to trust. A short page with one clear, verified answer is more useful than a long page that only restates obvious advice.",
        ],
      },
      {
        heading: "Make the page understandable before optimizing it",
        paragraphs: [
          "Give every public page one descriptive title, one primary heading, and a concise summary that matches what the reader will find. Distinctive headings make scanning easier for people and reduce ambiguity for search systems. Use descriptive links such as “Read the contributor checklist” rather than vague links such as “click here.”",
          "Keep important answers in normal visible text. Do not hide the main explanation behind an interaction, rely on a client-only visual state for the only answer, or move essential documentation into an image. Screenshots can support an explanation, but they should not be the only way to understand it.",
        ],
        checklist: [
          "One real audience question per guide.",
          "A unique title, primary heading, and page summary.",
          "Visible explanation, clear next step, and relevant internal links.",
          "No fabricated outcomes, rankings, endorsements, or customer stories.",
        ],
      },
      {
        heading: "Use technical discovery files for their real job",
        paragraphs: [
          "A sitemap tells crawlers which canonical public URLs you want them to discover. A robots file manages crawl access. Canonical metadata clarifies the preferred URL when similar URLs exist. Structured data can explain the type of visible content. These are useful maintenance tools, but none of them can turn weak content into a useful result or guarantee indexing.",
          "Keep operational and user-specific URLs out of editorial discovery. For example, a generated repository audit can be directly shared with a collaborator, but it should not become an indexed page for every possible repository path. This protects the quality of the public content library and keeps search discovery focused on durable resources.",
        ],
      },
      {
        heading: "Review and improve based on useful evidence",
        paragraphs: [
          "After publishing, use the tools available to your site to check that a page loads, is crawlable, points to the right canonical URL, and has truthful metadata. If you use Search Console, look at which questions lead people to a page and whether readers reach the intended guide. Improve the content when you can answer the reader’s question more clearly or completely.",
          "Do not change review dates, create near-duplicate articles, or chase every trending term merely to look fresh. A maintained library earns trust when every update reflects a meaningful improvement and when its authorship, purpose, and product limits remain clear.",
        ],
        callout:
          "Good discovery work makes useful developer knowledge easier to reach. It does not manufacture authority or promise a ranking.",
      },
    ],
    relatedSlugs: [
      "readme-setup-new-contributor",
      "write-contributing-guide-developers-use",
    ],
  },
];

export function guideBySlug(slug: string) {
  return GUIDES.find((guide) => guide.slug === slug);
}

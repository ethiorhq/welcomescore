# WelcomeScore Growth Strategy

## The strategic decision

WelcomeScore should become the **maintainer control plane for JavaScript and TypeScript repository readiness**: a tool that detects the next useful improvement, turns it into an evidence-backed artifact, and helps maintainers bring contributors into the work.

It should not become a generic social network, a popularity ranking, or an AI chat product with a repository badge attached. The strongest path to legitimate stars is to make WelcomeScore useful inside the places where maintainers already work: the repository README, pull requests, GitHub Actions, npm release workflows, issue labels, and contributor documentation.

This direction fits the product that already exists: a web audit dashboard, the `@ethiorhq/welcomescore` CLI, score/badge endpoints, Hall of Fame, Dev Lounge, guides, Algofox review, Supabase persistence, and a native Android client under construction.

## What the research suggests

The strongest open-source developer products repeatedly do three things well: they solve a narrow recurring job, fit into an existing workflow, and publish evidence or artifacts that travel beyond their own website.

Knip is a useful reference because it describes a specific job—finding unused dependencies, exports, and files—and makes the result actionable. Its official site also emphasizes a large plugin ecosystem, a playground, and public adoption signals rather than presenting the product as an abstract “code quality” platform. [1]

Renovate demonstrates the power of recurring automation. Its value is not only that it reports dependency problems; it continuously creates pull requests, works across multiple platforms, supports configuration presets, and can be run as an npm package, container, or hosted app. That creates repeated utility inside a repository instead of requiring users to remember to return to a dashboard. [2]

Changesets shows how a small, explicit repository artifact can become part of a maintainer workflow. Contributors declare the release intent in a changeset, and the tool carries that information through versioning, changelogs, and publishing. The feature is valuable because it reduces coordination cost at the moment a contribution is made. [3]

Storybook shows the compounding effect of an ecosystem surface. Its official site combines isolated development, reproducible edge-case states, automated UI testing, documentation, integrations, published examples, and a contributor community. It reports 400+ integrations, more than 2,000 contributors, and substantial package usage, but those numbers are downstream of the workflow usefulness and integration surface. [4]

Docusaurus demonstrates that documentation can be a distribution engine when it is easy to maintain. Its official site highlights Markdown/MDX, React extensibility, localization, versioning, search, and a showcase of projects using it. This suggests that WelcomeScore’s guides should be treated as product infrastructure, not marketing filler. [5]

Backstage demonstrates the value of an extensible developer portal with a clear object model. Its official repository describes a catalog, software templates, TechDocs, plugins, contributor guidance, RFCs, adopters, and multiple localized README files. The transferable lesson is not to copy Backstage’s scale, but to define reusable repository objects and extension points. [6]

GitHub’s own documentation confirms that community health files, templates, security policy, funding files, and discussion forms are operational building blocks for healthy repositories. GitHub also supports organization-level default community health files through a public `.github` repository, allowing one maintained standard to help multiple repositories. [7]

GitHub Actions make workflow automation and reusable workflows available directly inside repositories, while artifact attestations and OIDC support can improve supply-chain trust. This supports an official WelcomeScore Action and machine-readable CI output rather than asking maintainers to manually visit the web app. [8]

OpenSSF Scorecard is a particularly important boundary. Its checks explain risks, remediation steps, branch protection, CI tests, code review, and best-practice badges. The lesson for WelcomeScore is that every score must explain its evidence, risk, limitations, and remediation. A single unexplained number will not earn durable trust. [9]

## The product wedge

The core product loop should be:

1. A maintainer runs `npx @ethiorhq/welcomescore` or adds the WelcomeScore GitHub Action.
2. WelcomeScore analyzes public repository evidence and produces a score with a clear evidence trail.
3. It identifies one **Next Useful Move**, not a noisy list of twenty warnings.
4. It generates a safe patch, checklist, issue draft, or pull-request comment that the maintainer can review.
5. The repository publishes a machine-readable report and an honest public badge.
6. Contributors can understand what improvement is wanted and how to help.
7. A later run shows whether the change improved the repository.

This creates a product that earns stars because it is useful in a maintainer’s workflow, not because it asks users to promote it.

## Priority 0: the first 30 days

### 1. Build the WelcomeScore GitHub Action

Create a first-party action in the repository, for example:

```yaml
- uses: ethiorhq/welcomescore-action@v1
  with:
    threshold: 80
    comment-on-pr: true
    report-path: .welcomescore/report.json
```

The action should run the deterministic CLI or a shared engine, emit a JSON report, optionally emit SARIF where appropriate, and fail or warn according to an explicit threshold. It should never block merges by default. The initial version should support `pull_request`, `push`, and manual dispatch.

For pull requests, the action should comment only when the report changes or when a new Next Useful Move is discovered. It should update its own comment instead of creating duplicates. The comment must show evidence, changed signals, and a link to the public explanation. This is the highest-value distribution feature because every participating repository becomes a legitimate discovery surface.

Acceptance criteria: a maintainer can add one workflow file, receive a stable report, see a useful PR comment, rerun without duplicate comments, and disable comments while keeping artifacts.

### 2. Make the report a first-class portable artifact

Add a stable `.welcomescore/` report format with a versioned schema. The report should include repository identity, timestamp, tool version, score, dimensions, evidence references, confidence/coverage, limitations, and recommended next action.

Support these outputs:

- human-readable terminal report
- Markdown report for README or issues
- JSON for automation
- SARIF only for findings that map honestly to SARIF semantics
- a public result URL
- an embeddable badge

A report should be reproducible for the same public repository state as far as GitHub data allows. Show the commit/default branch and analysis time. Do not imply that a score is a security certification, quality guarantee, or endorsement.

Acceptance criteria: the CLI and web dashboard consume the same schema, schema versions are documented, and a repository can store a report without sending source files to WelcomeScore.

### 3. Turn “Next Useful Move” into the product’s signature feature

The current product already has actionable guidance. Make it the primary unit of value. Each recommendation should contain:

- the observed evidence
- why it matters to first-time contributors or maintainers
- the smallest safe next step
- an example file or change
- a test/check that proves completion
- a copyable issue or PR draft
- an estimated effort band
- links to relevant repository locations

Do not let AI invent repository facts. AI can rewrite or prioritize evidence, but the evidence collector remains deterministic and server-side. If evidence is unavailable, say so.

The first templates should cover missing or weak `CONTRIBUTING.md`, setup documentation, Code of Conduct, license, CI test workflow, good-first-issue availability, default branch clarity, issue templates, release notes, and package metadata.

### 4. Add a maintainer “before and after” timeline

A score is more useful when it shows change. Store a privacy-minimized public history for repositories that opt in or whose public checks are requested. Show:

- previous score and current score
- changed dimensions
- completed actions
- remaining next move
- analysis commit or branch
- confidence/coverage changes

The timeline should avoid turning into a competitive leaderboard. The main message is progress, not rank. Give maintainers a shareable improvement page such as “Repository onboarding readiness improved from 61 to 78 after three documented changes.”

### 5. Make the README badge explain itself

Keep the badge, but make the landing page behind it substantially better. A click should show:

- score and grade
- evidence summary
- analysis time
- repository default branch
- limitations
- “what to do next”
- link to run locally with the CLI
- link to the GitHub Action

Offer a compact badge and a fuller README card. Avoid visual tricks that merge a crown, stars, and score. Keep the badge logo consistent with the main WelcomeScore `.js.org` identity.

## Priority 1: days 31–90

### Repository onboarding blueprint

Generate a repository-specific onboarding map. It should identify the path a first-time contributor should follow: clone, install, run tests, find a good first issue, read contribution rules, open a change, and receive review. This is a better differentiator than another generic score.

The output should be a public Markdown document that maintainers can copy into `CONTRIBUTING.md`, but it must remain a draft until reviewed. The CLI `--fix` mode may create absent low-risk templates, never overwrite existing files, and always show a diff or file list before writing.

### GitHub issue and PR draft generation

For each Next Useful Move, generate a draft issue with:

- concise title
- observed evidence
- impact on a new contributor
- acceptance criteria
- suggested labels
- no claim that a human has approved it

For safe documentation changes, generate a patch preview. Do not open issues or pull requests automatically. The maintainer must review and explicitly copy or submit.

### Maintainer workspace

Create a focused workspace for a maintainer to track several repositories or a monorepo. It should show current score, last run, next useful move, open action drafts, and whether a previous action was completed.

Keep the data model minimal. Do not start with accounts, teams, billing, or enterprise permissions unless a real user need appears. For anonymous public checks, retain the current privacy boundary. For saved workspaces, use explicit authentication and clear data deletion controls.

### Ecosystem adapters

After GitHub Action support, add adapters only where they reuse the same report schema:

- npm package README badge helper
- reusable GitHub workflow template
- `package.json` script integration
- CI output for GitLab later, if demand exists
- a Vite/Next.js/Node starter integration

Do not build eight integrations before one is excellent. GitHub and npm are the correct first ecosystems for WelcomeScore.

### Evidence and correction system

Add a “Report an incorrect signal” path for each finding. A maintainer should be able to explain why a signal is false, outdated, or intentionally absent. Store only what is needed to improve the engine. Use corrections to build regression tests and transparent changelog entries.

This is an important trust feature. Repository health tools will occasionally be wrong because conventions vary. A respectful correction loop is better than pretending the score is objective.

## Priority 2: months 3–6

### Public repository profiles

Build a profile page that is more useful than a score card. It should contain repository purpose, contributor path, current readiness, recent improvements, maintainer-selected goals, and links to the source repository. Allow the repository owner to claim or verify the profile without making claims about ownership that cannot be confirmed.

### Contributor matching without a social feed

Instead of creating an addictive feed, let a visitor find repositories by a useful intent:

- “I want a JavaScript project with a clear first contribution path.”
- “I want a documentation issue.”
- “I want a beginner-friendly test improvement.”
- “I want a repository with active maintainer response.”

The system should show evidence and let the user open the repository on GitHub. Do not promise that a good-first-issue label guarantees a welcoming experience.

### Maintainer office hours and high-signal events

Use Dev Lounge for scheduled, moderated events: release clinic, CONTRIBUTING.md review hour, JavaScript health clinic, and open-source onboarding sessions. Each event should produce a durable artifact such as a guide, FAQ update, or anonymized lessons page. This creates community value without requiring an infinite chat stream.

### Translations and regional entry points

Translate the onboarding guides and key interface copy into a small number of languages only after English copy and information architecture are stable. Begin with languages represented by actual contributors or usage data. Keep repository evidence and code identifiers in their original form while translating explanations.

### Native Android client

The Android app should be positioned as a convenient maintainer companion, not a second product. The first native features should be score lookup, saved public result history, Hall of Fame browsing, notification-free review of next actions, and safe share links. Dev Lounge posting and verification should be added only when the security contract is genuinely mobile-safe.

## The artifact distribution strategy

WelcomeScore should publish useful artifacts wherever a maintainer already works. The minimum distribution package should include the CLI, GitHub Action, workflow template, JSON schema, Markdown report, badge endpoint, public score page, and documentation explaining limitations.

The badge should link to the evidence page, not simply to the homepage. GitHub’s own documentation treats workflow badges as a practical README artifact that communicates current workflow status. WelcomeScore can use the same habit, but it must avoid suggesting that its badge is a pass/fail certification. [10]

The GitHub Action should use pinned action dependencies and least-privilege permissions. GitHub’s Actions documentation highlights reusable workflows, secret handling, OIDC, artifact attestations, dependency caching, and action pinning as important workflow capabilities. [8]

The CLI should be genuinely useful without the website. A maintainer should be able to run:

```bash
npx @ethiorhq/welcomescore
npx @ethiorhq/welcomescore --ci --threshold=80
npx @ethiorhq/welcomescore --format=json
npx @ethiorhq/welcomescore --fix --dry-run
```

The tool should exit predictably in CI, produce stable machine-readable output, and make `--fix` reviewable. This is how WelcomeScore earns trust from serious maintainers.

## Contributor flywheel

The repository should make the first contribution easy without lowering standards. Add a contributor map in `CONTRIBUTING.md` that links each area to a file, test command, expected change size, and maintainer contact path.

Create issue templates for documentation, scoring false positive, UI/accessibility, CLI, Android, and security. Make labels meaningful. A good first issue should be a real bounded task, not a cosmetic placeholder created solely to attract contributors.

Publish a monthly maintainer changelog that explains what changed in the scoring engine, which signals were corrected, and what contributors helped. Highlight contributors by the work they did, not by gamified points.

Use GitHub’s community health-file model as a checklist for the repository and organization. CONTRIBUTING, CODE_OF_CONDUCT, SECURITY, templates, funding, accessibility, and discussion forms should be maintained as product surfaces. [7]

## Distribution plan

The strongest free distribution channels are:

1. GitHub Actions marketplace/search through a useful first-party action.
2. npm discovery through the scoped CLI and clear README examples.
3. Repository badges that lead to evidence pages.
4. SEO pages answering concrete maintainer questions.
5. Public examples using well-known repositories, clearly labeled as examples.
6. Documentation templates that link back to the CLI and action.
7. Open-source conferences, maintainer communities, and contributor workshops.
8. Native Android release only after signed distribution and backend compatibility are ready.

SEO should focus on intent, not broad claims. Good pages include:

- how to write a CONTRIBUTING.md developers can use
- how to create a good first issue responsibly
- JavaScript repository health checklist
- how to add a repository health check to GitHub Actions
- how to audit npm package metadata
- how to improve a repository’s contributor onboarding
- how to interpret a repository readiness score

Every page should have an honest answer, an example, a copyable artifact, and a path to run WelcomeScore. Do not produce hundreds of thin AI-generated pages.

## Metrics that matter

The north-star metric should be **verified maintainer improvements completed after a WelcomeScore recommendation**. A completed improvement means that the system can observe a changed public signal or the maintainer explicitly marks and verifies the action.

Supporting metrics should include:

- first audit completion rate
- percentage of audits that reach a Next Useful Move
- percentage of repositories that run the CLI or Action again
- number of repositories with two or more observed improvements
- number of unique repositories using the Action
- badge click-through to evidence pages
- public report regeneration rate
- issue/PR draft copy rate
- contributor conversion from a repository profile to the source repository
- correction reports resolved
- false-positive rate by signal
- median maintainer time to first useful result
- Dev Lounge reports resolved and unanswered questions, not raw messages
- native Android retention only after the app has real utility

GitHub stars, npm downloads, and pageviews are secondary indicators. They matter, but they should not be the product’s optimization target.

## Ten ethical experiments

1. Publish a GitHub Action starter workflow and test it on WelcomeScore itself.
2. Invite ten JavaScript maintainers to review only the evidence accuracy, not to promote the product.
3. Create a “Fix one onboarding barrier” public challenge with before/after examples.
4. Add a copyable `CONTRIBUTING.md` starter generated from deterministic evidence.
5. Publish a guide comparing repository health signals with clear limitations.
6. Add an opt-in public improvement timeline for repositories that want to show progress.
7. Run a moderated documentation clinic in Dev Lounge and turn the answers into a guide.
8. Create a false-positive bounty or recognition path for signal corrections.
9. Add a CI output mode that maintainers can use without visiting the website.
10. Offer a small set of localization starter issues based on actual contributor interest.

None of these experiments should ask for artificial stars, coordinated reviews, or forced badges.

## What not to build yet

Do not build a token, points economy, paid ranking, “viral” invite ladder, public shaming board, automated mass issue creation, automatic social posting, repository certification claim, giant generic AI chat, or an infinite feed.

Do not expand to every forge and language before the JavaScript/TypeScript workflow is excellent. Do not add complex team billing or enterprise permissions before maintainers repeatedly ask for them. Do not let the Hall of Fame become the main reason to use the product; it should celebrate evidence-backed improvement, not popularity.

## Recommended 30-day sequence

### Week 1: contract and artifact foundation

Freeze the report schema, define evidence and limitations, align the CLI and web engine, and add tests for deterministic output. Write the GitHub Action specification and permissions model.

### Week 2: GitHub Action and PR output

Build the action, artifact upload, threshold behavior, PR comment update logic, and a reusable starter workflow. Run it on WelcomeScore and two opt-in example repositories.

### Week 3: Next Useful Move and correction loop

Improve the top ten actionable recommendations, add issue/patch drafts, add false-signal reporting, and turn every correction into a regression test where appropriate.

### Week 4: distribution and maintainer onboarding

Update README and docs, publish the action documentation, create three strong SEO guides, add the evidence-focused badge landing page, add contributor issues with real scope, and invite maintainers to evaluate accuracy.

At the end of 30 days, review whether the product produced completed improvements. If not, do not add more social features; improve evidence quality and workflow integration first.

## Proposed technical modules

The highest-priority implementation can be organized as follows:

```text
packages/cli/src/
  report-schema.ts
  reporters/json.ts
  reporters/markdown.ts
  ci.ts
  fixes.ts

.github/
  workflows/welcomescore.yml
  ISSUE_TEMPLATE/
  pull_request_template.md

actions/welcomescore/
  action.yml
  src/
  README.md

lib/jsHealth/
  engine.ts
  evidence.ts
  reportSchema.ts
  remediation.ts
  corrections.ts

app/api/report/
  route.ts
app/api/corrections/
  route.ts
app/api/actionable/
  route.ts
app/report/[owner]/[repo]/
  page.tsx
app/components/
  EvidencePanel.tsx
  NextUsefulMoveCard.tsx
  ImprovementTimeline.tsx
  AndroidAppDownloadCard.tsx

docs/
  ACTION.md
  REPORT_SCHEMA.md
  SIGNALS_AND_LIMITATIONS.md
  CONTRIBUTOR_PATH.md
  MAINTAINER_CLINICS.md
```

The Android client should consume the stable public report and evidence APIs rather than duplicating scoring logic. This keeps web, CLI, GitHub Action, and native Android results consistent.

## Strategic conclusion

WelcomeScore is most likely to grow when it becomes a tool that maintainers install because it improves a repository, and when that improvement leaves a useful public artifact behind. The GitHub Action, stable report schema, evidence page, Next Useful Move, correction loop, and contributor path should come before more community mechanics.

If those pieces work, stars become a side effect of usefulness: maintainers reference the tool in workflows, contributors discover clear tasks, and repositories share honest progress. If those pieces do not work, more badges, social prompts, or AI features will create activity without durable adoption.

## References

[1]: https://knip.dev/ "Knip — Declutter your JavaScript & TypeScript projects"
[2]: https://docs.renovatebot.com/ "Renovate documentation — Automated dependency updates"
[3]: https://github.com/changesets/changesets "Changesets — A tool to manage versioning and changelogs"
[4]: https://storybook.js.org/ "Storybook — Build, test & document components"
[5]: https://docusaurus.io/ "Docusaurus — Build optimized websites and focus on content"
[6]: https://github.com/backstage/backstage "Backstage — Open framework for developer portals"
[7]: https://docs.github.com/en/communities/setting-up-your-project-for-healthy-contributions/creating-a-default-community-health-file "GitHub — Creating a default community health file"
[8]: https://docs.github.com/actions "GitHub Actions documentation"
[9]: https://github.com/ossf/scorecard/blob/main/docs/checks.md "OpenSSF Scorecard check documentation"
[10]: https://docs.github.com/actions/managing-workflow-runs/adding-a-workflow-status-badge "GitHub — Adding a workflow status badge"

# Contributing to WelcomeScore

Thank you for helping improve WelcomeScore. This project evaluates public GitHub repositories for signals that make a first contribution easier, so its own contribution path should be concise, reproducible, and respectful.

Before participating, read the [Code of Conduct](CODE_OF_CONDUCT.md), [Security Policy](SECURITY.md), [Support Policy](SUPPORT.md), and [Attribution Guide](ATTRIBUTION.md). By submitting a contribution, you agree to the contribution terms in the project [LICENSE](LICENSE).

## Quick start

### Prerequisites

Use a current Node.js LTS release with npm. You also need Git and a GitHub account to open an issue or pull request.

### Local setup

```bash
git clone https://github.com/ethiorhq/welcomescore.git
cd welcomescore
npm install
cp .env.example .env.local
npm run dev
```

The local application runs at [http://localhost:3005](http://localhost:3005). Never commit `.env.local`, API keys, Supabase service-role keys, provider keys, or any other credential.

### Optional development configuration

The application can score public repositories without a GitHub token, although GitHub applies lower unauthenticated API limits. See `.env.example` for optional GitHub, Supabase, and review-provider variables. All secrets remain server-side unless a variable is explicitly documented as browser-safe with a `NEXT_PUBLIC_` prefix.

## Choose the right contribution path

Use GitHub Issues for reproducible bugs, focused improvements, questions about the codebase, and carefully scoped feature proposals. Use the private security reporting channel described in `SECURITY.md` for vulnerabilities, exposed secrets, authentication bypasses, or abuse that should not be public.

Good first contributions are intentionally small, testable, and independently useful. Look for the `good first issue` label. If none is available, comment on an existing issue before beginning work so maintainers can confirm scope and avoid duplicate effort.

## Development standards

Keep each pull request narrow and explain the user-facing reason for the change. Preserve WelcomeScore’s existing principles:

- score repositories only from the documented public signals;
- do not add autonomous Hall of Fame entries, chat posts, social posts, or data mutations;
- keep secrets server-only and do not introduce `NEXT_PUBLIC_` exposure for private credentials;
- keep Algofox guidance technical, evidence-bound, temporary, and respectful;
- preserve the dark, restrained visual system, accessible controls, reduced-motion support, and non-red error treatment;
- do not add deceptive footer-removal checks, hidden lockouts, tracking, or unrelated dependencies.

Use TypeScript, keep components reusable, and avoid duplicating functionality across pages. Document any new environment variable in `.env.example` and the README.

## Validate your change

Run the checks relevant to your change before opening a pull request:

```bash
npx tsc --noEmit
npm run build
```

Run focused ESLint checks for edited files where useful. Existing repository warnings should not be used as justification for adding new warnings or errors. Test relevant user flows manually at desktop and narrow mobile widths. For API changes, verify invalid input and safe failure behavior as well as the happy path.

## Pull request process

1. Create a focused branch from the current default branch.
2. Make the smallest complete change that addresses the agreed issue.
3. Update tests, documentation, migration notes, or screenshots only when they help reviewers verify the change.
4. Run the validation commands above.
5. Open a pull request using the project template. State what changed, why, how it was tested, and any risk or follow-up.
6. Respond constructively to review. Maintainers may request revisions, split an oversized change, or decline work that conflicts with project scope or safety principles.

Do not include secrets, personal data, proprietary material, copied content without permission, or unrelated formatting churn in a pull request.

## Issues and labels

When creating an issue, include the expected behavior, actual behavior, reliable reproduction steps, environment details, and only the minimum safe screenshots or logs. Do not publish API keys, access tokens, private repository URLs, personal data, security vulnerabilities, or harmful chat content.

A maintainer may apply `good first issue` only when an issue has a clear outcome, limited scope, enough context to begin safely, and no hidden security or architectural dependency. The label signals an approachable starting point, not a guarantee of mentoring or acceptance.

## Contributor license grant

By submitting a contribution for inclusion in this repository, you confirm that you have the right to submit it and grant ETHIOR the rights described in Section 5 of the [LICENSE](LICENSE). If you cannot grant those rights, do not submit the contribution.

## Recognition and attribution

WelcomeScore values accurate credit. Keep original-project attribution required by `LICENSE`, `NOTICE`, and `ATTRIBUTION.md` when working with a derivative. Contributions may be recognized in release notes, but contribution does not create an employment, partnership, ownership, or compensation relationship.

## Need help?

See [SUPPORT.md](SUPPORT.md) for the appropriate public support route. For a security concern, follow [SECURITY.md](SECURITY.md). For conduct concerns, follow [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

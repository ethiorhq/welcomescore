# WelcomeScore CLI Publication and JS.ORG Response

**Status:** [`@ethiorhq/welcomescore@0.1.0` is publicly published on npm](https://www.npmjs.com/package/@ethiorhq/welcomescore). A clean public install has verified both `npx @ethiorhq/welcomescore --version` and its local CI mode. Do not submit the JS.ORG response draft until Vercel custom-domain configuration and the exact JS.ORG mapping are also verified.

## What this release contributes to the JavaScript ecosystem

WelcomeScore now has a substantive JavaScript/TypeScript maintainer tool in [`packages/cli`](../packages/cli). The package exposes a local terminal command, `welcomescore`, through npm’s standard `bin` field. It evaluates observable project foundations: package metadata, TypeScript/Node tooling, GitHub Actions signals, and contributor readiness. Its web counterpart is the [JavaScript Health dashboard](https://welcomescore.vercel.app/js).

The tool is intentionally local-first. Its normal mode does not upload source code, package manifests, environment files, tokens, Git credentials, or analytics. Its `--fix` mode creates only absent low-risk templates, never overwrites a file or package manifest, and never installs dependencies, runs commands, commits, publishes, or changes GitHub.

| Invocation | Intended use |
|---|---|
| `npx @ethiorhq/welcomescore` | Interactive local terminal report. |
| `npx @ethiorhq/welcomescore --ci --threshold=80` | Headless CI threshold check with deterministic exit codes. |
| `npx @ethiorhq/welcomescore --json` | Structured report for other local tools. |
| `npx @ethiorhq/welcomescore --fix --dry-run` | Review safe template suggestions without creating files. |

## Maintainer publication checklist

Publishing is an external, irreversible distribution action. Complete these checks deliberately from a secured maintainer environment.

1. Confirm the organization-scoped registry name remains available: `npm view @ethiorhq/welcomescore version`. A `404` indicates that no public package currently occupies the name; a successful response means you must select a different name.
2. Review the custom source-available license, attribution, notice, and trademark terms in the root repository and packaged copies. Confirm npm distribution is permitted for the intended version; obtain appropriate legal review when needed.
3. Run the exact verification suite from the repository root:

   ```bash
   npm ci
   npm test
   npm run cli:check
   npm run cli:test
   npm run cli:build
   npm run cli:pack:check
   npm run build
   ```

4. Inspect the packed artifact. It must include only `dist`, `README.md`, `LICENSE`, `ATTRIBUTION.md`, `NOTICE`, and `package.json`; it must never include `.env` files, local reports, source secrets, or unrelated project files.
5. For the first release, sign in as a personal npm account that is authorized to publish for the `ethiorhq` organization, confirm the organization-scoped package name is still available, and run `npm publish --access public` from `packages/cli`. The package’s release preflight runs its typecheck, tests, build, and package preview before publication.
6. After the first package is public, set up npm trusted publishing for the `ethiorhq/welcomescore` repository and the `Publish WelcomeScore CLI` GitHub Actions workflow. The workflow requests an OIDC identity token and does not require committing an npm token. Review npm’s trusted publisher documentation before enabling it.[1]
7. For a later version, update `packages/cli/package.json`, build the package, create a GitHub Release deliberately, and verify the release workflow’s `npm publish --provenance --access public` result.
8. Verify in a clean directory after publication:

   ```bash
   npx --yes @ethiorhq/welcomescore --version
   npx --yes @ethiorhq/welcomescore --ci --threshold=80
   ```

9. Confirm the public npm package page, package repository link, CLI help, JavaScript Health dashboard, and exact domain response below before updating the JS.ORG pull request.

> npm provenance identifies the build origin of a published package. It is not a security certification or a guarantee about package behavior.[2]

## JS.ORG response draft

Use this only **after** Vercel custom-domain configuration, the JS.ORG mapping, and the links below have been manually verified. Replace bracketed placeholders with the actual package version, release URL, and JS.ORG pull request link.

```text
Hi @MattIPv4,

Thank you for the review. I have updated WelcomeScore so it directly serves JavaScript and TypeScript maintainers rather than functioning only as a general repository landing page.

The project now includes a published npm CLI:
https://www.npmjs.com/package/@ethiorhq/welcomescore

Developers can run it locally with:

npx @ethiorhq/welcomescore
npx @ethiorhq/welcomescore --ci --threshold=80

The CLI audits JavaScript/TypeScript package metadata, Node and TypeScript tooling, GitHub Actions signals, and contributor foundations. It has local interactive, CI, JSON, and conservative template-preview/fix modes. The normal CLI does not upload project source or environment values.

The matching public JavaScript Health dashboard is available at:
https://welcomescore.js.org/js

Source, package implementation, tests, package metadata, and the release workflow are in:
https://github.com/ethiorhq/welcomescore/tree/main/packages/cli

Published version: [VERSION]
Release verification: [RELEASE_URL]

The .js.org site serves this functionality directly and does not redirect visitors to another domain. Please let me know if any further JS.ORG-specific adjustment would help the review.

Thank you.
```

This response explains the newly verifiable technical substance. It does **not** guarantee approval; final acceptance remains with JS.ORG maintainers and their then-current requirements.

## References

[1]: https://docs.npmjs.com/trusted-publishers/ "npm trusted publishers"
[2]: https://docs.npmjs.com/generating-provenance-statements/ "npm provenance statements"

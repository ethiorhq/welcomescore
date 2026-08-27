# WelcomeScore CLI

`welcomescore` is a local JavaScript and TypeScript repository health tool for npm-package maintainers. It reviews observable package metadata, Node tooling, CI workflow signals, and contributor foundations.

```bash
npx welcomescore
```

The interactive terminal view presents a 0–100 **JavaScript Health Index**. Press `d` to show diagnostics and `q` or `Esc` to close.

## CI mode

Use CI mode for a deterministic threshold check. It emits a concise result to standard error and returns `0` when the score meets the threshold, `1` when a completed audit is below it, and `2` for invalid input or scanner failure.

```bash
npx welcomescore --ci --threshold=80
```

Use `--json` when another program needs the full report on standard output, or `--markdown` for a human-readable report.

```bash
npx welcomescore --json > welcomescore-report.json
npx welcomescore --markdown > welcomescore-report.md
```

## Safe remediation templates

`--fix` is deliberately conservative. It creates only absent low-risk templates and never overwrites an existing file, edits `package.json`, installs dependencies, runs package scripts, creates a commit, changes GitHub, or publishes a package.

```bash
npx welcomescore --fix --dry-run
npx welcomescore --fix
```

The package metadata suggestion is written as `welcomescore.package-fragment.json` for a maintainer to review and merge manually. Templates may include `.nvmrc`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, and a starter issue template only when those paths do not already exist.

## Optional public label evidence

The default scan is local. It does not upload source code, package manifests, environment variables, git credentials, or analytics to WelcomeScore. With explicit `--github`, the CLI may make one public GitHub API read to check for a curated starter-issue label on the `origin` repository.

```bash
npx welcomescore --github
```

## What the index means

The index is a deterministic review of visible project signals. It is **not** a security audit, code-quality certification, legal opinion, popularity ranking, package safety guarantee, or endorsement. A missing signal can be appropriate for a project’s scope; always review diagnostics in context.

For a public GitHub repository view, visit [WelcomeScore JavaScript Health](https://welcomescore.vercel.app/js).

## Development

```bash
npm install
npm run check
npm test
npm run build
npm pack --dry-run
```

## License

WelcomeScore CLI is source-available under the project’s custom Source-Available Attribution License, not an OSI-approved open-source license. See [LICENSE](./LICENSE), [ATTRIBUTION.md](./ATTRIBUTION.md), and [NOTICE](./NOTICE) before redistributing or modifying it.

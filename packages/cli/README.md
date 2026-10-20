# WelcomeScore CLI

`@ethiorhq/welcomescore` is an evidence-based local JavaScript and TypeScript repository health tool for open-source maintainers. It evaluates package metadata, Node tooling infrastructure, CI/CD workflow readiness, and contributor onboarding foundations.

```bash
npx @ethiorhq/welcomescore
```

The interactive terminal view presents a 0–100 **JavaScript Health Index**. Press `d` to show diagnostics and `q` or `Esc` to close.

## Usage Modes

### 1. Interactive & Terminal Reporting
```bash
npx @ethiorhq/welcomescore
npx @ethiorhq/welcomescore --no-color
npx @ethiorhq/welcomescore --details
```

### 2. CI Mode with Deterministic Thresholds
Use CI mode for automated pipelines. It emits a concise summary and returns:
- `0`: Score meets or exceeds `--threshold` (default: 80).
- `1`: Completed audit score is below threshold.
- `2`: Invalid CLI arguments or unreadable repository.

```bash
npx @ethiorhq/welcomescore --ci --threshold=80
```

### 3. Machine-Readable JSON & Markdown Reports
```bash
# Output JSON to stdout
npx @ethiorhq/welcomescore --format=json

# Write Markdown report directly to a file
npx @ethiorhq/welcomescore --format=markdown --output=.welcomescore/report.md
```

### 4. Safe Remediation Templates (`--fix`)
`--fix` creates absent low-risk template files. It **never** overwrites existing files, modifies `package.json` in-place, installs dependencies, runs untrusted scripts, commits code, or publishes packages.

```bash
# Preview planned file creations
npx @ethiorhq/welcomescore --fix --dry-run

# Create absent templates
npx @ethiorhq/welcomescore --fix
```

Package metadata suggestions are written safely as `welcomescore.package-fragment.json` for maintainer review. Templates created if absent:
- `.nvmrc`
- `CONTRIBUTING.md`
- `CODE_OF_CONDUCT.md`
- `.github/ISSUE_TEMPLATE/good_first_issue.md`

### 5. Deep Framework Stack Health Audits (`--stack`)
Evaluate architecture, resilience boundaries, compiler compatibility, and build orchestration for modern web stacks:

```bash
# Next.js Deep Health (App Router, Error/Not-Found boundaries, CWV, Server Actions)
npx @ethiorhq/welcomescore --stack nextjs

# React 19 Readiness (React 19 compiler patterns, direct ref props, hydration hygiene)
npx @ethiorhq/welcomescore --stack react

# Monorepo & Tooling (Turborepo pipeline caching, strict lockfiles, Biome/ESLint 9)
npx @ethiorhq/welcomescore --stack monorepo
```

## Privacy & Security Boundary

The default audit is completely local. It **does not upload** source code, manifests, environment variables, credentials, or analytics to any remote server. With `--github`, the tool makes a read-only call to GitHub's public API to check for open starter issue labels on the remote `origin`.

## Limitations

WelcomeScore audits public repository signals. It is **not** a security audit, code-quality certification, legal advice, package safety guarantee, popularity ranking, or endorsement.

For online audits and badge generation, visit [WelcomeScore](https://welcomescore.vercel.app).

import type { JsHealthRemediation, JsHealthRemediationId } from "./types";

const PACKAGE_FRAGMENT = `{
  "description": "A concise description of the package purpose.",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/OWNER/REPOSITORY.git"
  },
  "bugs": {
    "url": "https://github.com/OWNER/REPOSITORY/issues"
  },
  "homepage": "https://github.com/OWNER/REPOSITORY#readme",
  "funding": "https://github.com/sponsors/OWNER",
  "packageManager": "npm@11.0.0",
  "engines": {
    "node": ">=22"
  },
  "files": ["dist", "README.md", "LICENSE"]
}`;

const TEMPLATES: Record<JsHealthRemediationId, JsHealthRemediation> = {
  "package-metadata": {
    id: "package-metadata",
    title: "Package metadata fragment",
    summary: "Review and merge only the fields that are accurate for this project. This fragment is never applied automatically.",
    targetPath: "welcomescore.package-fragment.json",
    language: "json",
    content: PACKAGE_FRAGMENT,
    writeMode: "manual-merge",
  },
  "package-exports": {
    id: "package-exports",
    title: "Explicit package exports",
    summary: "Review these public entry points before publishing. Adding exports can be a breaking change for existing consumers.",
    targetPath: "welcomescore.package-fragment.json",
    language: "json",
    content: `{
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "types": "./dist/index.d.ts"
}`,
    writeMode: "manual-merge",
  },
  "node-engines": {
    id: "node-engines",
    title: "Node.js engines declaration",
    summary: "Choose a range your tests actually support; this is a proposed fragment, not an automatic package.json edit.",
    targetPath: "welcomescore.package-fragment.json",
    language: "json",
    content: `{
  "engines": {
    "node": ">=22"
  }
}`,
    writeMode: "manual-merge",
  },
  "package-manager": {
    id: "package-manager",
    title: "Package manager declaration",
    summary: "Use the package-manager version the project is tested with.",
    targetPath: "welcomescore.package-fragment.json",
    language: "json",
    content: `{
  "packageManager": "npm@11.0.0"
}`,
    writeMode: "manual-merge",
  },
  tsconfig: {
    id: "tsconfig",
    title: "TypeScript configuration",
    summary: "Starting point only. Adjust module and target choices for the project’s actual runtime and bundler.",
    targetPath: "tsconfig.json",
    language: "json",
    content: `{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "declaration": true,
    "outDir": "dist",
    "skipLibCheck": true
  },
  "include": ["src"]
}`,
    writeMode: "create-if-absent",
  },
  "lint-config": {
    id: "lint-config",
    title: "ESLint configuration",
    summary: "A minimal ESM ESLint configuration. Review parser and framework plugins before use.",
    targetPath: "eslint.config.mjs",
    language: "text",
    content: `export default [
  {
    ignores: ["dist", "coverage", "node_modules"],
  },
];
`,
    writeMode: "create-if-absent",
  },
  "test-runner": {
    id: "test-runner",
    title: "Vitest starter configuration",
    summary: "Install and configure the test runner deliberately; this preview does not add a dependency or modify scripts.",
    targetPath: "vitest.config.ts",
    language: "text",
    content: `import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
  },
});
`,
    writeMode: "create-if-absent",
  },
  "node-version": {
    id: "node-version",
    title: "Node.js version pin",
    summary: "Select a Node version that your CI and supported engines actually validate.",
    targetPath: ".nvmrc",
    language: "text",
    content: "22\n",
    writeMode: "create-if-absent",
  },
  "github-actions": {
    id: "github-actions",
    title: "Node.js CI workflow",
    summary: "Review triggers, permissions, and package-manager commands before enabling this workflow.",
    targetPath: ".github/workflows/ci.yml",
    language: "yaml",
    content: `name: Verify JavaScript project

on:
  pull_request:
  push:
    branches: [main]

permissions:
  contents: read

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v7
        with:
          node-version-file: .nvmrc
          cache: npm
      - run: npm ci
      - run: npm test
      - run: npm run build --if-present
`,
    writeMode: "create-if-absent",
  },
  "ci-test-job": {
    id: "ci-test-job",
    title: "CI test command",
    summary: "Add a non-watch test command to your existing workflow; commands must match scripts this project supports.",
    targetPath: ".github/workflows/ci.yml",
    language: "yaml",
    content: "      - run: npm test\n",
    writeMode: "manual-merge",
  },
  "bundle-size": {
    id: "bundle-size",
    title: "Package-size review",
    summary: "Consider a package-size check appropriate for the release process; no CI workflow is generated automatically.",
    targetPath: "welcomescore.package-fragment.json",
    language: "json",
    content: `{
  "scripts": {
    "pack:check": "npm pack --dry-run"
  }
}`,
    writeMode: "manual-merge",
  },
  "publish-pipeline": {
    id: "publish-pipeline",
    title: "npm release workflow",
    summary: "This is a review template. Configure trusted publishing or protected credentials before enabling release publication.",
    targetPath: ".github/workflows/publish.yml",
    language: "yaml",
    content: `name: Publish package

on:
  release:
    types: [published]

permissions:
  contents: read
  id-token: write

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v7
        with:
          node-version-file: .nvmrc
          registry-url: https://registry.npmjs.org
      - run: npm ci
      - run: npm test
      - run: npm publish --provenance --access public
`,
    writeMode: "create-if-absent",
  },
  contributing: {
    id: "contributing",
    title: "Contribution guide",
    summary: "A concise starting path for contributors. Update commands, support expectations, and review policy for the project.",
    targetPath: "CONTRIBUTING.md",
    language: "markdown",
    content: `# Contributing

Thank you for improving this JavaScript project.

## Before opening a pull request

Please install dependencies with the documented package manager, run the project checks, and keep changes focused. Describe the problem, the chosen approach, and any user-visible impact.

## Good first contributions

Documentation improvements, test coverage, reproductions, and small accessibility fixes are welcome. Please comment on an issue before starting substantial work so maintainers can coordinate.

## Community expectations

By participating, you agree to follow the project Code of Conduct.
`,
    writeMode: "create-if-absent",
  },
  "code-of-conduct": {
    id: "code-of-conduct",
    title: "Code of Conduct starter",
    summary: "Replace the contact route and review this policy with project maintainers before adoption.",
    targetPath: "CODE_OF_CONDUCT.md",
    language: "markdown",
    content: `# Code of Conduct

## Our commitment

We are committed to a welcoming, respectful, and harassment-free community for everyone participating in this project.

## Expected behavior

Be constructive, respect different viewpoints and experiences, accept feedback professionally, and focus discussion on improving the project.

## Reporting

Report concerns to the project maintainers through the repository’s private security or support contact. Reports should be handled with discretion and without retaliation.
`,
    writeMode: "create-if-absent",
  },
  "starter-issues": {
    id: "starter-issues",
    title: "Starter issue template",
    summary: "Use this template only for work that is genuinely scoped, documented, and available for a newcomer to attempt.",
    targetPath: ".github/ISSUE_TEMPLATE/good_first_issue.md",
    language: "markdown",
    content: `---
name: Good first issue
about: A clearly scoped task for a new contributor
labels: good first issue
---

## Goal

Describe the user or maintainer outcome.

## Context

Link the relevant code, documentation, or discussion.

## Suggested starting point

Describe the first file, command, or test a contributor can inspect.

## Acceptance criteria

- [ ] The expected behavior is covered.
- [ ] Relevant documentation is updated.
- [ ] Project checks pass.
`,
    writeMode: "create-if-absent",
  },
};

export function getJsHealthRemediation(id: JsHealthRemediationId) {
  return TEMPLATES[id];
}

export function getJsHealthRemediations(ids: JsHealthRemediationId[]) {
  return Array.from(new Set(ids)).map((id) => getJsHealthRemediation(id));
}

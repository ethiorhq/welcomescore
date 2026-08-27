import {
  JS_HEALTH_CATEGORY_DEFINITIONS,
  JS_HEALTH_SCHEMA_VERSION,
  type JsHealthCheck,
  type JsHealthCheckStatus,
  type JsHealthRemediationId,
  type JsHealthReport,
  type JsHealthSnapshot,
} from "./types";

type CheckDefinition = {
  id: string;
  category: JsHealthCheck["category"];
  label: string;
  maxPoints: number;
  assess: (snapshot: JsHealthSnapshot) => Assessment;
};

type Assessment = {
  status: JsHealthCheckStatus;
  points: number;
  evidence: string;
  remediationId?: JsHealthRemediationId;
};

const TEST_RUNNER_PATTERN = /\b(vitest|jest|mocha|ava|node\s+--test|playwright\s+test|cypress\s+run)\b/i;
const TEST_DEPENDENCY_PATTERN = /^(vitest|jest|mocha|ava|@playwright\/test|cypress)$/i;
const LINT_DEPENDENCY_PATTERN = /^(eslint|@eslint\/js|@biomejs\/biome|biome)$/i;
const PACKAGE_METADATA_FIELDS = ["name", "version", "description"] as const;

const CHECKS: CheckDefinition[] = [
  {
    id: "package-identity",
    category: "package",
    label: "Package identity",
    maxPoints: 4,
    assess: (snapshot) => {
      const packageJson = snapshot.packageJson;
      const present = PACKAGE_METADATA_FIELDS.filter((field) => hasNonEmptyString(packageJson?.[field]));
      if (present.length === PACKAGE_METADATA_FIELDS.length) {
        return pass(4, "name, version, and description are present.");
      }
      if (present.length > 0) {
        return partial(2, `${present.join(", ")} present; add ${missingFields(PACKAGE_METADATA_FIELDS, present).join(" and ")}.`, "package-metadata");
      }
      return missing("No readable package identity was found.", "package-metadata");
    },
  },
  {
    id: "package-license",
    category: "package",
    label: "SPDX license metadata",
    maxPoints: 5,
    assess: (snapshot) => hasNonEmptyString(snapshot.packageJson?.license)
      ? pass(5, `license: ${String(snapshot.packageJson?.license)}.`)
      : missing("Add an SPDX license identifier to package.json.", "package-metadata"),
  },
  {
    id: "package-repository",
    category: "package",
    label: "Repository metadata",
    maxPoints: 4,
    assess: (snapshot) => snapshot.packageJson?.repository
      ? pass(4, "repository metadata is present.")
      : missing("Add a public repository field so users can inspect the source.", "package-metadata"),
  },
  {
    id: "package-exports",
    category: "package",
    label: "Public entry points and types",
    maxPoints: 6,
    assess: (snapshot) => {
      const hasExports = Boolean(snapshot.packageJson?.exports);
      const hasTypes = hasNonEmptyString(snapshot.packageJson?.types) || hasNonEmptyString(snapshot.packageJson?.typings);
      if (hasExports && hasTypes) {
        return pass(6, "exports and TypeScript declaration metadata are present.");
      }
      if (hasExports || hasTypes) {
        return partial(3, hasExports ? "exports is present; add types when publishing TypeScript declarations." : "types is present; define explicit exports for package entry points.", "package-exports");
      }
      return missing("No explicit exports or TypeScript declaration metadata was found.", "package-exports");
    },
  },
  {
    id: "package-node-engines",
    category: "package",
    label: "Supported Node.js range",
    maxPoints: 4,
    assess: (snapshot) => hasNonEmptyString(recordValue(snapshot.packageJson?.engines)?.node)
      ? pass(4, `engines.node: ${String(recordValue(snapshot.packageJson?.engines)?.node)}.`)
      : missing("Declare engines.node so contributors and CI use a compatible Node version.", "node-engines"),
  },
  {
    id: "package-funding",
    category: "package",
    label: "Funding metadata",
    maxPoints: 3,
    assess: (snapshot) => snapshot.packageJson?.funding
      ? pass(3, "funding metadata is present.")
      : missing("Add funding metadata if the project accepts financial support.", "package-metadata"),
  },
  {
    id: "package-manager",
    category: "package",
    label: "Package manager declaration",
    maxPoints: 3,
    assess: (snapshot) => hasNonEmptyString(snapshot.packageJson?.packageManager)
      ? pass(3, `packageManager: ${String(snapshot.packageJson?.packageManager)}.`)
      : missing("Declare packageManager to make local installs reproducible.", "package-manager"),
  },
  {
    id: "package-publish-files",
    category: "package",
    label: "Publish file allowlist",
    maxPoints: 6,
    assess: (snapshot) => {
      if (snapshot.packageJson?.private === true) {
        return notApplicable(6, "Package is marked private; npm tarball allowlisting is not expected.");
      }
      const files = snapshot.packageJson?.files;
      return Array.isArray(files) && files.length > 0
        ? pass(6, "package.json includes a publish files allowlist.")
        : missing("Add a files allowlist before publishing to npm.", "package-metadata");
    },
  },
  {
    id: "tooling-typescript",
    category: "tooling",
    label: "TypeScript configuration",
    maxPoints: 6,
    assess: (snapshot) => hasPath(snapshot, "tsconfig.json")
      ? pass(6, "tsconfig.json is present.")
      : missing("Add tsconfig.json when this project uses TypeScript.", "tsconfig"),
  },
  {
    id: "tooling-lint",
    category: "tooling",
    label: "Lint or formatting configuration",
    maxPoints: 5,
    assess: (snapshot) => {
      const files = ["eslint.config.js", "eslint.config.mjs", "eslint.config.cjs", ".eslintrc", ".eslintrc.json", ".eslintrc.js", ".eslintrc.cjs", "biome.json", "biome.jsonc"];
      const dependencyNames = dependencyNamesFor(snapshot.packageJson);
      if (files.some((path) => hasPath(snapshot, path)) || dependencyNames.some((name) => LINT_DEPENDENCY_PATTERN.test(name))) {
        return pass(5, "A lint or formatting tool is configured.");
      }
      return missing("Add an ESLint or Biome configuration.", "lint-config");
    },
  },
  {
    id: "tooling-tests",
    category: "tooling",
    label: "Test runner and script",
    maxPoints: 8,
    assess: (snapshot) => {
      const scripts = recordValue(snapshot.packageJson?.scripts);
      const testScript = stringValues(scripts).find(([name]) => name === "test" || name.startsWith("test:"));
      const runnerDependency = dependencyNamesFor(snapshot.packageJson).some((name) => TEST_DEPENDENCY_PATTERN.test(name));
      const runnerScript = testScript ? TEST_RUNNER_PATTERN.test(testScript[1]) : false;
      if (testScript && (runnerDependency || runnerScript)) {
        return pass(8, `Test script detected: ${testScript[0]}.`);
      }
      if (testScript || runnerDependency) {
        return partial(4, "Test evidence is incomplete; add a non-watch test script.", "test-runner");
      }
      return missing("Add a test runner dependency and a non-watch test script.", "test-runner");
    },
  },
  {
    id: "tooling-node-pin",
    category: "tooling",
    label: "Node.js version pin",
    maxPoints: 6,
    assess: (snapshot) => {
      if (hasPath(snapshot, ".nvmrc")) {
        return pass(6, ".nvmrc is present.");
      }
      if (recordValue(snapshot.packageJson?.volta)?.node) {
        return pass(6, "volta.node is present in package.json.");
      }
      return missing("Add .nvmrc or a Volta Node pin.", "node-version");
    },
  },
  {
    id: "cicd-workflows",
    category: "cicd",
    label: "GitHub Actions workflow",
    maxPoints: 5,
    assess: (snapshot) => workflowNames(snapshot).length > 0
      ? pass(5, "GitHub Actions workflow files are present.")
      : missing("Add a GitHub Actions workflow for repeatable checks.", "github-actions"),
  },
  {
    id: "cicd-tests",
    category: "cicd",
    label: "CI test job",
    maxPoints: 8,
    assess: (snapshot) => {
      const workflows = workflowSignal(snapshot);
      return /npm\s+(run\s+)?test|pnpm\s+(run\s+)?test|yarn\s+test|vitest|jest|npm\s+run\s+(check|lint|build)/.test(workflows)
        ? pass(8, "A workflow contains a repeatable test or verification command.")
        : missing("Add a CI workflow that runs the project test command.", "ci-test-job");
    },
  },
  {
    id: "cicd-node-setup",
    category: "cicd",
    label: "Node setup in CI",
    maxPoints: 3,
    assess: (snapshot) => {
      const workflows = workflowSignal(snapshot);
      return /actions\/setup-node|node-version|node-version-file/.test(workflows)
        ? pass(3, "A workflow contains a Node.js setup indicator.")
        : missing("Configure a Node.js setup step in the CI workflow.", "ci-test-job");
    },
  },
  {
    id: "cicd-bundle-size",
    category: "cicd",
    label: "Bundle-size or package-size guard",
    maxPoints: 4,
    assess: (snapshot) => {
      const names = `${workflowSignal(snapshot)} ${dependencyNamesFor(snapshot.packageJson).join(" ")}`.toLowerCase();
      return /bundle|size-limit|bundlesize|pkg-size|package-size/.test(names)
        ? pass(4, "Bundle or package-size tracking evidence is present.")
        : missing("Consider a bundle-size or package-size guard for published artifacts.", "bundle-size");
    },
  },
  {
    id: "cicd-publish",
    category: "cicd",
    label: "npm publishing or release path",
    maxPoints: 5,
    assess: (snapshot) => {
      if (snapshot.packageJson?.private === true) {
        return notApplicable(5, "Package is marked private; an npm publishing workflow is not expected.");
      }
      const names = workflowSignal(snapshot);
      return /npm\s+publish|pnpm\s+publish|yarn\s+npm\s+publish|workflow_dispatch.*publish|release:\s*$|on:\s*release/.test(names)
        ? pass(5, "Release or npm publishing workflow evidence is present.")
        : missing("Add a reviewed release or npm publishing workflow before publishing.", "publish-pipeline");
    },
  },
  {
    id: "contributors-guide",
    category: "contributors",
    label: "Contribution guide",
    maxPoints: 5,
    assess: (snapshot) => hasPath(snapshot, "contributing.md")
      ? pass(5, "CONTRIBUTING.md is present.")
      : missing("Add CONTRIBUTING.md with a clear local setup and contribution path.", "contributing"),
  },
  {
    id: "contributors-code-of-conduct",
    category: "contributors",
    label: "Code of Conduct",
    maxPoints: 4,
    assess: (snapshot) => hasPath(snapshot, "code_of_conduct.md") || hasPath(snapshot, "code-of-conduct.md")
      ? pass(4, "A Code of Conduct file is present.")
      : missing("Add a Code of Conduct to set contribution expectations.", "code-of-conduct"),
  },
  {
    id: "contributors-starter-issues",
    category: "contributors",
    label: "Starter contributor path",
    maxPoints: 6,
    assess: (snapshot) => {
      if (snapshot.hasStarterIssueLabel === true) {
        return pass(6, "A public starter-issue label was observed.");
      }
      if (hasPath(snapshot, ".github/issue_template/good_first_issue.md") || hasPath(snapshot, ".github/issue_template/good-first-issue.md")) {
        return partial(3, "A starter-issue template is present; add and curate a public good-first-issue label when appropriate.", "starter-issues");
      }
      if (snapshot.hasStarterIssueLabel === null) {
        return missing("No public starter-issue label evidence was available.", "starter-issues");
      }
      return missing("Add a starter-issue template or curate a good-first-issue label.", "starter-issues");
    },
  },
];

export function evaluateJsHealth(snapshot: JsHealthSnapshot): JsHealthReport {
  const checks = CHECKS.map((definition) => toCheck(definition, snapshot));
  const categories = JS_HEALTH_CATEGORY_DEFINITIONS.map((definition) => ({
    ...definition,
    score: checks
      .filter((check) => check.category === definition.id)
      .reduce((total, check) => total + check.points, 0),
  }));
  const score = categories.reduce((total, category) => total + category.score, 0);

  return {
    schemaVersion: JS_HEALTH_SCHEMA_VERSION,
    subject: snapshot.subject,
    generatedAt: new Date().toISOString(),
    score,
    grade: gradeForScore(score),
    categories,
    checks,
    limitations: [
      "This is a deterministic metadata and project-structure review, not a security audit, code-quality certification, legal opinion, or endorsement.",
      "Missing signals are practical maintenance observations and may be appropriate for a project’s scope.",
      "The public dashboard reads allowlisted public repository metadata; the local CLI does not upload source files or environment variables.",
    ],
  };
}

function toCheck(definition: CheckDefinition, snapshot: JsHealthSnapshot): JsHealthCheck {
  const assessment = definition.assess(snapshot);
  return {
    id: definition.id,
    category: definition.category,
    label: definition.label,
    status: assessment.status,
    points: assessment.points,
    maxPoints: definition.maxPoints,
    evidence: assessment.evidence,
    ...(assessment.remediationId ? { remediationId: assessment.remediationId } : {}),
  };
}

function pass(points: number, evidence: string): Assessment {
  return { status: "pass", points, evidence };
}

function partial(points: number, evidence: string, remediationId: JsHealthRemediationId): Assessment {
  return { status: "partial", points, evidence, remediationId };
}

function missing(evidence: string, remediationId: JsHealthRemediationId): Assessment {
  return { status: "missing", points: 0, evidence, remediationId };
}

function notApplicable(points: number, evidence: string): Assessment {
  return { status: "not-applicable", points, evidence };
}

function gradeForScore(score: number): JsHealthReport["grade"] {
  if (score >= 85) return "A";
  if (score >= 70) return "B";
  if (score >= 50) return "C";
  return "D";
}

function hasPath(snapshot: JsHealthSnapshot, path: string) {
  const expected = path.toLowerCase();
  return snapshot.paths.some((candidate) => candidate.toLowerCase() === expected);
}

function workflowNames(snapshot: JsHealthSnapshot) {
  return snapshot.workflowNames ?? snapshot.paths.filter((path) => path.toLowerCase().startsWith(".github/workflows/"));
}

function workflowSignal(snapshot: JsHealthSnapshot) {
  return [...workflowNames(snapshot), ...(snapshot.workflowContent ?? [])].join(" ").toLowerCase();
}

function dependencyNamesFor(packageJson: Record<string, unknown> | null) {
  return ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"]
    .flatMap((field) => Object.keys(recordValue(packageJson?.[field]) ?? {}));
}

function recordValue(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function stringValues(value: Record<string, unknown> | null) {
  return Object.entries(value ?? {}).filter((entry): entry is [string, string] => typeof entry[1] === "string");
}

function hasNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function missingFields<T extends readonly string[]>(fields: T, present: readonly string[]) {
  return fields.filter((field) => !present.includes(field));
}

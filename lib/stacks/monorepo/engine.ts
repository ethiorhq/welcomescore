import type {
  StackCheck,
  StackNextUsefulMove,
  StackReport,
  StackSnapshot,
} from "../types";

export function evaluateMonorepoStack(snapshot: StackSnapshot): StackReport {
  const paths = snapshot.paths.map((p) => p.toLowerCase());
  const packageJson = snapshot.packageJson ?? {};
  const deps = {
    ...((packageJson.dependencies as Record<string, string> | undefined) ?? {}),
    ...((packageJson.devDependencies as Record<string, string> | undefined) ?? {}),
  };

  const checks: StackCheck[] = [];

  // Check 1: Pipeline Orchestration & Caching (25 pts)
  const hasTurbo = paths.some((p) => p === "turbo.json" || p.endsWith("/turbo.json")) || Boolean(deps.turbo);
  const hasNx = paths.some((p) => p === "nx.json" || p.endsWith("/nx.json")) || Boolean(deps.nx);

  if (hasTurbo || hasNx) {
    checks.push({
      id: "monorepo-pipeline-caching",
      category: "Build Orchestration",
      label: "Build Pipeline & Task Caching",
      status: "pass",
      points: 25,
      maxPoints: 25,
      explanation: `Configured build orchestrator with remote caching (${hasTurbo ? "Turborepo" : "Nx"}).`,
    });
  } else {
    checks.push({
      id: "monorepo-pipeline-caching",
      category: "Build Orchestration",
      label: "Build Pipeline & Task Caching",
      status: "partial",
      points: 12,
      maxPoints: 25,
      explanation: "Workspaces detected without Turborepo or Nx task orchestration. Builds cannot take advantage of cached outputs.",
      remediation: {
        title: "Add Turborepo Pipeline Caching",
        summary: "Set up turbo.json to cache lint, test, and build outputs across monorepo packages.",
        targetPath: "turbo.json",
        language: "json",
        codeSnippet: `{\n  "$schema": "https://turbo.build/schema.json",\n  "tasks": {\n    "build": {\n      "dependsOn": ["^build"],\n      "outputs": [".next/**", "dist/**"]\n    },\n    "lint": {},\n    "test": {}\n  }\n}`,
        acceptanceCriteria: ["Add turbo.json to root workspace.", "Install turbo dependency."],
        effort: "small",
      },
    });
  }

  // Check 2: Modern Package Manager & Lockfile (25 pts)
  const hasPnpm = paths.some((p) => p.includes("pnpm-lock.yaml"));
  const hasBun = paths.some((p) => p.includes("bun.lockb") || p.includes("bun.lock"));

  if (hasPnpm || hasBun) {
    checks.push({
      id: "monorepo-package-manager",
      category: "Dependency Management",
      label: "Modern Lockfile & Hoisting",
      status: "pass",
      points: 25,
      maxPoints: 25,
      explanation: `Uses high-performance package manager (${hasPnpm ? "pnpm" : "Bun"}) with strict dependency isolation.`,
    });
  } else {
    checks.push({
      id: "monorepo-package-manager",
      category: "Dependency Management",
      label: "Modern Lockfile & Hoisting",
      status: "partial",
      points: 12,
      maxPoints: 25,
      explanation: "Using standard npm or yarn lockfile. pnpm or Bun provides faster CI installations and avoids phantom dependencies.",
      remediation: {
        title: "Migrate Monorepo to pnpm",
        summary: "Use pnpm for strict dependency isolation and instant hard-linked package deduplication.",
        targetPath: "pnpm-workspace.yaml",
        language: "yaml",
        codeSnippet: `packages:\n  - "apps/*"\n  - "packages/*"`,
        acceptanceCriteria: ["Create pnpm-workspace.yaml and generate pnpm-lock.yaml."],
        effort: "medium",
      },
    });
  }

  // Check 3: Fast Formatting & Linting (25 pts)
  const hasBiome = paths.some((p) => p.includes("biome.json")) || Boolean(deps["@biomejs/biome"]);
  const hasFlatConfig = paths.some((p) => p.includes("eslint.config."));

  if (hasBiome || hasFlatConfig) {
    checks.push({
      id: "monorepo-fast-linting",
      category: "Tooling Modernity",
      label: "Modern Fast Linter / Formatter",
      status: "pass",
      points: 25,
      maxPoints: 25,
      explanation: `Uses next-generation fast toolchain (${hasBiome ? "Biome" : "ESLint 9 Flat Config"}).`,
    });
  } else {
    checks.push({
      id: "monorepo-fast-linting",
      category: "Tooling Modernity",
      label: "Modern Fast Linter / Formatter",
      status: "partial",
      points: 12,
      maxPoints: 25,
      explanation: "Legacy ESLint/Prettier configuration observed. Adopting Biome or ESLint 9 Flat Config speeds up monorepo CI by up to 20x.",
      remediation: {
        title: "Adopt Biome for Fast Monorepo Linting",
        summary: "Set up biome.json for single-binary formatting and linting across all workspace packages.",
        targetPath: "biome.json",
        language: "json",
        codeSnippet: `{\n  "$schema": "https://biomejs.dev/schemas/1.9.4/schema.json",\n  "organizeImports": { "enabled": true },\n  "linter": { "enabled": true },\n  "formatter": { "enabled": true, "indentStyle": "space", "lineWidth": 100 }\n}`,
        acceptanceCriteria: ["Add biome.json to workspace root."],
        effort: "small",
      },
    });
  }

  // Check 4: Workspace Isolation & Packages Directory (25 pts)
  const hasPackagesDir = paths.some((p) => p.startsWith("packages/") || p.startsWith("apps/"));
  if (hasPackagesDir) {
    checks.push({
      id: "monorepo-workspace-boundaries",
      category: "Architecture",
      label: "Workspace Directory Separation",
      status: "pass",
      points: 25,
      maxPoints: 25,
      explanation: "Clean directory separation observed with dedicated apps/ and packages/ boundaries.",
    });
  } else {
    checks.push({
      id: "monorepo-workspace-boundaries",
      category: "Architecture",
      label: "Workspace Directory Separation",
      status: "partial",
      points: 12,
      maxPoints: 25,
      explanation: "Organize reusable utilities and applications into dedicated apps/ and packages/ directories.",
      remediation: {
        title: "Establish Clean Package Boundaries",
        summary: "Group deployable applications under apps/ and reusable libraries under packages/.",
        targetPath: "package.json",
        language: "json",
        codeSnippet: `{\n  "workspaces": [\n    "apps/*",\n    "packages/*"\n  ]\n}`,
        acceptanceCriteria: ["Separate shared packages from main applications."],
        effort: "medium",
      },
    });
  }

  const totalScore = checks.reduce((acc, c) => acc + c.points, 0);
  let grade: StackReport["grade"] = "F";
  if (totalScore >= 90) grade = "A";
  else if (totalScore >= 80) grade = "B";
  else if (totalScore >= 70) grade = "C";
  else if (totalScore >= 60) grade = "D";

  const nonPassingChecks = checks
    .filter((c) => c.status !== "pass" && c.remediation)
    .sort((a, b) => b.maxPoints - b.points - (a.maxPoints - a.points));

  let nextUsefulMove: StackNextUsefulMove | null = null;
  if (nonPassingChecks.length > 0 && nonPassingChecks[0].remediation) {
    const topCheck = nonPassingChecks[0];
    const rem = topCheck.remediation!;
    nextUsefulMove = {
      id: topCheck.id,
      title: rem.title,
      whyItMatters: topCheck.explanation,
      effort: rem.effort,
      expectedOutcome: rem.summary,
      acceptanceCriteria: rem.acceptanceCriteria,
      remediation: rem,
    };
  } else {
    nextUsefulMove = {
      id: "monorepo-maintain-excellence",
      title: "Maintain monorepo build caching and package boundaries",
      whyItMatters: "Pipeline caching, lockfile hygiene, and workspace separation are fully optimized.",
      effort: "small",
      expectedOutcome: "Keep workspace tasks cached and avoid phantom dependencies.",
      acceptanceCriteria: ["Ensure CI enforces turbo/pnpm lockfile checks on PRs."],
    };
  }

  return {
    stackId: "monorepo",
    stackName: "Monorepo & Tooling",
    tagline: "Turborepo Task Caching, pnpm/Bun Isolation, and Biome Tooling",
    score: totalScore,
    grade,
    checks,
    nextUsefulMove,
    detected: true,
    confidence: "high",
    limitations: [
      "Evaluates declared monorepo configuration files, lockfiles, and workspace directories.",
      "Does not benchmark remote cache latency or execute build tasks.",
    ],
  };
}

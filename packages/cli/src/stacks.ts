import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import chalk, { Chalk } from "chalk";
import {
  detectStacks,
  evaluateAllDetectedStacks,
  evaluateStack,
} from "../../../lib/stacks/index.js";
import type {
  StackId,
  StackReport,
  StackSnapshot,
  StackCheck,
} from "../../../lib/stacks/types.js";

export { detectStacks, evaluateAllDetectedStacks };
export type { StackId, StackReport, StackSnapshot };

const STACK_FILE_CANDIDATES = [
  "package.json",
  "tsconfig.json",
  "turbo.json",
  "pnpm-workspace.yaml",
  "pnpm-lock.yaml",
  "bun.lockb",
  "bun.lock",
  "package-lock.json",
  "yarn.lock",
  "biome.json",
  "biome.jsonc",
  "next.config.js",
  "next.config.mjs",
  "next.config.ts",
  "app/layout.tsx",
  "app/layout.jsx",
  "app/layout.js",
  "app/error.tsx",
  "app/error.jsx",
  "app/not-found.tsx",
  "app/not-found.jsx",
  "app/sitemap.ts",
  "app/robots.ts",
  "app/opengraph-image.tsx",
  "src/app/layout.tsx",
  "src/app/error.tsx",
  "src/app/not-found.tsx",
  "src/app/sitemap.ts",
  "src/app/robots.ts",
  "src/app/opengraph-image.tsx",
  "sitemap.ts",
  "robots.ts",
  "vitest.config.ts",
  "vitest.config.js",
  "vitest.config.mjs",
  ".eslintrc.json",
  ".eslintrc.js",
  ".eslintrc.cjs",
  "eslint.config.js",
  "eslint.config.mjs",
];

export async function readLocalStackSnapshot(
  cwd: string,
  packageJson: Record<string, unknown> | null,
): Promise<StackSnapshot> {
  const rootEntries = await listDirectoryEntries(cwd);

  // Check candidate paths
  const observedPaths: string[] = [];
  for (const candidate of STACK_FILE_CANDIDATES) {
    try {
      const fullPath = path.join(cwd, candidate);
      const s = await stat(fullPath);
      if (s.isFile()) {
        observedPaths.push(candidate);
      }
    } catch {
      // not found
    }
  }

  // Also check if any .tsx or .jsx files exist in app/ or src/
  for (const entry of rootEntries) {
    if (["app", "src", "packages", "apps", "components"].includes(entry)) {
      const subEntries = await listDirectoryEntries(path.join(cwd, entry));
      for (const sub of subEntries) {
        if (sub.endsWith(".tsx") || sub.endsWith(".jsx")) {
          observedPaths.push(`${entry}/${sub}`);
        }
      }
    }
  }

  return {
    packageJson,
    paths: observedPaths,
  };
}

async function listDirectoryEntries(targetDir: string): Promise<string[]> {
  try {
    const dirents = await readdir(targetDir, { withFileTypes: true });
    return dirents.map((d) => d.name);
  } catch {
    return [];
  }
}

export function evaluateStackById(
  snapshot: StackSnapshot,
  stackId: StackId,
): StackReport | null {
  return evaluateStack(stackId, snapshot);
}

export function renderStackHumanReport(
  report: StackReport,
  options: { color?: boolean; details?: boolean } = {},
): string {
  const paint = options.color === false ? new Chalk({ level: 0 }) : chalk;
  const gradeColor =
    report.grade === "A"
      ? paint.hex("#7A9B76")
      : report.grade === "B"
      ? paint.hex("#E8A23D")
      : paint.hex("#D9534F");

  const lines = [
    `${paint.bold(report.stackName)}  ${gradeColor(
      `${report.score}/100 (${report.grade})`,
    )}`,
    paint.dim(report.tagline),
    "",
  ];

  for (const check of report.checks) {
    const symbol =
      check.status === "pass"
        ? paint.green("✓")
        : check.status === "partial"
        ? paint.yellow("~")
        : paint.red("·");
    const scoreText = `${check.points}/${check.maxPoints} pts`;
    lines.push(`  ${symbol} ${check.label.padEnd(36)} ${paint.dim(scoreText)}`);
    if (options.details) {
      lines.push(`    ${paint.dim(check.explanation)}`);
      if (check.remediation) {
        lines.push(
          `    ${paint.hex("#E8A23D")("→ Fix:")} ${paint.dim(
            check.remediation.title,
          )} (${paint.cyan(check.remediation.targetPath)})`,
        );
      }
    }
  }

  if (report.nextUsefulMove) {
    lines.push("");
    lines.push(
      `${paint.bold("Next Useful Move:")} ${report.nextUsefulMove.title}`,
    );
    lines.push(paint.dim(report.nextUsefulMove.whyItMatters));
    if (report.nextUsefulMove.remediation) {
      lines.push(
        paint.cyan(`Target File: ${report.nextUsefulMove.remediation.targetPath}`),
      );
    }
  }

  lines.push("");
  lines.push(
    paint.dim(
      "Stack scores evaluate observable architecture, configuration, and dependencies.",
    ),
  );

  return lines.join("\n");
}

export function renderStackMarkdown(report: StackReport): string {
  const lines = [
    `# ${report.stackName} Health Report`,
    "",
    `**Score:** ${report.score}/100 (${report.grade})`,
    `**Tagline:** ${report.tagline}`,
    "",
    "| Check | Category | Status | Points | Finding |",
    "|---|---|---|---:|---|",
    ...report.checks.map(
      (c: StackCheck) =>
        `| ${c.label} | ${c.category} | ${c.status} | ${c.points}/${c.maxPoints} | ${c.explanation.replace(/\|/g, "\\|")} |`,
    ),
    "",
  ];

  if (report.nextUsefulMove) {
    lines.push("## Next Useful Move");
    lines.push(`**${report.nextUsefulMove.title}**`);
    lines.push("");
    lines.push(report.nextUsefulMove.whyItMatters);
    if (report.nextUsefulMove.remediation) {
      lines.push("");
      lines.push(`\`\`\`${report.nextUsefulMove.remediation.language}`);
      lines.push(report.nextUsefulMove.remediation.codeSnippet);
      lines.push("```");
    }
    lines.push("");
  }

  return lines.join("\n");
}

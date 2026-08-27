import { execFile } from "node:child_process";
import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import type { JsHealthSnapshot } from "./health.js";

const execFileAsync = promisify(execFile);
const ROOT_PATHS = [
  "package.json",
  "tsconfig.json",
  "jsconfig.json",
  "eslint.config.js",
  "eslint.config.mjs",
  "eslint.config.cjs",
  ".eslintrc",
  ".eslintrc.json",
  ".eslintrc.js",
  ".eslintrc.cjs",
  "biome.json",
  "biome.jsonc",
  "vitest.config.ts",
  "vitest.config.js",
  "jest.config.ts",
  "jest.config.js",
  ".nvmrc",
  "CONTRIBUTING.md",
  "CODE_OF_CONDUCT.md",
  "CODE-OF-CONDUCT.md",
  ".github/ISSUE_TEMPLATE/good_first_issue.md",
  ".github/ISSUE_TEMPLATE/good-first-issue.md",
];
const WORKFLOW_DIRECTORY = ".github/workflows";
const MAX_WORKFLOW_BYTES = 64_000;

export type LocalSnapshotOptions = {
  cwd: string;
  includeGithubLabel?: boolean;
};

export async function readLocalSnapshot(options: LocalSnapshotOptions): Promise<JsHealthSnapshot> {
  const cwd = path.resolve(options.cwd);
  const packageJson = await readPackageJson(cwd);
  const paths = await existingPaths(cwd, ROOT_PATHS);
  const workflows = await readWorkflows(cwd);
  const repository = await getRepositoryReference(cwd, packageJson);
  const hasStarterIssueLabel = options.includeGithubLabel && repository
    ? await readStarterIssueLabel(repository)
    : null;

  return {
    subject: {
      kind: "local",
      name: typeof packageJson?.name === "string" ? packageJson.name : path.basename(cwd),
      ...(repository ? { repository } : {}),
    },
    packageJson,
    paths: [...paths, ...workflows.paths],
    workflowNames: workflows.paths,
    workflowContent: workflows.content,
    hasStarterIssueLabel,
  };
}

async function readPackageJson(cwd: string): Promise<Record<string, unknown> | null> {
  const content = await readOptional(path.join(cwd, "package.json"));
  if (!content) {
    return null;
  }

  try {
    const parsed = JSON.parse(content) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed as Record<string, unknown>
      : null;
  } catch {
    throw new Error("package.json is not valid JSON.");
  }
}

async function existingPaths(cwd: string, candidates: string[]) {
  const results = await Promise.all(candidates.map(async (candidate) => {
    try {
      const target = path.join(cwd, candidate);
      return (await stat(target)).isFile() ? candidate : null;
    } catch {
      return null;
    }
  }));

  return results.filter((value): value is string => Boolean(value));
}

async function readWorkflows(cwd: string) {
  const directory = path.join(cwd, WORKFLOW_DIRECTORY);
  try {
    const entries = await readdir(directory, { withFileTypes: true });
    const names = entries
      .filter((entry) => entry.isFile() && /\.ya?ml$/i.test(entry.name))
      .map((entry) => `${WORKFLOW_DIRECTORY}/${entry.name}`);
    const content = await Promise.all(names.map(async (name) => {
      const value = await readOptional(path.join(cwd, name), MAX_WORKFLOW_BYTES);
      return value ?? "";
    }));
    return { paths: names, content };
  } catch {
    return { paths: [] as string[], content: [] as string[] };
  }
}

async function getRepositoryReference(cwd: string, packageJson: Record<string, unknown> | null) {
  const fromPackage = repositoryFromPackageJson(packageJson?.repository);
  if (fromPackage) {
    return fromPackage;
  }

  try {
    const { stdout } = await execFileAsync("git", ["config", "--get", "remote.origin.url"], { cwd, timeout: 2_000 });
    return repositoryFromRemote(stdout.trim());
  } catch {
    return undefined;
  }
}

function repositoryFromPackageJson(value: unknown) {
  if (typeof value === "string") {
    return repositoryFromRemote(value);
  }
  if (value && typeof value === "object" && "url" in value && typeof value.url === "string") {
    return repositoryFromRemote(value.url);
  }
  return undefined;
}

function repositoryFromRemote(value: string) {
  const normalized = value
    .replace(/^git\+/, "")
    .replace(/^git@github\.com:/, "https://github.com/")
    .replace(/\.git$/, "");
  const match = normalized.match(/^https?:\/\/(?:www\.)?github\.com\/([\w.-]+)\/([\w.-]+)$/i);
  return match ? `${match[1]}/${match[2]}` : undefined;
}

async function readStarterIssueLabel(repository: string) {
  try {
    const response = await fetch(`https://api.github.com/repos/${repository}/labels?per_page=100`, {
      headers: { Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" },
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok) {
      return null;
    }
    const labels = await response.json() as Array<{ name?: string }>;
    return labels.some((label) => /^(good first issue|good-first-issue|beginner friendly)$/i.test(label.name ?? ""));
  } catch {
    return null;
  }
}

async function readOptional(filePath: string, maxBytes?: number) {
  try {
    const content = await readFile(filePath, "utf8");
    return maxBytes ? content.slice(0, maxBytes) : content;
  } catch {
    return null;
  }
}

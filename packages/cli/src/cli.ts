import ora from "ora";
import { Command, InvalidArgumentError } from "commander";
import { applyFixes, planFixes } from "./fixes.js";
import { evaluateJsHealth } from "./health.js";
import { renderInteractiveDashboard } from "./interactive.js";
import { renderCiSummary, renderFixPlan, renderHumanReport, renderJson, renderMarkdown } from "./reporters.js";
import { readLocalSnapshot } from "./snapshot.js";

export type CliOptions = {
  cwd: string;
  ci: boolean;
  threshold: number;
  json: boolean;
  markdown: boolean;
  details: boolean;
  fix: boolean;
  dryRun: boolean;
  github: boolean;
  color: boolean;
};

export async function runCli(argv: string[] = process.argv): Promise<number> {
  const program = buildProgram();
  program.parse(argv);
  const options = program.opts<CliOptions>();

  if (options.ci && options.fix) {
    writeError("--ci and --fix cannot be used together. Review and apply templates locally instead.");
    return 2;
  }
  if (options.json && (options.fix || options.markdown)) {
    writeError("--json cannot be combined with --fix or --markdown, because JSON must remain the only stdout output.");
    return 2;
  }
  if (!Number.isInteger(options.threshold) || options.threshold < 0 || options.threshold > 100) {
    writeError("--threshold must be an integer from 0 to 100.");
    return 2;
  }

  const shouldSpin = !options.ci && !options.json && !options.markdown && process.stderr.isTTY;
  const spinner = shouldSpin ? ora({ text: "Reading local JavaScript project signals…", color: "yellow" }).start() : null;

  try {
    const snapshot = await readLocalSnapshot({ cwd: options.cwd, includeGithubLabel: options.github });
    const report = evaluateJsHealth(snapshot);
    spinner?.succeed("JavaScript project signals read");

    if (options.fix) {
      const execution = options.dryRun
        ? { plan: await planFixes(options.cwd, report), written: [] as string[] }
        : await applyFixes(options.cwd, report, false);
      process.stdout.write(renderFixPlan(execution.plan, options.dryRun));
      if (execution.written.length > 0) {
        process.stdout.write(`Created: ${execution.written.join(", ")}\n`);
      }
      return 0;
    }

    if (options.json) {
      process.stdout.write(renderJson(report));
    } else if (options.markdown) {
      process.stdout.write(renderMarkdown(report));
    } else if (options.ci) {
      process.stderr.write(`${renderCiSummary(report, options.threshold)}\n`);
    } else if (process.stdout.isTTY) {
      await renderInteractiveDashboard(report);
    } else {
      process.stdout.write(`${renderHumanReport(report, { details: options.details, color: options.color })}\n`);
    }

    return options.ci && report.score < options.threshold ? 1 : 0;
  } catch (error) {
    spinner?.fail("WelcomeScore could not complete the local scan");
    writeError(error instanceof Error ? error.message : "Unexpected scanner error.");
    return 2;
  }
}

export function buildProgram() {
  const program = new Command();
  program
    .name("welcomescore")
    .description("Local JavaScript and TypeScript repository health checks for package, tooling, CI, and contributor foundations.")
    .version("0.1.0")
    .option("--cwd <path>", "project directory to inspect", process.cwd())
    .option("--ci", "quiet CI mode with a threshold exit code", false)
    .option("--threshold <score>", "minimum passing score in CI mode", parseThreshold, 80)
    .option("--json", "write only the stable report JSON to stdout", false)
    .option("--markdown", "write a Markdown report to stdout", false)
    .option("--details", "include diagnostic details in non-interactive human output", false)
    .option("--fix", "create only absent, low-risk templates after review", false)
    .option("--dry-run", "show safe template writes without creating files", false)
    .option("--github", "explicitly read public GitHub starter-label evidence from the configured origin remote", false)
    .option("--no-color", "disable ANSI colors in human output");
  return program;
}

function parseThreshold(value: string) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) {
    throw new InvalidArgumentError("threshold must be a number");
  }
  return parsed;
}

function writeError(message: string) {
  process.stderr.write(`welcomescore: ${message}\n`);
}

import chalk, { Chalk } from "chalk";
import type { FixPlanItem } from "./fixes.js";
import type { JsHealthCheck, JsHealthReport } from "./health.js";

const statusSymbol: Record<JsHealthCheck["status"], string> = {
  pass: "✓",
  partial: "~",
  missing: "·",
  "not-applicable": "–",
};

export function renderSummary(report: JsHealthReport, color = true) {
  const paint = color ? chalk : new Chalk({ level: 0 });
  const score = scoreText(report.score, report.grade, paint);
  return `${paint.bold("WelcomeScore JS Health")}  ${score}\n${paint.dim(`${report.subject.name} · ${report.generatedAt}`)}`;
}

export function renderHumanReport(report: JsHealthReport, options: { details?: boolean; color?: boolean } = {}) {
  const paint = options.color === false ? new Chalk({ level: 0 }) : chalk;
  const rows = report.categories.map((category) => {
    const label = category.label.padEnd(26);
    return `  ${paint.hex("#E8A23D")(label)} ${String(category.score).padStart(2)}/${category.maxScore}`;
  });
  const sections = [renderSummary(report, options.color !== false), "", ...rows];

  if (options.details) {
    for (const category of report.categories) {
      sections.push("", paint.bold(category.label));
      for (const check of report.checks.filter((item) => item.category === category.id)) {
        sections.push(`  ${paintStatus(check, paint)} ${check.label} ${paint.dim(`(${check.points}/${check.maxPoints})`)}`);
        sections.push(`    ${paint.dim(check.evidence)}`);
      }
    }
  }

  sections.push("", paint.dim("This report checks observable project signals; it is not a security audit, certification, legal opinion, or endorsement."));
  return sections.join("\n");
}

export function renderCiSummary(report: JsHealthReport, threshold: number) {
  const outcome = report.score >= threshold ? "PASS" : "BELOW_THRESHOLD";
  return `welcomescore ${outcome}: ${report.score}/100 (threshold ${threshold}) — ${report.subject.name}`;
}

export function renderJson(report: JsHealthReport) {
  return `${JSON.stringify(report, null, 2)}\n`;
}

export function renderMarkdown(report: JsHealthReport) {
  const lines = [
    "# WelcomeScore JavaScript Health Report",
    "",
    `**Subject:** ${report.subject.name}`,
    `**Generated:** ${report.generatedAt}`,
    `**Score:** ${report.score}/100 (${report.grade})`,
    "",
    "| Category | Score |",
    "|---|---:|",
    ...report.categories.map((category) => `| ${category.label} | ${category.score}/${category.maxScore} |`),
    "",
    "| Check | Status | Score | Evidence |",
    "|---|---|---:|---|",
    ...report.checks.map((check) => `| ${check.label} | ${check.status} | ${check.points}/${check.maxPoints} | ${check.evidence.replace(/\|/g, "\\|")} |`),
    "",
    "## Limits",
    "",
    ...report.limitations.map((limit) => `- ${limit}`),
    "",
  ];
  return lines.join("\n");
}

export function renderFixPlan(plan: FixPlanItem[], dryRun: boolean) {
  const heading = dryRun ? "WelcomeScore safe fix plan (dry run)" : "WelcomeScore safe fix result";
  const lines = [heading, ""];
  if (plan.length === 0) {
    return `${heading}\n\nNo safe templates are needed.\n`;
  }
  for (const item of plan) {
    const prefix = item.status === "planned" ? "create" : item.status === "skipped-existing" ? "keep" : "review";
    lines.push(`  ${prefix.padEnd(7)} ${item.remediation.targetPath} — ${item.remediation.title}`);
  }
  lines.push("", "Existing files are never overwritten. Package metadata is written only as a separate merge fragment.");
  return `${lines.join("\n")}\n`;
}

function paintStatus(check: JsHealthCheck, paint: typeof chalk) {
  const value = `${statusSymbol[check.status]} ${check.status}`;
  if (check.status === "pass") return paint.hex("#7A9B76")(value);
  if (check.status === "partial") return paint.hex("#E8A23D")(value);
  return paint.dim(value);
}

function scoreText(score: number, grade: string, paint: typeof chalk) {
  const value = `${score}/100 ${grade}`;
  if (score >= 85) return paint.hex("#7A9B76").bold(value);
  if (score >= 70) return paint.hex("#E8A23D").bold(value);
  return paint.bold(value);
}

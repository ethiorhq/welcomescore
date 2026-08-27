import { access, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { getJsHealthRemediation, type JsHealthReport, type JsHealthRemediation } from "./health.js";

const CREATE_IF_ABSENT_IDS = new Set([
  "node-version",
  "contributing",
  "code-of-conduct",
  "starter-issues",
]);
const PACKAGE_FRAGMENT_IDS = new Set([
  "package-metadata",
  "package-exports",
  "node-engines",
  "package-manager",
  "bundle-size",
]);

export type FixPlanItem = {
  remediation: JsHealthRemediation;
  status: "planned" | "skipped-existing" | "skipped-manual";
};

export type FixExecution = {
  plan: FixPlanItem[];
  written: string[];
};

export async function planFixes(cwd: string, report: JsHealthReport): Promise<FixPlanItem[]> {
  const unresolved = report.checks
    .filter((check) => check.status !== "pass" && check.status !== "not-applicable" && check.remediationId)
    .map((check) => check.remediationId!);
  const unique = Array.from(new Set(unresolved));
  const plans: FixPlanItem[] = [];

  for (const id of unique) {
    if (PACKAGE_FRAGMENT_IDS.has(id)) {
      if (plans.some((plan) => plan.remediation.id === "package-metadata")) {
        continue;
      }
      const remediation = getJsHealthRemediation("package-metadata");
      plans.push({ remediation, status: await exists(path.join(cwd, remediation.targetPath)) ? "skipped-existing" : "planned" });
      continue;
    }

    const remediation = getJsHealthRemediation(id);
    if (!CREATE_IF_ABSENT_IDS.has(id) || remediation.writeMode !== "create-if-absent") {
      plans.push({ remediation, status: "skipped-manual" });
      continue;
    }

    plans.push({ remediation, status: await exists(path.join(cwd, remediation.targetPath)) ? "skipped-existing" : "planned" });
  }

  return plans;
}

export async function applyFixes(cwd: string, report: JsHealthReport, dryRun: boolean): Promise<FixExecution> {
  const plan = await planFixes(cwd, report);
  const written: string[] = [];
  if (dryRun) {
    return { plan, written };
  }

  for (const item of plan) {
    if (item.status !== "planned") {
      continue;
    }
    const destination = path.join(cwd, item.remediation.targetPath);
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, item.remediation.content, { encoding: "utf8", flag: "wx" });
    written.push(item.remediation.targetPath);
  }

  return { plan, written };
}

async function exists(filePath: string) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

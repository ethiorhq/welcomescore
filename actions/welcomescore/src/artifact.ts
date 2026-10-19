import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { JsHealthReport } from "@/lib/jsHealth/types";
import { renderJson, renderMarkdown } from "@/packages/cli/src/reporters";

export async function writeReportArtifact(
  cwd: string,
  report: JsHealthReport,
  format: "json" | "markdown",
): Promise<string> {
  const dir = path.join(cwd, ".welcomescore");
  await mkdir(dir, { recursive: true });

  const fileName = format === "markdown" ? "report.md" : "report.json";
  const filePath = path.join(dir, fileName);
  const content = format === "markdown" ? renderMarkdown(report) : renderJson(report);

  await writeFile(filePath, content, "utf8");
  return filePath;
}

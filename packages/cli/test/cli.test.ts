import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { runCli } from "../src/cli";
import { applyFixes } from "../src/fixes";
import { evaluateJsHealth } from "../src/health";
import { readLocalSnapshot } from "../src/snapshot";

const fixtures = path.resolve(import.meta.dirname, "fixtures");
const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

describe("WelcomeScore CLI health index", () => {
  it("scores a healthy JavaScript package from local allowlisted project signals", async () => {
    const snapshot = await readLocalSnapshot({ cwd: path.join(fixtures, "healthy") });
    const report = evaluateJsHealth(snapshot);

    expect(report.score).toBe(97);
    expect(report.categories.map((category) => category.score)).toEqual([35, 25, 25, 12]);
    expect(report.checks.find((check) => check.id === "contributors-starter-issues")?.status).toBe("partial");
    expect(report.limitations.join(" ")).toMatch(/not a security audit/i);
  });

  it("reports transparent missing signals for a minimal package without treating them as execution errors", async () => {
    const snapshot = await readLocalSnapshot({ cwd: path.join(fixtures, "minimal") });
    const report = evaluateJsHealth(snapshot);

    expect(report.score).toBe(2);
    expect(report.checks.filter((check) => check.status === "missing")).toHaveLength(19);
  });

  it("uses CI threshold failures as exit code 1", async () => {
    const code = await runCli(["node", "welcomescore", "--ci", "--cwd", path.join(fixtures, "minimal"), "--threshold", "80"]);
    expect(code).toBe(1);
  });

  it("creates only missing allowlisted templates and preserves package.json", async () => {
    const cwd = await mkdtemp(path.join(os.tmpdir(), "welcomescore-cli-"));
    temporaryDirectories.push(cwd);
    await writeFile(path.join(cwd, "package.json"), JSON.stringify({ name: "example", version: "0.0.1" }));
    const report = evaluateJsHealth(await readLocalSnapshot({ cwd }));

    const execution = await applyFixes(cwd, report, false);

    expect(execution.written).toContain(".nvmrc");
    expect(execution.written).toContain("CONTRIBUTING.md");
    expect(execution.written).toContain("welcomescore.package-fragment.json");
    expect(JSON.parse(await readFile(path.join(cwd, "package.json"), "utf8"))).toEqual({ name: "example", version: "0.0.1" });
    await expect(readFile(path.join(cwd, "welcomescore.package-fragment.json"), "utf8")).resolves.toContain("repository");
  });
});

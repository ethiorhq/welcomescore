import { describe, expect, it } from "vitest";
import { evaluateJsHealth } from "@/lib/jsHealth/engine";
import type { JsHealthSnapshot } from "@/lib/jsHealth/types";

const completeSnapshot: JsHealthSnapshot = {
  subject: { kind: "local", name: "fixture", repository: "example/fixture" },
  packageJson: {
    name: "fixture",
    version: "1.0.0",
    description: "fixture",
    license: "MIT",
    repository: "example/fixture",
    exports: "./dist/index.js",
    types: "./dist/index.d.ts",
    engines: { node: ">=22" },
    funding: "https://example.test/fund",
    packageManager: "npm@11",
    files: ["dist"],
    scripts: { test: "vitest run" },
    devDependencies: { vitest: "^2", eslint: "^9", "size-limit": "^11" },
  },
  paths: ["tsconfig.json", ".nvmrc", "CONTRIBUTING.md", "CODE_OF_CONDUCT.md"],
  workflowNames: [".github/workflows/verify.yml", ".github/workflows/publish.yml"],
  workflowContent: [
    "uses: actions/setup-node@v7\n- run: npm test\n- run: npm run size-limit",
    "on:\n  release:\n- run: npm publish --provenance --access public",
  ],
  hasStarterIssueLabel: true,
};

describe("evaluateJsHealth", () => {
  it("returns an explainable 100-point report from observable signals", () => {
    const report = evaluateJsHealth(completeSnapshot);

    expect(report.score).toBe(100);
    expect(report.grade).toBe("A");
    expect(report.categories.map((category) => category.score)).toEqual([35, 25, 25, 15]);
    expect(report.checks.every((check) => check.status === "pass")).toBe(true);
    expect(report.limitations.join(" ")).toMatch(/not a security audit/i);
  });

  it("treats private-package publication signals as not applicable without presenting a publishing requirement", () => {
    const report = evaluateJsHealth({
      ...completeSnapshot,
      packageJson: { ...completeSnapshot.packageJson, private: true, files: undefined },
    });

    expect(report.checks.find((check) => check.id === "package-publish-files")?.status).toBe("not-applicable");
    expect(report.checks.find((check) => check.id === "cicd-publish")?.status).toBe("not-applicable");
  });

  it("requires observed workflow commands rather than a workflow filename alone for CI test credit", () => {
    const report = evaluateJsHealth({
      ...completeSnapshot,
      workflowNames: [".github/workflows/ci.yml"],
      workflowContent: ["name: CI\nsteps:\n  - run: echo ready"],
    });

    expect(report.checks.find((check) => check.id === "cicd-tests")?.status).toBe("missing");
    expect(report.checks.find((check) => check.id === "cicd-node-setup")?.status).toBe("missing");
  });
});

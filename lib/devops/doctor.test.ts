import { describe, it, expect } from "vitest";
import {
  auditLicenseCompliance,
  analyzeWorkflows,
  diagnoseDevOps,
} from "./doctor";

describe("auditLicenseCompliance", () => {
  it("recognizes permissive open source licenses with low risk", () => {
    const mit = auditLicenseCompliance("MIT");
    expect(mit.classification).toBe("permissive");
    expect(mit.commercialUsePermitted).toBe(true);
    expect(mit.riskLevel).toBe("low");

    const apache = auditLicenseCompliance("Apache-2.0");
    expect(apache.classification).toBe("permissive");
    expect(apache.commercialUsePermitted).toBe(true);
  });

  it("identifies copyleft requirements for GPL and AGPL", () => {
    const gpl = auditLicenseCompliance("GPL-3.0");
    expect(gpl.classification).toBe("copyleft");
    expect(gpl.disclosureRequired).toBe(true);
    expect(gpl.riskLevel).toBe("medium");

    const agpl = auditLicenseCompliance("AGPL-3.0");
    expect(agpl.classification).toBe("copyleft");
    expect(agpl.riskLevel).toBe("high");
  });

  it("flags proprietary or source-available licenses with commercial restrictions", () => {
    const busl = auditLicenseCompliance("BUSL-1.1");
    expect(busl.classification).toBe("proprietary");
    expect(busl.commercialUsePermitted).toBe(false);
    expect(busl.riskLevel).toBe("high");
  });

  it("handles missing or unasserted licenses safely", () => {
    const missing = auditLicenseCompliance(null);
    expect(missing.classification).toBe("missing");
    expect(missing.riskLevel).toBe("high");
  });
});

describe("analyzeWorkflows", () => {
  it("flags repositories with zero CI workflows", () => {
    const res = analyzeWorkflows([]);
    expect(res.cachingScore).toBe(0);
    expect(res.concurrencyScore).toBe(0);
    expect(res.issues.some((i) => i.id === "no-ci-workflows")).toBe(true);
  });

  it("scores highly when workflows use caching, concurrency, and modern pins", () => {
    const sampleYml = `
name: CI
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
concurrency:
  group: ci-\${{ github.ref }}
  cancel-in-progress: true
jobs:
  test:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm test
`;
    const res = analyzeWorkflows([{ path: ".github/workflows/ci.yml", content: sampleYml }]);
    expect(res.cachingScore).toBe(100);
    expect(res.concurrencyScore).toBe(100);
    expect(res.securityScore).toBe(95);
    expect(res.issues.length).toBe(0);
  });

  it("catches mutable branch tags and missing cache", () => {
    const flawedYml = `
name: Build
on:
  push:
    branches: [main]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@master
      - run: npm install
      - run: npm test
`;
    const res = analyzeWorkflows([{ path: ".github/workflows/build.yml", content: flawedYml }]);
    expect(res.cachingScore).toBe(30);
    expect(res.securityScore).toBe(45);
    expect(res.issues.some((i) => i.id === "missing-dependency-cache")).toBe(true);
    expect(res.issues.some((i) => i.id === "outdated-or-mutable-action-pins")).toBe(true);
    expect(res.issues.some((i) => i.id === "missing-concurrency-cancel")).toBe(true);
  });
});

describe("diagnoseDevOps", () => {
  it("produces a comprehensive report and grade for a well-maintained repo", () => {
    const report = diagnoseDevOps({
      repo: "ethiorhq/welcomescore",
      defaultBranch: "main",
      licenseSpdx: "MIT",
      workflowFiles: [
        {
          path: ".github/workflows/test.yml",
          content: `
name: Tests
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
concurrency:
  group: test-\${{ github.ref }}
  cancel-in-progress: true
jobs:
  test:
    runs-on: ubuntu-latest
    timeout-minutes: 20
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          cache: 'npm'
`,
        },
      ],
    });

    expect(report.score).toBeGreaterThanOrEqual(90);
    expect(["A+", "A"]).toContain(report.grade);
    expect(report.wastedComputeEstimate.efficiencyRating).toBe("Optimal");
    expect(report.recommendedCiPatch).toContain("cancel-in-progress: true");
    expect(report.licenseCompliance.classification).toBe("permissive");
  });

  it("calculates estimated compute savings when issues exist", () => {
    const report = diagnoseDevOps({
      repo: "user/unoptimized-app",
      defaultBranch: "main",
      licenseSpdx: null,
      workflowFiles: [
        {
          path: ".github/workflows/ci.yml",
          content: `
name: CI
on: [push]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm i
`,
        },
      ],
    });

    expect(report.score).toBeLessThan(70);
    expect(report.wastedComputeEstimate.estimatedMinutesSavedPerMonth).toBeGreaterThan(0);
    expect(report.issues.some((i) => i.id === "license-risk-alert")).toBe(true);
  });
});

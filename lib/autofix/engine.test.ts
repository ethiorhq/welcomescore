import { describe, expect, it } from "vitest";
import {
  generateCiWorkflow,
  generateCodeOfConduct,
  generateContributingGuide,
  generateIssueTemplate,
  generateLicense,
  generatePullRequestTemplate,
  generateReadmeSetup,
  generateSecurityPolicy,
  getGitHubDirectNewFileUrl,
  resolveAutoFix,
} from "./engine";

describe("AutoFix Engine", () => {
  const ctx = {
    repoOwner: "testowner",
    repoName: "testproject",
    primaryLanguage: "TypeScript",
    defaultBranch: "main",
  };

  it("builds a direct GitHub new file URL correctly", () => {
    const url = getGitHubDirectNewFileUrl("testowner", "testproject", "CONTRIBUTING.md", "# Guide", "main");
    expect(url).toContain("https://github.com/testowner/testproject/new/main");
    expect(url).toContain("filename=CONTRIBUTING.md");
    expect(url).toContain("value=");
  });

  it("generates a tailored CONTRIBUTING.md guide with project details", () => {
    const fix = generateContributingGuide(ctx);
    expect(fix.targetPath).toBe("CONTRIBUTING.md");
    expect(fix.content).toContain("# Contributing to testproject");
    expect(fix.content).toContain("testowner/testproject");
    expect(fix.content).toContain("npm install");
    expect(fix.directGitHubUrl).toContain("filename=CONTRIBUTING.md");
  });

  it("generates Python specific install and test steps when language is Python", () => {
    const pyCtx = { ...ctx, primaryLanguage: "Python" };
    const fix = generateContributingGuide(pyCtx);
    expect(fix.content).toContain("pip install");
    expect(fix.content).toContain("pytest");
  });

  it("generates CODE_OF_CONDUCT.md with Contributor Covenant standards", () => {
    const fix = generateCodeOfConduct(ctx);
    expect(fix.targetPath).toBe("CODE_OF_CONDUCT.md");
    expect(fix.content).toContain("Contributor Covenant");
    expect(fix.content).toContain("testowner/testproject");
  });

  it("generates MIT LICENSE with current year and owner", () => {
    const fix = generateLicense(ctx);
    expect(fix.targetPath).toBe("LICENSE");
    expect(fix.content).toContain("MIT License");
    expect(fix.content).toContain(`Copyright (c) ${new Date().getFullYear()} testowner`);
  });

  it("generates README setup snippet", () => {
    const fix = generateReadmeSetup(ctx);
    expect(fix.targetPath).toBe("README.md");
    expect(fix.content).toContain("## Quickstart & Local Setup");
  });

  it("generates GitHub Issue Forms with structured fields", () => {
    const fix = generateIssueTemplate(ctx);
    expect(fix.targetPath).toBe(".github/ISSUE_TEMPLATE/bug_report.yml");
    expect(fix.language).toBe("yaml");
    expect(fix.content).toContain("name: 🐛 Bug Report");
  });

  it("generates GitHub Pull Request Template", () => {
    const fix = generatePullRequestTemplate(ctx);
    expect(fix.targetPath).toBe(".github/PULL_REQUEST_TEMPLATE.md");
    expect(fix.content).toContain("## Checklist");
  });

  it("generates GitHub Actions CI workflow with caching", () => {
    const fix = generateCiWorkflow(ctx);
    expect(fix.targetPath).toBe(".github/workflows/ci.yml");
    expect(fix.content).toContain("actions/checkout@v4");
    expect(fix.content).toContain("actions/setup-node@v4");
  });

  it("generates GitHub Actions CI workflow for Go", () => {
    const goCtx = { ...ctx, primaryLanguage: "Go" };
    const fix = generateCiWorkflow(goCtx);
    expect(fix.content).toContain("actions/setup-go@v5");
    expect(fix.content).toContain("go test -v ./...");
  });

  it("generates SECURITY.md policy", () => {
    const fix = generateSecurityPolicy(ctx);
    expect(fix.targetPath).toBe("SECURITY.md");
    expect(fix.content).toContain("# Security Policy");
    expect(fix.content).toContain("Private Security Advisory");
  });

  it("resolves appropriate AutoFix proposal by check label", () => {
    expect(resolveAutoFix("CONTRIBUTING.md", ctx)?.id).toBe("contributing");
    expect(resolveAutoFix("CODE_OF_CONDUCT.md", ctx)?.id).toBe("code-of-conduct");
    expect(resolveAutoFix("README setup section", ctx)?.id).toBe("readme-setup");
    expect(resolveAutoFix("LICENSE", ctx)?.id).toBe("license");
    expect(resolveAutoFix("Issue Templates", ctx)?.id).toBe("issue-template");
    expect(resolveAutoFix("Pull Request Template", ctx)?.id).toBe("pr-template");
    expect(resolveAutoFix("CI Workflow", ctx)?.id).toBe("ci-workflow");
    expect(resolveAutoFix("Security Policy", ctx)?.id).toBe("security-policy");
    expect(resolveAutoFix("Unknown Check", ctx)).toBeNull();
  });
});

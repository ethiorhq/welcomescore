import { describe, expect, it } from "vitest";
import { selectNextUsefulMove } from "./nextUsefulMove";
import { sanitizeIssueContent, buildIssueDraft } from "./issueDraft";
import { buildPatchPlan } from "./patchPlan";
import type { EvidenceItem } from "@/lib/report/types";

function mockEvidence(overrides: Partial<EvidenceItem>[]): EvidenceItem[] {
  return overrides.map((o, idx) => ({
    id: o.id ?? `check-${idx}`,
    category: o.category ?? "general",
    label: o.label ?? `Check ${idx}`,
    status: o.status ?? "pass",
    points: o.points ?? 10,
    maxPoints: o.maxPoints ?? 10,
    explanation: o.explanation ?? "Checked",
    observedAt: "2026-10-20T00:00:00Z",
    confidence: o.confidence ?? "high",
  }));
}

describe("Next Useful Move Engine", () => {
  it("prioritizes README setup as priority 10 over other missing items", () => {
    const checks = mockEvidence([
      { id: "readme-setup", status: "missing" },
      { id: "contributing-guide", status: "missing" },
      { id: "code-of-conduct", status: "missing" },
    ]);

    const move = selectNextUsefulMove(checks, { repoFullName: "owner/repo" });
    expect(move.id).toBe("readme-setup");
    expect(move.patchPlan?.files).toContain("README.md");
    expect(move.issueDraft?.title).toContain("setup instructions to README");
  });

  it("prioritizes CONTRIBUTING.md when setup is passed", () => {
    const checks = mockEvidence([
      { id: "readme-setup", status: "pass" },
      { id: "contributing-guide", status: "missing" },
      { id: "code-of-conduct", status: "missing" },
    ]);

    const move = selectNextUsefulMove(checks, { repoFullName: "owner/repo" });
    expect(move.id).toBe("contributing-guide");
    expect(move.patchPlan?.files).toContain("CONTRIBUTING.md");
  });

  it("prioritizes CI test workflow when CI is missing", () => {
    const checks = mockEvidence([
      { id: "readme-setup", status: "pass" },
      { id: "contributing-guide", status: "pass" },
      { id: "code-of-conduct", status: "pass" },
      { id: "license", status: "pass" },
      { id: "cicd-tests", status: "missing" },
    ]);

    const move = selectNextUsefulMove(checks, {
      repoFullName: "owner/repo",
      hasCiTestJob: false,
    });
    expect(move.id).toBe("ci-test-workflow");
    expect(move.patchPlan?.files).toContain(".github/workflows/test.yml");
    expect(move.issueDraft?.labels).toContain("ci");
  });

  it("prioritizes starter issue quality when docs pass but starter issues are missing", () => {
    const checks = mockEvidence([
      { id: "readme-setup", status: "pass" },
      { id: "contributing-guide", status: "pass" },
      { id: "code-of-conduct", status: "pass" },
      { id: "license", status: "pass" },
      { id: "starter-issues", status: "missing" },
    ]);

    const move = selectNextUsefulMove(checks, { repoFullName: "owner/repo" });
    expect(move.id).toBe("starter-issue-quality");
    expect(move.issueDraft?.title).toContain("Scope and label a beginner-friendly starter issue");
  });

  it("prioritizes package metadata when options flag it as missing", () => {
    const checks = mockEvidence([
      { id: "readme-setup", status: "pass" },
      { id: "contributing-guide", status: "pass" },
      { id: "code-of-conduct", status: "pass" },
      { id: "license", status: "pass" },
      { id: "starter-issues", status: "pass" },
    ]);

    const move = selectNextUsefulMove(checks, {
      repoFullName: "owner/repo",
      hasPackageMetadata: false,
    });
    expect(move.id).toBe("package-metadata");
    expect(move.patchPlan?.files).toContain("package.json");
    expect(move.patchPlan?.safety).toBe("review-required");
  });

  it("prioritizes issue templates when other foundations pass", () => {
    const checks = mockEvidence([
      { id: "readme-setup", status: "pass" },
      { id: "contributing-guide", status: "pass" },
      { id: "code-of-conduct", status: "pass" },
      { id: "license", status: "pass" },
      { id: "starter-issues", status: "pass" },
    ]);

    const move = selectNextUsefulMove(checks, {
      repoFullName: "owner/repo",
      hasIssueTemplates: false,
    });
    expect(move.id).toBe("issue-templates");
    expect(move.patchPlan?.files).toContain(".github/ISSUE_TEMPLATE/bug_report.md");
  });

  it("flags uncertain signals when evidence items have unknown status", () => {
    const checks = mockEvidence([
      { id: "readme-setup", status: "pass" },
      { id: "contributing-guide", status: "pass" },
      { id: "code-of-conduct", status: "pass" },
      { id: "license", status: "pass" },
      { id: "starter-issues", status: "pass" },
      { id: "recent-activity", status: "unknown", label: "Recently active" },
    ]);

    const move = selectNextUsefulMove(checks, { repoFullName: "owner/repo" });
    expect(move.id).toBe("uncertain-signal");
    expect(move.evidenceIds).toContain("recent-activity");
    expect(move.acceptanceCriteria.some((c) => c.includes("Recently active"))).toBe(true);
  });

  it("returns maintain-the-path when all foundations pass cleanly", () => {
    const checks = mockEvidence([
      { id: "readme-setup", status: "pass" },
      { id: "contributing-guide", status: "pass" },
      { id: "code-of-conduct", status: "pass" },
      { id: "license", status: "pass" },
      { id: "starter-issues", status: "pass" },
    ]);

    const move = selectNextUsefulMove(checks, {
      repoFullName: "owner/repo",
      hasCiTestJob: true,
      hasPackageMetadata: true,
      hasIssueTemplates: true,
      hasDefaultBranchClarity: true,
      hasReleaseNotes: true,
    });
    expect(move.id).toBe("maintain-the-path");
    expect(move.title).toContain("Keep the contributor path honest and current");
  });

  it("sanitizes dangerous HTML and control characters from inputs in issue drafts", () => {
    const maliciousRepo = "evil<script>alert(1)</script>/repo\u0000test";
    const sanitized = sanitizeIssueContent(maliciousRepo);
    expect(sanitized).not.toContain("<script>");
    expect(sanitized).not.toContain("</script>");
    expect(sanitized).not.toContain("\u0000");

    const draft = buildIssueDraft("readme-setup", maliciousRepo);
    expect(draft?.body).not.toContain("<script>");
  });

  it("buildPatchPlan returns expected plans for all 11 move categories", () => {
    const moves = [
      "contributing-guide",
      "readme-setup",
      "code-of-conduct",
      "license",
      "ci-test-workflow",
      "starter-issue-quality",
      "package-metadata",
      "default-branch-clarity",
      "issue-templates",
      "release-guidance",
      "uncertain-signal",
    ];

    for (const moveId of moves) {
      const plan = buildPatchPlan(moveId);
      expect(plan).toBeDefined();
      expect(plan?.files.length).toBeGreaterThan(0);
      expect(plan?.operations.length).toBeGreaterThan(0);
      expect(["low-risk", "review-required"]).toContain(plan?.safety);
    }
  });
});

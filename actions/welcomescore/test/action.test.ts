import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { parseActionInputs } from "../src/inputs";
import { buildPrCommentMarkdown, COMMENT_MARKER } from "../src/comment";
import { writeReportArtifact } from "../src/artifact";
import { setActionOutputs } from "../src/outputs";
import type { JsHealthReport } from "@/lib/jsHealth/types";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((d) => rm(d, { recursive: true, force: true })),
  );
});

const mockJsHealthReport: JsHealthReport = {
  schemaVersion: 1,
  subject: { kind: "local", name: "test-package" },
  generatedAt: "2026-10-20T00:00:00Z",
  score: 88,
  grade: "A",
  categories: [],
  checks: [
    {
      id: "contributing",
      category: "contributors",
      label: "Contribution guide",
      status: "pass",
      points: 5,
      maxPoints: 5,
      evidence: "Present",
    },
  ],
  limitations: ["Test limit."],
};

describe("GitHub Action Inputs & Outputs", () => {
  it("parses default inputs when environment is empty", () => {
    const inputs = parseActionInputs({});
    expect(inputs.threshold).toBe(80);
    expect(inputs.commentOnPr).toBe(false);
    expect(inputs.uploadReport).toBe(true);
    expect(inputs.format).toBe("json");
    expect(inputs.failOn).toBe("threshold");
  });

  it("parses custom environment overrides correctly", () => {
    const inputs = parseActionInputs({
      "INPUT_THRESHOLD": "95",
      "INPUT_COMMENT-ON-PR": "true",
      "INPUT_FORMAT": "markdown",
      "INPUT_FAIL-ON": "never",
      "INPUT_CWD": "/custom/path",
      "INPUT_GITHUB-TOKEN": "test-token-123",
    });

    expect(inputs.threshold).toBe(95);
    expect(inputs.commentOnPr).toBe(true);
    expect(inputs.format).toBe("markdown");
    expect(inputs.failOn).toBe("never");
    expect(inputs.cwd).toBe("/custom/path");
    expect(inputs.githubToken).toBe("test-token-123");
  });

  it("formats step outputs correctly to GITHUB_OUTPUT file", async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), "action-out-"));
    temporaryDirectories.push(tempDir);
    const outputFile = path.join(tempDir, "output.txt");

    await setActionOutputs(
      {
        score: 92,
        grade: "A",
        reportPath: ".welcomescore/report.json",
        nextUsefulMove: "Add CI test job",
        reportUrl: "https://welcomescore.vercel.app/report/owner/repo",
      },
      outputFile,
    );

    const written = await readFile(outputFile, "utf8");
    expect(written).toContain("score=92");
    expect(written).toContain("grade=A");
    expect(written).toContain("report-path=.welcomescore/report.json");
    expect(written).toContain("next-useful-move=Add CI test job");
  });
});

describe("GitHub Action Comment & Artifact Generation", () => {
  it("builds an idempotent PR comment with marker and Next Useful Move", () => {
    const comment = buildPrCommentMarkdown({
      score: 84,
      grade: "B",
      reportUrl: "https://welcomescore.vercel.app/report/owner/repo",
      nextUsefulMove: {
        title: "Add local setup instructions to README",
        expectedOutcome: "README explains prerequisites and install steps",
        effort: "medium",
      },
      checksSummary: { passed: 5, total: 6 },
    });

    expect(comment).toContain(COMMENT_MARKER);
    expect(comment).toContain("Score: 84/100 (Grade B)");
    expect(comment).toContain("Add local setup instructions to README");
    expect(comment).toContain("https://welcomescore.vercel.app/report/owner/repo");
  });

  it("writes local report artifact file in .welcomescore directory", async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), "action-artifact-"));
    temporaryDirectories.push(tempDir);

    const artifactPath = await writeReportArtifact(tempDir, mockJsHealthReport, "json");
    expect(artifactPath).toContain(".welcomescore");
    expect(artifactPath.endsWith("report.json")).toBe(true);

    const content = JSON.parse(await readFile(artifactPath, "utf8"));
    expect(content.score).toBe(88);
    expect(content.subject.name).toBe("test-package");
  });
});

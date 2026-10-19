import { parseActionInputs } from "./inputs";
import { setActionOutputs } from "./outputs";
import { writeReportArtifact } from "./artifact";
import { buildPrCommentMarkdown, upsertPrComment } from "./comment";
import { readLocalSnapshot } from "@/packages/cli/src/snapshot";
import { evaluateJsHealth } from "@/packages/cli/src/health";
import { SITE_URL } from "@/lib/site";

export async function runAction(): Promise<number> {
  const inputs = parseActionInputs();
  process.stdout.write("::group::WelcomeScore Repository Audit\n");
  process.stdout.write(`Scanning repository at ${inputs.cwd}…\n`);

  try {
    const snapshot = await readLocalSnapshot({ cwd: inputs.cwd });
    const report = evaluateJsHealth(snapshot);
    process.stdout.write(`Audit completed: Score ${report.score}/100 (Grade ${report.grade})\n`);
    process.stdout.write("::endgroup::\n");

    // Write artifact
    const artifactPath = await writeReportArtifact(inputs.cwd, report, inputs.format);
    process.stdout.write(`Artifact written to: ${artifactPath}\n`);

    const repoSlug = report.subject.repository || report.subject.name;
    const reportUrl = `${SITE_URL}/report/${repoSlug}`;

    // Compute Next Useful Move title
    const firstMissing = report.checks.find(
      (c) => c.status === "missing" || c.status === "partial",
    );
    const nextMoveTitle = firstMissing ? firstMissing.label : "Maintain current readiness";

    // Set outputs
    await setActionOutputs({
      score: report.score,
      grade: report.grade,
      reportPath: artifactPath,
      nextUsefulMove: nextMoveTitle,
      reportUrl,
    });

    // Optional PR comment
    if (inputs.commentOnPr && inputs.githubToken) {
      const githubRepository = process.env.GITHUB_REPOSITORY; // "owner/repo"
      const githubEventPath = process.env.GITHUB_EVENT_PATH;

      if (githubRepository && githubEventPath) {
        try {
          const fs = await import("node:fs/promises");
          const eventData = JSON.parse(await fs.readFile(githubEventPath, "utf8"));
          const pullNumber = eventData.pull_request?.number;

          if (pullNumber) {
            const [repoOwner, repoName] = githubRepository.split("/");
            const commentBody = buildPrCommentMarkdown({
              score: report.score,
              grade: report.grade,
              reportUrl,
              nextUsefulMove: firstMissing
                ? {
                    title: firstMissing.label,
                    expectedOutcome: firstMissing.evidence,
                    effort: "medium",
                  }
                : null,
              checksSummary: {
                passed: report.checks.filter((c) => c.status === "pass").length,
                total: report.checks.length,
              },
            });

            const commentResult = await upsertPrComment(
              {
                repoOwner,
                repoName,
                pullNumber,
                token: inputs.githubToken,
              },
              commentBody,
            );

            if (commentResult.success) {
              process.stdout.write(`PR comment updated on #${pullNumber}\n`);
            } else {
              process.stderr.write(`Warning: Could not update PR comment: ${commentResult.error}\n`);
            }
          }
        } catch (e) {
          process.stderr.write(`Warning: Failed to process PR event data: ${String(e)}\n`);
        }
      }
    }

    // Check threshold failure condition
    if (inputs.failOn === "threshold" && report.score < inputs.threshold) {
      process.stderr.write(
        `::error::WelcomeScore threshold failure: ${report.score}/100 is below the required threshold of ${inputs.threshold}\n`,
      );
      return 1;
    }

    return 0;
  } catch (err) {
    process.stderr.write(`::error::WelcomeScore action failed: ${String(err)}\n`);
    return 2;
  }
}

// If invoked as a script
if (process.env.NODE_ENV !== "test" && typeof process.env.VITEST === "undefined") {
  runAction().then((code) => {
    if (code !== 0) {
      process.exit(code);
    }
  });
}

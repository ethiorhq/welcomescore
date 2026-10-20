import "server-only";
import { readGitHubJsHealthSnapshot } from "@/lib/jsHealth/github";
import { evaluateAllDetectedStacks } from "./index";
import type { StackReport } from "./types";

export async function getGitHubStackEvaluation(
  owner: string,
  repo: string,
): Promise<{
  detectedStacks: string[];
  stackReports: Record<string, StackReport>;
}> {
  try {
    const snapshot = await readGitHubJsHealthSnapshot(`${owner}/${repo}`);
    return evaluateAllDetectedStacks({
      packageJson: snapshot.packageJson,
      paths: snapshot.paths,
    });
  } catch {
    return {
      detectedStacks: ["core"],
      stackReports: {},
    };
  }
}

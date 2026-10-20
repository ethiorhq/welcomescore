import { detectStacks } from "./detector";
import { evaluateNextJsStack } from "./nextjs/engine";
import { evaluateReactStack } from "./react/engine";
import { evaluateMonorepoStack } from "./monorepo/engine";
import type { StackId, StackReport, StackSnapshot } from "./types";

export * from "./types";
export * from "./detector";
export { evaluateNextJsStack } from "./nextjs/engine";
export { evaluateReactStack } from "./react/engine";
export { evaluateMonorepoStack } from "./monorepo/engine";

export function evaluateStack(stackId: StackId, snapshot: StackSnapshot): StackReport | null {
  switch (stackId) {
    case "nextjs":
      return evaluateNextJsStack(snapshot);
    case "react":
      return evaluateReactStack(snapshot);
    case "monorepo":
      return evaluateMonorepoStack(snapshot);
    case "core":
    default:
      return null;
  }
}

export function evaluateAllDetectedStacks(snapshot: StackSnapshot): {
  detectedStacks: StackId[];
  stackReports: Record<string, StackReport>;
} {
  const detectedStacks = detectStacks(snapshot);
  const stackReports: Record<string, StackReport> = {};

  for (const stackId of detectedStacks) {
    if (stackId === "core") continue;
    const report = evaluateStack(stackId, snapshot);
    if (report) {
      stackReports[stackId] = report;
    }
  }

  return {
    detectedStacks,
    stackReports,
  };
}

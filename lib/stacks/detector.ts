import type { StackId, StackSnapshot } from "./types";

export function detectStacks(snapshot: StackSnapshot): StackId[] {
  const detected: StackId[] = ["core"]; // Core contributor readiness is always supported

  const packageJson = snapshot.packageJson ?? {};
  const deps = {
    ...((packageJson.dependencies as Record<string, string> | undefined) ?? {}),
    ...((packageJson.devDependencies as Record<string, string> | undefined) ?? {}),
    ...((packageJson.peerDependencies as Record<string, string> | undefined) ?? {}),
  };

  const pathSet = new Set(snapshot.paths.map((p) => p.toLowerCase()));

  // 1. Next.js Detection
  const hasNextDependency = Boolean(deps.next);
  const hasNextConfig = Array.from(pathSet).some((p) =>
    p === "next.config.js" ||
    p === "next.config.ts" ||
    p === "next.config.mjs" ||
    p.endsWith("/next.config.js") ||
    p.endsWith("/next.config.ts") ||
    p.endsWith("/next.config.mjs"),
  );
  const hasAppRouter = Array.from(pathSet).some((p) =>
    p.startsWith("app/") || p.includes("/app/"),
  );

  if (hasNextDependency || hasNextConfig || hasAppRouter) {
    detected.push("nextjs");
  }

  // 2. React Detection
  const hasReactDependency = Boolean(deps.react);
  const hasReactFiles = Array.from(pathSet).some((p) =>
    p.endsWith(".tsx") || p.endsWith(".jsx"),
  );

  if (hasReactDependency || hasReactFiles) {
    detected.push("react");
  }

  // 3. Monorepo Detection
  const hasMonorepoFiles = Array.from(pathSet).some((p) =>
    p === "turbo.json" ||
    p === "pnpm-workspace.yaml" ||
    p === "lerna.json" ||
    p === "nx.json" ||
    p.endsWith("/turbo.json") ||
    p.endsWith("/pnpm-workspace.yaml"),
  );
  const hasWorkspacesConfig = Boolean(packageJson.workspaces);

  if (hasMonorepoFiles || hasWorkspacesConfig) {
    detected.push("monorepo");
  }

  return detected;
}

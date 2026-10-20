import { describe, expect, it } from "vitest";
import {
  detectStacks,
  evaluateAllDetectedStacks,
  evaluateNextJsStack,
  evaluateReactStack,
  evaluateMonorepoStack,
  type StackSnapshot,
} from "./index";

describe("Stack Detector", () => {
  it("always includes core stack", () => {
    const snapshot: StackSnapshot = {
      packageJson: {},
      paths: ["README.md", "LICENSE"],
    };
    const detected = detectStacks(snapshot);
    expect(detected).toContain("core");
  });

  it("detects Next.js from dependencies and app router paths", () => {
    const snapshot: StackSnapshot = {
      packageJson: {
        dependencies: { next: "^15.0.0", react: "^19.0.0" },
      },
      paths: ["app/layout.tsx", "app/page.tsx", "next.config.mjs"],
    };
    const detected = detectStacks(snapshot);
    expect(detected).toContain("nextjs");
    expect(detected).toContain("react");
  });

  it("detects monorepo from turbo.json and pnpm-workspace", () => {
    const snapshot: StackSnapshot = {
      packageJson: { workspaces: ["apps/*", "packages/*"] },
      paths: ["turbo.json", "pnpm-workspace.yaml"],
    };
    const detected = detectStacks(snapshot);
    expect(detected).toContain("monorepo");
  });
});

describe("Next.js Deep Health Evaluator", () => {
  it("scores 100 on a modern Next.js 15 repository with complete resilience and SEO", () => {
    const snapshot: StackSnapshot = {
      packageJson: {
        scripts: { dev: "next dev --turbo", build: "next build", start: "next start" },
        dependencies: { next: "^15.1.0", react: "^19.0.0" },
      },
      paths: [
        "app/layout.tsx",
        "app/page.tsx",
        "app/error.tsx",
        "app/not-found.tsx",
        "app/loading.tsx",
        "app/sitemap.ts",
        "app/robots.ts",
        "app/opengraph-image.tsx",
        "next.config.ts",
      ],
    };

    const report = evaluateNextJsStack(snapshot);
    expect(report.score).toBe(100);
    expect(report.grade).toBe("A");
    expect(report.checks.length).toBe(6);
    expect(report.checks.every((c) => c.status === "pass")).toBe(true);
    expect(report.nextUsefulMove?.id).toBe("next-maintain-excellence");
  });

  it("identifies missing resilience boundaries and generates an actionable Next Useful Move", () => {
    const snapshot: StackSnapshot = {
      packageJson: {
        scripts: { dev: "next dev", build: "next build" },
        dependencies: { next: "^14.2.0", react: "^18.3.0" },
      },
      paths: [
        "app/layout.tsx",
        "app/page.tsx",
        "next.config.js",
      ],
    };

    const report = evaluateNextJsStack(snapshot);
    expect(report.score).toBeLessThan(100);
    const resilienceCheck = report.checks.find((c) => c.id === "next-resilience-boundaries");
    expect(resilienceCheck?.status).toBe("missing");
    expect(report.nextUsefulMove?.id).toBe("next-resilience-boundaries");
    expect(report.nextUsefulMove?.remediation?.targetPath).toBe("app/error.tsx");
  });
});

describe("React 19 Readiness Evaluator", () => {
  it("scores 100 on React 19 app with Vitest and testing library", () => {
    const snapshot: StackSnapshot = {
      packageJson: {
        dependencies: { react: "^19.0.0", "react-dom": "^19.0.0" },
        devDependencies: {
          vitest: "^2.1.0",
          "@testing-library/react": "^16.0.0",
          "eslint-plugin-jsx-a11y": "^6.10.0",
        },
      },
      paths: ["components/Button.tsx", "vitest.config.ts"],
    };

    const report = evaluateReactStack(snapshot);
    expect(report.score).toBe(100);
    expect(report.grade).toBe("A");
    expect(report.checks.length).toBe(5);
  });

  it("suggests upgrading to React 19 and adding tests when on React 18 without testing harness", () => {
    const snapshot: StackSnapshot = {
      packageJson: {
        dependencies: { react: "^18.2.0", "react-dom": "^18.2.0" },
        devDependencies: {},
      },
      paths: ["src/App.tsx"],
    };

    const report = evaluateReactStack(snapshot);
    expect(report.score).toBeLessThan(90);
    expect(report.nextUsefulMove).toBeDefined();
    expect(report.checks.some((c) => c.status === "missing" || c.status === "partial")).toBe(true);
  });
});

describe("Monorepo Evaluator", () => {
  it("scores 100 on Turborepo with pnpm and Biome", () => {
    const snapshot: StackSnapshot = {
      packageJson: {
        devDependencies: { turbo: "^2.0.0", "@biomejs/biome": "^1.9.0" },
        workspaces: ["apps/*", "packages/*"],
      },
      paths: [
        "turbo.json",
        "pnpm-lock.yaml",
        "biome.json",
        "apps/web/package.json",
        "packages/ui/package.json",
      ],
    };

    const report = evaluateMonorepoStack(snapshot);
    expect(report.score).toBe(100);
    expect(report.grade).toBe("A");
    expect(report.checks.length).toBe(4);
  });
});

describe("Composite Stack Evaluator", () => {
  it("evaluates multiple stacks simultaneously for a Next.js + React repository", () => {
    const snapshot: StackSnapshot = {
      packageJson: {
        dependencies: { next: "^15.0.0", react: "^19.0.0", "react-dom": "^19.0.0" },
        devDependencies: { vitest: "^2.0.0", "@testing-library/react": "^16.0.0" },
      },
      paths: ["app/layout.tsx", "app/page.tsx", "app/error.tsx", "app/not-found.tsx"],
    };

    const composite = evaluateAllDetectedStacks(snapshot);
    expect(composite.detectedStacks).toContain("core");
    expect(composite.detectedStacks).toContain("nextjs");
    expect(composite.detectedStacks).toContain("react");
    expect(composite.stackReports.nextjs).toBeDefined();
    expect(composite.stackReports.react).toBeDefined();
  });
});

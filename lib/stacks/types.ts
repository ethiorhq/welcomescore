export type StackId = "core" | "nextjs" | "react" | "monorepo";

export type StackCheckStatus = "pass" | "partial" | "missing" | "not-applicable";

export type StackRemediation = {
  title: string;
  summary: string;
  targetPath: string;
  language: "typescript" | "tsx" | "json" | "markdown" | "yaml" | "text";
  codeSnippet: string;
  acceptanceCriteria: string[];
  effort: "small" | "medium" | "large";
};

export type StackCheck = {
  id: string;
  category: string;
  label: string;
  status: StackCheckStatus;
  points: number;
  maxPoints: number;
  explanation: string;
  remediation?: StackRemediation;
  sourceUrl?: string;
  sourcePath?: string;
};

export type StackNextUsefulMove = {
  id: string;
  title: string;
  whyItMatters: string;
  effort: "small" | "medium" | "large";
  expectedOutcome: string;
  acceptanceCriteria: string[];
  remediation?: StackRemediation;
};

export type StackReport = {
  stackId: StackId;
  stackName: string;
  tagline: string;
  score: number;
  grade: "A" | "B" | "C" | "D" | "F";
  checks: StackCheck[];
  nextUsefulMove: StackNextUsefulMove | null;
  detected: boolean;
  confidence: "high" | "medium";
  limitations: string[];
};

export type StackSnapshot = {
  packageJson: Record<string, unknown> | null;
  paths: string[];
  fileContents?: Record<string, string>;
};

export type StackDefinition = {
  id: StackId;
  name: string;
  badgeLabel: string;
  description: string;
  icon: string;
  color: string;
  accentColor: string;
};

export const STACK_DEFINITIONS: Record<StackId, StackDefinition> = {
  core: {
    id: "core",
    name: "Contributor Readiness",
    badgeLabel: "welcomescore",
    description: "Evaluates public onboarding signals, documentation, starter issues, and community governance.",
    icon: "★",
    color: "#E8A23D",
    accentColor: "rgba(232, 162, 61, 0.15)",
  },
  nextjs: {
    id: "nextjs",
    name: "Next.js Deep Health",
    badgeLabel: "next.js health",
    description: "Evaluates App Router architecture, Server Actions security, Core Web Vitals, and metadata API.",
    icon: "▲",
    color: "#000000",
    accentColor: "rgba(255, 255, 255, 0.15)",
  },
  react: {
    id: "react",
    name: "React 19 Readiness",
    badgeLabel: "react 19",
    description: "Evaluates React 19 compiler compatibility, ref modernization, hydration hygiene, and testing stack.",
    icon: "⚛",
    color: "#087EA4",
    accentColor: "rgba(8, 126, 164, 0.15)",
  },
  monorepo: {
    id: "monorepo",
    name: "Monorepo & Tooling",
    badgeLabel: "monorepo",
    description: "Evaluates build caching, modern lockfiles (pnpm/bun), fast linters (biome), and workspace boundaries.",
    icon: "⬡",
    color: "#7928CA",
    accentColor: "rgba(121, 40, 202, 0.15)",
  },
};

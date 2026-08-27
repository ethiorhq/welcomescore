export const JS_HEALTH_SCHEMA_VERSION = 1 as const;

export type JsHealthCategoryId = "package" | "tooling" | "cicd" | "contributors";
export type JsHealthCheckStatus = "pass" | "partial" | "missing" | "not-applicable";
export type JsHealthSubjectKind = "local" | "github";

export type JsHealthCategory = {
  id: JsHealthCategoryId;
  label: string;
  score: number;
  maxScore: number;
};

export type JsHealthCheck = {
  id: string;
  category: JsHealthCategoryId;
  label: string;
  status: JsHealthCheckStatus;
  points: number;
  maxPoints: number;
  evidence: string;
  remediationId?: JsHealthRemediationId;
};

export type JsHealthReport = {
  schemaVersion: typeof JS_HEALTH_SCHEMA_VERSION;
  subject: {
    kind: JsHealthSubjectKind;
    name: string;
    repository?: string;
  };
  generatedAt: string;
  score: number;
  grade: "A" | "B" | "C" | "D";
  categories: JsHealthCategory[];
  checks: JsHealthCheck[];
  limitations: string[];
};

export type JsHealthSnapshot = {
  subject: JsHealthReport["subject"];
  packageJson: Record<string, unknown> | null;
  paths: string[];
  workflowNames?: string[];
  /** Parsed text from allowlisted workflow files; never returned in a report. */
  workflowContent?: string[];
  hasStarterIssueLabel?: boolean | null;
};

export type JsHealthRemediationId =
  | "package-metadata"
  | "package-exports"
  | "node-engines"
  | "package-manager"
  | "tsconfig"
  | "lint-config"
  | "test-runner"
  | "node-version"
  | "github-actions"
  | "ci-test-job"
  | "bundle-size"
  | "publish-pipeline"
  | "contributing"
  | "code-of-conduct"
  | "starter-issues";

export type JsHealthRemediation = {
  id: JsHealthRemediationId;
  title: string;
  summary: string;
  targetPath: string;
  language: "json" | "markdown" | "text" | "yaml";
  content: string;
  writeMode: "manual-merge" | "create-if-absent";
};

export const JS_HEALTH_CATEGORY_DEFINITIONS: Array<{
  id: JsHealthCategoryId;
  label: string;
  maxScore: number;
}> = [
  { id: "package", label: "Package telemetry", maxScore: 35 },
  { id: "tooling", label: "Tooling infrastructure", maxScore: 25 },
  { id: "cicd", label: "CI/CD readiness", maxScore: 25 },
  { id: "contributors", label: "Contributor health", maxScore: 15 },
];

export function isJsHealthCategoryId(value: string): value is JsHealthCategoryId {
  return JS_HEALTH_CATEGORY_DEFINITIONS.some((category) => category.id === value);
}

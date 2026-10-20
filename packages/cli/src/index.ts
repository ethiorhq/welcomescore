export { runCli, buildProgram } from "./cli.js";
export type { CliOptions, OutputFormat } from "./cli.js";
export { evaluateJsHealth, getJsHealthRemediation, getJsHealthRemediations } from "./health.js";
export type {
  JsHealthCategory,
  JsHealthCategoryId,
  JsHealthCheck,
  JsHealthCheckStatus,
  JsHealthRemediation,
  JsHealthRemediationId,
  JsHealthReport,
  JsHealthSnapshot,
} from "./health.js";
export * from "./report-schema.js";
export {
  detectStacks,
  evaluateAllDetectedStacks,
  evaluateStackById,
  readLocalStackSnapshot,
  renderStackHumanReport,
  renderStackMarkdown,
} from "./stacks.js";
export type { StackId, StackReport, StackSnapshot } from "./stacks.js";

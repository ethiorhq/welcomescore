export const REPORT_SCHEMA_VERSION = "1.0" as const;
export type ReportSchemaVersion = typeof REPORT_SCHEMA_VERSION;

export const CURRENT_TOOL_VERSION = "0.2.0" as const;


export const SUPPORTED_REPORT_SCHEMA_VERSIONS: readonly string[] = [
  REPORT_SCHEMA_VERSION,
];

export function isSupportedReportSchemaVersion(version: unknown): version is ReportSchemaVersion {
  return typeof version === "string" && SUPPORTED_REPORT_SCHEMA_VERSIONS.includes(version);
}

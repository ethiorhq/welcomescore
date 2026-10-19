export type ActionInputs = {
  threshold: number;
  commentOnPr: boolean;
  uploadReport: boolean;
  format: "json" | "markdown";
  failOn: "never" | "threshold" | "missing-next-move";
  cwd: string;
  githubToken?: string;
};

export function parseActionInputs(env: Record<string, string | undefined> = process.env): ActionInputs {
  const thresholdRaw = env["INPUT_THRESHOLD"] ?? "80";
  const threshold = Number.parseInt(thresholdRaw, 10);

  const commentOnPr = env["INPUT_COMMENT-ON-PR"] === "true";
  const uploadReport = env["INPUT_UPLOAD-REPORT"] !== "false";
  const format = (env["INPUT_FORMAT"] ?? "json").toLowerCase() === "markdown" ? "markdown" : "json";

  const rawFailOn = (env["INPUT_FAIL-ON"] ?? "threshold").toLowerCase();
  const failOn =
    rawFailOn === "never" || rawFailOn === "missing-next-move" ? rawFailOn : "threshold";

  const cwd = env["INPUT_CWD"] || process.cwd();
  const githubToken = env["INPUT_GITHUB-TOKEN"] || env["GITHUB_TOKEN"];

  return {
    threshold: Number.isFinite(threshold) ? threshold : 80,
    commentOnPr,
    uploadReport,
    format,
    failOn,
    cwd,
    githubToken,
  };
}

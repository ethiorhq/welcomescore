import { appendFile } from "node:fs/promises";

export type ActionOutputs = {
  score: number;
  grade: string;
  reportPath: string;
  nextUsefulMove: string;
  reportUrl: string;
};

export async function setActionOutputs(
  outputs: ActionOutputs,
  outputFilePath: string | undefined = process.env.GITHUB_OUTPUT,
): Promise<void> {
  const lines = [
    `score=${outputs.score}`,
    `grade=${outputs.grade}`,
    `report-path=${outputs.reportPath}`,
    `next-useful-move=${outputs.nextUsefulMove}`,
    `report-url=${outputs.reportUrl}`,
  ].join("\n");

  if (outputFilePath) {
    await appendFile(outputFilePath, `${lines}\n`, "utf8");
  } else {
    // When running locally in test / CLI mode
    for (const [key, value] of Object.entries(outputs)) {
      process.stdout.write(`::set-output name=${key}::${String(value)}\n`);
    }
  }
}

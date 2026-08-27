import React, { useState } from "react";
import { Box, Text, render, useApp, useInput } from "ink";
import type { JsHealthCheck, JsHealthReport } from "./health.js";

export async function renderInteractiveDashboard(report: JsHealthReport) {
  const instance = render(<Dashboard report={report} />);
  await instance.waitUntilExit();
}

function Dashboard({ report }: { report: JsHealthReport }) {
  const [showDetails, setShowDetails] = useState(false);
  const { exit } = useApp();

  useInput((input, key) => {
    if (input === "d") setShowDetails((value) => !value);
    if (input === "q" || key.escape) exit();
  });

  return (
    <Box flexDirection="column" paddingX={1}>
      <Box marginBottom={1}>
        <Text bold color="#E8A23D">WelcomeScore JS Health</Text>
        <Text dimColor> · local project report</Text>
      </Box>
      <Box marginBottom={1}>
        <Text bold color={scoreColor(report.score)}>{report.score}/100 {report.grade}</Text>
        <Text dimColor>  {report.subject.name}</Text>
      </Box>
      <Box flexDirection="column">
        {report.categories.map((category) => (
          <Box key={category.id}>
            <Box width={27}><Text>{category.label}</Text></Box>
            <Text color={category.score === category.maxScore ? "#7A9B76" : "#E8A23D"}>{String(category.score).padStart(2)}/{category.maxScore}</Text>
          </Box>
        ))}
      </Box>
      <Box marginTop={1}>
        <Text dimColor>Press d to {showDetails ? "hide" : "show"} details · q or Esc to close</Text>
      </Box>
      {showDetails ? (
        <Box flexDirection="column" marginTop={1}>
          {report.categories.map((category) => (
            <Box flexDirection="column" marginTop={1} key={category.id}>
              <Text bold>{category.label}</Text>
              {report.checks.filter((check) => check.category === category.id).map((check) => (
                <Detail key={check.id} check={check} />
              ))}
            </Box>
          ))}
        </Box>
      ) : null}
      <Box marginTop={1}>
        <Text dimColor>This is an observable project-signal review, not a certification or security audit.</Text>
      </Box>
    </Box>
  );
}

function Detail({ check }: { check: JsHealthCheck }) {
  const marker = check.status === "pass" ? "✓" : check.status === "partial" ? "~" : check.status === "not-applicable" ? "–" : "·";
  const color = check.status === "pass" ? "#7A9B76" : check.status === "partial" ? "#E8A23D" : undefined;
  return (
    <Box flexDirection="column" marginTop={1} paddingLeft={2}>
      <Text color={color}>{marker} {check.label} ({check.points}/{check.maxPoints})</Text>
      <Text dimColor wrap="wrap">  {check.evidence}</Text>
    </Box>
  );
}

function scoreColor(score: number) {
  if (score >= 85) return "#7A9B76";
  if (score >= 70) return "#E8A23D";
  return undefined;
}

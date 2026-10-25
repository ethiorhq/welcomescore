/**
 * DevOps CI/CD Pipeline Doctor & License Radar Engine
 * Part of ETHIOR WelcomeScore - All-in-One DevOps & DevEx Intelligence
 */

export interface WorkflowAuditIssue {
  id: string;
  category: "caching" | "security" | "reliability" | "performance" | "license";
  severity: "critical" | "warning" | "recommendation";
  title: string;
  description: string;
  remediation: string;
  suggestedPatch?: string;
  impactMinutesPerRun?: number;
}

export interface LicenseComplianceResult {
  licenseSpdx: string;
  classification: "permissive" | "copyleft" | "proprietary" | "missing" | "unrecognized";
  commercialUsePermitted: boolean;
  modificationAllowed: boolean;
  disclosureRequired: boolean;
  riskLevel: "low" | "medium" | "high";
  notes: string;
}

export interface DevOpsDoctorReport {
  score: number; // 0 - 100
  grade: "A+" | "A" | "B" | "C" | "D" | "F";
  summary: string;
  wastedComputeEstimate: {
    estimatedMinutesSavedPerMonth: number;
    efficiencyRating: "Optimal" | "Moderate Waste" | "Severe Inefficiency";
  };
  metrics: {
    cachingScore: number; // 0 - 100
    securityScore: number; // 0 - 100
    concurrencyScore: number; // 0 - 100
    licenseScore: number; // 0 - 100
  };
  licenseCompliance: LicenseComplianceResult;
  issues: WorkflowAuditIssue[];
  quickWins: string[];
  recommendedCiPatch?: string;
}

export interface WorkflowFileSample {
  path: string;
  content: string;
}

export interface DevOpsAnalyzeInput {
  repo: string;
  defaultBranch?: string;
  licenseSpdx?: string | null;
  workflowFiles?: WorkflowFileSample[];
  packageJsonContent?: string | null;
}

/**
 * Standard license database & compliance radar
 */
export function auditLicenseCompliance(spdxId?: string | null): LicenseComplianceResult {
  const normalized = (spdxId || "").trim().toUpperCase();

  if (!normalized || normalized === "NOASSERTION" || normalized === "NONE") {
    return {
      licenseSpdx: spdxId || "Missing",
      classification: "missing",
      commercialUsePermitted: false,
      modificationAllowed: false,
      disclosureRequired: false,
      riskLevel: "high",
      notes: "No recognized license detected. Default copyright laws apply; contributors and enterprise consumers cannot legally distribute or commercialize code.",
    };
  }

  // Permissive licenses
  if (["MIT", "APACHE-2.0", "BSD-2-CLAUSE", "BSD-3-CLAUSE", "ISC", "0BSD", "UNLICENSE"].includes(normalized)) {
    return {
      licenseSpdx: normalized,
      classification: "permissive",
      commercialUsePermitted: true,
      modificationAllowed: true,
      disclosureRequired: false,
      riskLevel: "low",
      notes: "Permissive standard open-source license. High enterprise adoption friendliness with minimal legal compliance overhead.",
    };
  }

  // Strong Copyleft
  if (normalized.startsWith("GPL") || normalized.startsWith("AGPL") || normalized.startsWith("LGPL") || normalized.startsWith("EUPL") || normalized.startsWith("MPL")) {
    const isAgpl = normalized.startsWith("AGPL");
    return {
      licenseSpdx: normalized,
      classification: "copyleft",
      commercialUsePermitted: true,
      modificationAllowed: true,
      disclosureRequired: true,
      riskLevel: isAgpl ? "high" : "medium",
      notes: `${normalized} imposes reciprocal source disclosure (copyleft). Derivative works and distributed binaries must make source code available under equivalent terms.`,
    };
  }

  // Proprietary / Custom
  if (["BUSL-1.1", "SSPL-1.0", "BSL-1.1", "COMMERCIAL"].includes(normalized)) {
    return {
      licenseSpdx: normalized,
      classification: "proprietary",
      commercialUsePermitted: false,
      modificationAllowed: true,
      disclosureRequired: false,
      riskLevel: "high",
      notes: "Source-available license with strict commercial restrictions. Incompatible with standard Open Source Initiative (OSI) definitions.",
    };
  }

  return {
    licenseSpdx: normalized,
    classification: "unrecognized",
    commercialUsePermitted: false,
    modificationAllowed: false,
    disclosureRequired: false,
    riskLevel: "medium",
    notes: `License '${spdxId}' recognized as custom or non-standard SPDX. Legal counsel review recommended for commercial integrations.`,
  };
}

/**
 * Analyzes GitHub Actions workflow YAML content
 */
export function analyzeWorkflows(workflows: WorkflowFileSample[]): {
  issues: WorkflowAuditIssue[];
  cachingScore: number;
  securityScore: number;
  concurrencyScore: number;
} {
  const issues: WorkflowAuditIssue[] = [];

  if (workflows.length === 0) {
    issues.push({
      id: "no-ci-workflows",
      category: "reliability",
      severity: "critical",
      title: "No GitHub Actions CI Workflows Detected",
      description: "Pull requests and commits are not automatically tested, linted, or built before merging.",
      remediation: "Add a `.github/workflows/ci.yml` pipeline with automated test execution and status checks.",
      suggestedPatch: `name: CI\non:\n  push:\n    branches: [main]\n  pull_request:\n    branches: [main]\njobs:\n  test:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - uses: actions/setup-node@v4\n        with:\n          node-version: 20\n          cache: 'npm'\n      - run: npm ci\n      - run: npm test`,
      impactMinutesPerRun: 0,
    });

    return {
      issues,
      cachingScore: 0,
      securityScore: 40,
      concurrencyScore: 0,
    };
  }

  let hasDependencyCaching = false;
  let hasConcurrencyControl = false;
  let hasUnpinnedActions = false;
  let hasTimeoutLimits = false;
  let hasPullRequestTrigger = false;

  const combinedContent = workflows.map((w) => w.content).join("\n");

  // Check 1: Dependency Caching
  if (
    combinedContent.includes("cache: 'npm'") ||
    combinedContent.includes('cache: "npm"') ||
    combinedContent.includes("cache: 'pnpm'") ||
    combinedContent.includes('cache: "pnpm"') ||
    combinedContent.includes("cache: 'yarn'") ||
    combinedContent.includes('cache: "yarn"') ||
    combinedContent.includes("cache: 'pip'") ||
    combinedContent.includes("actions/cache@")
  ) {
    hasDependencyCaching = true;
  } else {
    issues.push({
      id: "missing-dependency-cache",
      category: "caching",
      severity: "warning",
      title: "Missing Package Manager Caching",
      description: "Dependencies are freshly downloaded on every runner invocation, wasting 1.5 - 4 minutes of GitHub Actions compute per build.",
      remediation: "Enable built-in caching on `actions/setup-node` (e.g. `cache: 'npm'`) or `actions/cache`.",
      suggestedPatch: `      - uses: actions/setup-node@v4\n        with:\n          node-version: 20\n          cache: 'npm'`,
      impactMinutesPerRun: 2.5,
    });
  }

  // Check 2: Concurrency Cancel In Progress
  if (
    combinedContent.includes("concurrency:") &&
    combinedContent.includes("cancel-in-progress: true")
  ) {
    hasConcurrencyControl = true;
  } else {
    issues.push({
      id: "missing-concurrency-cancel",
      category: "performance",
      severity: "warning",
      title: "Missing Concurrency `cancel-in-progress`",
      description: "Rapid commits or PR re-pushes trigger redundant parallel builds, consuming billable minutes on obsolete commits.",
      remediation: "Add a top-level `concurrency` block with `cancel-in-progress: true`.",
      suggestedPatch: `concurrency:\n  group: \${{ github.workflow }}-\${{ github.ref }}\n  cancel-in-progress: true`,
      impactMinutesPerRun: 3.0,
    });
  }

  // Check 3: Action Pinning / Supply Chain Security
  // Check if using mutable refs like @master or @main or archaic @v1/@v2
  if (
    combinedContent.includes("@master") ||
    combinedContent.includes("@main") ||
    combinedContent.includes("actions/checkout@v1") ||
    combinedContent.includes("actions/checkout@v2")
  ) {
    hasUnpinnedActions = true;
    issues.push({
      id: "outdated-or-mutable-action-pins",
      category: "security",
      severity: "critical",
      title: "Outdated or Mutable Action References Detected",
      description: "Using mutable branch tags (@master/@main) or archaic versions exposes CI runners to supply-chain tampering and breaking Node runner deprecations.",
      remediation: "Upgrade to modern supported actions (e.g. `actions/checkout@v4`) and pin immutable commit SHAs for production pipelines.",
      suggestedPatch: `      - uses: actions/checkout@v4`,
      impactMinutesPerRun: 0,
    });
  }

  // Check 4: Job Timeout Guardrails
  if (combinedContent.includes("timeout-minutes:")) {
    hasTimeoutLimits = true;
  } else {
    issues.push({
      id: "missing-job-timeouts",
      category: "reliability",
      severity: "recommendation",
      title: "Missing `timeout-minutes` Safeguards",
      description: "Default GitHub Actions job timeout is 360 minutes (6 hours). If a test runner hangs, it can deplete an entire monthly runner quota in one run.",
      remediation: "Explicitly set `timeout-minutes: 15` on test and build jobs.",
      suggestedPatch: `    timeout-minutes: 15`,
      impactMinutesPerRun: 0,
    });
  }

  // Check 5: Pull Request Triggers
  if (combinedContent.includes("pull_request:")) {
    hasPullRequestTrigger = true;
  } else {
    issues.push({
      id: "missing-pr-trigger",
      category: "reliability",
      severity: "warning",
      title: "CI Workflow Does Not Run on Pull Requests",
      description: "External contributions and branch PRs cannot be validated before merging.",
      remediation: "Include `pull_request: { branches: [main] }` in workflow triggers.",
      suggestedPatch: `on:\n  push:\n    branches: [main]\n  pull_request:\n    branches: [main]`,
      impactMinutesPerRun: 0,
    });
  }

  // Calculate Subscores
  const cachingScore = hasDependencyCaching ? 100 : 30;
  const securityScore = hasUnpinnedActions ? 45 : 95;
  const concurrencyScore = hasConcurrencyControl
    ? 100
    : hasTimeoutLimits && hasPullRequestTrigger
      ? 75
      : hasTimeoutLimits
        ? 60
        : 40;

  return {
    issues,
    cachingScore,
    securityScore,
    concurrencyScore,
  };
}

/**
 * Main DevOps CI/CD Doctor Diagnostic Engine
 */
export function diagnoseDevOps(input: DevOpsAnalyzeInput): DevOpsDoctorReport {
  const licenseResult = auditLicenseCompliance(input.licenseSpdx);
  const workflows = input.workflowFiles || [];
  const wfAnalysis = analyzeWorkflows(workflows);

  const licenseScore =
    licenseResult.riskLevel === "low"
      ? 100
      : licenseResult.riskLevel === "medium"
        ? 70
        : 35;

  const allIssues = [...wfAnalysis.issues];

  if (licenseResult.riskLevel === "high") {
    allIssues.push({
      id: "license-risk-alert",
      category: "license",
      severity: "critical",
      title: `License Risk: ${licenseResult.classification.toUpperCase()}`,
      description: licenseResult.notes,
      remediation: "Choose an OSI-approved permissive license like MIT or Apache-2.0 to unblock enterprise adoption.",
      suggestedPatch: "Create a root LICENSE file with standard MIT text.",
      impactMinutesPerRun: 0,
    });
  } else if (licenseResult.riskLevel === "medium") {
    allIssues.push({
      id: "license-copyleft-notice",
      category: "license",
      severity: "recommendation",
      title: `Copyleft License Identified (${licenseResult.licenseSpdx})`,
      description: licenseResult.notes,
      remediation: "Document source disclosure rules clearly in CONTRIBUTING.md for downstream developers.",
      impactMinutesPerRun: 0,
    });
  }

  // Overall Score Calculation (Weighted)
  // Caching: 25%, Security: 30%, Concurrency/Reliability: 25%, License: 20%
  const weightedScore = Math.round(
    wfAnalysis.cachingScore * 0.25 +
    wfAnalysis.securityScore * 0.3 +
    wfAnalysis.concurrencyScore * 0.25 +
    licenseScore * 0.2
  );

  const finalScore = Math.min(100, Math.max(0, weightedScore));

  const grade: DevOpsDoctorReport["grade"] =
    finalScore >= 95
      ? "A+"
      : finalScore >= 85
        ? "A"
        : finalScore >= 75
          ? "B"
          : finalScore >= 60
            ? "C"
            : finalScore >= 45
              ? "D"
              : "F";

  // Wasted compute estimation based on issues
  const minutesSavedPerRun = allIssues.reduce((sum, issue) => sum + (issue.impactMinutesPerRun || 0), 0);
  const estimatedRunsPerMonth = 40; // Conservative median for active OSS repos
  const totalMinutesSaved = Math.round(minutesSavedPerRun * estimatedRunsPerMonth);

  const efficiencyRating: DevOpsDoctorReport["wastedComputeEstimate"]["efficiencyRating"] =
    totalMinutesSaved <= 30
      ? "Optimal"
      : totalMinutesSaved <= 150
        ? "Moderate Waste"
        : "Severe Inefficiency";

  // Quick Wins Extraction
  const quickWins = allIssues
    .filter((i) => i.severity !== "recommendation")
    .map((i) => i.title);

  if (quickWins.length === 0) {
    quickWins.push("CI/CD pipeline and license configurations meet production benchmarks!");
  }

  // Recommended Master CI Patch
  const recommendedCiPatch = `name: CI\n\non:\n  push:\n    branches: [${input.defaultBranch || "main"}]\n  pull_request:\n    branches: [${input.defaultBranch || "main"}]\n\nconcurrency:\n  group: \${{ github.workflow }}-\${{ github.ref }}\n  cancel-in-progress: true\n\njobs:\n  validate:\n    name: Test & Lint\n    runs-on: ubuntu-latest\n    timeout-minutes: 15\n    steps:\n      - name: Checkout Code\n        uses: actions/checkout@v4\n\n      - name: Setup Node.js\n        uses: actions/setup-node@v4\n        with:\n          node-version: 20\n          cache: 'npm'\n\n      - name: Install Dependencies\n        run: npm ci\n\n      - name: Run Tests\n        run: npm test --if-present\n\n      - name: WelcomeScore Health Check\n        uses: ethiorhq/welcomescore-action@v1\n        with:\n          threshold: 80`;

  const summary =
    finalScore >= 85
      ? `High-velocity DevOps posture detected. CI/CD pipelines run with strong isolation and compliance (${efficiencyRating}).`
      : `DevOps inefficiencies detected. Applying recommended caching and concurrency patches will save ~${totalMinutesSaved} billable minutes per month.`;

  return {
    score: finalScore,
    grade,
    summary,
    wastedComputeEstimate: {
      estimatedMinutesSavedPerMonth: totalMinutesSaved,
      efficiencyRating,
    },
    metrics: {
      cachingScore: wfAnalysis.cachingScore,
      securityScore: wfAnalysis.securityScore,
      concurrencyScore: wfAnalysis.concurrencyScore,
      licenseScore,
    },
    licenseCompliance: licenseResult,
    issues: allIssues,
    quickWins,
    recommendedCiPatch,
  };
}

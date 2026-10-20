import type {
  StackCheck,
  StackNextUsefulMove,
  StackReport,
  StackSnapshot,
} from "../types";

export function evaluateReactStack(snapshot: StackSnapshot): StackReport {
  const paths = snapshot.paths.map((p) => p.toLowerCase());
  const packageJson = snapshot.packageJson ?? {};
  const deps = {
    ...((packageJson.dependencies as Record<string, string> | undefined) ?? {}),
    ...((packageJson.devDependencies as Record<string, string> | undefined) ?? {}),
    ...((packageJson.peerDependencies as Record<string, string> | undefined) ?? {}),
  };

  const reactVersion = deps.react ?? "";
  const checks: StackCheck[] = [];

  // Check 1: React 19 Compiler & Foundation (25 pts)
  const isReact19 =
    reactVersion.includes("19") ||
    reactVersion.includes("^19") ||
    reactVersion.includes("rc") ||
    reactVersion.includes("canary");
  const hasCompilerPlugin =
    Boolean(deps["babel-plugin-react-compiler"]) ||
    Boolean(deps["eslint-plugin-react-compiler"]);

  if (isReact19 || hasCompilerPlugin) {
    checks.push({
      id: "react-19-compiler-readiness",
      category: "Framework Modernity",
      label: "React 19 & Compiler Readiness",
      status: "pass",
      points: 25,
      maxPoints: 25,
      explanation: `React version is modern (${reactVersion || "19+"}) with automatic memoization / compiler support.`,
    });
  } else if (reactVersion.includes("18") || reactVersion.includes("^18")) {
    checks.push({
      id: "react-19-compiler-readiness",
      category: "Framework Modernity",
      label: "React 19 & Compiler Readiness",
      status: "partial",
      points: 12,
      maxPoints: 25,
      explanation: `Running React 18 (${reactVersion}). Upgrading to React 19 unlocks direct ref props, Actions, and React Compiler compatibility.`,
      remediation: {
        title: "Upgrade to React 19",
        summary: "Update react and react-dom dependencies to React 19 for automatic compiler optimizations and native Actions.",
        targetPath: "package.json",
        language: "json",
        codeSnippet: `{\n  "dependencies": {\n    "react": "^19.0.0",\n    "react-dom": "^19.0.0"\n  }\n}`,
        acceptanceCriteria: [
          "Update react and react-dom to ^19.0.0.",
          "Run test suite to verify third-party library compatibility.",
        ],
        effort: "medium",
      },
    });
  } else {
    checks.push({
      id: "react-19-compiler-readiness",
      category: "Framework Modernity",
      label: "React 19 & Compiler Readiness",
      status: "missing",
      points: 0,
      maxPoints: 25,
      explanation: "Legacy or undeclared React version. Older versions lack concurrent features and Server Component support.",
      remediation: {
        title: "Modernize React Version",
        summary: "Declare supported React 18+ or 19 dependencies in package.json.",
        targetPath: "package.json",
        language: "json",
        codeSnippet: `{\n  "dependencies": {\n    "react": "^19.0.0",\n    "react-dom": "^19.0.0"\n  }\n}`,
        acceptanceCriteria: ["Install current stable React release."],
        effort: "medium",
      },
    });
  }

  // Check 2: Direct Ref Props Modernization (20 pts)
  // React 19 passes ref as a normal prop, removing the need for forwardRef.
  checks.push({
    id: "react-direct-refs",
    category: "Component Architecture",
    label: "Ref Props Standardization",
    status: isReact19 ? "pass" : "partial",
    points: isReact19 ? 20 : 10,
    maxPoints: 20,
    explanation: isReact19
      ? "React 19 allows direct ref passing without forwardRef wrapper boilerplate."
      : "In React 18, components often require forwardRef(). React 19 standardizes ref as a regular component prop.",
    remediation: {
      title: "Adopt Direct Ref Props",
      summary: "Simplify custom component signatures by accepting ref as a standard prop without forwardRef wrappers.",
      targetPath: "components/Button.tsx",
      language: "tsx",
      codeSnippet: `// React 19 standard:\nexport function Button({\n  ref,\n  children,\n  ...props\n}: React.ComponentProps<"button">) {\n  return (\n    <button ref={ref} {...props}>\n      {children}\n    </button>\n  );\n}`,
      acceptanceCriteria: [
        "Eliminate unnecessary forwardRef() wrapper functions in custom component exports.",
      ],
      effort: "small",
    },
  });

  // Check 3: Hydration Hygiene & Safe Mounting (20 pts)
  const hasHydrationGuards = paths.some((p) =>
    p.includes("layout.tsx") ||
    p.includes("_app.tsx") ||
    p.includes("root.tsx") ||
    p.includes("app.tsx") ||
    p.includes("main.tsx") ||
    p.includes("index.tsx") ||
    p.endsWith(".tsx"),
  );
  checks.push({
    id: "react-hydration-hygiene",
    category: "SSR & Hydration",
    label: "Hydration Hygiene & Browser Global Guards",
    status: hasHydrationGuards ? "pass" : "partial",
    points: hasHydrationGuards ? 20 : 15,
    maxPoints: 20,
    explanation: hasHydrationGuards
      ? "Root application boundaries implement clean client/server rendering separation."
      : "Ensure browser-only APIs are accessed safely inside useEffect or with mounting state guards.",
  });

  // Check 4: Modern Testing Harness (20 pts)
  const hasVitest = Boolean(deps.vitest);
  const hasTestingLibrary = Boolean(deps["@testing-library/react"]);
  const hasPlaywright = Boolean(deps["@playwright/test"]);
  const hasJest = Boolean(deps.jest);

  if ((hasVitest || hasPlaywright) && hasTestingLibrary) {
    checks.push({
      id: "react-modern-testing",
      category: "Quality Assurance",
      label: "Component Testing Harness",
      status: "pass",
      points: 20,
      maxPoints: 20,
      explanation: "Uses modern testing tools (Vitest / Playwright with React Testing Library) with fast ESM execution.",
    });
  } else if (hasTestingLibrary || hasJest || hasVitest) {
    checks.push({
      id: "react-modern-testing",
      category: "Quality Assurance",
      label: "Component Testing Harness",
      status: "partial",
      points: 10,
      maxPoints: 20,
      explanation: "Testing setup observed. Adding Vitest + React Testing Library ensures fast, parallelized component assertions.",
      remediation: {
        title: "Configure Vitest and React Testing Library",
        summary: "Set up instant ESM-native component testing with Vitest and @testing-library/react.",
        targetPath: "vitest.config.ts",
        language: "typescript",
        codeSnippet: `import { defineConfig } from "vitest/config";\nimport react from "@vitejs/plugin-react";\n\nexport default defineConfig({\n  plugins: [react()],\n  test: {\n    environment: "jsdom",\n    globals: true,\n  },\n});`,
        acceptanceCriteria: [
          "Install vitest, jsdom, and @testing-library/react.",
          "Add test script to package.json.",
        ],
        effort: "small",
      },
    });
  } else {
    checks.push({
      id: "react-modern-testing",
      category: "Quality Assurance",
      label: "Component Testing Harness",
      status: "missing",
      points: 0,
      maxPoints: 20,
      explanation: "No component testing framework detected in devDependencies.",
      remediation: {
        title: "Set Up React Component Tests",
        summary: "Add Vitest and React Testing Library to verify component rendering and state transitions.",
        targetPath: "package.json",
        language: "json",
        codeSnippet: `{\n  "scripts": {\n    "test": "vitest run"\n  },\n  "devDependencies": {\n    "vitest": "^2.0.0",\n    "@testing-library/react": "^16.0.0",\n    "jsdom": "^25.0.0"\n  }\n}`,
        acceptanceCriteria: ["Configure vitest in package.json."],
        effort: "medium",
      },
    });
  }

  // Check 5: Accessibility & Semantic Structure (15 pts)
  const hasA11yLinter = Boolean(deps["eslint-plugin-jsx-a11y"]);
  if (hasA11yLinter) {
    checks.push({
      id: "react-a11y-standards",
      category: "Accessibility",
      label: "JSX Accessibility Linting",
      status: "pass",
      points: 15,
      maxPoints: 15,
      explanation: "eslint-plugin-jsx-a11y is configured to enforce WCAG accessibility rules at build time.",
    });
  } else {
    checks.push({
      id: "react-a11y-standards",
      category: "Accessibility",
      label: "JSX Accessibility Linting",
      status: "partial",
      points: 8,
      maxPoints: 15,
      explanation: "Add eslint-plugin-jsx-a11y to prevent inaccessible click handlers, missing aria attributes, and form label mismatches.",
      remediation: {
        title: "Add eslint-plugin-jsx-a11y",
        summary: "Enforce accessible component markup automatically during code review and CI.",
        targetPath: ".eslintrc.json",
        language: "json",
        codeSnippet: `{\n  "extends": ["next/core-web-vitals", "plugin:jsx-a11y/recommended"],\n  "plugins": ["jsx-a11y"]\n}`,
        acceptanceCriteria: [
          "Install eslint-plugin-jsx-a11y.",
          "Add plugin:jsx-a11y/recommended to ESLint configuration.",
        ],
        effort: "small",
      },
    });
  }

  // Calculate total score and grade
  const totalScore = checks.reduce((acc, c) => acc + c.points, 0);
  let grade: StackReport["grade"] = "F";
  if (totalScore >= 90) grade = "A";
  else if (totalScore >= 80) grade = "B";
  else if (totalScore >= 70) grade = "C";
  else if (totalScore >= 60) grade = "D";

  const nonPassingChecks = checks
    .filter((c) => c.status !== "pass" && c.remediation)
    .sort((a, b) => b.maxPoints - b.points - (a.maxPoints - a.points));

  let nextUsefulMove: StackNextUsefulMove | null = null;
  if (nonPassingChecks.length > 0 && nonPassingChecks[0].remediation) {
    const topCheck = nonPassingChecks[0];
    const rem = topCheck.remediation!;
    nextUsefulMove = {
      id: topCheck.id,
      title: rem.title,
      whyItMatters: topCheck.explanation,
      effort: rem.effort,
      expectedOutcome: rem.summary,
      acceptanceCriteria: rem.acceptanceCriteria,
      remediation: rem,
    };
  } else {
    nextUsefulMove = {
      id: "react-maintain-excellence",
      title: "Maintain React 19 component excellence",
      whyItMatters: "React framework modernity, ref standards, test coverage, and accessibility rules are verified.",
      effort: "small",
      expectedOutcome: "Keep components accessible and ready for compiler optimizations.",
      acceptanceCriteria: ["Maintain clean hook dependency patterns and test coverage."],
    };
  }

  return {
    stackId: "react",
    stackName: "React 19 Readiness",
    tagline: "React 19 Compiler, Ref Modernization, Hydration, and Testing",
    score: totalScore,
    grade,
    checks,
    nextUsefulMove,
    detected: true,
    confidence: "high",
    limitations: [
      "Evaluates declared React package dependencies, testing libraries, and JSX accessibility rules.",
      "Does not execute UI components in a live browser DOM.",
    ],
  };
}

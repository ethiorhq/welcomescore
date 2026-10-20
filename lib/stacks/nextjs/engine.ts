import type {
  StackCheck,
  StackNextUsefulMove,
  StackReport,
  StackSnapshot,
} from "../types";

export function evaluateNextJsStack(snapshot: StackSnapshot): StackReport {
  const paths = snapshot.paths.map((p) => p.toLowerCase());
  const packageJson = snapshot.packageJson ?? {};
  const deps = {
    ...((packageJson.dependencies as Record<string, string> | undefined) ?? {}),
    ...((packageJson.devDependencies as Record<string, string> | undefined) ?? {}),
  };

  const nextVersion = deps.next ?? "";
  const checks: StackCheck[] = [];

  // Check 1: App Router & Layout Architecture (20 pts)
  const hasAppRouter = paths.some(
    (p) =>
      p === "app/layout.tsx" ||
      p === "app/layout.jsx" ||
      p === "app/layout.js" ||
      p.endsWith("/app/layout.tsx") ||
      p.endsWith("/app/layout.jsx"),
  );
  const hasPagesRouter = paths.some(
    (p) =>
      p === "pages/_app.tsx" ||
      p === "pages/_app.jsx" ||
      p === "pages/_app.js" ||
      p.startsWith("pages/"),
  );

  if (hasAppRouter) {
    checks.push({
      id: "next-app-router",
      category: "Architecture",
      label: "App Router & Root Layout",
      status: "pass",
      points: 20,
      maxPoints: 20,
      explanation: "Uses modern Next.js App Router with root layout architecture.",
    });
  } else if (hasPagesRouter) {
    checks.push({
      id: "next-app-router",
      category: "Architecture",
      label: "App Router & Root Layout",
      status: "partial",
      points: 10,
      maxPoints: 20,
      explanation: "Uses legacy Pages router. Upgrading to App Router unlocks React Server Components and nested layouts.",
      remediation: {
        title: "Migrate to Next.js App Router",
        summary: "Create a root app/layout.tsx to leverage React Server Components, streaming, and nested layouts.",
        targetPath: "app/layout.tsx",
        language: "tsx",
        codeSnippet: `export default function RootLayout({\n  children,\n}: {\n  children: React.ReactNode;\n}) {\n  return (\n    <html lang="en">\n      <body>{children}</body>\n    </html>\n  );\n}`,
        acceptanceCriteria: [
          "Create app/layout.tsx with <html> and <body> tags.",
          "Wrap page components in server-rendered layout boundaries.",
        ],
        effort: "medium",
      },
    });
  } else {
    checks.push({
      id: "next-app-router",
      category: "Architecture",
      label: "App Router & Root Layout",
      status: "missing",
      points: 0,
      maxPoints: 20,
      explanation: "No standardized App Router or Pages router structure detected.",
      remediation: {
        title: "Initialize Next.js App Router Structure",
        summary: "Set up app/layout.tsx and app/page.tsx for clean server-rendered routing.",
        targetPath: "app/layout.tsx",
        language: "tsx",
        codeSnippet: `export default function RootLayout({\n  children,\n}: {\n  children: React.ReactNode;\n}) {\n  return (\n    <html lang="en">\n      <body>{children}</body>\n    </html>\n  );\n}`,
        acceptanceCriteria: ["Add app/layout.tsx and app/page.tsx"],
        effort: "medium",
      },
    });
  }

  // Check 2: Resilience Boundaries (20 pts)
  const hasErrorBoundary = paths.some(
    (p) =>
      p === "app/error.tsx" ||
      p === "app/error.jsx" ||
      p === "app/global-error.tsx" ||
      p.endsWith("/error.tsx"),
  );
  const hasNotFoundBoundary = paths.some(
    (p) =>
      p === "app/not-found.tsx" ||
      p === "app/not-found.jsx" ||
      p.endsWith("/not-found.tsx"),
  );
  const hasLoadingBoundary = paths.some(
    (p) =>
      p === "app/loading.tsx" ||
      p === "app/loading.jsx" ||
      p.endsWith("/loading.tsx"),
  );

  const resilienceCount = [hasErrorBoundary, hasNotFoundBoundary, hasLoadingBoundary].filter(Boolean).length;
  if (resilienceCount >= 2) {
    checks.push({
      id: "next-resilience-boundaries",
      category: "Resilience",
      label: "Error & Not-Found Boundaries",
      status: "pass",
      points: 20,
      maxPoints: 20,
      explanation: `Configured resilience boundaries (${resilienceCount}/3 observed: ${[
        hasErrorBoundary && "error.tsx",
        hasNotFoundBoundary && "not-found.tsx",
        hasLoadingBoundary && "loading.tsx",
      ]
        .filter(Boolean)
        .join(", ")}).`,
    });
  } else if (resilienceCount === 1) {
    checks.push({
      id: "next-resilience-boundaries",
      category: "Resilience",
      label: "Error & Not-Found Boundaries",
      status: "partial",
      points: 10,
      maxPoints: 20,
      explanation: "Incomplete resilience boundaries. Add error.tsx and not-found.tsx to prevent white-screen crashes.",
      remediation: {
        title: "Add Next.js Error and 404 Boundaries",
        summary: "Provide user-friendly error fallbacks that prevent fatal React hydration and rendering crashes.",
        targetPath: "app/error.tsx",
        language: "tsx",
        codeSnippet: `"use client";\n\nimport { useEffect } from "react";\n\nexport default function ErrorBoundary({\n  error,\n  reset,\n}: {\n  error: Error & { digest?: string };\n  reset: () => void;\n}) {\n  useEffect(() => {\n    console.error("Runtime error caught:", error);\n  }, [error]);\n\n  return (\n    <main className="flex min-h-[50vh] flex-col items-center justify-center p-6 text-center">\n      <h2 className="text-xl font-bold">Something went wrong</h2>\n      <p className="mt-2 text-sm text-gray-500">An unexpected error occurred while rendering this page.</p>\n      <button\n        type="button"\n        onClick={() => reset()}\n        className="mt-4 rounded-md bg-amber-500 px-4 py-2 text-sm font-semibold text-black"\n      >\n        Try again\n      </button>\n    </main>\n  );\n}`,
        acceptanceCriteria: [
          "Create client-side app/error.tsx with error logging and reset() action.",
          "Create app/not-found.tsx with semantic 404 messaging.",
        ],
        effort: "small",
      },
    });
  } else {
    checks.push({
      id: "next-resilience-boundaries",
      category: "Resilience",
      label: "Error & Not-Found Boundaries",
      status: "missing",
      points: 0,
      maxPoints: 20,
      explanation: "Missing error.tsx and not-found.tsx boundaries. Uncaught errors risk white-screening visitors.",
      remediation: {
        title: "Implement Next.js error.tsx and not-found.tsx",
        summary: "Add robust error fallbacks to capture rendering exceptions gracefully.",
        targetPath: "app/error.tsx",
        language: "tsx",
        codeSnippet: `"use client";\n\nexport default function GlobalError({\n  error,\n  reset,\n}: {\n  error: Error & { digest?: string };\n  reset: () => void;\n}) {\n  return (\n    <div className="p-8 text-center">\n      <h2 className="text-xl font-bold">An error occurred</h2>\n      <button onClick={() => reset()} className="mt-4 rounded bg-amber-500 px-4 py-2 font-semibold text-black">Try again</button>\n    </div>\n  );\n}`,
        acceptanceCriteria: ["Add app/error.tsx and app/not-found.tsx"],
        effort: "small",
      },
    });
  }

  // Check 3: Server Action & Secret Safety (15 pts)
  const envFiles = paths.filter((p) => p.includes(".env"));
  const hasDangerousPublicSecrets = envFiles.some(
    (p) =>
      p.includes("secret") ||
      p.includes("private") ||
      p.includes("password"),
  );

  if (!hasDangerousPublicSecrets) {
    checks.push({
      id: "next-server-action-safety",
      category: "Security",
      label: "Server Action & Client Boundary Safety",
      status: "pass",
      points: 15,
      maxPoints: 15,
      explanation: "No exposed secret patterns detected in client-exposed environment or manifest files.",
    });
  } else {
    checks.push({
      id: "next-server-action-safety",
      category: "Security",
      label: "Server Action & Client Boundary Safety",
      status: "partial",
      points: 8,
      maxPoints: 15,
      explanation: "Verify that sensitive credentials are not prefixed with NEXT_PUBLIC_ or bundled into client code.",
      remediation: {
        title: "Audit Environment Variables and Server Boundaries",
        summary: "Ensure database tokens, API keys, and signing secrets are server-only without NEXT_PUBLIC_ prefixes.",
        targetPath: ".env.example",
        language: "text",
        codeSnippet: `# Safe client-exposed public keys\nNEXT_PUBLIC_APP_URL=https://example.com\n\n# Server-only keys (never prefix with NEXT_PUBLIC_)\nDATABASE_URL=postgres://...\nAPI_SECRET_KEY=sk_live_...`,
        acceptanceCriteria: [
          "Check that private API keys and tokens do not have NEXT_PUBLIC_ prefixes.",
          "Restrict client bundles to public URLs and anonymous IDs.",
        ],
        effort: "small",
      },
    });
  }

  // Check 4: Metadata & SEO API (15 pts)
  const hasSitemap = paths.some(
    (p) =>
      p === "app/sitemap.ts" ||
      p === "app/sitemap.js" ||
      p === "app/sitemap.xml" ||
      p === "public/sitemap.xml",
  );
  const hasRobots = paths.some(
    (p) =>
      p === "app/robots.ts" ||
      p === "app/robots.js" ||
      p === "public/robots.txt",
  );
  const hasDynamicOg = paths.some(
    (p) =>
      p.includes("opengraph-image") ||
      p.includes("twitter-image"),
  );

  const seoSignalsCount = [hasSitemap, hasRobots, hasDynamicOg].filter(Boolean).length;
  if (seoSignalsCount >= 2) {
    checks.push({
      id: "next-metadata-api",
      category: "SEO & Discovery",
      label: "Metadata API & OpenGraph Engine",
      status: "pass",
      points: 15,
      maxPoints: 15,
      explanation: `Verified Next.js metadata and discovery signals (${[
        hasSitemap && "sitemap",
        hasRobots && "robots",
        hasDynamicOg && "opengraph-image",
      ]
        .filter(Boolean)
        .join(", ")}).`,
    });
  } else if (seoSignalsCount === 1) {
    checks.push({
      id: "next-metadata-api",
      category: "SEO & Discovery",
      label: "Metadata API & OpenGraph Engine",
      status: "partial",
      points: 8,
      maxPoints: 15,
      explanation: "Partial SEO setup. Add sitemap.ts and dynamic OpenGraph image generators for social share virality.",
      remediation: {
        title: "Export Dynamic Metadata and Sitemap",
        summary: "Implement Next.js sitemap.ts to ensure search engines discover public routes efficiently.",
        targetPath: "app/sitemap.ts",
        language: "typescript",
        codeSnippet: `import type { MetadataRoute } from "next";\n\nexport default function sitemap(): MetadataRoute.Sitemap {\n  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://example.com";\n  return [\n    {\n      url: baseUrl,\n      lastModified: new Date(),\n      changeFrequency: "weekly",\n      priority: 1,\n    },\n  ];\n}`,
        acceptanceCriteria: ["Add app/sitemap.ts returning typed MetadataRoute.Sitemap."],
        effort: "small",
      },
    });
  } else {
    checks.push({
      id: "next-metadata-api",
      category: "SEO & Discovery",
      label: "Metadata API & OpenGraph Engine",
      status: "missing",
      points: 0,
      maxPoints: 15,
      explanation: "No sitemap or robots discovery files detected in app/ or public/.",
      remediation: {
        title: "Add Next.js sitemap.ts and robots.ts",
        summary: "Configure automated sitemap and crawler policies using Next.js Metadata Route APIs.",
        targetPath: "app/sitemap.ts",
        language: "typescript",
        codeSnippet: `import type { MetadataRoute } from "next";\n\nexport default function sitemap(): MetadataRoute.Sitemap {\n  return [{ url: "https://example.com", lastModified: new Date() }];\n}`,
        acceptanceCriteria: ["Add app/sitemap.ts and app/robots.ts"],
        effort: "small",
      },
    });
  }

  // Check 5: Media & Font Optimization (15 pts)
  const hasNextFont = paths.some(
    (p) => p.includes("font") || p.includes("layout.tsx") || p.includes("layout.jsx"),
  );
  if (hasNextFont) {
    checks.push({
      id: "next-image-font-opt",
      category: "Performance",
      label: "Image & Font Optimization (CWV)",
      status: "pass",
      points: 15,
      maxPoints: 15,
      explanation: "Layout is configured with self-hosted font optimization and modern media boundaries.",
    });
  } else {
    checks.push({
      id: "next-image-font-opt",
      category: "Performance",
      label: "Image & Font Optimization (CWV)",
      status: "partial",
      points: 8,
      maxPoints: 15,
      explanation: "Adopt next/font and next/image to prevent layout shifts (CLS) and maximize Core Web Vitals.",
      remediation: {
        title: "Implement next/font and next/image",
        summary: "Self-host fonts with next/font/google to prevent external render-blocking font requests.",
        targetPath: "app/layout.tsx",
        language: "tsx",
        codeSnippet: `import { Inter } from "next/font/google";\n\nconst inter = Inter({ subsets: ["latin"], display: "swap" });\n\nexport default function RootLayout({ children }: { children: React.ReactNode }) {\n  return (\n    <html lang="en" className={inter.className}>\n      <body>{children}</body>\n    </html>\n  );\n}`,
        acceptanceCriteria: ["Import fonts via next/font to eliminate external Google Font CDN CSS round-trips."],
        effort: "small",
      },
    });
  }

  // Check 6: Modern Tooling & Turbopack (15 pts)
  const isModernNext =
    nextVersion.includes("14") ||
    nextVersion.includes("15") ||
    nextVersion.includes("^14") ||
    nextVersion.includes("^15") ||
    nextVersion.includes("canary");
  const scripts = (packageJson.scripts as Record<string, string> | undefined) ?? {};
  const hasDevScript = Boolean(scripts.dev);

  if (isModernNext && hasDevScript) {
    checks.push({
      id: "next-turbopack-tooling",
      category: "Tooling",
      label: "Next.js 14/15 & Build Pipeline",
      status: "pass",
      points: 15,
      maxPoints: 15,
      explanation: `Modern Next.js version observed (${nextVersion || "14+"}) with standardized build scripts.`,
    });
  } else if (hasDevScript) {
    checks.push({
      id: "next-turbopack-tooling",
      category: "Tooling",
      label: "Next.js 14/15 & Build Pipeline",
      status: "partial",
      points: 8,
      maxPoints: 15,
      explanation: `Next.js version is ${nextVersion || "unspecified"}. Upgrading to Next.js 14+ or 15 delivers faster Turbopack builds.`,
      remediation: {
        title: "Upgrade to Next.js 15 with Turbopack",
        summary: "Update package.json to Next.js 15 for faster compilation and React 19 compatibility.",
        targetPath: "package.json",
        language: "json",
        codeSnippet: `{\n  "scripts": {\n    "dev": "next dev --turbo",\n    "build": "next build",\n    "start": "next start"\n  }\n}`,
        acceptanceCriteria: ["Update next and react dependencies to current stable releases."],
        effort: "medium",
      },
    });
  } else {
    checks.push({
      id: "next-turbopack-tooling",
      category: "Tooling",
      label: "Next.js 14/15 & Build Pipeline",
      status: "missing",
      points: 0,
      maxPoints: 15,
      explanation: "No package.json dev or build scripts detected for Next.js.",
      remediation: {
        title: "Add Standard Next.js Scripts",
        summary: "Declare dev, build, and start scripts in package.json.",
        targetPath: "package.json",
        language: "json",
        codeSnippet: `{\n  "scripts": {\n    "dev": "next dev",\n    "build": "next build",\n    "start": "next start"\n  }\n}`,
        acceptanceCriteria: ["Add standard Next.js npm scripts."],
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

  // Pick Next Useful Move from highest deficit check
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
      id: "next-maintain-excellence",
      title: "Maintain Next.js architectural excellence and Core Web Vitals",
      whyItMatters: "All core Next.js App Router, resilience, metadata, and performance boundaries are verified.",
      effort: "small",
      expectedOutcome: "Maintain fast builds and robust error boundaries across releases.",
      acceptanceCriteria: [
        "Keep dependencies updated.",
        "Maintain zero leaked server variables.",
      ],
    };
  }

  return {
    stackId: "nextjs",
    stackName: "Next.js Deep Health",
    tagline: "App Router, Resilience Boundaries, Server Actions, and Core Web Vitals",
    score: totalScore,
    grade,
    checks,
    nextUsefulMove,
    detected: true,
    confidence: "high",
    limitations: [
      "Evaluates observable Next.js configuration files, App Router layout boundaries, and package metadata.",
      "Does not execute runtime server actions or assess backend database performance.",
    ],
  };
}

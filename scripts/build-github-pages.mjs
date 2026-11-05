import fs from "node:fs";
import path from "node:path";

const outDir = path.resolve("out");
if (fs.existsSync(outDir)) {
  fs.rmSync(outDir, { recursive: true, force: true });
}
fs.mkdirSync(outDir, { recursive: true });

// Copy public assets
const publicDir = path.resolve("public");
if (fs.existsSync(publicDir)) {
  fs.cpSync(publicDir, outDir, { recursive: true });
}

// Ensure .nojekyll for GitHub Pages
fs.writeFileSync(path.join(outDir, ".nojekyll"), "");

const landingHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover" />
  <title>ETHIOR WelcomeScore — Open Source Contributor Readiness & Repository Onboarding Audit</title>
  <meta name="description" content="WelcomeScore by ETHIOR evaluates how ready a public GitHub repository is for first-time contributors with deterministic 5-pillar audits, onboarding checklists, and developer badges." />
  <link rel="icon" href="./favicon.ico" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600;700&family=IBM+Plex+Sans:wght@400;500;600&display=swap" rel="stylesheet" />
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: {
            sans: ['"IBM Plex Sans"', 'Arial', 'Helvetica', 'sans-serif'],
            mono: ['"IBM Plex Mono"', 'monospace'],
          },
          colors: {
            base: '#12141C',
            surface: '#1B1E29',
            text: '#F2EEE6',
            muted: '#8B8F9E',
            accent: '#E8A23D',
            good: '#7A9B76',
          }
        }
      }
    }
  </script>
  <style>
    body { background-color: #12141C; color: #F2EEE6; font-family: "IBM Plex Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    .text-link { color: #8B8F9E; transition: color 180ms ease; }
    .text-link:hover { color: #E8A23D; }
  </style>
</head>
<body class="flex min-h-screen flex-col justify-between bg-base text-text">

  <!-- Main View Container -->
  <main class="relative flex min-h-screen flex-1 flex-col overflow-x-hidden bg-base px-4 pt-4 pb-10 text-text sm:px-6 sm:py-16">
    
    <!-- Top-Right Controls Row (Matching WelcomeScore Layout Exactly) -->
    <div class="w-full flex justify-end pb-4 sm:absolute sm:top-6 sm:right-8 sm:w-auto sm:pb-0 z-30">
      <div class="flex flex-col items-end gap-1.5 shrink-0">
        <!-- Star on GitHub Badge -->
        <a
          href="https://github.com/ethiorhq/welcomescore"
          target="_blank"
          rel="noopener noreferrer"
          class="group inline-flex items-center gap-1.5 rounded-md border border-muted/30 bg-surface/90 px-2.5 py-1 font-mono text-[11px] text-text/80 shadow-sm backdrop-blur-md transition-all duration-200 hover:border-accent/50 hover:bg-surface hover:text-accent"
        >
          <svg class="h-3.5 w-3.5 text-accent" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 .587l3.668 7.431 8.2 1.192-5.934 5.784 1.399 8.169-7.333-3.856-7.333 3.856 1.399-8.169-5.933-5.784 8.2-1.192zm0 5.702l-2.223 4.504-4.969.722 3.596 3.505-.848 4.951 4.444-2.336 4.444 2.336-.848-4.951 3.596-3.505-4.969-.722z"/>
          </svg>
          <span class="font-medium text-text/90 group-hover:text-accent">Star on GitHub</span>
        </a>

        <!-- 3-Server Switcher Pill -->
        <div class="relative inline-block text-left" id="switcherWrapper">
          <button
            type="button"
            id="switcherButton"
            class="group inline-flex items-center gap-1.5 rounded-md border border-muted/30 bg-surface/90 px-2.5 py-0.5 font-mono text-[11px] text-text/80 shadow-sm backdrop-blur-md transition-all duration-200 hover:border-accent/50 hover:bg-surface hover:text-accent"
          >
            <span class="relative flex h-1.5 w-1.5 shrink-0">
              <span class="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 bg-sky-400"></span>
              <span class="relative inline-flex h-1.5 w-1.5 rounded-full bg-sky-400"></span>
            </span>
            <span class="font-medium text-text/90 group-hover:text-accent">GitHub Pages</span>
            <span class="text-muted/40">·</span>
            <span class="inline-flex items-center gap-1 font-semibold text-accent">
              <span>3 Servers</span>
              <svg class="h-2.5 w-2.5 text-accent/80 transition-transform duration-200" id="chevronIcon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </span>
          </button>

          <!-- Dropdown Menu -->
          <div
            id="switcherMenu"
            class="hidden absolute right-0 top-full z-50 mt-1.5 w-72 rounded-lg border border-muted/30 bg-[#161822]/98 p-1.5 font-mono text-xs shadow-2xl backdrop-blur-xl"
          >
            <div class="flex items-center justify-between border-b border-muted/20 px-2.5 py-1.5 text-[10px] uppercase tracking-wider text-muted">
              <span class="font-semibold text-text/80">Active-Active Mesh (3 Nodes)</span>
              <span class="text-accent">99.99% Uptime</span>
            </div>
            <div class="py-1 space-y-1">
              <a href="https://welcomescore.pages.dev" class="flex items-center justify-between rounded-md px-2.5 py-2 hover:bg-surface hover:text-accent text-text/80 transition-colors">
                <div class="flex items-center gap-2">
                  <span class="h-2 w-2 rounded-full bg-emerald-400"></span>
                  <div class="flex flex-col text-left">
                    <span class="font-semibold text-xs leading-none">Cloudflare Edge Primary</span>
                    <span class="text-[10px] text-muted mt-0.5">welcomescore.pages.dev</span>
                  </div>
                </div>
                <span class="text-[10px] text-muted font-semibold">Switch →</span>
              </a>

              <a href="https://welcomescore.vercel.app" class="flex items-center justify-between rounded-md px-2.5 py-2 hover:bg-surface hover:text-accent text-text/80 transition-colors">
                <div class="flex items-center gap-2">
                  <span class="h-2 w-2 rounded-full bg-accent"></span>
                  <div class="flex flex-col text-left">
                    <span class="font-semibold text-xs leading-none">Vercel Serverless Mirror</span>
                    <span class="text-[10px] text-muted mt-0.5">welcomescore.vercel.app</span>
                  </div>
                </div>
                <span class="text-[10px] text-muted font-semibold">Switch →</span>
              </a>

              <div class="flex items-center justify-between rounded-md px-2.5 py-2 bg-muted/15 border border-muted/20 text-text cursor-default">
                <div class="flex items-center gap-2">
                  <span class="h-2 w-2 rounded-full bg-sky-400"></span>
                  <div class="flex flex-col text-left">
                    <span class="font-semibold text-xs leading-none">GitHub Pages Mirror</span>
                    <span class="text-[10px] text-muted mt-0.5">ethiorhq.github.io/welcomescore</span>
                  </div>
                </div>
                <span class="rounded bg-sky-500/20 px-1.5 py-0.5 text-[9px] font-bold uppercase text-sky-400">Active</span>
              </div>
            </div>
            <div class="border-t border-muted/20 px-2.5 py-1.5 text-[10px] text-muted flex items-center justify-between">
              <a href="https://welcomescore.pages.dev/policies/multi-server" class="text-link hover:text-accent">Reliability Policy &amp; SLA →</a>
              <span class="text-[9px] text-muted/60">Auto-sync</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Centered Content Area (Matching Authentic WelcomeScore) -->
    <div class="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center">
      <section class="w-full text-center">
        
        <!-- Authentic WelcomeScore Wordmark -->
        <h1 class="text-3xl text-accent sm:text-6xl flex justify-center">
          <span class="inline-flex items-start gap-2">
            <span class="font-mono font-bold tracking-tight text-accent">WelcomeScore</span>
            <span class="mt-0.5 inline-flex rounded-md border border-accent/30 bg-accent/10 px-1.5 py-0.5 font-mono text-xs font-semibold text-accent sm:mt-2 sm:px-2 sm:py-1">
              ETHIOR
            </span>
          </span>
        </h1>

        <!-- Feature Pill Buttons (Original WelcomeScore Row) -->
        <div class="mt-5 flex flex-wrap justify-center gap-2 sm:gap-3 font-sans">
          <a
            class="inline-flex h-9 sm:h-10 items-center justify-center rounded-md border border-accent/45 bg-accent/10 px-3 sm:px-4 text-xs sm:text-sm font-medium text-accent transition-colors duration-180 ease-out hover:bg-accent/20"
            href="https://welcomescore.vercel.app/devops"
          >
            ⚡ DevOps Doctor
          </a>
          <a
            class="inline-flex h-9 sm:h-10 items-center justify-center rounded-md border border-muted/35 bg-surface px-3 sm:px-4 text-xs sm:text-sm font-medium text-muted transition-colors duration-180 ease-out hover:border-accent/45 hover:text-accent"
            href="https://welcomescore.vercel.app/org"
          >
            🏢 Fleet Cockpit
          </a>
          <a
            class="inline-flex h-9 sm:h-10 items-center justify-center rounded-md border border-muted/35 bg-surface px-3 sm:px-4 text-xs sm:text-sm font-medium text-muted transition-colors duration-180 ease-out hover:border-accent/45 hover:text-accent"
            href="https://welcomescore.vercel.app/templates"
          >
            🛠️ Studio
          </a>
          <a
            class="inline-flex h-9 sm:h-10 items-center justify-center rounded-md border border-muted/35 bg-surface px-3 sm:px-4 text-xs sm:text-sm font-medium text-muted transition-colors duration-180 ease-out hover:border-accent/45 hover:text-accent"
            href="https://welcomescore.vercel.app/leaderboard"
          >
            <span class="hidden sm:inline">Explore the </span>Hall of Fame
          </a>
          <a
            class="inline-flex h-9 sm:h-10 items-center justify-center rounded-md border border-muted/35 bg-surface px-3 sm:px-4 text-xs sm:text-sm font-medium text-muted transition-colors duration-180 ease-out hover:border-accent/45 hover:text-accent"
            href="https://welcomescore.vercel.app/js"
          >
            <span class="hidden sm:inline">JavaScript </span>Repository Health<span class="hidden sm:inline"> Index</span>
          </a>
          <a
            class="inline-flex h-9 sm:h-10 items-center justify-center rounded-md border border-muted/35 bg-surface px-3 sm:px-4 text-xs sm:text-sm font-medium text-muted transition-colors duration-180 ease-out hover:border-accent/45 hover:text-accent"
            href="https://welcomescore.vercel.app/lounge"
          >
            <span class="hidden sm:inline">Open </span>Dev Lounge
          </a>
        </div>

        <!-- Input Form (Direct Live Scan) -->
        <form id="auditForm" class="mx-auto mt-6 flex w-full max-w-2xl flex-col gap-3 sm:flex-row">
          <label class="sr-only" for="repository">Repository</label>
          <input
            id="repository"
            type="text"
            placeholder="owner/repo — e.g. vercel/next.js"
            class="h-12 w-full rounded-md border border-muted/45 bg-surface px-4 font-mono text-base text-text outline-none placeholder:text-muted focus:border-accent sm:text-sm"
            required
          />
          <button
            type="submit"
            class="h-12 shrink-0 rounded-md bg-accent px-6 font-sans text-sm font-semibold text-base active:scale-[0.98] hover:bg-accent/90 transition-colors"
          >
            Check
          </button>
        </form>

        <a
          href="https://welcomescore.vercel.app/compare"
          class="mt-3 inline-block font-sans text-sm text-link underline underline-offset-4"
        >
          Compare two repos instead →
        </a>

        <!-- Live Server Endpoints Card (Clean & Prominent) -->
        <div class="mx-auto mt-8 w-full max-w-2xl rounded-lg border border-muted/25 bg-surface/80 p-4 sm:p-5 text-left font-mono">
          <div class="flex items-center justify-between border-b border-muted/20 pb-3 mb-3">
            <span class="text-xs uppercase tracking-wider font-semibold text-text">Active Production Servers</span>
            <span class="inline-flex items-center gap-1.5 text-[11px] text-emerald-400">
              <span class="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              99.99% Target Uptime
            </span>
          </div>
          <p class="text-xs text-muted mb-4 font-sans leading-relaxed">
            This is the static GitHub Pages mirror. Realtime audits, WebSockets, and API computations run continuously on our primary edge servers below:
          </p>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <!-- Cloudflare Link -->
            <a
              href="https://welcomescore.pages.dev"
              class="group/card p-3 rounded-md border border-emerald-500/30 bg-base/60 hover:border-emerald-400 transition-all"
            >
              <div class="flex items-center justify-between mb-1">
                <span class="text-xs font-bold text-text group-hover/card:text-emerald-400 transition-colors">Cloudflare Edge Primary</span>
                <span class="h-2 w-2 rounded-full bg-emerald-400"></span>
              </div>
              <p class="text-[11px] text-muted font-sans">Workerd V8 Isolates · sub-10ms TTFB</p>
              <span class="text-[11px] text-emerald-400 mt-1 inline-block">https://welcomescore.pages.dev →</span>
            </a>

            <!-- Vercel Link -->
            <a
              href="https://welcomescore.vercel.app"
              class="group/card p-3 rounded-md border border-accent/30 bg-base/60 hover:border-accent transition-all"
            >
              <div class="flex items-center justify-between mb-1">
                <span class="text-xs font-bold text-text group-hover/card:text-accent transition-colors">Vercel Serverless Mirror</span>
                <span class="h-2 w-2 rounded-full bg-accent"></span>
              </div>
              <p class="text-[11px] text-muted font-sans">Edge Hybrid Compute · Failover</p>
              <span class="text-[11px] text-accent mt-1 inline-block">https://welcomescore.vercel.app →</span>
            </a>
          </div>
        </div>

      </section>
    </div>
  </main>

  <!-- Authentic WelcomeScore Site Footer (Exact Match) -->
  <footer class="mx-auto mt-10 w-full max-w-6xl border-t border-muted/20 px-4 pt-6 pb-8 text-center font-sans text-xs text-muted sm:px-6">
    <nav aria-label="Footer navigation" class="flex flex-wrap justify-center gap-x-4 gap-y-3">
      <a class="inline-block h-6 min-w-[44px] text-link underline underline-offset-4" href="https://welcomescore.vercel.app/how-it-works">How it works</a>
      <a class="inline-block h-6 min-w-[44px] text-link underline underline-offset-4" href="https://welcomescore.vercel.app/devops">DevOps Doctor</a>
      <a class="inline-block h-6 min-w-[44px] text-link underline underline-offset-4" href="https://welcomescore.vercel.app/org">Fleet Cockpit</a>
      <a class="inline-block h-6 min-w-[44px] text-link underline underline-offset-4" href="https://welcomescore.vercel.app/templates">Template Studio</a>
      <a class="inline-block h-6 min-w-[44px] text-link underline underline-offset-4" href="https://welcomescore.vercel.app/js">JS Health Index</a>
      <a class="inline-block h-6 min-w-[44px] text-link underline underline-offset-4" href="https://welcomescore.vercel.app/guides">Developer guides</a>
      <a class="inline-block h-6 min-w-[44px] text-link underline underline-offset-4" href="https://welcomescore.vercel.app/faq">FAQ</a>
      <a class="inline-block h-6 min-w-[44px] text-link underline underline-offset-4" href="https://welcomescore.vercel.app/policies/multi-server">Multi-Server Policy</a>
      <a class="inline-block h-6 min-w-[44px] text-link underline underline-offset-4" href="https://welcomescore.vercel.app/privacy">Privacy Policy</a>
      <a class="inline-block h-6 min-w-[44px] text-link underline underline-offset-4" href="https://welcomescore.vercel.app/terms">Terms &amp; Conditions</a>
      <a class="inline-block h-6 min-w-[44px] text-link underline underline-offset-4" href="https://welcomescore.vercel.app/dev-lounge-policy">Dev Lounge Policy</a>
    </nav>

    <p class="mt-5 leading-6">
      Built by <a class="text-link underline underline-offset-4 font-semibold text-text" href="https://ethior.com">ETHIOR</a>
      <span aria-hidden="true"> · </span>
      Original project: <a class="text-link underline underline-offset-4" href="https://welcomescore.vercel.app">WelcomeScore by ETHIOR</a>
      <span aria-hidden="true"> · </span>
      <a class="text-link underline underline-offset-4" href="https://github.com/ethiorhq/welcomescore">Source on GitHub</a>
      <span aria-hidden="true"> · </span>
      <a class="text-link underline underline-offset-4" href="https://welcomescore.vercel.app/guides/rss.xml">Guide RSS</a>
    </p>

    <!-- ETHIOR Official Social Icons (Exact SVGs) -->
    <div class="mt-3 flex justify-center items-center gap-2">
      <!-- LinkedIn -->
      <a
        href="https://www.linkedin.com/company/ethior"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="ETHIOR on LinkedIn"
        class="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-muted/30 bg-surface text-text/80 transition-all duration-200 hover:border-[#0A66C2]/60 hover:bg-[#0A66C2]/15 hover:text-[#0A66C2] hover:shadow-[0_0_16px_rgba(10,102,194,0.35)]"
      >
        <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451c.979 0 1.778-.773 1.778-1.729V1.73C24 .774 23.205 0 22.225 0z" />
        </svg>
      </a>

      <!-- Instagram -->
      <a
        href="https://www.instagram.com/ethiorhq/"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="ETHIOR on Instagram"
        class="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-muted/30 bg-surface text-text/80 transition-all duration-200 hover:border-[#E4405F]/60 hover:bg-[#E4405F]/15 hover:text-[#E4405F] hover:shadow-[0_0_16px_rgba(228,64,95,0.35)]"
      >
        <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
        </svg>
      </a>

      <!-- Facebook -->
      <a
        href="https://www.facebook.com/ethiorhq/"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="ETHIOR on Facebook"
        class="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-muted/30 bg-surface text-text/80 transition-all duration-200 hover:border-[#1877F2]/60 hover:bg-[#1877F2]/15 hover:text-[#1877F2] hover:shadow-[0_0_16px_rgba(24,119,242,0.35)]"
      >
        <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      </a>

      <!-- GitHub -->
      <a
        href="https://github.com/ethiorhq"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="ETHIOR on GitHub"
        class="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-muted/30 bg-surface text-text/80 transition-all duration-200 hover:border-white/60 hover:bg-white/10 hover:text-white hover:shadow-[0_0_16px_rgba(255,255,255,0.25)]"
      >
        <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
        </svg>
      </a>
    </div>

    <p class="mt-3 text-[11px] text-muted/70">
      © 2026 ETHIOR. All rights reserved. Governed under the MIT License.
    </p>
  </footer>

  <!-- Scripts -->
  <script>
    // Toggle 3-Server Switcher Dropdown
    var switcherButton = document.getElementById("switcherButton");
    var switcherMenu = document.getElementById("switcherMenu");
    var chevronIcon = document.getElementById("chevronIcon");

    switcherButton.addEventListener("click", function(e) {
      e.stopPropagation();
      var isHidden = switcherMenu.classList.contains("hidden");
      if (isHidden) {
        switcherMenu.classList.remove("hidden");
        chevronIcon.classList.add("rotate-180");
      } else {
        switcherMenu.classList.add("hidden");
        chevronIcon.classList.remove("rotate-180");
      }
    });

    document.addEventListener("click", function(e) {
      if (!document.getElementById("switcherWrapper").contains(e.target)) {
        switcherMenu.classList.add("hidden");
        chevronIcon.classList.remove("rotate-180");
      }
    });

    // Form submission -> redirect to live auditor report on active production server
    document.getElementById("auditForm").addEventListener("submit", function(e) {
      e.preventDefault();
      var raw = document.getElementById("repository").value.trim();
      var cleaned = raw.replace(/^https?:\\/\\/github\\.com\\//i, "").replace(/^github\\.com\\//i, "").replace(/\\.git$/i, "").replace(/^\\/+|\\/+$/g, "");
      if (cleaned) {
        window.location.href = "https://welcomescore.vercel.app/report/" + cleaned;
      }
    });
  </script>
</body>
</html>`;

fs.writeFileSync(path.join(outDir, "index.html"), landingHtml);
fs.writeFileSync(path.join(outDir, "404.html"), landingHtml);
console.log("GitHub Pages static mirror successfully rebuilt with authentic WelcomeScore UI & layout!");

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

// Ensure .nojekyll
fs.writeFileSync(path.join(outDir, ".nojekyll"), "");

const landingHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover" />
  <title>ETHIOR WelcomeScore — Open Source Contributor Readiness (GitHub Pages Mirror)</title>
  <meta name="description" content="WelcomeScore by ETHIOR evaluates how ready a public GitHub repository is for first-time contributors. Static global mirror on GitHub Pages." />
  <link rel="icon" href="./favicon.ico" />
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
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
    body { background-color: #12141C; color: #F2EEE6; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
  </style>
</head>
<body class="min-h-screen flex flex-col justify-between selection:bg-accent/30 selection:text-accent">
  <!-- Top Navigation -->
  <header class="border-b border-muted/20 bg-surface/80 backdrop-blur-md sticky top-0 z-40">
    <div class="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
      <a href="https://welcomescore.pages.dev" class="flex items-center gap-2 group">
        <span class="text-xl font-bold tracking-tight text-text group-hover:text-accent transition-colors">
          Welcome<span class="text-accent">Score</span>
        </span>
        <span class="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-400 border border-sky-500/30">
          GH Pages Mirror
        </span>
      </a>

      <!-- 3-Server Switcher Pill -->
      <div class="flex items-center gap-2">
        <div class="relative">
          <div class="flex items-center gap-1.5 rounded-md border border-muted/30 bg-surface px-2.5 py-1 font-mono text-xs text-text shadow-sm">
            <span class="h-2 w-2 rounded-full bg-sky-400 animate-pulse"></span>
            <span class="font-semibold text-sky-400">GH Pages Mirror</span>
            <span class="text-muted/40">·</span>
            <a href="https://welcomescore.pages.dev" class="text-accent hover:underline">⇄ Cloudflare</a>
            <span class="text-muted/40">·</span>
            <a href="https://welcomescore.vercel.app" class="text-accent hover:underline">⇄ Vercel</a>
          </div>
        </div>
      </div>
    </div>
  </header>

  <!-- Hero Section -->
  <main class="max-w-4xl mx-auto px-4 py-16 text-center flex-1 flex flex-col justify-center items-center">
    <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-sky-500/30 bg-sky-500/10 text-sky-400 text-xs font-mono mb-6">
      <span class="h-1.5 w-1.5 rounded-full bg-sky-400"></span>
      Active-Active 3-Server Global Mesh: Node 3 (GitHub Pages)
    </div>

    <h1 class="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4 text-text leading-tight">
      Is Your Repository Ready for <br class="hidden sm:inline" />
      <span class="text-accent">First-Time Contributors?</span>
    </h1>

    <p class="text-base sm:text-lg text-muted max-w-2xl mb-8 leading-relaxed">
      WelcomeScore deterministically evaluates observable onboarding signals—documentation, contribution guidelines, code of conduct, starter issues, and licensing—with ready-to-use patch plans.
    </p>

    <!-- Auditor Input Box -->
    <div class="w-full max-w-xl bg-surface/90 border border-muted/30 rounded-xl p-2 sm:p-3 shadow-2xl backdrop-blur-md mb-8">
      <form id="auditForm" class="flex flex-col sm:flex-row gap-2">
        <input
          id="repoInput"
          type="text"
          placeholder="owner/repo or github.com/owner/repo"
          class="flex-1 bg-base/80 border border-muted/30 rounded-lg px-4 py-2.5 text-sm text-text placeholder-muted/60 focus:outline-none focus:border-accent font-mono"
          required
        />
        <button
          type="submit"
          class="bg-accent hover:bg-accent/90 text-base font-semibold px-6 py-2.5 rounded-lg text-sm transition-all shadow-md active:scale-95"
        >
          Audit Repo →
        </button>
      </form>
    </div>

    <!-- 3-Server Edge Status Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-2xl text-left">
      <a href="https://welcomescore.pages.dev" class="p-3.5 rounded-lg border border-emerald-500/30 bg-surface/50 hover:border-emerald-500 transition-colors group">
        <div class="flex items-center justify-between mb-1">
          <span class="text-xs font-bold text-text group-hover:text-emerald-400">Cloudflare Edge</span>
          <span class="h-2 w-2 rounded-full bg-emerald-400"></span>
        </div>
        <p class="text-[11px] text-muted">Primary Edge · Workerd V8</p>
        <p class="text-[10px] text-emerald-400 font-mono mt-1">welcomescore.pages.dev →</p>
      </a>

      <a href="https://welcomescore.vercel.app" class="p-3.5 rounded-lg border border-accent/30 bg-surface/50 hover:border-accent transition-colors group">
        <div class="flex items-center justify-between mb-1">
          <span class="text-xs font-bold text-text group-hover:text-accent">Vercel Mirror</span>
          <span class="h-2 w-2 rounded-full bg-accent"></span>
        </div>
        <p class="text-[11px] text-muted">Failover Mirror · Global Edge</p>
        <p class="text-[10px] text-accent font-mono mt-1">welcomescore.vercel.app →</p>
      </a>

      <div class="p-3.5 rounded-lg border border-sky-500 bg-sky-500/10">
        <div class="flex items-center justify-between mb-1">
          <span class="text-xs font-bold text-sky-400">GitHub Pages</span>
          <span class="h-2 w-2 rounded-full bg-sky-400"></span>
        </div>
        <p class="text-[11px] text-text/80">Static CDN Mirror (Active)</p>
        <p class="text-[10px] text-sky-400 font-mono mt-1">ethiorhq.github.io/welcomescore</p>
      </div>
    </div>
  </main>

  <!-- Footer -->
  <footer class="border-t border-muted/20 bg-surface/50 py-8 text-center text-xs text-muted">
    <div class="max-w-6xl mx-auto px-4 flex flex-col items-center gap-3">
      <div class="flex items-center gap-3 text-text/80">
        <span>Built by <a href="https://ethior.com" class="text-accent hover:underline font-semibold">ETHIOR</a></span>
        <span>·</span>
        <a href="https://github.com/ethiorhq/welcomescore" class="hover:text-text">Source on GitHub</a>
        <span>·</span>
        <a href="https://welcomescore.pages.dev/policies/multi-server" class="hover:text-text">3-Server SLA Policy</a>
      </div>
      <p>© 2026 ETHIOR. All rights reserved. Governed under the MIT License.</p>
    </div>
  </footer>

  <script>
    document.getElementById("auditForm").addEventListener("submit", function(e) {
      e.preventDefault();
      var raw = document.getElementById("repoInput").value.trim();
      var cleaned = raw.replace(/^https?:\\/\\/github\\.com\\//i, "").replace(/^github\\.com\\//i, "").replace(/\\.git$/i, "").replace(/^\\/+|\\/+$/g, "");
      if (cleaned) {
        window.location.href = "https://welcomescore.pages.dev/report/" + cleaned;
      }
    });
  </script>
</body>
</html>`;

fs.writeFileSync(path.join(outDir, "index.html"), landingHtml);
fs.writeFileSync(path.join(outDir, "404.html"), landingHtml);
console.log("GitHub Pages static mirror built successfully in ./out");

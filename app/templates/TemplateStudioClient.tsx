"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import WelcomeScoreWordmark from "@/app/components/WelcomeScoreWordmark";
import HeaderControls from "@/app/components/HeaderControls";
import SiteFooter from "@/app/components/SiteFooter";
import {
  getAllAvailableTemplates,
  getGitHubDirectNewFileUrl,
  type AutoFixProposal,
} from "@/lib/autofix/engine";

const LANGUAGES = [
  { id: "TypeScript", label: "TypeScript / Node" },
  { id: "Python", label: "Python" },
  { id: "Go", label: "Go" },
  { id: "Rust", label: "Rust" },
  { id: "Java", label: "Java / Kotlin" },
  { id: "General", label: "General / Other" },
];

export default function TemplateStudioClient() {
  const [repoInput, setRepoInput] = useState("my-org/my-repo");
  const [branchInput, setBranchInput] = useState("main");
  const [selectedLanguage, setSelectedLanguage] = useState("TypeScript");
  const [selectedTemplateId, setSelectedTemplateId] = useState("contributing");
  const [copied, setCopied] = useState(false);
  const [customContentMap, setCustomContentMap] = useState<Record<string, string>>({});

  const [ownerPart, namePart] = repoInput.includes("/")
    ? repoInput.split("/")
    : ["owner", repoInput || "repo"];

  const context = useMemo(
    () => ({
      repoOwner: ownerPart.trim() || "owner",
      repoName: namePart?.trim() || "repo",
      primaryLanguage: selectedLanguage,
      defaultBranch: branchInput.trim() || "main",
    }),
    [ownerPart, namePart, selectedLanguage, branchInput]
  );

  const templates: AutoFixProposal[] = useMemo(() => {
    return getAllAvailableTemplates(context);
  }, [context]);

  const activeTemplate = useMemo(() => {
    return (
      templates.find((t) => t.id === selectedTemplateId) || templates[0]
    );
  }, [templates, selectedTemplateId]);

  const displayContent =
    customContentMap[activeTemplate.id] !== undefined
      ? customContentMap[activeTemplate.id]
      : activeTemplate.content;

  const directPrUrl = useMemo(() => {
    return getGitHubDirectNewFileUrl(
      context.repoOwner,
      context.repoName,
      activeTemplate.targetPath,
      displayContent,
      context.defaultBranch
    );
  }, [context, activeTemplate.targetPath, displayContent]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(displayContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }

  function handleDownload() {
    const blob = new Blob([displayContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const filename = activeTemplate.targetPath.split("/").pop() || "file.txt";
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function handleResetTemplate() {
    setCustomContentMap((prev) => {
      const next = { ...prev };
      delete next[activeTemplate.id];
      return next;
    });
  }

  return (
    <div className="min-h-screen bg-base text-text selection:bg-accent/30 selection:text-text">
      {/* Header */}
      <header className="border-b border-muted/20 bg-surface/50 backdrop-blur-md sticky top-0 z-40">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-2 group">
            <WelcomeScoreWordmark />
          </Link>
          <div className="flex items-center gap-3">
            <nav className="hidden sm:flex items-center gap-3 font-mono text-xs text-muted">
              <Link href="/" className="hover:text-text transition">Audits</Link>
              <Link href="/devops" className="hover:text-text transition">DevOps Doctor</Link>
              <Link href="/org" className="hover:text-text transition">Fleet Cockpit</Link>
              <Link href="/templates" className="text-accent font-semibold">Studio</Link>
            </nav>
            <HeaderControls />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12 space-y-8">
        {/* Hero */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-3.5 py-1 font-mono text-xs text-accent">
            <span className="h-2 w-2 rounded-full bg-accent animate-ping" />
            ETHIOR Open-Source Template & CI Studio
          </div>
          <h1 className="font-mono text-2xl sm:text-4xl font-extrabold tracking-tight text-text">
            Tailor & 1-Click Dispatch GitHub Community Files
          </h1>
          <p className="mx-auto max-w-2xl font-sans text-sm text-muted leading-relaxed">
            Generate production-grade <code className="text-accent font-mono">CONTRIBUTING.md</code>, issue forms, GitHub Actions CI workflows, and security policies tailored to your ecosystem. Dispatches directly to GitHub without requiring OAuth tokens.
          </p>
        </div>

        {/* Global Controls Grid */}
        <div className="rounded-2xl border border-muted/20 bg-surface/80 p-5 shadow-xl grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block font-mono text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
              Target Repository
            </label>
            <input
              type="text"
              value={repoInput}
              onChange={(e) => setRepoInput(e.target.value)}
              placeholder="owner/repo"
              className="w-full rounded-xl border border-muted/30 bg-base px-3.5 py-2 font-mono text-sm text-text placeholder-muted/50 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>

          <div>
            <label className="block font-mono text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
              Default Branch
            </label>
            <input
              type="text"
              value={branchInput}
              onChange={(e) => setBranchInput(e.target.value)}
              placeholder="main"
              className="w-full rounded-xl border border-muted/30 bg-base px-3.5 py-2 font-mono text-sm text-text placeholder-muted/50 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>

          <div>
            <label className="block font-mono text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
              Primary Ecosystem / Stack
            </label>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="w-full rounded-xl border border-muted/30 bg-base px-3.5 py-2 font-mono text-sm text-text focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.id} value={lang.id} className="bg-surface text-text">
                  {lang.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Studio Workspace: Sidebar + Editor */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Templates Menu */}
          <div className="lg:col-span-4 space-y-2">
            <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-muted px-1">
              Select Template ({templates.length})
            </h2>
            <div className="space-y-1.5">
              {templates.map((tpl) => {
                const isActive = tpl.id === activeTemplate.id;
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => setSelectedTemplateId(tpl.id)}
                    className={`w-full text-left rounded-xl p-3.5 transition flex flex-col gap-1 border ${
                      isActive
                        ? "border-accent bg-accent/10 shadow-sm"
                        : "border-muted/15 bg-surface/50 hover:border-muted/40 hover:bg-surface/80"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`font-mono text-xs font-semibold ${isActive ? "text-accent" : "text-text"}`}>
                        {tpl.title}
                      </span>
                      <span className="font-mono text-[10px] text-muted rounded bg-base/80 px-1.5 py-0.5 border border-muted/20">
                        {tpl.language}
                      </span>
                    </div>
                    <span className="font-mono text-[11px] text-muted truncate">
                      {tpl.targetPath}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Editor & Preview Pane */}
          <div className="lg:col-span-8 space-y-4">
            <div className="rounded-2xl border border-muted/20 bg-surface/80 p-5 space-y-4 shadow-xl">
              {/* File Header Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-muted/15 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-accent font-semibold uppercase tracking-wider">
                      Target Path:
                    </span>
                    <code className="font-mono text-xs font-bold text-text bg-base px-2 py-0.5 rounded border border-muted/20">
                      {activeTemplate.targetPath}
                    </code>
                  </div>
                  <p className="mt-1 font-sans text-xs text-muted">
                    {activeTemplate.summary}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleResetTemplate}
                    title="Reset to generated default"
                    className="rounded-lg border border-muted/30 bg-base px-2.5 py-1.5 font-mono text-xs text-muted hover:text-text transition"
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="rounded-lg border border-muted/30 bg-base px-3 py-1.5 font-mono text-xs font-medium text-text hover:border-accent hover:text-accent transition flex items-center gap-1.5"
                  >
                    {copied ? "✓ Copied" : "Copy"}
                  </button>
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="rounded-lg border border-muted/30 bg-base px-3 py-1.5 font-mono text-xs font-medium text-text hover:border-accent hover:text-accent transition"
                  >
                    Download
                  </button>
                  <a
                    href={directPrUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg bg-accent px-3.5 py-1.5 font-mono text-xs font-bold text-base hover:bg-accent/90 transition shadow-sm flex items-center gap-1.5"
                  >
                    <span>1-Click PR to GitHub</span>
                    <span>↗</span>
                  </a>
                </div>
              </div>

              {/* Why it Matters Note */}
              <div className="rounded-xl border border-accent/20 bg-accent/5 p-3 font-sans text-xs text-text/80 flex items-start gap-2.5">
                <span className="font-mono text-accent text-sm leading-none mt-0.5">💡</span>
                <div>
                  <strong className="font-semibold text-accent font-mono text-xs block">Why this matters:</strong>
                  <span>{activeTemplate.whyItMatters}</span>
                </div>
              </div>

              {/* Code Textarea Editor */}
              <div className="relative">
                <textarea
                  value={displayContent}
                  onChange={(e) =>
                    setCustomContentMap((prev) => ({
                      ...prev,
                      [activeTemplate.id]: e.target.value,
                    }))
                  }
                  rows={20}
                  spellCheck={false}
                  className="w-full rounded-xl border border-muted/30 bg-base/95 p-4 font-mono text-xs text-text leading-relaxed selection:bg-accent/30 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent resize-y"
                />
              </div>

              {/* Footer Tip */}
              <div className="flex flex-wrap items-center justify-between text-[11px] font-mono text-muted gap-2 pt-1">
                <span>Direct GitHub URL creates a new file directly on <code className="text-text">{context.defaultBranch}</code> branch.</span>
                <span>{displayContent.split("\n").length} lines</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import WelcomeScoreWordmark from "@/app/components/WelcomeScoreWordmark";
import BackButton from "@/app/components/BackButton";
import HeaderControls from "@/app/components/HeaderControls";
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
    <main className="min-h-screen bg-base px-4 py-8 text-text sm:px-6 sm:py-12">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Authentic Page Header */}
        <header className="flex flex-col gap-6 border-b border-muted/20 pb-8 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-accent">
              Open-Source Community & CI Studio
            </p>
            <h1 className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-3xl text-text sm:text-5xl">
              <WelcomeScoreWordmark badgeClassName="sm:mt-1.5" />
              <span className="font-mono font-bold tracking-tight">Template Studio</span>
            </h1>
            <p className="mt-3 max-w-2xl font-sans text-sm leading-6 text-muted sm:text-base">
              Tailor and 1-click dispatch GitHub CONTRIBUTING.md, issue forms, PR templates, Dependabot configs, and CI workflows.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <BackButton />
            <Link
              href="/"
              className="inline-flex h-11 items-center justify-center rounded-md border border-accent/45 bg-accent/10 px-4 font-sans text-sm font-medium text-accent transition-colors duration-180 ease-out hover:bg-accent/15 active:scale-[0.98] sm:h-10"
            >
              Check a repository
            </Link>
            <HeaderControls />
          </div>
        </header>

        {/* Authentic Notice Callout */}
        <section className="rounded-lg border border-accent/25 bg-surface px-5 py-4 sm:flex sm:items-center sm:justify-between sm:gap-6">
          <p className="font-sans text-sm leading-6 text-text">
            Tailor templates to your primary language ecosystem and dispatch pull requests to GitHub with zero token overhead.
          </p>
          <span className="mt-2 inline-block shrink-0 font-mono text-xs text-muted sm:mt-0">
            Zero token requirement · 1-Click PR
          </span>
        </section>

        {/* Global Controls Grid */}
        <div className="rounded-lg border border-muted/20 bg-surface p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block font-mono text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
              Target Repository
            </label>
            <input
              type="text"
              value={repoInput}
              onChange={(e) => setRepoInput(e.target.value)}
              placeholder="owner/repo"
              className="h-11 w-full rounded-md border border-muted/45 bg-base px-3.5 font-mono text-sm text-text placeholder-muted/50 focus:border-accent focus:outline-none"
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
              className="h-11 w-full rounded-md border border-muted/45 bg-base px-3.5 font-mono text-sm text-text placeholder-muted/50 focus:border-accent focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-mono text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
              Primary Ecosystem / Stack
            </label>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="h-11 w-full rounded-md border border-muted/45 bg-base px-3.5 font-mono text-sm text-text focus:border-accent focus:outline-none"
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
                    className={`w-full text-left rounded-md p-3 transition flex flex-col gap-1 border ${
                      isActive
                        ? "border-accent bg-accent/15"
                        : "border-muted/20 bg-surface/60 hover:border-muted/40 hover:bg-surface"
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
            <div className="rounded-lg border border-muted/20 bg-surface p-5 space-y-4">
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
                    className="rounded-md border border-muted/30 bg-base px-2.5 py-1.5 font-mono text-xs text-muted hover:text-text transition"
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="rounded-md border border-muted/30 bg-base px-3 py-1.5 font-mono text-xs font-medium text-text hover:border-accent hover:text-accent transition flex items-center gap-1.5"
                  >
                    {copied ? "✓ Copied" : "Copy"}
                  </button>
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="rounded-md border border-muted/30 bg-base px-3 py-1.5 font-mono text-xs font-medium text-text hover:border-accent hover:text-accent transition"
                  >
                    Download
                  </button>
                  <a
                    href={directPrUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-md bg-accent px-3.5 py-1.5 font-mono text-xs font-bold text-base hover:bg-accent/90 transition shadow-sm flex items-center gap-1.5"
                  >
                    <span>1-Click PR to GitHub</span>
                    <span>↗</span>
                  </a>
                </div>
              </div>

              {/* Why it Matters Note */}
              <div className="rounded-md border border-accent/20 bg-accent/5 p-3 font-sans text-xs text-text/80 flex items-start gap-2.5">
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
                  className="w-full rounded-md border border-muted/30 bg-base/95 p-4 font-mono text-xs text-text leading-relaxed selection:bg-accent/30 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent resize-y"
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
      </div>
    </main>
  );
}

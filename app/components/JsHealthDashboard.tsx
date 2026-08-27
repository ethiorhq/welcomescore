"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import WelcomeScoreWordmark from "@/app/components/WelcomeScoreWordmark";
import { getJsHealthRemediation } from "@/lib/jsHealth/remediation";
import type { JsHealthCategory, JsHealthCheck, JsHealthReport } from "@/lib/jsHealth/types";

type FetchState = {
  report: JsHealthReport | null;
  error: string;
  loading: boolean;
};

const INITIAL_STATE: FetchState = { report: null, error: "", loading: false };
const BENCHMARKS = [
  { label: "Express", repo: "expressjs/express" },
  { label: "React", repo: "facebook/react" },
];

export default function JsHealthDashboard() {
  const [repository, setRepository] = useState("");
  const [state, setState] = useState<FetchState>(INITIAL_STATE);
  const [comparison, setComparison] = useState<JsHealthReport | null>(null);
  const [selectedCheck, setSelectedCheck] = useState<JsHealthCheck | null>(null);
  const reduceMotion = useReducedMotion();

  async function inspectRepository(value: string, target: "primary" | "comparison" = "primary") {
    const repo = value.trim();
    if (!repo) return;
    if (target === "primary") {
      setState({ report: null, error: "", loading: true });
      setComparison(null);
      setSelectedCheck(null);
    }

    try {
      const response = await fetch(`/api/js-health?repo=${encodeURIComponent(repo)}`, { cache: "no-store" });
      const payload = await response.json().catch(() => ({})) as JsHealthReport | { error?: string };
      if (!response.ok || !("score" in payload)) {
        const error = "error" in payload ? payload.error : "upstream-error";
        if (target === "primary") {
          setState({ report: null, loading: false, error: errorMessage(error) });
        }
        return;
      }
      if (target === "primary") {
        setState({ report: payload, error: "", loading: false });
      } else {
        setComparison(payload);
      }
    } catch {
      if (target === "primary") {
        setState({ report: null, loading: false, error: "The public repository check is unavailable right now. Please try again shortly." });
      }
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void inspectRepository(repository);
  }

  const selectedRemediation = selectedCheck?.remediationId
    ? getJsHealthRemediation(selectedCheck.remediationId)
    : null;

  return (
    <main className="min-h-screen flex-1 overflow-x-hidden bg-base px-4 py-8 text-text sm:px-6 sm:py-12">
      <div className="mx-auto w-full max-w-6xl">
        <header className="flex flex-col gap-6 border-b border-muted/20 pb-8 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Link href="/" className="text-link text-sm underline underline-offset-4">← Contributor readiness</Link>
            <h1 className="mt-5 text-3xl text-accent sm:text-5xl"><WelcomeScoreWordmark /></h1>
            <p className="mt-3 max-w-2xl font-sans text-base text-muted sm:text-lg">
              JavaScript Health is a read-only audit for package metadata, Node tooling, CI evidence, and contributor foundations.
            </p>
          </div>
          <div className="rounded-md border border-accent/25 bg-surface/70 px-4 py-3 font-mono text-xs text-muted shadow-[0_0_35px_rgba(232,162,61,0.05)]">
            <p className="text-accent">npx welcomescore</p>
            <p className="mt-1">Local CLI · no source upload</p>
          </div>
        </header>

        <section className="mt-8 rounded-md border border-muted/25 bg-surface/75 p-5 shadow-[0_18px_70px_rgba(0,0,0,0.18)] sm:p-7" aria-labelledby="js-health-title">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent">Public GitHub scan</p>
              <h2 id="js-health-title" className="mt-2 font-mono text-2xl font-bold text-text">JavaScript Repository Health Index</h2>
              <p className="mt-2 max-w-2xl font-sans text-sm text-muted">
                We read allowlisted public repository metadata and file-path signals. No source code, tokens, browser-local notes, Hall data, or Lounge data is retained.
              </p>
            </div>
            <p className="max-w-xs font-sans text-xs leading-5 text-muted">This is not a security audit, quality certification, legal opinion, popularity ranking, or endorsement.</p>
          </div>

          <form className="mt-6 flex flex-col gap-3 sm:flex-row" onSubmit={handleSubmit}>
            <label className="sr-only" htmlFor="js-repository">GitHub repository</label>
            <input
              id="js-repository"
              value={repository}
              onChange={(event) => setRepository(event.target.value)}
              placeholder="owner/repo — e.g. expressjs/express"
              className="h-12 min-w-0 flex-1 rounded-md border border-muted/45 bg-base/65 px-4 font-mono text-sm text-text outline-none placeholder:text-muted focus:border-accent"
            />
            <button
              type="submit"
              disabled={state.loading || !repository.trim()}
              className="h-12 rounded-md bg-accent px-5 font-sans text-sm font-semibold text-base transition-transform duration-150 ease-out active:scale-[0.97] disabled:cursor-not-allowed disabled:bg-base disabled:text-muted"
            >
              {state.loading ? "Reading public signals…" : "Inspect JS health"}
            </button>
          </form>
          {state.error ? <p className="mt-3 font-sans text-sm text-muted" role="status">{state.error}</p> : null}
        </section>

        <AnimatePresence mode="wait">
          {state.loading ? <TelemetryStream key="stream" reduceMotion={reduceMotion} /> : null}
          {state.report ? (
            <motion.div
              key={state.report.generatedAt}
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
              className="mt-7"
            >
              <HealthReport
                report={state.report}
                comparison={comparison}
                selectedCheck={selectedCheck}
                onSelectCheck={setSelectedCheck}
                onCompare={(repo) => void inspectRepository(repo, "comparison")}
                onClearComparison={() => setComparison(null)}
                reduceMotion={reduceMotion}
              />
            </motion.div>
          ) : null}
        </AnimatePresence>

        <section className="mt-8 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]" aria-labelledby="cli-title">
          <div className="rounded-md border border-muted/25 bg-surface/70 p-5 sm:p-6">
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-accent">Terminal-native companion</p>
            <h2 id="cli-title" className="mt-2 font-mono text-xl font-bold">Run the same local-first checks</h2>
            <p className="mt-2 font-sans text-sm leading-6 text-muted">The CLI reads only your selected local project directory. It does not upload source files, package manifests, environment values, or repository credentials to WelcomeScore.</p>
            <CopyCommand value="npx welcomescore" />
            <CopyCommand value="npx welcomescore --ci --threshold=80" />
            <CopyCommand value="npx welcomescore --fix --dry-run" />
          </div>
          <div className="rounded-md border border-accent/25 bg-[radial-gradient(circle_at_top_right,rgba(232,162,61,0.12),transparent_52%)] p-5 sm:p-6">
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-accent">Remediation boundary</p>
            <h2 className="mt-2 font-mono text-xl font-bold">Maintainer-reviewed templates</h2>
            <p className="mt-2 font-sans text-sm leading-6 text-muted">The CLI’s fix mode creates only missing low-risk templates. It never overwrites files, edits package.json, installs dependencies, runs scripts, commits, publishes, or changes GitHub.</p>
            <Link href="/how-it-works" className="mt-5 inline-block text-link text-sm underline underline-offset-4">Read the safety model →</Link>
          </div>
        </section>
      </div>

      <AnimatePresence>
        {selectedRemediation ? (
          <RemediationStudio remediation={selectedRemediation} onClose={() => setSelectedCheck(null)} reduceMotion={reduceMotion} />
        ) : null}
      </AnimatePresence>
    </main>
  );
}

function TelemetryStream({ reduceMotion }: { reduceMotion: boolean | null }) {
  const stages = ["resolve public repository", "inspect package metadata", "inspect tooling paths", "inspect workflows and labels"];
  return (
    <motion.section
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="mt-7 rounded-md border border-accent/20 bg-surface/65 p-5 font-mono text-sm"
      aria-live="polite"
    >
      <p className="text-accent">Public GitHub scan in progress</p>
      <div className="mt-4 space-y-2 text-muted">
        {stages.map((stage, index) => (
          <motion.p key={stage} initial={reduceMotion ? false : { opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: reduceMotion ? 0 : index * 0.08 }}>
            <span className="mr-2 text-good">›</span>{stage}
          </motion.p>
        ))}
      </div>
      <p className="mt-4 font-sans text-xs text-muted">This is a progress display for a public repository request, not access to your local terminal.</p>
    </motion.section>
  );
}

function HealthReport({ report, comparison, selectedCheck, onSelectCheck, onCompare, onClearComparison, reduceMotion }: {
  report: JsHealthReport;
  comparison: JsHealthReport | null;
  selectedCheck: JsHealthCheck | null;
  onSelectCheck: (check: JsHealthCheck | null) => void;
  onCompare: (repository: string) => void;
  onClearComparison: () => void;
  reduceMotion: boolean | null;
}) {
  return (
    <>
      <section className="grid gap-4 lg:grid-cols-[0.88fr_1.12fr]" aria-label="Health overview">
        <div className="rounded-md border border-muted/25 bg-surface/75 p-5 sm:p-6">
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-muted">Observed public project signals</p>
          <div className="mt-4 flex items-end gap-4">
            <span className={report.score >= 85 ? "font-mono text-6xl font-bold text-good" : "font-mono text-6xl font-bold text-accent"}>{report.score}</span>
            <span className="mb-2 font-mono text-2xl text-muted">/100 · {report.grade}</span>
          </div>
          <p className="mt-3 font-mono text-sm text-text">{report.subject.repository ?? report.subject.name}</p>
          <p className="mt-2 font-sans text-xs text-muted">Checked {formatTimestamp(report.generatedAt)} · cached public signals may be refreshed within five minutes.</p>
          <div className="mt-5 grid grid-cols-2 gap-2">
            {report.categories.map((category) => <CategoryChip key={category.id} category={category} />)}
          </div>
        </div>
        <div className="rounded-md border border-accent/20 bg-surface/75 p-4 sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.16em] text-accent">Category telemetry</p>
              <h2 className="mt-2 font-mono text-xl font-bold">Project-shape comparison</h2>
            </div>
            {comparison ? <button type="button" className="self-start text-link text-sm underline underline-offset-4" onClick={onClearComparison}>Clear comparison</button> : null}
          </div>
          <RadarChart primary={report.categories} comparison={comparison?.categories ?? null} reduceMotion={reduceMotion} />
          <div className="mt-3 flex flex-wrap gap-2">
            {BENCHMARKS.map((benchmark) => (
              <button
                type="button"
                key={benchmark.repo}
                onClick={() => onCompare(benchmark.repo)}
                className="rounded-md border border-muted/35 px-3 py-2 font-sans text-xs text-muted transition-colors duration-180 ease-out hover:border-accent/45 hover:text-accent"
              >
                Compare {benchmark.label}
              </button>
            ))}
          </div>
          <p className="mt-3 font-sans text-xs text-muted">Comparison is an explicit separate public read, not a “top package” ranking or fixed benchmark.</p>
        </div>
      </section>

      <section className="mt-7 rounded-md border border-muted/25 bg-surface/75 p-5 sm:p-6" aria-labelledby="diagnostics-title">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-accent">Inspectable evidence</p>
            <h2 id="diagnostics-title" className="mt-2 font-mono text-xl font-bold">Maintainer diagnostics</h2>
          </div>
          <p className="font-sans text-xs text-muted">Select an incomplete check to open a review-only template.</p>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {report.checks.map((check) => (
            <button
              key={check.id}
              type="button"
              disabled={!check.remediationId}
              onClick={() => onSelectCheck(check)}
              className={`rounded-md border p-4 text-left transition-colors duration-180 ease-out ${selectedCheck?.id === check.id ? "border-accent/65 bg-accent/5" : "border-muted/25 bg-base/30"} ${check.remediationId ? "hover:border-accent/45" : "cursor-default"}`}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="font-mono text-sm text-text">{check.label}</span>
                <StatusPill status={check.status} />
              </div>
              <p className="mt-2 font-sans text-sm leading-5 text-muted">{check.evidence}</p>
              <p className="mt-3 font-mono text-xs text-muted">{check.points}/{check.maxPoints} points{check.remediationId ? " · open template" : ""}</p>
            </button>
          ))}
        </div>
      </section>
    </>
  );
}

function RadarChart({ primary, comparison, reduceMotion }: { primary: JsHealthCategory[]; comparison: JsHealthCategory[] | null; reduceMotion: boolean | null }) {
  const labels = primary.map((category) => category.label);
  const primaryPoints = polygonPoints(primary);
  const comparisonPoints = comparison ? polygonPoints(comparison) : null;
  const rings = [0.25, 0.5, 0.75, 1];
  return (
    <div className="mt-3 overflow-x-auto" role="img" aria-label={`Radar chart showing ${primary.map((item) => `${item.label} ${item.score} of ${item.maxScore}`).join(", ")}${comparison ? ", with an explicit comparison" : ""}`}>
      <svg viewBox="0 0 260 250" className="mx-auto h-[235px] min-w-[260px] max-w-full" aria-hidden="true">
        {rings.map((ring) => <polygon key={ring} points={axisPoints(ring)} fill="none" stroke="rgba(139,143,158,0.22)" strokeWidth="1" />)}
        {labels.map((label, index) => {
          const point = polarPoint(index, 1.13);
          return <g key={label}><line x1="130" y1="120" x2={polarPoint(index, 1).x} y2={polarPoint(index, 1).y} stroke="rgba(139,143,158,0.25)" /><text x={point.x} y={point.y} fill="#8B8F9E" fontSize="8" textAnchor="middle">{label.split(" ")[0]}</text></g>;
        })}
        {comparisonPoints ? <motion.polygon points={comparisonPoints} fill="rgba(139,143,158,0.09)" stroke="#8B8F9E" strokeWidth="1.5" initial={reduceMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} /> : null}
        <motion.polygon points={primaryPoints} fill="rgba(232,162,61,0.16)" stroke="#E8A23D" strokeWidth="2" initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.22 }} style={{ transformOrigin: "130px 120px" }} />
        {primary.map((category, index) => { const point = polarPoint(index, category.score / category.maxScore); return <circle key={category.id} cx={point.x} cy={point.y} r="3" fill="#E8A23D" />; })}
      </svg>
      <div className="flex justify-center gap-4 font-mono text-xs text-muted"><span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-accent" />Selected repo</span>{comparison ? <span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-muted" />Explicit comparison</span> : null}</div>
    </div>
  );
}

function axisPoints(multiplier: number) {
  return [0, 1, 2, 3].map((index) => polarPoint(index, multiplier)).map((point) => `${point.x},${point.y}`).join(" ");
}

function polygonPoints(categories: JsHealthCategory[]) {
  return categories.map((category, index) => polarPoint(index, category.score / category.maxScore)).map((point) => `${point.x},${point.y}`).join(" ");
}

function polarPoint(index: number, ratio: number) {
  const angle = (-90 + index * 90) * (Math.PI / 180);
  const radius = 78 * ratio;
  return { x: 130 + Math.cos(angle) * radius, y: 120 + Math.sin(angle) * radius };
}

function CategoryChip({ category }: { category: JsHealthCategory }) {
  return <div className="rounded-md border border-muted/20 bg-base/40 px-3 py-2"><p className="font-mono text-xs text-muted">{category.label}</p><p className="mt-1 font-mono text-lg text-text">{category.score}<span className="text-sm text-muted">/{category.maxScore}</span></p></div>;
}

function StatusPill({ status }: { status: JsHealthCheck["status"] }) {
  const label = status === "not-applicable" ? "N/A" : status;
  const className = status === "pass" ? "border-good/40 bg-good/10 text-good" : status === "partial" ? "border-accent/35 bg-accent/10 text-accent" : "border-muted/35 bg-transparent text-muted";
  return <span className={`shrink-0 rounded-md border px-2 py-1 font-mono text-[10px] uppercase tracking-wide ${className}`}>{label}</span>;
}

function RemediationStudio({ remediation, onClose, reduceMotion }: { remediation: ReturnType<typeof getJsHealthRemediation>; onClose: () => void; reduceMotion: boolean | null }) {
  const [copied, setCopied] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    closeButtonRef.current?.focus();
    const dismissOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", dismissOnEscape);
    return () => window.removeEventListener("keydown", dismissOnEscape);
  }, [onClose]);
  async function copySuggestion() {
    try {
      await navigator.clipboard.writeText(remediation.content);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1_500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <motion.div className="fixed inset-0 z-50 flex items-end justify-center bg-base/80 p-4 sm:items-center" initial={reduceMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="presentation" onMouseDown={onClose}>
      <motion.section className="max-h-[88vh] w-full max-w-3xl overflow-auto rounded-md border border-accent/35 bg-surface p-5 shadow-2xl sm:p-6" initial={reduceMotion ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }} transition={{ duration: 0.2 }} role="dialog" aria-modal="true" aria-labelledby="remediation-title" onMouseDown={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-4"><div><p className="font-mono text-xs uppercase tracking-[0.16em] text-accent">Remediation Studio · review-only</p><h2 id="remediation-title" className="mt-2 font-mono text-xl font-bold">{remediation.title}</h2></div><button ref={closeButtonRef} type="button" onClick={onClose} className="rounded-md border border-muted/35 px-3 py-2 font-sans text-sm text-muted hover:border-accent/45 hover:text-accent">Close</button></div>
        <p className="mt-3 font-sans text-sm leading-6 text-muted">{remediation.summary}</p>
        <p className="mt-3 font-mono text-xs text-muted">Suggested target: {remediation.targetPath} · {remediation.writeMode === "manual-merge" ? "manual merge required" : "create only if absent"}</p>
        <pre className="mt-5 overflow-x-auto rounded-md border border-muted/25 bg-base/70 p-4 font-mono text-xs leading-6 text-text"><code>{formatDiffPreview(remediation.targetPath, remediation.content)}</code></pre>
        <div className="mt-5 flex flex-wrap items-center gap-3"><button type="button" onClick={() => void copySuggestion()} className="rounded-md border border-accent/45 bg-accent/10 px-4 py-2 font-sans text-sm font-semibold text-accent transition-transform duration-150 ease-out active:scale-[0.97]">{copied ? "Copied" : "Copy template"}</button><p className="font-sans text-xs text-muted">Copying is manual. This dashboard cannot write to your repository.</p></div>
      </motion.section>
    </motion.div>
  );
}

function CopyCommand({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1_500);
    } catch {
      setCopied(false);
    }
  }
  return <div className="mt-3 flex items-center gap-2 rounded-md border border-muted/25 bg-base/60 p-2"><code className="min-w-0 flex-1 overflow-x-auto font-mono text-xs text-text">{value}</code><button type="button" onClick={() => void copy()} className="shrink-0 rounded-md px-2 py-1 font-sans text-xs text-accent hover:bg-accent/10">{copied ? "Copied" : "Copy"}</button></div>;
}

function formatDiffPreview(targetPath: string, content: string) {
  const added = content.replace(/\n$/, "").split("\n").map((line) => `+${line}`).join("\n");
  return `--- /dev/null\n+++ b/${targetPath}\n@@ maintainer-reviewed proposal @@\n${added}`;
}

function formatTimestamp(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function errorMessage(code?: string) {
  if (code === "not-found") return "That GitHub repository could not be found. Check the owner and repository name.";
  if (code === "rate-limit") return "Too many public checks are running right now. Please try again in a few minutes.";
  return "The public repository check is unavailable right now. Please try again shortly.";
}

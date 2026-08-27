"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import ActionArtifactModal from "@/app/components/ActionArtifactModal";
import { actionArtifactById } from "@/lib/actionArtifacts";
import {
  getReturnBrief,
  resolveReturnWorkspace,
  returnIntentLabel,
  workStateLabel,
  buildAuditSignalSnapshot,
  type LocalReturnWorkspace,
  type PrivateWorkState,
  type ReturnIntent,
} from "@/lib/returnWithPurpose";
import { useLocalReturnWorkspace } from "@/lib/useLocalReturnWorkspace";
import { resolveNextUsefulMove } from "@/lib/nextUsefulMove";
import type { ScoreResult } from "@/lib/scoreRepo";

type ContributorWorkspaceProps = {
  repo: string;
  initialWorkspace?: LocalReturnWorkspace | null;
  freshResult?: ScoreResult | null;
  onStartFreshAudit?: (repo: string) => void;
  onWorkspaceCleared?: () => void;
};

const RETURN_INTENTS: ReturnIntent[] = [
  "not-set",
  "after-a-meaningful-change",
  "after-a-merge",
  "when-i-have-time",
];

export default function ContributorWorkspace({
  repo,
  initialWorkspace,
  freshResult,
  onStartFreshAudit,
  onWorkspaceCleared,
}: ContributorWorkspaceProps) {
  const {
    workspace: localWorkspace,
    isLoaded,
    isStorageAvailable,
    maxNoteLength,
    saveWorkspace,
    clearWorkspace,
    prepareFreshAudit,
  } = useLocalReturnWorkspace(repo);
  const workspace = localWorkspace ?? initialWorkspace ?? null;
  const [note, setNote] = useState(workspace?.note ?? "");
  const [intent, setIntent] = useState<ReturnIntent>(workspace?.returnIntent ?? "not-set");
  const [statusMessage, setStatusMessage] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const [isArtifactOpen, setIsArtifactOpen] = useState(false);
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);
  const copyTriggerRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    setNote(workspace?.note ?? "");
    setIntent(workspace?.returnIntent ?? "not-set");
  }, [workspace?.note, workspace?.returnIntent]);

  if (!isLoaded && !initialWorkspace) {
    return <p className="font-sans text-sm text-muted">Loading your private workspace…</p>;
  }

  if (!workspace) {
    return (
      <section className="rounded-md border border-muted/25 bg-surface p-5" aria-labelledby="workspace-empty-title">
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-accent">My contributor workspace</p>
        <h1 id="workspace-empty-title" className="mt-2 font-mono text-xl font-semibold text-text">Nothing saved on this device</h1>
        <p className="mt-2 max-w-xl font-sans text-sm leading-6 text-muted">
          Save a Next Useful Move after an audit when you want a quiet place to resume real contributor work. WelcomeScore will not create a plan for you automatically.
        </p>
        <Link href="/" className="mt-4 inline-flex h-10 items-center rounded-md border border-accent/45 bg-accent/10 px-4 font-sans text-sm font-medium text-accent transition-colors duration-180 ease-out hover:bg-accent/15">
          Check a repository
        </Link>
      </section>
    );
  }

  const activeWorkspace = workspace;
  const fallbackPlan = freshResult ? resolveNextUsefulMove(freshResult) : null;
  const savedMove = workspace.savedMove ?? fallbackPlan?.primary;
  const currentPlan = fallbackPlan ?? (savedMove
    ? {
        primary: savedMove,
        applicableMoveIds: [workspace.activeMoveId],
      }
    : null);

  if (!savedMove || !currentPlan) {
    return null;
  }

  const activePlan = currentPlan;
  const view = resolveReturnWorkspace(workspace, activePlan, Boolean(freshResult));
  const artifact = savedMove.artifact ? actionArtifactById(savedMove.artifact.artifactId) : null;
  const snapshot = workspace.lastKnownAudit;

  function savePrivateState(workState: PrivateWorkState) {
    const saved = saveWorkspace({
      moveId: activeWorkspace.activeMoveId,
      workState,
      returnIntent: intent,
      note,
      lastKnownAudit: freshResult ? buildAuditSignalSnapshot(freshResult) : snapshot,
      savedMove,
    });
    setStatusMessage(saved ? `${workStateLabel(workState)} on this device.` : "Private workspace saving is unavailable in this browser.");
  }

  function handleStartFreshAudit() {
    if (!onStartFreshAudit) {
      setStatusMessage("Open this repository’s audit when you are ready for current public signals.");
      return;
    }

    if (!prepareFreshAudit()) {
      setStatusMessage("Private handoff saving is unavailable in this browser. You can still open the audit manually.");
      return;
    }

    savePrivateState("ready-for-fresh-audit");
    onStartFreshAudit(activeWorkspace.repo);
  }

  async function handleCopyBrief() {
    try {
      await navigator.clipboard.writeText(getReturnBrief(activeWorkspace, activePlan));
      setIsCopied(true);
      setStatusMessage("Private return brief copied. It does not prove work is complete.");
      window.setTimeout(() => setIsCopied(false), 1_500);
    } catch {
      setStatusMessage("Copying is unavailable in this browser. You can still use the guide and editable outline.");
    }
  }

  function handleClear() {
    if (!isConfirmingClear) {
      setIsConfirmingClear(true);
      return;
    }

    if (clearWorkspace()) {
      setStatusMessage("Private plan cleared from this device.");
      onWorkspaceCleared?.();
    } else {
      setStatusMessage("Private workspace clearing is unavailable in this browser.");
    }
    setIsConfirmingClear(false);
  }

  return (
    <section aria-labelledby="contributor-workspace-title" className="rounded-md border border-muted/25 bg-surface p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-muted/20 pb-4">
        <div>
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-accent">My contributor workspace</p>
          <h1 id="contributor-workspace-title" className="mt-1.5 break-all font-mono text-xl font-semibold text-text sm:text-2xl">{workspace.repo}</h1>
          <p className="mt-1 font-sans text-sm text-muted">Private to this browser · no reminders · no automatic checks</p>
        </div>
        <span className="rounded-md border border-muted/30 bg-base/30 px-2.5 py-1 font-mono text-xs text-muted">{workStateLabel(workspace.workState)}</span>
      </div>

      <div className="mt-5 rounded-md border border-accent/25 bg-accent/5 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">Your chosen contributor action</p>
            <h2 className="mt-1.5 font-sans text-base font-semibold text-text sm:text-lg">{savedMove.title}</h2>
          </div>
          <span className="font-mono text-xs text-muted">{savedMove.estimatedEffort}</span>
        </div>
        <p className="mt-2 font-sans text-sm leading-6 text-muted">{savedMove.summary}</p>
        <p className="mt-3 rounded-md border border-muted/20 bg-base/25 p-3 font-sans text-xs leading-5 text-muted">
          <span className="font-semibold text-accent">Keep it honest:</span> {savedMove.guardrail}
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Link href={savedMove.guide.href} className="inline-flex h-10 items-center justify-center rounded-md border border-accent/45 bg-accent/10 px-4 font-sans text-sm font-medium text-accent transition-colors duration-180 ease-out hover:bg-accent/15">
            {savedMove.guide.label}
          </Link>
          {artifact ? (
            <button type="button" onClick={() => setIsArtifactOpen(true)} className="h-10 rounded-md border border-muted/35 bg-base/30 px-4 font-sans text-sm font-medium text-muted transition-colors duration-180 ease-out hover:border-accent/45 hover:text-accent">
              {savedMove.artifact?.label}
            </button>
          ) : null}
          <button ref={copyTriggerRef} type="button" onClick={() => void handleCopyBrief()} className="h-10 rounded-md border border-muted/35 bg-base/30 px-4 font-sans text-sm font-medium text-muted transition-colors duration-180 ease-out hover:border-accent/45 hover:text-accent">
            {isCopied ? "Copied!" : "Copy private return brief"}
          </button>
        </div>
      </div>

      <div className="mt-5 rounded-md border border-muted/25 bg-base/25 p-4" aria-labelledby="evidence-ledger-title">
        <p id="evidence-ledger-title" className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Evidence ledger</p>
        <p className={`mt-1.5 font-sans text-sm leading-6 ${view.evidenceState === "saved-action-no-longer-observed" || view.evidenceState === "all-current-signals-visible" ? "text-good" : "text-muted"}`} role="status" aria-atomic="true">
          {view.evidenceSummary}
        </p>
        {snapshot ? (
          <dl className="mt-3 grid gap-2 border-t border-muted/20 pt-3 font-sans text-sm sm:grid-cols-2">
            <div><dt className="text-muted">Last public snapshot</dt><dd className="mt-0.5 font-mono text-text">{snapshot.score}/100 · {snapshot.grade}</dd></div>
            <div><dt className="text-muted">Saved action</dt><dd className="mt-0.5 text-text">{savedMove.title}</dd></div>
          </dl>
        ) : null}
        <p className="mt-3 font-sans text-xs leading-5 text-muted">A fresh audit uses current public GitHub signals. It does not change GitHub or prove work is complete.</p>
        <button type="button" onClick={handleStartFreshAudit} className="mt-3 h-10 rounded-md border border-accent/45 bg-accent/10 px-4 font-sans text-sm font-medium text-accent transition-colors duration-180 ease-out hover:bg-accent/15">
          Start a fresh audit
        </button>
      </div>

      <div className="mt-5 border-t border-muted/20 pt-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label htmlFor="return-intent" className="font-sans text-sm font-medium text-text">Your return timing</label>
          <p className="font-sans text-xs text-muted">Optional and private to this browser</p>
        </div>
        <select id="return-intent" value={intent} onChange={(event) => setIntent(event.target.value as ReturnIntent)} className="mt-2 h-10 w-full rounded-md border border-muted/35 bg-base/30 px-3 font-sans text-sm text-text outline-none focus:border-accent sm:max-w-md">
          {RETURN_INTENTS.map((option) => <option key={option} value={option}>{returnIntentLabel(option)}</option>)}
        </select>

        <div className="mt-4 flex items-center justify-between gap-3">
          <label htmlFor="return-workspace-note" className="font-sans text-sm font-medium text-text">Private note</label>
          <span className="font-mono text-[11px] text-muted">{note.length}/{maxNoteLength}</span>
        </div>
        <textarea id="return-workspace-note" value={note} onChange={(event) => setNote(event.target.value.slice(0, maxNoteLength))} rows={3} placeholder="For example: verify the acceptance criteria and close stale work first." className="mt-2 w-full resize-y rounded-md border border-muted/35 bg-base/30 px-3 py-2 font-sans text-sm leading-5 text-text outline-none placeholder:text-muted focus:border-accent" />
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <button type="button" onClick={() => savePrivateState("planned")} className="h-10 rounded-md border border-muted/35 bg-base/30 px-4 font-sans text-sm font-medium text-muted transition-colors duration-180 ease-out hover:border-accent/45 hover:text-accent">Save private note</button>
          <button type="button" onClick={() => savePrivateState("in-progress")} className="h-10 rounded-md border border-muted/35 bg-base/30 px-4 font-sans text-sm font-medium text-muted transition-colors duration-180 ease-out hover:border-accent/45 hover:text-accent">I&apos;m working on it</button>
          <button type="button" onClick={() => savePrivateState("ready-for-fresh-audit")} className="h-10 rounded-md border border-muted/35 bg-base/30 px-4 font-sans text-sm font-medium text-muted transition-colors duration-180 ease-out hover:border-accent/45 hover:text-accent">Ready for a fresh audit</button>
        </div>
      </div>

      <div className="mt-5 border-t border-muted/20 pt-4">
        <button type="button" onClick={handleClear} className="font-sans text-xs text-link underline underline-offset-4">
          {isConfirmingClear ? "Confirm: clear this private plan" : "Clear this private plan"}
        </button>
      </div>

      {!isStorageAvailable ? <p className="mt-3 font-sans text-xs leading-5 text-muted" role="status">Private workspace saving is unavailable in this browser. Guides and editable outlines still work.</p> : null}
      {statusMessage ? <p className="mt-3 font-sans text-xs leading-5 text-muted" role="status" aria-atomic="true">{statusMessage}</p> : null}

      {isArtifactOpen && artifact ? <ActionArtifactModal artifact={artifact} onClose={() => { setIsArtifactOpen(false); window.setTimeout(() => copyTriggerRef.current?.focus(), 0); }} /> : null}
    </section>
  );
}


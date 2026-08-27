"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  actionArtifactById,
  type ActionArtifact,
} from "@/lib/actionArtifacts";
import {
  resolveNextUsefulMove,
  type ActionArtifactId,
  type MoveDefinition,
} from "@/lib/nextUsefulMove";
import type { ScoreResult } from "@/lib/scoreRepo";
import {
  buildAuditSignalSnapshot,
  type PrivateWorkState,
} from "@/lib/returnWithPurpose";
import { useLocalReturnWorkspace } from "@/lib/useLocalReturnWorkspace";
import { getAlgofoxMessage } from "@/app/components/pet/algofoxMessages";
import { useAlgofoxPet } from "@/app/components/pet/AlgofoxPetProvider";

type NextUsefulMoveCardProps = {
  result: ScoreResult;
  onRequestRefresh?: () => void;
};

const localStatusCopy: Record<PrivateWorkState, string> = {
  planned: "Saved as your next action on this device.",
  "in-progress": "Marked in progress on this device.",
  "ready-for-fresh-audit": "Saved on this device. Start a fresh audit whenever you choose.",
};

export default function NextUsefulMoveCard({
  result,
  onRequestRefresh,
}: NextUsefulMoveCardProps) {
  const plan = useMemo(() => resolveNextUsefulMove(result), [result]);
  const {
    workspace,
    isLoaded,
    isStorageAvailable,
    maxNoteLength,
    saveWorkspace,
    clearWorkspace,
  } = useLocalReturnWorkspace(result.repo);
  const [isSecondaryOpen, setIsSecondaryOpen] = useState(false);
  const [selectedArtifactId, setSelectedArtifactId] = useState<ActionArtifactId | null>(null);
  const [note, setNote] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [statusTone, setStatusTone] = useState<"good" | "muted">("good");
  const artifactTriggerRef = useRef<HTMLButtonElement | null>(null);
  const lastFocusedElement = useRef<HTMLElement | null>(null);
  const { setAlgofoxState } = useAlgofoxPet();

  const activeReflection = workspace?.activeMoveId === plan.primary.id ? workspace : null;
  const previousMoveIsNowVerified = Boolean(
    workspace && !plan.applicableMoveIds.includes(workspace.activeMoveId),
  );

  useEffect(() => {
    setNote(activeReflection?.note ?? "");
  }, [activeReflection?.note, result.repo]);

  useEffect(() => {
    setIsSecondaryOpen(false);
    setSelectedArtifactId(null);
    setStatusMessage("");
    setStatusTone("good");
  }, [result.repo]);

  function setLocalStatus(status: PrivateWorkState) {
    const saved = saveWorkspace({
      moveId: plan.primary.id,
      workState: status,
      note,
      lastKnownAudit: buildAuditSignalSnapshot(result, plan),
      savedMove: plan.primary,
    });

    if (!saved) {
      setStatusTone("muted");
      setStatusMessage("Private action saving is unavailable in this browser. Guides and outlines still work.");
      return false;
    }

    setStatusTone("good");
    setStatusMessage(localStatusCopy[status]);
    return true;
  }

  function handlePlanAction() {
    if (setLocalStatus("planned")) {
      setAlgofoxState("review", getAlgofoxMessage("nextMovePlanned"), 4_500);
    }
  }

  function handleWorkAction() {
    if (setLocalStatus("in-progress")) {
      setAlgofoxState("review", getAlgofoxMessage("nextMoveWorking"), 4_500);
    }
  }

  function handleRecheck() {
    if (!onRequestRefresh) {
      setStatusTone("muted");
      setStatusMessage("Use the repository Check button when you are ready for a fresh audit.");
      return;
    }

    setLocalStatus("ready-for-fresh-audit");
    setAlgofoxState("running", getAlgofoxMessage("nextMoveRecheck"));
    onRequestRefresh();
  }

  function handleSaveNote() {
    const status = activeReflection?.workState ?? "planned";
    setLocalStatus(status);
  }

  function handleClearReflection() {
    if (clearWorkspace()) {
      setNote("");
      setStatusTone("good");
      setStatusMessage("Private plan cleared from this device.");
    } else {
      setStatusTone("muted");
      setStatusMessage("Private action saving is unavailable in this browser.");
    }
  }

  function handleOpenArtifact(artifactId: ActionArtifactId, trigger?: HTMLButtonElement | null) {
    lastFocusedElement.current = trigger ?? (document.activeElement as HTMLElement | null);
    setSelectedArtifactId(artifactId);
  }

  function handleCloseArtifact() {
    setSelectedArtifactId(null);
    window.setTimeout(() => lastFocusedElement.current?.focus(), 0);
  }

  return (
    <section
      className="mt-7 border-t border-muted/20 pt-6"
      aria-labelledby="next-useful-move-title"
    >
      <div className="rounded-md border border-accent/25 bg-accent/5 p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-accent">
              Next useful move
            </p>
            <h2 id="next-useful-move-title" className="mt-1.5 font-sans text-base font-semibold text-text sm:text-lg">
              {plan.primary.title}
            </h2>
          </div>
          <div className="rounded-md border border-muted/30 bg-base/30 px-2.5 py-1 font-mono text-xs text-muted">
            {plan.primary.estimatedEffort}
          </div>
        </div>

        <p className="mt-2 max-w-2xl font-sans text-sm leading-6 text-muted">{plan.primary.summary}</p>

        <dl className="mt-4 grid gap-3 border-y border-muted/20 py-4 sm:grid-cols-2">
          <div>
            <dt className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
              Observed in this audit
            </dt>
            <dd className="mt-1 font-sans text-sm leading-5 text-text">
              {plan.primary.evidence.map((evidence) => (
                <span key={evidence.label} className="block">
                  <span className="font-medium">{evidence.label}</span>
                  <span className="text-muted"> · {evidence.observed}</span>
                </span>
              ))}
            </dd>
          </div>
          <div>
            <dt className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
              Why this helps
            </dt>
            <dd className="mt-1 font-sans text-sm leading-5 text-muted">{plan.primary.whyItMatters}</dd>
          </div>
        </dl>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Link
            href={plan.primary.guide.href}
            className="inline-flex h-10 items-center justify-center rounded-md border border-accent/45 bg-accent/10 px-4 font-sans text-sm font-medium text-accent transition-colors duration-180 ease-out hover:bg-accent/15"
          >
            {plan.primary.guide.label}
          </Link>
          {plan.primary.artifact ? (
            <button
              ref={artifactTriggerRef}
              type="button"
              onClick={(event) => handleOpenArtifact(plan.primary.artifact!.artifactId, event.currentTarget)}
              className="h-10 rounded-md border border-muted/35 bg-base/30 px-4 font-sans text-sm font-medium text-muted transition-colors duration-180 ease-out hover:border-accent/45 hover:text-accent"
            >
              {plan.primary.artifact.label}
            </button>
          ) : null}
          {plan.primary.externalAction ? (
            <a
              href={plan.primary.externalAction.href}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 items-center justify-center rounded-md px-2 font-sans text-sm text-link underline underline-offset-4"
            >
              {plan.primary.externalAction.label}
            </a>
          ) : null}
        </div>

        <div className="mt-4 rounded-md border border-muted/25 bg-surface/60 p-3">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Done looks like</p>
          <p className="mt-1 font-sans text-sm leading-5 text-text">{plan.primary.completionDefinition}</p>
          <p className="mt-3 font-sans text-xs leading-5 text-muted">
            <span className="font-semibold text-accent">Keep it honest:</span> {plan.primary.guardrail}
          </p>
        </div>

        {previousMoveIsNowVerified && workspace ? (
          <div className="mt-4 rounded-md border border-good/35 bg-good/10 p-3" role="status" aria-atomic="true">
            <p className="font-sans text-sm leading-5 text-good">
              The latest audit no longer shows the action you saved on this device. Review the current evidence before treating the change as complete.
            </p>
            <button
              type="button"
              onClick={handleClearReflection}
              className="mt-2 font-sans text-xs text-link underline underline-offset-4"
            >
              Clear local note
            </button>
          </div>
        ) : null}

        {isLoaded && isStorageAvailable && !previousMoveIsNowVerified ? (
          <div className="mt-4 border-t border-muted/20 pt-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              {!activeReflection ? (
                <button
                  type="button"
                  onClick={handlePlanAction}
                  className="h-10 rounded-md border border-muted/35 bg-base/30 px-4 font-sans text-sm font-medium text-muted transition-colors duration-180 ease-out hover:border-accent/45 hover:text-accent"
                >
                  Mark as my next action
                </button>
              ) : null}
              {activeReflection?.workState === "planned" ? (
                <button
                  type="button"
                  onClick={handleWorkAction}
                  className="h-10 rounded-md border border-muted/35 bg-base/30 px-4 font-sans text-sm font-medium text-muted transition-colors duration-180 ease-out hover:border-accent/45 hover:text-accent"
                >
                  I&apos;m working on it
                </button>
              ) : null}
              {activeReflection?.workState === "in-progress" || activeReflection?.workState === "ready-for-fresh-audit" ? (
                <button
                  type="button"
                  onClick={handleRecheck}
                  className="h-10 rounded-md border border-accent/45 bg-accent/10 px-4 font-sans text-sm font-medium text-accent transition-colors duration-180 ease-out hover:bg-accent/15"
                >
                  {activeReflection.workState === "ready-for-fresh-audit"
                    ? "Re-check latest public signals"
                    : "I made a change — Re-check"}
                </button>
              ) : null}
            </div>

            {workspace ? (
              <Link href={`/return?repo=${encodeURIComponent(result.repo)}`} className="mt-3 inline-block font-sans text-xs text-link underline underline-offset-4">
                Open my contributor workspace
              </Link>
            ) : null}

            {activeReflection ? (
              <div className="mt-3">
                <div className="flex items-center justify-between gap-3">
                  <label htmlFor="next-useful-move-note" className="font-sans text-xs text-muted">
                    Optional private note — saved only in this browser
                  </label>
                  <span className="font-mono text-[11px] text-muted">
                    {note.length}/{maxNoteLength}
                  </span>
                </div>
                <textarea
                  id="next-useful-move-note"
                  value={note}
                  onChange={(event) => setNote(event.target.value.slice(0, maxNoteLength))}
                  maxLength={maxNoteLength}
                  rows={2}
                  placeholder="For example: verify the clean setup path before publishing."
                  className="mt-1.5 w-full resize-y rounded-md border border-muted/35 bg-base/30 px-3 py-2 font-sans text-sm leading-5 text-text outline-none placeholder:text-muted focus:border-accent"
                />
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
                  <button
                    type="button"
                    onClick={handleSaveNote}
                    className="font-sans text-xs text-link underline underline-offset-4"
                  >
                    Save private note
                  </button>
                  <button
                    type="button"
                    onClick={handleClearReflection}
                    className="font-sans text-xs text-link underline underline-offset-4"
                  >
                    Clear local plan
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {isLoaded && !isStorageAvailable ? (
          <p className="mt-4 border-t border-muted/20 pt-4 font-sans text-xs leading-5 text-muted" role="status">
            Private action saving is unavailable in this browser. Guides and editable outlines still work.
          </p>
        ) : null}

        {statusMessage ? (
          <p
            className={`mt-3 font-sans text-xs leading-5 ${statusTone === "good" ? "text-good" : "text-muted"}`}
            role="status"
            aria-atomic="true"
          >
            {statusMessage}
          </p>
        ) : null}

        {plan.secondary.length > 0 ? (
          <div className="mt-4 border-t border-muted/20 pt-4">
            <button
              type="button"
              onClick={() => setIsSecondaryOpen((isOpen) => !isOpen)}
              aria-expanded={isSecondaryOpen}
              aria-controls="next-useful-move-secondary"
              className="inline-flex min-h-10 items-center font-sans text-sm font-medium text-link underline underline-offset-4"
            >
              {isSecondaryOpen ? "Hide other useful moves" : `See other useful moves (${plan.secondary.length})`} {isSecondaryOpen ? "↑" : "↓"}
            </button>
            {isSecondaryOpen ? (
              <ul id="next-useful-move-secondary" className="mt-3 space-y-2" aria-label="Other useful contributor actions">
                {plan.secondary.map((move) => (
                  <SecondaryMove
                    key={move.id}
                    move={move}
                    onOpenArtifact={(artifactId, trigger) => handleOpenArtifact(artifactId, trigger)}
                  />
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
      </div>

      {selectedArtifactId ? (
        <ActionArtifactModal
          artifact={actionArtifactById(selectedArtifactId)}
          onClose={handleCloseArtifact}
          onCopied={() => setAlgofoxState("review", getAlgofoxMessage("nextMoveCopied"), 4_500)}
        />
      ) : null}
    </section>
  );
}

function SecondaryMove({
  move,
  onOpenArtifact,
}: {
  move: MoveDefinition;
  onOpenArtifact: (artifactId: ActionArtifactId, trigger: HTMLButtonElement | null) => void;
}) {
  return (
    <li className="rounded-md border border-muted/25 bg-base/20 p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="font-sans text-sm font-semibold text-text">{move.title}</h3>
        <span className="font-mono text-[11px] text-muted">{move.estimatedEffort}</span>
      </div>
      <p className="mt-1 font-sans text-sm leading-5 text-muted">{move.summary}</p>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 font-sans text-xs">
        <Link href={move.guide.href} className="text-link underline underline-offset-4">
          {move.guide.label}
        </Link>
        {move.artifact ? (
          <button
            type="button"
            onClick={(event) => onOpenArtifact(move.artifact!.artifactId, event.currentTarget)}
            className="text-link underline underline-offset-4"
          >
            {move.artifact.label}
          </button>
        ) : null}
      </div>
    </li>
  );
}

function ActionArtifactModal({
  artifact,
  onClose,
  onCopied,
}: {
  artifact: ActionArtifact;
  onClose: () => void;
  onCopied: () => void;
}) {
  const [content, setContent] = useState(artifact.content);
  const [isCopied, setIsCopied] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    closeButtonRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(content);
      setIsCopied(true);
      onCopied();
      window.setTimeout(() => setIsCopied(false), 1_500);
    } catch {
      setIsCopied(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-base/85 px-3 py-4 sm:px-6 sm:py-8"
      onMouseDown={onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="action-artifact-modal-title"
        className="mx-auto w-full max-w-2xl rounded-lg border border-muted/25 bg-surface p-4 shadow-2xl sm:my-4 sm:p-6"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-muted/20 pb-4">
          <div>
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-accent">Editable starting point</p>
            <h2 id="action-artifact-modal-title" className="mt-1.5 font-mono text-base font-semibold text-text">
              {artifact.title}
            </h2>
            <p className="mt-1.5 max-w-xl font-sans text-sm leading-5 text-muted">{artifact.summary}</p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="text-link -mt-1 text-xl leading-none"
            aria-label="Close editable starting point"
          >
            ×
          </button>
        </div>

        <div className="mt-4 rounded-md border border-muted/25 bg-base/25 p-3">
          <p className="font-sans text-xs leading-5 text-muted">
            <span className="font-semibold text-accent">Keep it honest:</span> {artifact.guardrail}
          </p>
        </div>

        <label htmlFor="action-artifact-content" className="mt-4 block font-mono text-xs font-semibold uppercase tracking-[0.12em] text-muted">
          Edit before copying
        </label>
        <textarea
          id="action-artifact-content"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          rows={18}
          spellCheck={false}
          className="mt-2 min-h-[18rem] w-full resize-y rounded-md border border-muted/35 bg-base/40 p-4 font-mono text-xs leading-6 text-text outline-none focus:border-accent"
        />

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-muted/20 pt-4">
          <button
            type="button"
            onClick={() => void handleCopy()}
            className={`h-10 rounded-md border border-accent/45 bg-accent/10 px-4 font-sans text-sm font-medium transition-colors duration-180 ease-out hover:bg-accent/15 ${
              isCopied ? "text-good" : "text-accent"
            }`}
          >
            {isCopied ? "Copied!" : artifact.copyLabel}
          </button>
          {isCopied ? (
            <p className="font-sans text-xs text-good" role="status" aria-atomic="true">
              Editable text copied. Review it before publishing anywhere.
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}

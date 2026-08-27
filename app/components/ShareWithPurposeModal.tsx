"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ScoreResult } from "@/lib/scoreRepo";
import {
  getShareCaption,
  isAllowedShareCaption,
  SHARE_INTENT_OPTIONS,
  type ShareIntent,
  type ShareableCheckLabel,
  type VerifiedAuditReceipt,
} from "@/lib/shareTypes";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

type ReceiptError =
  | "receipt-unavailable"
  | "not-found"
  | "rate-limit"
  | "invalid-format"
  | "upstream-error";

export default function ShareWithPurposeModal({
  result,
  onClose,
}: {
  result: ScoreResult;
  onClose: () => void;
}) {
  const [step, setStep] = useState<"intent" | "evidence" | "review">("intent");
  const [intent, setIntent] = useState<ShareIntent | null>(null);
  const [selectedLabels, setSelectedLabels] = useState<ShareableCheckLabel[]>([]);
  const [receipt, setReceipt] = useState<VerifiedAuditReceipt | null>(null);
  const [caption, setCaption] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<ReceiptError | null>(null);
  const [copied, setCopied] = useState(false);
  const modalRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const copiedTimeoutRef = useRef<number | null>(null);

  const shareableChecks = useMemo(
    () =>
      result.checks.filter(
        (check): check is typeof check & { label: ShareableCheckLabel } =>
          check.passed &&
          [
            "CONTRIBUTING.md",
            "CODE_OF_CONDUCT.md",
            "README setup section",
            "LICENSE",
            "Good-first-issue labels",
            "Recently active",
          ].includes(check.label as ShareableCheckLabel),
      ),
    [result.checks],
  );

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    const focusTimer = window.setTimeout(() => closeButtonRef.current?.focus(), 0);

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab" || !modalRef.current) {
        return;
      }

      const focusable = Array.from(
        modalRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      );
      if (focusable.length === 0) {
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      if (copiedTimeoutRef.current) {
        window.clearTimeout(copiedTimeoutRef.current);
      }
      window.removeEventListener("keydown", onKeyDown);
      previousFocus?.focus();
    };
  }, [onClose]);

  function toggleLabel(label: ShareableCheckLabel) {
    setSelectedLabels((current) =>
      current.includes(label)
        ? current.filter((value) => value !== label)
        : [...current, label],
    );
  }

  async function createReceipt() {
    setIsCreating(true);
    setError(null);

    try {
      const response = await fetch("/api/share/receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repo: result.repo, selectedLabels }),
      });
      const payload = (await response.json().catch(() => null)) as
        | VerifiedAuditReceipt
        | { error?: ReceiptError }
        | null;

      if (!response.ok || !payload || !("token" in payload)) {
        setError(payload && "error" in payload && payload.error ? payload.error : "upstream-error");
        return;
      }

      setReceipt(payload);
      setCaption(
        getShareCaption({
          intent: intent ?? "request-setup-feedback",
          repo: payload.payload.repo,
          receiptUrl: payload.url,
          issuedAt: payload.payload.issuedAt,
        }),
      );
      setStep("review");
    } catch {
      setError("upstream-error");
    } finally {
      setIsCreating(false);
    }
  }

  async function copyCaption() {
    if (!receipt || !isAllowedShareCaption(caption)) {
      return;
    }

    try {
      await navigator.clipboard.writeText(caption);
      setCopied(true);
      if (copiedTimeoutRef.current) {
        window.clearTimeout(copiedTimeoutRef.current);
      }
      copiedTimeoutRef.current = window.setTimeout(() => setCopied(false), 1_500);
    } catch {
      setCopied(false);
    }
  }

  function openXComposer() {
    if (!caption || !isAllowedShareCaption(caption)) {
      return;
    }

    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(caption)}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  function openLinkedInDialog() {
    if (!receipt || !isAllowedShareCaption(caption)) {
      return;
    }

    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(receipt.url)}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  const errorMessage = error ? getErrorMessage(error) : null;
  const isCaptionAllowed = isAllowedShareCaption(caption);

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-base/85 px-3 py-4 sm:px-6 sm:py-8"
      onMouseDown={onClose}
    >
      <section
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-with-purpose-title"
        className="mx-auto w-full max-w-2xl rounded-lg border border-muted/25 bg-surface p-4 shadow-2xl sm:my-4 sm:p-5"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-muted/20 pb-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-accent">
              Share with purpose
            </p>
            <h2 id="share-with-purpose-title" className="mt-2 break-all font-mono text-lg font-bold">
              {result.repo}
            </h2>
            <p className="mt-1.5 max-w-xl font-sans text-sm leading-5 text-muted">
              Choose useful public contributor context. Nothing is posted, copied, or added anywhere for you.
            </p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            className="text-link text-xl leading-none"
            onClick={onClose}
            aria-label="Close Share With Purpose"
          >
            ×
          </button>
        </div>

        {step === "intent" ? (
          <section className="mt-5" aria-labelledby="share-intent-title">
            <h3 id="share-intent-title" className="font-sans text-sm font-semibold text-text">
              What useful context do you want to share?
            </h3>
            <fieldset className="mt-3 grid gap-2">
              <legend className="sr-only">Sharing purpose</legend>
              {SHARE_INTENT_OPTIONS.map((option) => {
                const selected = intent === option.id;
                return (
                  <label
                    key={option.id}
                    className={`cursor-pointer rounded-md border p-3 transition-colors duration-180 ease-out ${
                      selected
                        ? "border-accent/50 bg-accent/10"
                        : "border-muted/25 bg-base/25 hover:border-muted/45"
                    }`}
                  >
                    <span className="flex gap-3">
                      <input
                        type="radio"
                        name="share-intent"
                        value={option.id}
                        checked={selected}
                        onChange={() => setIntent(option.id)}
                        className="mt-1 h-4 w-4 accent-accent"
                      />
                      <span>
                        <span className={`block font-mono text-sm font-semibold ${selected ? "text-accent" : "text-text"}`}>
                          {option.title}
                        </span>
                        <span className="mt-1 block font-sans text-xs leading-4 text-muted">
                          {option.description}
                        </span>
                      </span>
                    </span>
                  </label>
                );
              })}
            </fieldset>
            <div className="mt-5 border-t border-muted/20 pt-4">
              <button
                type="button"
                disabled={!intent}
                onClick={() => setStep("evidence")}
                className="h-10 rounded-md border border-accent/45 bg-accent/10 px-4 font-sans text-sm font-medium text-accent transition-colors duration-180 ease-out hover:bg-accent/15 disabled:cursor-not-allowed disabled:border-muted/25 disabled:bg-base/25 disabled:text-muted"
              >
                Continue
              </button>
              <p className="mt-3 font-sans text-xs leading-5 text-muted">
                This choice is local to this dialog. It does not create a post, Hall entry, Lounge message, or share.
              </p>
            </div>
          </section>
        ) : null}

        {step === "evidence" ? (
          <section className="mt-5" aria-labelledby="share-evidence-title">
            <button
              type="button"
              onClick={() => setStep("intent")}
              className="text-link font-sans text-sm underline underline-offset-4"
            >
              ← Change purpose
            </button>
            <h3 id="share-evidence-title" className="mt-4 font-sans text-sm font-semibold text-text">
              Choose factual public signals to include
            </h3>
            <p className="mt-1.5 font-sans text-sm leading-5 text-muted">
              The repository, date, score, and grade remain part of the dated receipt. Optional signals below are verified again when you create it.
            </p>
            <fieldset className="mt-4 grid gap-2">
              <legend className="sr-only">Verified audit signals to include</legend>
              {shareableChecks.map((check) => {
                const checked = selectedLabels.includes(check.label);
                return (
                  <label
                    key={check.label}
                    className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors duration-180 ease-out ${
                      checked
                        ? "border-accent/50 bg-accent/10"
                        : "border-muted/25 bg-base/25 hover:border-muted/45"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleLabel(check.label)}
                      className="mt-0.5 h-4 w-4 accent-accent"
                    />
                    <span>
                      <span className="block font-mono text-sm font-semibold text-text">{check.label}</span>
                      <span className="mt-1 block font-sans text-xs leading-4 text-muted">
                        Public audit evidence only. Raw files, issue text, workspace notes, and personal data are never included.
                      </span>
                    </span>
                  </label>
                );
              })}
            </fieldset>
            <div className="mt-5 border-t border-muted/20 pt-4">
              <p className="font-sans text-xs leading-5 text-muted">
                A receipt is a 21-day dated public snapshot. It is not a quality, security, legal, or community-endorsement certification.
              </p>
              {errorMessage ? (
                <p role="alert" className="mt-3 rounded-md border border-muted/25 bg-base/25 p-3 font-sans text-sm text-muted">
                  {errorMessage}
                </p>
              ) : null}
              <button
                type="button"
                disabled={isCreating}
                onClick={() => void createReceipt()}
                className="mt-4 h-10 rounded-md border border-accent/45 bg-accent/10 px-4 font-sans text-sm font-medium text-accent transition-colors duration-180 ease-out hover:bg-accent/15 disabled:cursor-wait disabled:border-muted/25 disabled:bg-base/25 disabled:text-muted"
              >
                {isCreating ? "Creating dated receipt…" : "Create a dated audit receipt"}
              </button>
            </div>
          </section>
        ) : null}

        {step === "review" && receipt ? (
          <section className="mt-5" aria-labelledby="share-review-title">
            <button
              type="button"
              onClick={() => setStep("evidence")}
              className="text-link font-sans text-sm underline underline-offset-4"
            >
              ← Change evidence
            </button>
            <h3 id="share-review-title" className="mt-4 font-sans text-sm font-semibold text-text">
              Review before anything leaves this page
            </h3>
            <div className="mt-3 rounded-md border border-muted/25 bg-base/25 p-3">
              <p className="font-mono text-xs uppercase tracking-[0.14em] text-accent">Dated audit context</p>
              <p className="mt-2 font-mono text-sm text-text">{receipt.payload.repo}</p>
              <p className="mt-1 font-sans text-xs leading-5 text-muted">
                {receipt.payload.score}/100 · {receipt.payload.grade} · issued {formatDate(receipt.payload.issuedAt)} · expires {formatDate(receipt.payload.expiresAt)}
              </p>
            </div>
            <label className="mt-4 block" htmlFor="share-caption">
              <span className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                Editable caption
              </span>
              <textarea
                id="share-caption"
                value={caption}
                onChange={(event) => setCaption(event.target.value)}
                rows={6}
                className="mt-2 w-full resize-y rounded-md border border-muted/35 bg-base/40 p-3 font-sans text-sm leading-5 text-text outline-none transition-colors duration-180 ease-out focus:border-accent/60"
              />
            </label>
            <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-muted/20 pt-4">
              <button
                type="button"
                disabled={!isCaptionAllowed}
                onClick={() => void copyCaption()}
                className={`h-10 rounded-md border border-accent/45 bg-accent/10 px-4 font-sans text-sm font-medium transition-colors duration-180 ease-out hover:bg-accent/15 disabled:cursor-not-allowed disabled:border-muted/25 disabled:bg-base/25 disabled:text-muted ${copied ? "text-good" : "text-accent"}`}
              >
                {copied ? "Copied" : "Copy caption and receipt link"}
              </button>
              <button
                type="button"
                disabled={!isCaptionAllowed}
                onClick={openXComposer}
                className="text-link font-sans text-sm underline underline-offset-4 disabled:cursor-not-allowed disabled:no-underline disabled:opacity-50"
              >
                Open X composer ↗
              </button>
              <button
                type="button"
                disabled={!isCaptionAllowed}
                onClick={openLinkedInDialog}
                className="text-link font-sans text-sm underline underline-offset-4 disabled:cursor-not-allowed disabled:no-underline disabled:opacity-50"
              >
                Open LinkedIn share dialog ↗
              </button>
              <Link
                href={`/lounge?prepareAudit=${encodeURIComponent(receipt.payload.repo)}`}
                onClick={onClose}
                className="text-link font-sans text-sm underline underline-offset-4"
              >
                Prepare a Dev Lounge discussion
              </Link>
            </div>
            <p role="status" className="mt-3 min-h-5 font-sans text-xs leading-5 text-muted">
              {!isCaptionAllowed
                ? "WelcomeScore cannot copy or open its sharing controls for language that solicits engagement or claims certification. Revise the caption to continue."
                : copied
                  ? "Caption copied. Nothing has been posted for you."
                  : "The external actions open a composer only. They do not copy or post your caption automatically."}
            </p>
          </section>
        ) : null}
      </section>
    </div>
  );
}

function getErrorMessage(error: ReceiptError) {
  switch (error) {
    case "receipt-unavailable":
      return "Dated receipts are temporarily unavailable. You can still use the README badge and current audit link.";
    case "not-found":
      return "This public repository could not be checked. Confirm the repository path and try again.";
    case "rate-limit":
      return "Too many checks are happening right now. Try again in a few minutes.";
    case "invalid-format":
      return "This repository path is not available for a receipt.";
    default:
      return "The dated receipt could not be created right now. No share or public activity was created.";
  }
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Unavailable"
    : new Intl.DateTimeFormat("en", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      }).format(date);
}

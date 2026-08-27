"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ContributorWorkspace from "@/app/components/ContributorWorkspace";
import {
  returnIntentLabel,
  workStateLabel,
  type LocalReturnWorkspace,
} from "@/lib/returnWithPurpose";
import {
  readLocalReturnWorkspace,
  useLocalReturnWorkspaceIndex,
} from "@/lib/useLocalReturnWorkspace";

export default function ReturnWorkspaceClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedRepo = searchParams?.get("repo")?.trim().toLowerCase() ?? null;
  const { entries, isLoaded, isStorageAvailable, reload, clearAll } = useLocalReturnWorkspaceIndex();
  const [workspaces, setWorkspaces] = useState<LocalReturnWorkspace[]>([]);
  const [isConfirmingClearAll, setIsConfirmingClearAll] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    setWorkspaces(entries.map((entry) => readLocalReturnWorkspace(entry.repo)).filter((workspace): workspace is LocalReturnWorkspace => Boolean(workspace)));
  }, [entries, isLoaded]);

  const selectedWorkspace = useMemo(
    () => (selectedRepo ? workspaces.find((workspace) => workspace.repo === selectedRepo) ?? null : null),
    [selectedRepo, workspaces],
  );

  function handleClearAll() {
    if (!isConfirmingClearAll) {
      setIsConfirmingClearAll(true);
      return;
    }

    if (clearAll()) {
      setWorkspaces([]);
      setStatusMessage("All private plans were cleared from this device.");
    } else {
      setStatusMessage("Private workspace clearing is unavailable in this browser.");
    }
    setIsConfirmingClearAll(false);
  }

  function handleWorkspaceCleared() {
    reload();
    router.replace("/return");
  }

  if (selectedRepo) {
    return (
      <main className="flex min-h-screen flex-1 flex-col overflow-x-hidden bg-base px-4 py-10 text-text sm:px-6 sm:py-16">
        <div className="mx-auto w-full max-w-3xl">
          <Link href="/return" className="font-sans text-sm text-link underline underline-offset-4">← My contributor workspace</Link>
          <div className="mt-5">
            <ContributorWorkspace
              repo={selectedRepo}
              initialWorkspace={selectedWorkspace}
              onWorkspaceCleared={handleWorkspaceCleared}
              onStartFreshAudit={(repo) => router.push(`/check/${repo}`)}
            />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-1 flex-col overflow-x-hidden bg-base px-4 py-10 text-text sm:px-6 sm:py-16">
      <section className="mx-auto w-full max-w-3xl" aria-labelledby="return-workspace-title">
        <Link href="/" className="font-sans text-sm text-link underline underline-offset-4">← Check a repository</Link>
        <div className="mt-5 rounded-md border border-muted/25 bg-surface p-4 sm:p-6">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-accent">Private to this browser</p>
          <h1 id="return-workspace-title" className="mt-2 font-mono text-2xl font-semibold text-text sm:text-3xl">My contributor workspace</h1>
          <p className="mt-2 max-w-2xl font-sans text-sm leading-6 text-muted">
            Resume work you chose when it is useful. There are no reminders, automatic checks, streaks, or public activity here.
          </p>
        </div>

        {!isLoaded ? <p className="mt-6 font-sans text-sm text-muted">Loading private plans from this browser…</p> : null}
        {isLoaded && workspaces.length === 0 ? (
          <section className="mt-6 rounded-md border border-muted/25 bg-surface p-5" aria-labelledby="no-workspaces-title">
            <h2 id="no-workspaces-title" className="font-sans text-base font-semibold text-text">Nothing saved on this device</h2>
            <p className="mt-2 font-sans text-sm leading-6 text-muted">After a repository audit, save a Next Useful Move if you want a calm private place to resume it later.</p>
            <Link href="/" className="mt-4 inline-flex h-10 items-center rounded-md border border-accent/45 bg-accent/10 px-4 font-sans text-sm font-medium text-accent transition-colors duration-180 ease-out hover:bg-accent/15">Check a repository</Link>
          </section>
        ) : null}

        {workspaces.length > 0 ? (
          <ul className="mt-6 space-y-3" aria-label="Private contributor plans">
            {workspaces.map((workspace) => (
              <li key={workspace.repo} className="rounded-md border border-muted/25 bg-surface p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="break-all font-mono text-base font-semibold text-text">{workspace.repo}</h2>
                    <p className="mt-1 font-sans text-sm text-muted">{workStateLabel(workspace.workState)} · {returnIntentLabel(workspace.returnIntent)}</p>
                  </div>
                  <span className="rounded-md border border-muted/30 bg-base/30 px-2.5 py-1 font-mono text-xs text-muted">Private plan</span>
                </div>
                <p className="mt-3 font-sans text-sm leading-6 text-text">{workspace.savedMove?.title ?? "Saved contributor action"}</p>
                {workspace.lastKnownAudit ? <p className="mt-1 font-sans text-xs text-muted">Last public snapshot: {workspace.lastKnownAudit.score}/100 · {workspace.lastKnownAudit.grade}</p> : null}
                <Link href={`/return?repo=${encodeURIComponent(workspace.repo)}`} className="mt-4 inline-flex h-10 items-center rounded-md border border-muted/35 bg-base/30 px-4 font-sans text-sm font-medium text-muted transition-colors duration-180 ease-out hover:border-accent/45 hover:text-accent">Continue this plan</Link>
              </li>
            ))}
          </ul>
        ) : null}

        {workspaces.length > 0 ? <div className="mt-6 border-t border-muted/20 pt-4"><button type="button" onClick={handleClearAll} className="font-sans text-xs text-link underline underline-offset-4">{isConfirmingClearAll ? "Confirm: clear all private plans" : "Clear all plans from this device"}</button></div> : null}
        {!isStorageAvailable ? <p className="mt-4 font-sans text-xs leading-5 text-muted" role="status">Private workspace storage is unavailable in this browser. Guides and audits still work.</p> : null}
        {statusMessage ? <p className="mt-4 font-sans text-xs leading-5 text-muted" role="status">{statusMessage}</p> : null}
      </section>
    </main>
  );
}

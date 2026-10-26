"use client";

import { useEffect } from "react";
import Link from "next/link";
import BackButton from "@/app/components/BackButton";
import HeaderControls from "@/app/components/HeaderControls";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("WelcomeScore Application Error:", error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-4xl flex-col justify-center px-4 py-12 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <BackButton />
        <HeaderControls />
      </div>

      <div className="rounded-lg border border-border bg-surface p-6 shadow-sm sm:p-8">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-muted">APPLICATION NOTICE</span>
          <span className="rounded border border-red-500/20 bg-red-500/10 px-1.5 py-0.5 font-mono text-[11px] font-medium text-red-400">
            Error
          </span>
        </div>

        <h1 className="mt-2 font-mono text-xl font-bold text-text sm:text-2xl">
          Something went wrong
        </h1>

        <p className="mt-3 text-sm text-muted">
          An unexpected error occurred while loading this page. Our team and automated health
          monitors have logged this event.
        </p>

        {error.digest && (
          <p className="mt-2 font-mono text-xs text-muted/60">
            Event Digest: {error.digest}
          </p>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={() => reset()}
            className="rounded-md bg-accent px-4 py-2 font-mono text-xs font-semibold text-base transition hover:bg-accent/90"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="rounded-md border border-border bg-base px-4 py-2 font-mono text-xs text-muted transition hover:border-accent/40 hover:text-text"
          >
            Return to Homepage
          </Link>
          <Link
            href="/faq"
            className="rounded-md border border-border bg-base px-4 py-2 font-mono text-xs text-muted transition hover:border-accent/40 hover:text-text"
          >
            View FAQ & Troubleshooting
          </Link>
        </div>
      </div>
    </div>
  );
}

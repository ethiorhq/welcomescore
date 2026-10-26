"use client";

import Link from "next/link";
import BackButton from "@/app/components/BackButton";
import HeaderControls from "@/app/components/HeaderControls";

interface ReportErrorNoticeProps {
  owner: string;
  repo: string;
  errorType: "rate-limit" | "upstream-error" | "generic";
  message?: string;
}

export default function ReportErrorNotice({
  owner,
  repo,
  errorType,
  message,
}: ReportErrorNoticeProps) {
  const repoName = `${owner}/${repo}`;
  const isRateLimit = errorType === "rate-limit";

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <BackButton />
        <HeaderControls />
      </div>

      <div className="rounded-lg border border-border bg-surface p-6 shadow-sm sm:p-8">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-muted">AUDIT / ERROR</span>
          <span
            className={`rounded px-1.5 py-0.5 font-mono text-[11px] font-medium ${
              isRateLimit
                ? "border border-amber-500/20 bg-amber-500/10 text-amber-400"
                : "border border-red-500/20 bg-red-500/10 text-red-400"
            }`}
          >
            {isRateLimit ? "GitHub Rate Limit (429)" : "Upstream Unavailable (502)"}
          </span>
        </div>

        <h1 className="mt-2 font-mono text-xl font-bold text-text sm:text-2xl">
          {repoName}
        </h1>

        <p className="mt-3 text-sm text-muted">
          {isRateLimit
            ? "GitHub's public unauthenticated API rate limit (60 requests/hr) was reached on this edge server. The quota resets every few minutes."
            : message ||
              "GitHub's API was temporarily unreachable. The repository may be temporarily inaccessible or GitHub is experiencing elevated latency."}
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={() => window.location.reload()}
            className="rounded-md bg-accent px-4 py-2 font-mono text-xs font-semibold text-base transition hover:bg-accent/90"
          >
            Retry Audit
          </button>
          <Link
            href="/"
            className="rounded-md border border-border bg-base px-4 py-2 font-mono text-xs text-muted transition hover:border-accent/40 hover:text-text"
          >
            Back to Home
          </Link>
          <Link
            href={`/devops/${owner}/${repo}`}
            className="rounded-md border border-border bg-base px-4 py-2 font-mono text-xs text-muted transition hover:border-accent/40 hover:text-text"
          >
            Check DevOps Doctor →
          </Link>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";

type ReportFreshnessProps = {
  analyzedAt: string;
  onRecheck?: () => void;
  isRechecking?: boolean;
};

export default function ReportFreshness({
  analyzedAt,
  onRecheck,
  isRechecking = false,
}: ReportFreshnessProps) {
  const [relativeTime, setRelativeTime] = useState("");

  useEffect(() => {
    function computeRelative() {
      const parsed = Date.parse(analyzedAt);
      if (Number.isNaN(parsed)) {
        setRelativeTime("");
        return;
      }
      const diffMs = Date.now() - parsed;
      const diffMinutes = Math.floor(diffMs / 60000);
      if (diffMinutes < 1) {
        setRelativeTime("just now");
      } else if (diffMinutes === 1) {
        setRelativeTime("1 minute ago");
      } else if (diffMinutes < 60) {
        setRelativeTime(`${diffMinutes} minutes ago`);
      } else {
        const diffHours = Math.floor(diffMinutes / 60);
        setRelativeTime(diffHours === 1 ? "1 hour ago" : `${diffHours} hours ago`);
      }
    }

    computeRelative();
    const interval = setInterval(computeRelative, 60000);
    return () => clearInterval(interval);
  }, [analyzedAt]);

  const formattedDate = new Date(analyzedAt).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });

  return (
    <aside
      aria-label="Report freshness"
      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-muted/20 bg-surface/60 px-4 py-2.5 font-sans text-xs text-muted"
    >
      <div className="flex items-center gap-2">
        <span
          className="inline-block h-2 w-2 rounded-full bg-accent"
          aria-hidden="true"
        />
        <span>
          Analyzed <strong className="text-text font-medium">{formattedDate}</strong>
          {relativeTime ? ` (${relativeTime})` : ""}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <span className="hidden sm:inline text-muted/70">
          Point-in-time public audit · Not a continuous certification
        </span>

        {onRecheck && (
          <button
            type="button"
            onClick={onRecheck}
            disabled={isRechecking}
            className="rounded border border-muted/30 bg-surface px-2.5 py-1 font-mono text-[11px] font-medium text-text transition hover:border-accent hover:text-accent disabled:opacity-50"
          >
            {isRechecking ? "Auditing…" : "Recheck"}
          </button>
        )}
      </div>
    </aside>
  );
}

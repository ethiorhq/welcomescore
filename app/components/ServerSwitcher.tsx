"use client";

import { useEffect, useState } from "react";
import { CLOUDFLARE_PRODUCTION_URL, VERCEL_MIRROR_URL } from "@/lib/site";

export default function ServerSwitcher({ className = "" }: { className?: string }) {
  const [mounted, setMounted] = useState(false);
  const [currentHost, setCurrentHost] = useState("");
  const [currentPath, setCurrentPath] = useState("");

  useEffect(() => {
    setMounted(true);
    setCurrentHost(window.location.hostname);
    setCurrentPath(window.location.pathname + window.location.search);
  }, []);

  if (!mounted) {
    return (
      <div className={`inline-flex items-center gap-1.5 rounded-full border border-muted/20 bg-surface/50 px-2.5 py-1 text-[11px] font-mono text-muted ${className}`}>
        <span className="h-1.5 w-1.5 rounded-full bg-accent/60" />
        <span>Checking server…</span>
      </div>
    );
  }

  const isVercel = currentHost.includes("vercel.app");
  const isCloudflare = currentHost.includes("is-local.org") || currentHost.includes("pages.dev") || currentHost.includes("workers.dev");

  const activeLabel = isVercel
    ? "Vercel Node"
    : isCloudflare
    ? "Cloudflare Edge"
    : "Local Node";

  const targetUrl = isVercel
    ? `${CLOUDFLARE_PRODUCTION_URL}${currentPath}`
    : `${VERCEL_MIRROR_URL}${currentPath}`;

  const switchLabel = isVercel
    ? "Cloudflare Edge"
    : "Vercel Mirror";

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border border-muted/25 bg-surface/70 px-3 py-1 font-mono text-xs shadow-sm backdrop-blur-md transition-colors hover:border-muted/40 ${className}`}
      title={`Currently serving from ${activeLabel}. Click to switch server.`}
    >
      <span className="flex items-center gap-1.5 text-muted">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
        <span className="font-medium text-text">{activeLabel}</span>
      </span>

      <span className="text-muted/40">|</span>

      <a
        href={targetUrl}
        className="text-[11px] text-accent hover:underline hover:text-accent/90 transition-colors flex items-center gap-1"
        title={`Failover or switch to ${switchLabel}`}
      >
        <span>Switch to {switchLabel}</span>
        <span aria-hidden="true">→</span>
      </a>
    </div>
  );
}

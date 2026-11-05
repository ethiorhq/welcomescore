"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  CLOUDFLARE_PAGES_URL,
  GITHUB_PAGES_MIRROR_URL,
  MULTI_SERVER_ENDPOINTS,
  VERCEL_MIRROR_URL,
  type ServerEndpoint,
} from "@/lib/site";

export default function ServerSwitcher({ className = "" }: { className?: string }) {
  const [mounted, setMounted] = useState(false);
  const [currentHost, setCurrentHost] = useState("");
  const [currentPath, setCurrentPath] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    setCurrentHost(window.location.hostname.toLowerCase());
    setCurrentPath(window.location.pathname + window.location.search);
  }, []);

  // Close dropdown on outside click or escape key
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  if (!mounted) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 rounded-md border border-muted/30 bg-surface/90 px-2 py-0.5 font-mono text-[10px] sm:text-[11px] text-muted ${className}`}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-accent/60" />
        <span>Detecting 3 servers…</span>
      </div>
    );
  }

  const isVercel = currentHost.includes("vercel.app");
  const isCloudflare =
    currentHost.includes("is-local.org") ||
    currentHost.includes("pages.dev") ||
    currentHost.includes("workers.dev");
  const isGitHubPages = currentHost.includes("github.io");

  const activeId = isCloudflare ? "cloudflare" : isVercel ? "vercel" : isGitHubPages ? "github" : "local";

  const activeEndpoint = MULTI_SERVER_ENDPOINTS.find((s) => s.id === activeId) || {
    id: "cloudflare" as const,
    name: "Local Dev",
    shortName: "Local",
    role: "Local Development Node",
    url: "#",
    domain: currentHost || "localhost",
    badgeColor: "muted",
    dotClass: "bg-muted",
  };

  // Strip GitHub Pages prefix if present so switching between mirrors preserves real subpaths
  const normalizedPath = currentPath.replace(/^\/welcomescore/, "") || "/";
  const pathForUrl = normalizedPath === "/" ? "" : normalizedPath;

  function getTargetUrl(endpoint: ServerEndpoint) {
    if (endpoint.id === "github") {
      return `${GITHUB_PAGES_MIRROR_URL}${pathForUrl}`;
    }
    if (endpoint.id === "vercel") {
      return `${VERCEL_MIRROR_URL}${pathForUrl}`;
    }
    return `${CLOUDFLARE_PAGES_URL}${pathForUrl}`;
  }

  return (
    <div ref={containerRef} className={`relative inline-block text-left ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label={`Server mesh switcher: Currently served by ${activeEndpoint.name}. Click to switch between 3 servers.`}
        className="group relative inline-flex items-center gap-1.5 rounded-md border border-muted/30 bg-surface/90 px-2 py-0.5 sm:px-2.5 sm:py-0.5 font-mono text-[10px] sm:text-[11px] text-text/80 shadow-sm backdrop-blur-md transition-all duration-200 hover:border-accent/50 hover:bg-surface hover:text-accent focus:outline-none focus:ring-1 focus:ring-accent"
      >
        {/* Pulsing Status Dot */}
        <span className="relative flex h-1.5 w-1.5 shrink-0" aria-hidden="true">
          <span
            className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${activeEndpoint.dotClass}`}
          />
          <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${activeEndpoint.dotClass}`} />
        </span>

        {/* Active Server Text */}
        <span className="font-medium text-text/90 group-hover:text-accent transition-colors whitespace-nowrap">
          <span className="hidden sm:inline">{activeEndpoint.name}</span>
          <span className="inline sm:hidden">{activeEndpoint.shortName}</span>
        </span>

        <span className="text-muted/40" aria-hidden="true">
          ·
        </span>

        {/* 3 Servers Indicator with Chevron */}
        <span className="inline-flex items-center gap-1 font-semibold text-accent whitespace-nowrap">
          <span className="hidden sm:inline">3 Servers</span>
          <span className="inline sm:hidden">3-Srv</span>
          <svg
            className={`h-2.5 w-2.5 text-accent/80 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>

      {/* Floating 3-Server Switcher Dropdown */}
      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          className="absolute right-0 top-full z-50 mt-1.5 w-72 rounded-lg border border-muted/30 bg-[#161822]/98 p-1.5 font-mono text-xs shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-muted/20 px-2.5 py-1.5 text-[10px] uppercase tracking-wider text-muted">
            <span className="font-semibold text-text/80">Active-Active Mesh (3 Nodes)</span>
            <span className="text-accent">99.99% Uptime</span>
          </div>

          {/* Server List */}
          <div className="py-1 space-y-1">
            {MULTI_SERVER_ENDPOINTS.map((endpoint) => {
              const isActive = endpoint.id === activeId;
              const targetUrl = getTargetUrl(endpoint);

              return (
                <a
                  key={endpoint.id}
                  href={isActive ? "#" : targetUrl}
                  onClick={(e) => {
                    if (isActive) {
                      e.preventDefault();
                      setIsOpen(false);
                    }
                  }}
                  role="menuitem"
                  className={`group/item flex items-center justify-between rounded-md px-2.5 py-2 transition-colors ${
                    isActive
                      ? "bg-muted/15 border border-muted/20 text-text cursor-default"
                      : "hover:bg-surface hover:text-accent text-text/80"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2 shrink-0">
                      <span
                        className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${
                          isActive ? `animate-ping ${endpoint.dotClass}` : "hidden"
                        }`}
                      />
                      <span className={`relative inline-flex h-2 w-2 rounded-full ${endpoint.dotClass}`} />
                    </span>
                    <div className="flex flex-col text-left">
                      <span className="font-semibold text-xs leading-none">
                        {endpoint.name}
                      </span>
                      <span className="text-[10px] text-muted group-hover/item:text-text/70 transition-colors mt-0.5">
                        {endpoint.domain}
                      </span>
                    </div>
                  </div>

                  {isActive ? (
                    <span className="rounded bg-accent/20 px-1.5 py-0.5 text-[9px] font-bold uppercase text-accent">
                      Active
                    </span>
                  ) : (
                    <span className="text-[10px] text-muted group-hover/item:text-accent font-semibold flex items-center gap-0.5">
                      Switch →
                    </span>
                  )}
                </a>
              );
            })}
          </div>

          {/* Footer Note */}
          <div className="border-t border-muted/20 px-2.5 py-1.5 text-[10px] text-muted flex items-center justify-between">
            <Link
              href="/policies/multi-server"
              onClick={() => setIsOpen(false)}
              className="text-text-link hover:text-accent transition-colors"
            >
              Reliability Policy &amp; SLA →
            </Link>
            <span className="text-[9px] text-muted/60">Auto-sync</span>
          </div>
        </div>
      )}
    </div>
  );
}

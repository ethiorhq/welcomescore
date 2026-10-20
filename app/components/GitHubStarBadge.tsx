"use client";

import React, { useEffect, useState } from "react";
import {
  DEFAULT_GITHUB_REPO_NAME,
  DEFAULT_GITHUB_REPO_OWNER,
  getGitHubRepoUrl,
} from "@/lib/githubBadge";

export interface GitHubStarBadgeProps {
  repoOwner?: string;
  repoName?: string;
  floating?: boolean;
  className?: string;
}

export default function GitHubStarBadge({
  repoOwner = DEFAULT_GITHUB_REPO_OWNER,
  repoName = DEFAULT_GITHUB_REPO_NAME,
  floating = false,
  className = "",
}: GitHubStarBadgeProps) {
  const repoUrl = getGitHubRepoUrl(repoOwner, repoName);
  const [stars, setStars] = useState<number | null>(2);

  // Fetch real-time star count from GitHub API with graceful fallback
  useEffect(() => {
    let isMounted = true;
    fetch(`https://api.github.com/repos/${repoOwner}/${repoName}`, {
      headers: { Accept: "application/vnd.github.v3+json" },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted && data && typeof data.stargazers_count === "number") {
          setStars(data.stargazers_count);
        }
      })
      .catch(() => {
        // Safe offline fallback
      });

    return () => {
      isMounted = false;
    };
  }, [repoOwner, repoName]);

  const containerClasses = floating
    ? "fixed top-4 right-4 sm:top-6 sm:right-8 z-40 animate-in fade-in slide-in-from-top-2 duration-300"
    : "inline-flex items-center";

  return (
    <div className={containerClasses}>
      <a
        href={repoUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Star ${repoOwner}/${repoName} on GitHub`}
        title={`Give ${repoOwner}/${repoName} a star on GitHub`}
        className={`group relative inline-flex items-center gap-2 rounded-md border border-muted/35 bg-surface/90 px-3 py-1.5 font-mono text-xs font-medium text-text backdrop-blur-md transition-all duration-200 hover:border-accent/50 hover:bg-surface hover:text-accent shadow-[0_0_15px_rgba(232,162,61,0.08)] hover:shadow-[0_0_20px_rgba(232,162,61,0.22)] active:scale-[0.98] focus:outline-none focus:ring-1 focus:ring-accent ${className}`}
      >
        {/* Animated Glowing Accent Pulse */}
        <span className="relative flex h-2 w-2 shrink-0" aria-hidden="true">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75"></span>
          <span className="relative inline-flex h-2 w-2 rounded-full bg-accent"></span>
        </span>

        {/* WelcomeScore Amber Star Icon with hover rotate & scale */}
        <svg
          className="h-3.5 w-3.5 shrink-0 text-accent transition-transform duration-300 group-hover:rotate-12 group-hover:scale-125"
          fill="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M12 .587l3.668 7.431 8.2 1.192-5.934 5.784 1.399 8.166L12 18.896l-7.333 3.864 1.399-8.166L.133 9.21l8.2-1.192z" />
        </svg>

        {/* CTA Label in WelcomeScore font-mono */}
        <span className="font-mono text-xs font-semibold tracking-tight text-text group-hover:text-accent transition-colors">
          Star<span className="hidden xs:inline"> on GitHub</span>
        </span>

        {/* Theme-matched Star Count Badge (matching .js.org curve & colors) */}
        <span className="inline-flex items-center rounded border border-accent/30 bg-accent/10 px-1.5 py-0.5 font-mono text-[11px] font-bold text-accent transition-colors group-hover:border-accent/60 group-hover:bg-accent/20">
          {stars !== null ? stars : "★"}
        </span>
      </a>
    </div>
  );
}

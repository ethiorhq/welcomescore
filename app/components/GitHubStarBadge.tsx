"use client";

import React from "react";
import {
  DEFAULT_GITHUB_REPO_NAME,
  DEFAULT_GITHUB_REPO_OWNER,
  getGitHubRepoUrl,
  getShieldsStarBadgeUrl,
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
  const shieldsBadgeUrl = getShieldsStarBadgeUrl(repoOwner, repoName);

  const containerClasses = floating
    ? "fixed top-3 right-3 sm:top-5 sm:right-6 z-40 animate-in fade-in slide-in-from-top-2 duration-300"
    : "inline-flex items-center";

  return (
    <div className={containerClasses}>
      <a
        href={repoUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Star ${repoOwner}/${repoName} on GitHub`}
        title={`Give ${repoOwner}/${repoName} a star on GitHub`}
        className={`group relative inline-flex items-center gap-2 sm:gap-2.5 rounded-full border border-blue-500/30 bg-[#17181C]/90 px-3 py-1.5 sm:px-3.5 sm:py-1.5 text-xs font-medium text-white backdrop-blur-md transition-all duration-300 hover:border-blue-500/80 hover:bg-[#22242B] shadow-[0_0_12px_rgba(59,130,246,0.2)] hover:shadow-[0_0_20px_rgba(59,130,246,0.5)] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${className}`}
      >
        {/* Animated Glowing Pulse */}
        <span className="relative flex h-2 w-2 shrink-0" aria-hidden="true">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75"></span>
          <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500"></span>
        </span>

        {/* Gold Star Icon with hover rotate & scale */}
        <svg
          className="h-3.5 w-3.5 shrink-0 text-yellow-400 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-125"
          fill="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M12 .587l3.668 7.431 8.2 1.192-5.934 5.784 1.399 8.166L12 18.896l-7.333 3.864 1.399-8.166L.133 9.21l8.2-1.192z" />
        </svg>

        {/* Call to action label */}
        <span className="hidden xs:inline font-sans font-medium text-gray-200 transition-colors group-hover:text-white">
          Star on GitHub
        </span>
        <span className="inline xs:hidden font-sans font-medium text-gray-200 transition-colors group-hover:text-white">
          Star
        </span>

        {/* Shields.io Live Star Count Badge */}
        <span className="hidden sm:inline-flex items-center shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={shieldsBadgeUrl}
            alt="GitHub Stars"
            className="h-4 pointer-events-none"
            loading="lazy"
          />
        </span>
      </a>
    </div>
  );
}

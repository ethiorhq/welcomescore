import React from "react";
import {
  ETHIOR_FACEBOOK_URL,
  ETHIOR_GITHUB_URL,
  ETHIOR_INSTAGRAM_URL,
  ETHIOR_LINKEDIN_URL,
} from "@/lib/site";

export interface SocialLinkItem {
  id: string;
  name: string;
  url: string;
  icon: (className?: string) => React.ReactNode;
  hoverStyles: string;
}

export const ETHIOR_SOCIALS: SocialLinkItem[] = [
  {
    id: "linkedin",
    name: "LinkedIn",
    url: ETHIOR_LINKEDIN_URL,
    hoverStyles:
      "hover:border-[#0A66C2]/60 hover:bg-[#0A66C2]/15 hover:text-[#0A66C2] hover:shadow-[0_0_16px_rgba(10,102,194,0.35)]",
    icon: (className = "h-4 w-4 sm:h-4.5 sm:w-4.5") => (
      <svg
        className={className}
        fill="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451c.979 0 1.778-.773 1.778-1.729V1.73C24 .774 23.205 0 22.225 0z" />
      </svg>
    ),
  },
  {
    id: "instagram",
    name: "Instagram",
    url: ETHIOR_INSTAGRAM_URL,
    hoverStyles:
      "hover:border-[#E4405F]/60 hover:bg-[#E4405F]/15 hover:text-[#E4405F] hover:shadow-[0_0_16px_rgba(228,64,95,0.35)]",
    icon: (className = "h-4 w-4 sm:h-4.5 sm:w-4.5") => (
      <svg
        className={className}
        fill="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    ),
  },
  {
    id: "facebook",
    name: "Facebook",
    url: ETHIOR_FACEBOOK_URL,
    hoverStyles:
      "hover:border-[#1877F2]/60 hover:bg-[#1877F2]/15 hover:text-[#1877F2] hover:shadow-[0_0_16px_rgba(24,119,242,0.35)]",
    icon: (className = "h-4 w-4 sm:h-4.5 sm:w-4.5") => (
      <svg
        className={className}
        fill="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    id: "github",
    name: "GitHub",
    url: ETHIOR_GITHUB_URL,
    hoverStyles:
      "hover:border-accent/60 hover:bg-accent/15 hover:text-accent hover:shadow-[0_0_16px_rgba(232,162,61,0.35)]",
    icon: (className = "h-4 w-4 sm:h-4.5 sm:w-4.5") => (
      <svg
        className={className}
        fill="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
        />
      </svg>
    ),
  },
];

export default function EthiorSocialLinks({
  className = "",
  showLabel = true,
}: {
  className?: string;
  showLabel?: boolean;
}) {
  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-3.5 ${className}`}
      aria-label="ETHIOR social media profiles"
    >
      {showLabel && (
        <span className="font-mono text-[11px] font-bold tracking-wider text-muted/80 uppercase">
          Connect with ETHIOR:
        </span>
      )}

      <div className="flex items-center gap-2">
        {ETHIOR_SOCIALS.map(({ id, name, url, icon, hoverStyles }) => (
          <a
            key={id}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Follow ETHIOR on ${name}`}
            title={`Follow ETHIOR on ${name}`}
            className={`group relative flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg border border-muted/30 bg-[#161825] text-muted shadow-md shadow-black/40 backdrop-blur-sm transition-all duration-200 ease-out hover:-translate-y-0.5 active:scale-95 focus:outline-none focus:ring-1 focus:ring-accent ${hoverStyles}`}
          >
            {icon("h-4 w-4 sm:h-4.5 sm:w-4.5 transition-transform duration-200 ease-out group-hover:scale-110")}
          </a>
        ))}
      </div>
    </div>
  );
}

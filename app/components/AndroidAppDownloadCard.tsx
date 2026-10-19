"use client";

import React from "react";

interface AndroidAppDownloadCardProps {
  className?: string;
}

export default function AndroidAppDownloadCard({
  className = "",
}: AndroidAppDownloadCardProps) {
  const appUrl = process.env.NEXT_PUBLIC_ANDROID_APP_URL?.trim();
  const appVersion = process.env.NEXT_PUBLIC_ANDROID_APP_VERSION?.trim();

  const isAvailable = Boolean(appUrl && appUrl.startsWith("https://") && !appUrl.includes("debug"));

  return (
    <div
      className={`rounded-xl border border-white/10 bg-[#1B1E29] p-5 shadow-lg ${className}`}
      role="region"
      aria-label="WelcomeScore Android App"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#E8A23D]/10 text-[#E8A23D] border border-[#E8A23D]/20">
            {/* Android Icon */}
            <svg
              className="h-6 w-6"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-1.0002s.4482-.9993.9993-.9993c.5511 0 .9993.4477.9993.9993 0 .5516-.4482 1.0002-.9993 1.0002m-11.046 0c-.5511 0-.9993-.4486-.9993-1.0002s.4482-.9993.9993-.9993c.5511 0 .9993.4477.9993.9993 0 .5516-.4482 1.0002-.9993 1.0002m11.4045-6.02l1.9973-3.4592a.416.416 0 00-.1521-.5676.416.416 0 00-.5676.1521l-2.0223 3.503C15.5902 8.411 13.8566 8.081 12 8.081c-1.8566 0-3.5902.33-5.1378.8687L4.8399 5.4467a.4161.4161 0 00-.5676-.1521.416.416 0 00-.1521.5676l1.9973 3.4592C2.6889 11.1867.3432 14.6589 0 18.7753h24c-.3432-4.1164-2.6889-7.5886-6.1185-9.4539" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-[#F2EEE6]">
                WelcomeScore for Android
              </h3>
              {appVersion && (
                <span className="font-mono text-[10px] text-[#8B8F9E] bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
                  v{appVersion}
                </span>
              )}
            </div>
            <p className="text-xs text-[#8B8F9E] mt-0.5">
              Inspect JavaScript/TypeScript readiness and Next Useful Moves on the go.
            </p>
          </div>
        </div>

        <div className="w-full sm:w-auto shrink-0">
          {isAvailable ? (
            <a
              href={appUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg border border-[#E8A23D] bg-[#E8A23D]/20 px-4 py-2 font-mono text-xs font-semibold text-[#E8A23D] transition hover:bg-[#E8A23D]/30"
            >
              Get Android App ↗
            </a>
          ) : (
            <div className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 font-mono text-xs text-[#8B8F9E]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#E8A23D]/60 animate-pulse" />
              Android app coming soon
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import React from "react";

export default function SubscribeFooterLink() {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("open-subscriber-modal"));
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-block h-6 min-w-[44px] text-link underline underline-offset-4 cursor-pointer bg-transparent border-0 p-0 font-sans text-xs hover:text-accent transition-colors focus:outline-none focus:ring-1 focus:ring-accent/50 rounded-sm"
      title="Subscribe a new email address for updates"
      aria-label="Subscribe for updates"
    >
      Subscribe for updates
    </button>
  );
}

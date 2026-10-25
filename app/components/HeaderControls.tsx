"use client";

import GitHubStarBadge from "@/app/components/GitHubStarBadge";
import ServerSwitcher from "@/app/components/ServerSwitcher";

export interface HeaderControlsProps {
  className?: string;
}

export default function HeaderControls({ className = "" }: HeaderControlsProps) {
  return (
    <div className={`flex flex-col items-end gap-1.5 shrink-0 ${className}`}>
      <GitHubStarBadge />
      <ServerSwitcher />
    </div>
  );
}

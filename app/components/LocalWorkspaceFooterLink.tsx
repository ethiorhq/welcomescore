"use client";

import Link from "next/link";
import { useLocalReturnWorkspaceIndex } from "@/lib/useLocalReturnWorkspace";

export default function LocalWorkspaceFooterLink() {
  const { entries, isLoaded } = useLocalReturnWorkspaceIndex();

  if (!isLoaded || entries.length === 0) {
    return null;
  }

  return (
    <Link className="text-link underline underline-offset-4" href="/return">
      My contributor workspace
    </Link>
  );
}

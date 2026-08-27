import { Suspense } from "react";
import type { Metadata } from "next";
import ReturnWorkspaceClient from "@/app/return/ReturnWorkspaceClient";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...pageMetadata({
    title: "My Contributor Workspace: Private Repository Plans | WelcomeScore",
    description: "Resume private, browser-local contributor plans and request a fresh public audit only when you choose.",
    path: "/return",
    imagePath: "/opengraph-image",
    imageAlt: "WelcomeScore My Contributor Workspace",
  }),
  robots: { index: false, follow: false },
};

export default function ReturnPage() {
  return (
    <Suspense fallback={<main className="min-h-screen flex-1 bg-base px-4 py-10 text-text"><p className="mx-auto w-full max-w-3xl font-sans text-sm text-muted">Loading private workspace…</p></main>}>
      <ReturnWorkspaceClient />
    </Suspense>
  );
}

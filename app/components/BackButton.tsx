"use client";

import { useRouter } from "next/navigation";

export default function BackButton({ fallbackHref = "/" }: { fallbackHref?: string }) {
  const router = useRouter();

  function handleBack() {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push(fallbackHref);
  }

  return (
    <button
      type="button"
      onClick={handleBack}
      className="inline-flex h-10 items-center justify-center rounded-md border border-muted/35 bg-surface px-4 font-sans text-sm font-medium text-muted transition-colors duration-180 ease-out hover:border-accent/45 hover:text-accent"
    >
      ← Back
    </button>
  );
}

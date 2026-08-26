"use client";

import { useEffect, useState } from "react";
import AlgofoxSprite from "@/app/components/pet/AlgofoxSprite";
import { useAlgofoxPet } from "@/app/components/pet/AlgofoxPetProvider";

export default function AlgofoxWidget() {
  const { state, quote, isVisible, hideAlgofox, showAlgofox, setAlgofoxState } = useAlgofoxPet();
  const [isMobileBubbleOpen, setIsMobileBubbleOpen] = useState(false);

  useEffect(() => {
    if (!quote) {
      setIsMobileBubbleOpen(false);
    }
  }, [quote]);

  if (!isVisible) {
    return (
      <button
        type="button"
        onClick={showAlgofox}
        className="fixed bottom-4 right-4 z-40 rounded-md border border-accent/35 bg-surface/95 px-3 py-2 font-mono text-xs font-semibold text-accent shadow-xl backdrop-blur transition-colors duration-180 ease-out hover:bg-accent/10"
        aria-label="Show Algofox guide"
      >
        Show Algofox
      </button>
    );
  }

  return (
    <aside className="pointer-events-none fixed bottom-3 right-3 z-40 flex max-w-[min(16rem,calc(100vw-1.5rem))] flex-col items-end sm:bottom-5 sm:right-5" aria-label="Algofox guide">
      {quote ? (
        <div className={`pointer-events-auto mb-1 max-w-[15rem] rounded-md border border-accent/30 bg-surface/95 px-3 py-2 shadow-xl backdrop-blur ${
          isMobileBubbleOpen ? "block" : "hidden sm:block"
        }`}>
          <div className="flex items-start gap-2">
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-accent">Algofox</span>
            <button
              type="button"
              onClick={() => {
                setIsMobileBubbleOpen(false);
                hideAlgofox();
              }}
              className="ml-auto text-link text-sm leading-none"
              aria-label="Hide Algofox guide"
            >
              ×
            </button>
          </div>
          <p className="mt-1 font-sans text-xs leading-5 text-muted">{quote}</p>
        </div>
      ) : null}
      <button
        type="button"
        onClick={() => {
          setIsMobileBubbleOpen(true);
          setAlgofoxState("waving", "Still here. Let’s make a repository easier to join.", 4_000);
        }}
        className="pointer-events-auto rounded-md outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-base"
        aria-label="Ask Algofox for a friendly prompt"
      >
        <AlgofoxSprite state={state} size={56} className="drop-shadow-[0_10px_20px_rgba(0,0,0,0.35)] sm:[transform:scale(1.25)] sm:origin-bottom-right" />
      </button>
    </aside>
  );
}

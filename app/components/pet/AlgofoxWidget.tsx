"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import AlgofoxSprite from "@/app/components/pet/AlgofoxSprite";
import { useAlgofoxPet } from "@/app/components/pet/AlgofoxPetProvider";

const VIEWPORT_MARGIN = 12;
const DRAG_THRESHOLD = 6;
const TRAVEL_FEEDBACK_DURATION_MS = 4_500;

type WidgetPosition = {
  left: number;
  top: number;
};

type DragGesture = {
  pointerId: number;
  startX: number;
  startY: number;
  originLeft: number;
  originTop: number;
  didMove: boolean;
  direction: "left" | "right";
};

export default function AlgofoxWidget() {
  const { state, quote, isVisible, hideAlgofox, showAlgofox, setAlgofoxState } = useAlgofoxPet();
  const [isMobileBubbleOpen, setIsMobileBubbleOpen] = useState(false);
  const [position, setPosition] = useState<WidgetPosition | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const asideRef = useRef<HTMLElement>(null);
  const dragGestureRef = useRef<DragGesture | null>(null);
  const suppressClickRef = useRef(false);

  useEffect(() => {
    if (!quote) {
      setIsMobileBubbleOpen(false);
    }
  }, [quote]);

  useEffect(() => {
    const keepPositionInViewport = () => {
      setPosition((current) => {
        if (!current) {
          return current;
        }
        return constrainPosition(current.left, current.top, asideRef.current);
      });
    };

    window.addEventListener("resize", keepPositionInViewport);
    return () => window.removeEventListener("resize", keepPositionInViewport);
  }, []);

  function handlePointerDown(event: PointerEvent<HTMLButtonElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    const rect = asideRef.current?.getBoundingClientRect();
    if (!rect) {
      return;
    }

    dragGestureRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originLeft: position?.left ?? rect.left,
      originTop: position?.top ?? rect.top,
      didMove: false,
      direction: "right",
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: PointerEvent<HTMLButtonElement>) {
    const gesture = dragGestureRef.current;
    if (!gesture || gesture.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - gesture.startX;
    const deltaY = event.clientY - gesture.startY;
    const hasCrossedThreshold =
      Math.abs(deltaX) >= DRAG_THRESHOLD || Math.abs(deltaY) >= DRAG_THRESHOLD;

    if (!gesture.didMove && !hasCrossedThreshold) {
      return;
    }

    const nextDirection = deltaX < 0 ? "left" : "right";
    if (!gesture.didMove || gesture.direction !== nextDirection) {
      gesture.direction = nextDirection;
      setAlgofoxState(nextDirection === "left" ? "run-left" : "run-right");
    }

    gesture.didMove = true;
    suppressClickRef.current = true;
    setIsDragging(true);
    setPosition(
      constrainPosition(
        gesture.originLeft + deltaX,
        gesture.originTop + deltaY,
        asideRef.current,
      ),
    );
  }

  function finishDrag(event: PointerEvent<HTMLButtonElement>, cancelled = false) {
    const gesture = dragGestureRef.current;
    if (!gesture || gesture.pointerId !== event.pointerId) {
      return;
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    dragGestureRef.current = null;
    setIsDragging(false);

    if (!gesture.didMove) {
      return;
    }

    if (cancelled) {
      setAlgofoxState("idle");
    } else {
      setIsMobileBubbleOpen(true);
      setAlgofoxState(
        gesture.direction === "left" ? "run-left" : "run-right",
        "Nice route. Algofox is happy to explore your developer workspace.",
        TRAVEL_FEEDBACK_DURATION_MS,
      );
    }

    window.setTimeout(() => {
      suppressClickRef.current = false;
    }, 0);
  }

  function handlePromptClick() {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }

    setIsMobileBubbleOpen(true);
    setAlgofoxState("waving", "Still here. Let’s make a repository easier to join.", 4_000);
  }

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
    <aside
      ref={asideRef}
      className="pointer-events-none fixed bottom-3 right-3 z-40 flex w-[min(16rem,calc(100vw-1.5rem))] flex-col items-end sm:bottom-5 sm:right-5"
      style={
        position
          ? { left: position.left, top: position.top, right: "auto", bottom: "auto" }
          : undefined
      }
      aria-label="Algofox guide"
    >
      {quote ? (
        <div
          className={`pointer-events-auto mb-1 max-w-[15rem] rounded-md border border-accent/30 bg-surface/95 px-3 py-2 shadow-xl backdrop-blur ${
            isMobileBubbleOpen ? "block" : "hidden sm:block"
          }`}
        >
          <div className="flex items-start gap-2">
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-accent">
              Algofox
            </span>
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

      {position ? (
        <button
          type="button"
          onClick={() => setPosition(null)}
          className="pointer-events-auto mb-1 rounded-md border border-muted/35 bg-surface/95 px-2 py-1 font-sans text-[10px] text-muted transition-colors duration-180 ease-out hover:border-accent/45 hover:text-accent"
        >
          Reset position
        </button>
      ) : null}

      <button
        type="button"
        onClick={handlePromptClick}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishDrag}
        onPointerCancel={(event) => finishDrag(event, true)}
        onKeyDown={(event) => {
          if (event.key === "Escape" && position) {
            setPosition(null);
          }
        }}
        className={`pointer-events-auto select-none rounded-md outline-none transition-opacity focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-base ${
          isDragging ? "cursor-grabbing opacity-90" : "cursor-grab"
        }`}
        style={{ touchAction: "none" }}
        aria-label="Ask Algofox for a friendly prompt. Drag Algofox to reposition the guide."
        title="Drag Algofox to reposition"
      >
        <AlgofoxSprite
          state={state}
          size={56}
          className="drop-shadow-[0_10px_20px_rgba(0,0,0,0.35)] sm:[transform:scale(1.25)] sm:origin-bottom-right"
        />
      </button>
    </aside>
  );
}

function constrainPosition(left: number, top: number, element: HTMLElement | null): WidgetPosition {
  const rect = element?.getBoundingClientRect();
  const width = Math.max(rect?.width ?? 0, 256);
  const height = Math.max(rect?.height ?? 0, 184);
  const maxLeft = Math.max(VIEWPORT_MARGIN, window.innerWidth - width - VIEWPORT_MARGIN);
  const maxTop = Math.max(VIEWPORT_MARGIN, window.innerHeight - height - VIEWPORT_MARGIN);

  return {
    left: Math.min(Math.max(left, VIEWPORT_MARGIN), maxLeft),
    top: Math.min(Math.max(top, VIEWPORT_MARGIN), maxTop),
  };
}

"use client";

import { useEffect, useRef } from "react";
import type { AlgofoxState } from "@/app/components/pet/AlgofoxPetProvider";

const FRAME_WIDTH = 192;
const FRAME_HEIGHT = 208;
const FRAME_COUNTS: Record<AlgofoxState, number> = {
  idle: 6,
  "run-right": 8,
  "run-left": 8,
  waving: 4,
  jumping: 5,
  failed: 8,
  waiting: 6,
  running: 6,
  review: 6,
};
const ROW_BY_STATE: Record<AlgofoxState, number> = {
  idle: 0,
  "run-right": 1,
  "run-left": 2,
  waving: 3,
  jumping: 4,
  failed: 5,
  waiting: 6,
  running: 7,
  review: 8,
};

export default function AlgofoxSprite({
  state,
  size = 92,
  className = "",
}: {
  state: AlgofoxState;
  size?: number;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const renderedHeight = Math.round((FRAME_HEIGHT / FRAME_WIDTH) * size);
    canvas.width = Math.round(size * ratio);
    canvas.height = Math.round(renderedHeight * ratio);
    canvas.style.width = `${size}px`;
    canvas.style.height = `${renderedHeight}px`;
    context.imageSmoothingEnabled = false;

    const sprite = new Image();
    let frame = 0;
    let timer: number | null = null;
    let cancelled = false;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const draw = () => {
      if (cancelled) {
        return;
      }

      const row = ROW_BY_STATE[state];
      const frameCount = FRAME_COUNTS[state];
      const frameColumn = frame % frameCount;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.clearRect(0, 0, size, renderedHeight);
      context.drawImage(
        sprite,
        frameColumn * FRAME_WIDTH,
        row * FRAME_HEIGHT,
        FRAME_WIDTH,
        FRAME_HEIGHT,
        0,
        0,
        size,
        renderedHeight,
      );
    };

    sprite.onload = () => {
      draw();
      if (!prefersReducedMotion) {
        timer = window.setInterval(() => {
          frame += 1;
          draw();
        }, state === "running" || state.startsWith("run-") ? 85 : 130);
      }
    };
    sprite.src = "/pets/algofox-spritesheet.webp";

    return () => {
      cancelled = true;
      if (timer) {
        window.clearInterval(timer);
      }
      sprite.onload = null;
    };
  }, [size, state]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`block shrink-0 [image-rendering:pixelated] ${className}`}
    />
  );
}

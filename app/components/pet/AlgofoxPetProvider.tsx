"use client";

import { getAlgofoxMessage } from "@/app/components/pet/algofoxMessages";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type AlgofoxState =
  | "idle"
  | "run-right"
  | "run-left"
  | "waving"
  | "jumping"
  | "failed"
  | "waiting"
  | "running"
  | "review";

type AlgofoxPetContextValue = {
  state: AlgofoxState;
  quote: string | null;
  isVisible: boolean;
  setAlgofoxState: (state: AlgofoxState, quote?: string, durationMs?: number) => void;
  hideAlgofox: () => void;
  showAlgofox: () => void;
};

const AlgofoxPetContext = createContext<AlgofoxPetContextValue | null>(null);
const DEFAULT_BUBBLE_DURATION_MS = 4_500;

export default function AlgofoxPetProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AlgofoxState>("idle");
  const [quote, setQuote] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const resetTimerRef = useRef<number | null>(null);

  const setAlgofoxState = useCallback(
    (
      nextState: AlgofoxState,
      nextQuote?: string,
      durationMs = nextQuote ? DEFAULT_BUBBLE_DURATION_MS : 0,
    ) => {
      if (resetTimerRef.current) {
        window.clearTimeout(resetTimerRef.current);
      }

      setState(nextState);
      setQuote(nextQuote ?? null);

      if (durationMs > 0) {
        resetTimerRef.current = window.setTimeout(() => {
          setState("idle");
          setQuote(null);
          resetTimerRef.current = null;
        }, durationMs);
      }
    },
    [],
  );

  useEffect(() => {
    setAlgofoxState("idle", getAlgofoxMessage("idle"), DEFAULT_BUBBLE_DURATION_MS);
  }, [setAlgofoxState]);

  useEffect(() => {
    let inactivityTimer: number | null = null;

    const scheduleWaitingState = () => {
      if (inactivityTimer) {
        window.clearTimeout(inactivityTimer);
      }
      inactivityTimer = window.setTimeout(() => {
        setAlgofoxState(
          "waiting",
          getAlgofoxMessage("waiting"),
          DEFAULT_BUBBLE_DURATION_MS,
        );
      }, 60_000);
    };

    const markActive = () => {
      if (inactivityTimer) {
        window.clearTimeout(inactivityTimer);
      }
      scheduleWaitingState();
    };

    const events: Array<keyof WindowEventMap> = ["pointerdown", "keydown", "scroll", "touchstart"];
    events.forEach((event) => window.addEventListener(event, markActive, { passive: true }));
    scheduleWaitingState();

    return () => {
      if (inactivityTimer) {
        window.clearTimeout(inactivityTimer);
      }
      if (resetTimerRef.current) {
        window.clearTimeout(resetTimerRef.current);
      }
      events.forEach((event) => window.removeEventListener(event, markActive));
    };
  }, [setAlgofoxState]);

  const value = useMemo(
    () => ({
      state,
      quote,
      isVisible,
      setAlgofoxState,
      hideAlgofox: () => setIsVisible(false),
      showAlgofox: () => setIsVisible(true),
    }),
    [isVisible, quote, setAlgofoxState, state],
  );

  return <AlgofoxPetContext.Provider value={value}>{children}</AlgofoxPetContext.Provider>;
}

export function useAlgofoxPet() {
  const context = useContext(AlgofoxPetContext);
  if (!context) {
    throw new Error("useAlgofoxPet must be used inside AlgofoxPetProvider");
  }
  return context;
}

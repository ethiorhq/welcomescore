"use client";

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
const IDLE_QUOTE = "Algofox is ready to inspect your contributor path.";

export default function AlgofoxPetProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AlgofoxState>("idle");
  const [quote, setQuote] = useState<string | null>(IDLE_QUOTE);
  const [isVisible, setIsVisible] = useState(true);
  const resetTimerRef = useRef<number | null>(null);

  const setAlgofoxState = useCallback(
    (nextState: AlgofoxState, nextQuote?: string, durationMs = 0) => {
      if (resetTimerRef.current) {
        window.clearTimeout(resetTimerRef.current);
      }

      setState(nextState);
      setQuote(nextQuote ?? null);

      if (durationMs > 0) {
        resetTimerRef.current = window.setTimeout(() => {
          setState("idle");
          setQuote(IDLE_QUOTE);
        }, durationMs);
      }
    },
    [],
  );

  useEffect(() => {
    let inactivityTimer: number | null = null;

    const scheduleWaitingState = () => {
      if (inactivityTimer) {
        window.clearTimeout(inactivityTimer);
      }
      inactivityTimer = window.setTimeout(() => {
        setState("waiting");
        setQuote("Quiet moment detected. I’ll be here when you are ready.");
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
  }, []);

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

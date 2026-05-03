"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

export enum VisualizerMode {
  Off = 0,
  Bars = 1,
  Spiral = 2,
  Matrix = 3,
}

export const VISUALIZER_LABELS: Record<VisualizerMode, string> = {
  [VisualizerMode.Off]: "Off",
  [VisualizerMode.Bars]: "Bars",
  [VisualizerMode.Spiral]: "Spiral",
  [VisualizerMode.Matrix]: "Matrix",
};

interface VisualizerContextValue {
  mode: VisualizerMode;
  setMode: (mode: VisualizerMode) => void;
  cycleMode: () => void;
}

const VisualizerContext = createContext<VisualizerContextValue | null>(null);

const STORAGE_KEY = "visualizer_mode";

export function VisualizerProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<VisualizerMode>(VisualizerMode.Bars);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved !== null) {
        const parsed = parseInt(saved, 10);
        if (parsed in VisualizerMode) {
          setModeState(parsed as VisualizerMode);
        }
      }
    } catch {}
  }, []);

  const setMode = (newMode: VisualizerMode) => {
    setModeState(newMode);
    try {
      localStorage.setItem(STORAGE_KEY, String(newMode));
    } catch {}
  };

  const cycleMode = () => {
    const modes = Object.values(VisualizerMode).filter(
      (v) => typeof v === "number",
    ) as VisualizerMode[];
    const idx = modes.indexOf(mode);
    const next = modes[(idx + 1) % modes.length];
    setMode(next);
  };

  return (
    <VisualizerContext.Provider value={{ mode, setMode, cycleMode }}>
      {children}
    </VisualizerContext.Provider>
  );
}

export function useVisualizer() {
  const ctx = useContext(VisualizerContext);
  if (!ctx) {
    throw new Error("useVisualizer must be used inside VisualizerProvider");
  }
  return ctx;
}

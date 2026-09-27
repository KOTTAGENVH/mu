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

interface VisualizerContextValue {
  mode: VisualizerMode;
  setMode: (mode: VisualizerMode) => void;
  cycleMode: () => void;
}

export const visualizerLabels: Record<VisualizerMode, string> = {
  [VisualizerMode.Off]: "Off",
  [VisualizerMode.Bars]: "Bars",
  [VisualizerMode.Spiral]: "Spiral",
  [VisualizerMode.Matrix]: "Matrix",
};

const visualizerContext = createContext<VisualizerContextValue | null>(null);

const storageKey = "visualizer_mode";

export function VisualizerProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<VisualizerMode>(VisualizerMode.Bars);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
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
      localStorage.setItem(storageKey, String(newMode));
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
    <visualizerContext.Provider value={{ mode, setMode, cycleMode }}>
      {children}
    </visualizerContext.Provider>
  );
}

export function useVisualizer() {
  const ctx = useContext(visualizerContext);
  if (!ctx) {
    throw new Error("useVisualizer must be used inside VisualizerProvider");
  }
  return ctx;
}

"use client";
import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";

export type EqBand = "100" | "300" | "1000" | "4000" | "12000";

interface AudioEqContextType {
  eqValues: Record<EqBand, number>;
  setEqValue: (band: EqBand, value: number) => void;
  pan: number;
  setPan: (value: number) => void;
  useCompressor: boolean;
  setUseCompressor: (value: boolean) => void;
  resetEq: () => void;
}

const defaultEq = {
  "100": 0, // Sub/Bass
  "300": 0, // Low-Mid
  "1000": 0, // Mid
  "4000": 0, // High-Mid
  "12000": 0, // Treble / Air
};

const AudioEqContext = createContext<AudioEqContextType | undefined>(undefined);

export const AudioEqProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [eqValues, setEqValues] = useState<Record<EqBand, number>>(defaultEq);
  const [pan, setPan] = useState<number>(0); // -1 - left || 1 right
  const [useCompressor, setUseCompressor] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedEq = localStorage.getItem("audioEqValues");
      const storedPan = localStorage.getItem("audioPan");
      const storedCompressor = localStorage.getItem("audioUseCompressor");

      if (storedEq) setEqValues(JSON.parse(storedEq));
      if (storedPan) setPan(parseFloat(storedPan));
      if (storedCompressor) setUseCompressor(JSON.parse(storedCompressor));

      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (isLoaded && typeof window !== "undefined") {
      localStorage.setItem("audioEqValues", JSON.stringify(eqValues));
      localStorage.setItem("audioPan", pan.toString());
      localStorage.setItem("audioUseCompressor", JSON.stringify(useCompressor));
    }
  }, [eqValues, pan, useCompressor, isLoaded]);

  const setEqValue = (band: EqBand, value: number) => {
    setEqValues((prev) => ({ ...prev, [band]: value }));
  };

  const resetEq = () => {
    setEqValues(defaultEq);
    setPan(0);
    setUseCompressor(false);
  };
  return (
    <AudioEqContext.Provider
      value={{
        eqValues,
        setEqValue,
        pan,
        setPan,
        useCompressor,
        setUseCompressor,
        resetEq,
      }}
    >
      {children}
    </AudioEqContext.Provider>
  );
};

export function useAudioEq() {
  const context = useContext(AudioEqContext);
  if (!context) {
    throw new Error("useAudioEq must be used within an AudioEqProvider");
  }
  return context;
}

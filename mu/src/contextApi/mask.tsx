"use client";
import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";

interface MaskContextState {
  maskStatus: boolean;
  toggleMask: (maskStatus: boolean) => void;
}

const MaskContext = createContext<MaskContextState>({
  maskStatus: false,
  toggleMask: () => {},
});

export const MaskProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [maskStatus, setMaskStatus] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedMask = localStorage.getItem("maskStatus");
      if (storedMask) {
        setMaskStatus(JSON.parse(storedMask));
      }
    }
  }, []);

  const toggleMask = (status: boolean) => {
    setMaskStatus(status);

    localStorage.setItem("maskStatus", JSON.stringify(status));
  };

  return (
    <MaskContext.Provider value={{ maskStatus, toggleMask }}>
      {children}
    </MaskContext.Provider>
  );
};

export const useMask = () => useContext(MaskContext);

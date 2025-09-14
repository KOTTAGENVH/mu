"use client";
import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
  useRef,
  useEffect,
} from "react";

// Define the type for the current play context state
interface CurrentPlayContextType {
  id: string;
  pause: boolean;
  toggleId: (id: string, shouldPause: boolean) => void;
}
// Create the context with default values
const CurrentPlayContext = createContext<CurrentPlayContextType>({
  id: "",
  pause: true,
  toggleId: () => { },
});

// Create a provider component
export const CurrentPlayProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [id, setId] = useState("");
  const [pause, setPause] = useState(true);
  const pendingTimerRef = useRef<number | null>(null);

  // Toggle function to set the id passed
  const toggleId = useCallback((newId: string, shouldPause: boolean) => {
    // Schedule updates after the current render to avoid
    // "Cannot update a component while rendering a different component" warnings.
    if (pendingTimerRef.current !== null) {
      clearTimeout(pendingTimerRef.current);
      pendingTimerRef.current = null;
    }
    pendingTimerRef.current = window.setTimeout(() => {
      pendingTimerRef.current = null;
      setId(newId);
      setPause(shouldPause);
    }, 0);
  }, []);

  // Cleanup any pending scheduled update on unmount
  useEffect(() => {
    return () => {
      if (pendingTimerRef.current !== null) {
        clearTimeout(pendingTimerRef.current);
        pendingTimerRef.current = null;
      }
    };
  }, []);

  return (
    <CurrentPlayContext.Provider value={{ id, pause, toggleId }}>
      {children}
    </CurrentPlayContext.Provider>
  );
};

// Custom hook to use the current play context
export const useCurrentPlay = () => useContext(CurrentPlayContext);

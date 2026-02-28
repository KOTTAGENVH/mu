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

interface CurrentPlayContextType {
  id: string;
  pause: boolean;
  toggleId: (id: string, shouldPause: boolean) => void;
}

const CurrentPlayContext = createContext<CurrentPlayContextType>({
  id: "",
  pause: true,
  toggleId: () => { },
});


export const CurrentPlayProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [id, setId] = useState("");
  const [pause, setPause] = useState(true);
  const pendingTimerRef = useRef<number | null>(null);


  const toggleId = useCallback((newId: string, shouldPause: boolean) => {
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

export const useCurrentPlay = () => useContext(CurrentPlayContext);

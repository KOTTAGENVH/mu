"use client";
import React, { createContext, useContext, useState, ReactNode } from "react";

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

  // Toggle function to set the id passed
  const toggleId = (newId: string, shouldPause: boolean) => {
    setId((prev) => (prev === newId ? prev : newId));
    setPause(shouldPause);
  };

  return (
    <CurrentPlayContext.Provider value={{ id, pause, toggleId }}>
      {children}
    </CurrentPlayContext.Provider>
  );
};

// Custom hook to use the current play context
export const useCurrentPlay = () => useContext(CurrentPlayContext);

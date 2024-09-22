"use client";
import React, { createContext, useContext, useState, ReactNode } from "react";

// Define the type for the theme context state
interface PlayContextState {
  id: string;
  togglePlay: (newId: string) => void;
}
// Create the context with default values
const PlayContext = createContext<PlayContextState>({
  id: "",
  togglePlay: () => {},
});

// Create a provider component
export const PlayContextProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [id, setId] = useState("");

  // Toggle function to set the id passed
  const togglePlay = (newId: string) => {
    setId(newId);
  };

  return (
    <PlayContext.Provider value={{ id, togglePlay }}>
      {children}
    </PlayContext.Provider>
  );
};

// Custom hook to use the theme context
export const useToPlay = () => useContext(PlayContext);

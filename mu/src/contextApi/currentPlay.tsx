"use client";
import React, { createContext, useContext, useState, ReactNode } from "react";

// Define the type for the theme context state
interface CurrentPlayContextType {
  id: string;
  toggleId: (id: string) => void;
}
// Create the context with default values
const CurrentPlayContext = createContext<CurrentPlayContextType>({
  id: "",
  toggleId: () => {},
});

// Create a provider component
export const CurrentPlayProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [id, setId] = useState("");

  // Toggle function to set the id passed
  const toggleId = (newId: string) => {
    setId(newId);
  };

  return (
    <CurrentPlayContext.Provider value={{ id, toggleId }}>
      {children}
    </CurrentPlayContext.Provider>
  );
};

// Custom hook to use the theme context
export const useCurrentPlay = () => useContext(CurrentPlayContext);

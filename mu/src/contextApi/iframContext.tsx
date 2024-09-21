"use client";
import React, { createContext, useContext, useState, ReactNode } from "react";

// Define the type for the theme context state
interface ThemeContextState {
  scene: number;
  toggleScene: () => void;
}

// Create the context with default values
const ThemeContext = createContext<ThemeContextState>({
  scene: 0,
  toggleScene: () => {},
});

// Create a provider component
export const ThemeProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [scene, setScene] = useState(0);

  // Toggle function to switch scenes
  const toggleScene = () => {
    setScene((prevScene) => (prevScene >= 8 ? 0 : prevScene + 1));
  };
  

  return (
    <ThemeContext.Provider value={{ scene, toggleScene }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use the theme context
export const useTheme = () => useContext(ThemeContext);

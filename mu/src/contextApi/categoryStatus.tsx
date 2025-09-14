"use client";
import React, { createContext, useContext, useState, ReactNode } from "react";

// Category status context state
interface CategoryStatusContextType {
  category: string;
  toggleCategory: (category: string) => void;
}
// Create the context with default values
const CategoryStatusContext = createContext<CategoryStatusContextType>({
  category: "",
  toggleCategory: () => {},
});

// Create a provider component
export const CategoryStatusProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [category, setCategory] = useState("");

  // Toggle function to set the category passed
  const toggleCategory = (category: string) => {
    setCategory(category);
  };

  return (
    <CategoryStatusContext.Provider value={{ category, toggleCategory }}>
      {children}
    </CategoryStatusContext.Provider>
  );
};

// Custom hook to use the category context
export const useCategoryStatus = () => useContext(CategoryStatusContext);

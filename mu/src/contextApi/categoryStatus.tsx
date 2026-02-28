"use client";
import React, { createContext, useContext, useState, ReactNode } from "react";

interface CategoryStatusContextType {
  category: string;
  toggleCategory: (category: string) => void;
}

const CategoryStatusContext = createContext<CategoryStatusContextType>({
  category: "",
  toggleCategory: () => {},
});

export const CategoryStatusProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [category, setCategory] = useState("");

  const toggleCategory = (category: string) => {
    setCategory(category);
  };

  return (
    <CategoryStatusContext.Provider value={{ category, toggleCategory }}>
      {children}
    </CategoryStatusContext.Provider>
  );
};

export const useCategoryStatus = () => useContext(CategoryStatusContext);

"use client";
import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";

interface SearchContextState {
  sematicSearch: boolean;
  toggleSearch: (sematicSearch: boolean) => void;
}

const SearchContext = createContext<SearchContextState>({
  sematicSearch: false,
  toggleSearch: () => {},
});

export const SearchProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [sematicSearch, setSematicSearch] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedSearch = localStorage.getItem("sematicSearchStatus");
      if (storedSearch) {
        setSematicSearch(JSON.parse(storedSearch));
      }
    }
  }, []);

  const toggleSearch = (status: boolean) => {
    setSematicSearch(status);

    localStorage.setItem("sematicSearchStatus", JSON.stringify(status));
  };

  return (
    <SearchContext.Provider value={{ sematicSearch, toggleSearch }}>
      {children}
    </SearchContext.Provider>
  );
};

export const useSearch = () => useContext(SearchContext);

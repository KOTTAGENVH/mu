"use client";
import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";

interface AuthContextState {
  authStatus: boolean;
  toggleAuth: (authStatus: boolean) => void;
}

const AuthContext = createContext<AuthContextState>({
  authStatus: false,
  toggleAuth: () => {},
});

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [authStatus, setAuthStatus] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedAuth = localStorage.getItem("authStatus");
      if (storedAuth) {
        setAuthStatus(JSON.parse(storedAuth));
      }
    }
  }, []);

  const toggleAuth = (status: boolean) => {
    setAuthStatus(status);

    localStorage.setItem("authStatus", JSON.stringify(status));
  };

  return (
    <AuthContext.Provider value={{ authStatus, toggleAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

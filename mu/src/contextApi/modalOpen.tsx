"use client";
import React, { createContext, useContext, useState, ReactNode } from "react";

// Define the type for the Modal context state
interface ModalContextState {
  Modal: boolean;
  id: string;
  name: string;
  category: string;
  toggleModal: (
    newModal: boolean,
    newId: string,
    newName: string,
    newCategory: string
  ) => void;
}

// Create the context with default values
const ModalContext = createContext<ModalContextState>({
  Modal: false,
  id: "",
  name: "",
  category: "",
  toggleModal: () => {},
});

// Create a provider component
export const ModalProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [Modal, setModal] = useState(false);
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");

  // Toggle function to set the Modal passed
  const toggleModal = (
    newModal: boolean,
    newId: string,
    newName: string,
    newCategory: string
  ) => {
    setModal(newModal);
    setId(newId);
    setName(newName);
    setCategory(newCategory);
  };

  return (
    <ModalContext.Provider value={{ Modal, id, name, category, toggleModal }}>
      {children}
    </ModalContext.Provider>
  );
};

// Custom hook to use the Modal context
export const useModal = () => useContext(ModalContext);

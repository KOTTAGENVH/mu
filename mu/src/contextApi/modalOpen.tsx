"use client";
import React, { createContext, useContext, useState, ReactNode } from "react";

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

const ModalContext = createContext<ModalContextState>({
  Modal: false,
  id: "",
  name: "",
  category: "",
  toggleModal: () => {},
});

export const ModalProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [Modal, setModal] = useState(false);
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");

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

export const useModal = () => useContext(ModalContext);

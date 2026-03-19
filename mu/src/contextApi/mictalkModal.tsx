"use client";
import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
} from "react";

interface MictalkModalContextType {
  isMicModalOpen: boolean;
  isSpeakerModalOpen: boolean;
  toggleMicModal: () => void;
  toggleSpeakerModal: () => void;
}

const MictalkModalContext = createContext<MictalkModalContextType | undefined>(undefined);

export const useMictalkModal = () => {
  const context = useContext(MictalkModalContext);
  if (context === undefined) {
    throw new Error("useModal must be used within a ModalProvider");
  }
  return context;
};

export const MictalkModalProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [isMicModalOpen, setMicModalOpen] = useState(false);
  const [isSpeakerModalOpen, setSpeakerModalOpen] = useState(false); 

  const toggleMicModal = useCallback(() => {
    setMicModalOpen((prev) => !prev);
  }, []);

  const toggleSpeakerModal = useCallback(() => {
    setSpeakerModalOpen((prev) => !prev);
  }, []);

  return (
    <MictalkModalContext.Provider
      value={{
        isMicModalOpen,
        isSpeakerModalOpen,
        toggleMicModal,
        toggleSpeakerModal,
      }}
    >
      {children}
    </MictalkModalContext.Provider>
  );
};

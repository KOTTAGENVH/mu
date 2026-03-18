"use client";
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface MicrophoneContextType {
  selectedMic: MediaDeviceInfo | null;
  setSelectedMic: (mic: MediaDeviceInfo | null) => void;
}

const MicrophoneContext = createContext<MicrophoneContextType | undefined>(undefined);

export const MicrophoneProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [selectedMic, setSelectedMic] = useState<MediaDeviceInfo | null>(null);

  return (
    <MicrophoneContext.Provider value={{ selectedMic, setSelectedMic }}>
      {children}
    </MicrophoneContext.Provider>
  );
};

export const useMicrophone = () => {
  const context = useContext(MicrophoneContext);
  if (!context) {
    throw new Error('useMicrophone must be used within a MicrophoneProvider');
  }
  return context;
};

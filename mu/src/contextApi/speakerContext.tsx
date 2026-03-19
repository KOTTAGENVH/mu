"use client";
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface SpeakerContextType {
  selectedSpeaker: MediaDeviceInfo | null;
  setSelectedSpeaker: (speaker: MediaDeviceInfo | null) => void;
}

const SpeakerContext = createContext<SpeakerContextType | undefined>(undefined);

export const SpeakerProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [selectedSpeaker, setSelectedSpeaker] = useState<MediaDeviceInfo | null>(null);

  return (
    <SpeakerContext.Provider value={{ selectedSpeaker, setSelectedSpeaker }}>
      {children}
    </SpeakerContext.Provider>
  );
};

export const useSpeaker = () => {
  const context = useContext(SpeakerContext);
  if (!context) {
    throw new Error('useSpeaker must be used within a SpeakerProvider');
  }
  return context;
};

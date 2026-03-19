"use client";
import { CurrentPlayProvider } from "@/contextApi/currentPlay";
import { ModalProvider } from "@/contextApi/modalOpen";
import { CategoryStatusProvider } from "@/contextApi/categoryStatus";
import { AuthProvider } from "@/contextApi/auth";
import { SearchProvider } from "@/contextApi/sematicSearch";
import { MaskProvider } from "@/contextApi/mask";
import { AudioEqProvider } from "@/contextApi/audioEnhance";
import { MicrophoneProvider } from "@/contextApi/microphoneContext";
import { SpeakerProvider } from "@/contextApi/speakerContext";
import { MictalkModalProvider } from "@/contextApi/mictalkModal";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MictalkModalProvider>
      <SpeakerProvider>
        <MicrophoneProvider>
          <AudioEqProvider>
            <MaskProvider>
              <SearchProvider>
                <AuthProvider>
                  <ModalProvider>
                    <CurrentPlayProvider>
                      <CategoryStatusProvider>
                        {children}
                      </CategoryStatusProvider>
                    </CurrentPlayProvider>
                  </ModalProvider>
                </AuthProvider>
              </SearchProvider>
            </MaskProvider>
          </AudioEqProvider>
        </MicrophoneProvider>
      </SpeakerProvider>
    </MictalkModalProvider>
  );
}

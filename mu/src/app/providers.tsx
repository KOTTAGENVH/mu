"use client";
import { CurrentPlayProvider } from "@/contextApi/currentPlay";
import { ModalProvider } from "@/contextApi/modalOpen";
import { CategoryStatusProvider } from "@/contextApi/categoryStatus";
import { AuthProvider } from "@/contextApi/auth";
import { SearchProvider } from "@/contextApi/sematicSearch";
import { MaskProvider } from "@/contextApi/mask";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MaskProvider>
      <SearchProvider>
        <AuthProvider>
          <ModalProvider>
            <CurrentPlayProvider>
              <CategoryStatusProvider>{children}</CategoryStatusProvider>
            </CurrentPlayProvider>
          </ModalProvider>
        </AuthProvider>
      </SearchProvider>
    </MaskProvider>
  );
}

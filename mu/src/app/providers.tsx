"use client";
import { CurrentPlayProvider } from "@/contextApi/currentPlay";
import { ModalProvider } from "@/contextApi/modalOpen";
import { CategoryStatusProvider } from "@/contextApi/categoryStatus";
import { AuthProvider } from "@/contextApi/auth";
import { SearchProvider } from "@/contextApi/sematicSearch";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SearchProvider>
    <AuthProvider>
      <ModalProvider>
        <CurrentPlayProvider>
          <CategoryStatusProvider>{children}</CategoryStatusProvider>
        </CurrentPlayProvider>
      </ModalProvider>
    </AuthProvider>
    </SearchProvider>
  );
}

"use client";
import { CurrentPlayProvider } from "@/contextApi/currentPlay";
import { ModalProvider } from "@/contextApi/modalOpen";
import { CategoryStatusProvider } from "@/contextApi/categoryStatus";
import { AuthProvider } from "@/contextApi/auth";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ModalProvider>
        <CurrentPlayProvider>
          <CategoryStatusProvider>{children}</CategoryStatusProvider>
        </CurrentPlayProvider>
      </ModalProvider>
    </AuthProvider>
  );
}

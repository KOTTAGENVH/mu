"use client";
import { CurrentPlayProvider } from "@/contextApi/currentPlay";
import { ModalProvider } from "@/contextApi/modalOpen";
import { CategoryStatusProvider } from "@/contextApi/categoryStatus";

export default function Providers({ children }: { children: React.ReactNode }) {


  return (
    <ModalProvider>
      <CurrentPlayProvider>
          <CategoryStatusProvider>
          {children}
          </CategoryStatusProvider>
      </CurrentPlayProvider>
    </ModalProvider>
  );
}

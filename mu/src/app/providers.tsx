"use client";
import { useEffect, useState } from "react";
import { CurrentPlayProvider } from "@/contextApi/currentPlay";
import { ModalProvider } from "@/contextApi/modalOpen";
import { CategoryStatusProvider } from "@/contextApi/categoryStatus";

export default function Providers({ children }: { children: React.ReactNode }) {
  // your existing client logic (kept as-is)
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const isCurrentlyDesktop = window.innerWidth > 1000;
      if (isDesktop !== isCurrentlyDesktop) setIsDesktop(isCurrentlyDesktop);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isDesktop]);

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

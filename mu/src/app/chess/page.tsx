"use client";
import dynamic from "next/dynamic";
import Header from "@/components/header";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contextApi/auth";
import { useEffect } from "react";
import { verifyCookie } from "@/app/api/client/services/auth/api";

const ChessGame = dynamic(() => import("@/components/games/chess/chessGame"), {
  ssr: false,
  loading: () => <div className="flex-1" />,
});

function Page() {
  const router = useRouter();
  const { toggleAuth } = useAuth();

  useEffect(() => {
    const fetchCookieStatus = async () => {
      const from = encodeURIComponent(window.location.pathname + window.location.search);
      try {
        const response = await verifyCookie();
        if (!response.success) {
          alert("Your session has expired. Please log in again.");
          toggleAuth(false);
          router.replace(`/login?from=${from}`);
          return;
        }
        toggleAuth(true);
      } catch {
        alert("An error occurred while verifying your session. Please log in again.");
        toggleAuth(false);
        router.replace(`/login?from=${from}`);
      }
    };
    fetchCookieStatus();
  }, [router, toggleAuth]);

  return (
    <div
      className="
        h-screen w-full
        flex flex-col overflow-hidden
        bg-slate-300 dark:bg-slate-950
        supports-[height:100dvh]:h-[100dvh]
      "
    >
      <Header fixed={false} />
      <main className="relative min-h-0 flex-1">
        <ChessGame height="100%" />
      </main>
    </div>
  );
}

export default Page;
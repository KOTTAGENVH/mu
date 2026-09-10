"use client";
import AudioList from "@/components/home/audioList";
import Header from "@/components/header";
import React, { useEffect } from "react";
import { verifyCookie } from "../api/client/services/auth/api";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contextApi/auth";

export type Audio = {
  _id: string;
  name: string;
  category: string;
  fileUrl: string;
  favourite: boolean;
};

function Page() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toggleAuth } = useAuth();

  useEffect(() => {
    const fetchCookieStatus = async () => {
      const qs = searchParams.toString();
      const from = encodeURIComponent(pathname + (qs ? `?${qs}` : ""));

      try {
        const response = await verifyCookie();
        if (!response.success) {
          alert("Your session has expired. Please log in again.");
          toggleAuth(false);
          router.replace(`/login?from=${from}`);
          return;
        }
        toggleAuth(true);
      } catch (error) {
        alert(
          "An error occurred while verifying your session. Please log in again.",
        );
        toggleAuth(false);
        router.replace(`/login?from=${from}`);
      }
    };
    fetchCookieStatus();
  }, [router, toggleAuth, pathname, searchParams]);
  
  return (
    <div
      className="
        min-h-screen w-full
        flex flex-col
        bg-slate-300 dark:bg-slate-950
        supports-[height:100dvh]:min-h-[100dvh]
        supports-[height:100svh]:min-h-[100svh]
      "
    >
      <Header />
      <AudioList />
    </div>
  );
}

export default Page;

"use client";
import React, { useEffect } from "react";
import Header from "@/components/header";
import FileUpload from "@/components/upload/fileUpload";
import { useRouter } from "next/navigation";
import { verifyCookie } from "../api/client/services/auth/api";
import { useAuth } from "@/contextApi/auth";
import LoginFooter from "@/components/login/loginFooter";

function Page() {
  const router = useRouter();
  const { toggleAuth } = useAuth();

  useEffect(() => {
    const fetchCookieStatus = async () => {
      const from = encodeURIComponent(
        window.location.pathname + window.location.search,
      );
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
  }, [router, toggleAuth]);

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
      <FileUpload />
      <LoginFooter />
    </div>
  );
}

export default Page;

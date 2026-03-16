"use client";
import React from "react";
import LoginFooter from "@/components/login/loginFooter";
import Header from "@/components/header";


function Page() {
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

      <LoginFooter />
    </div>
  );
}

export default Page;

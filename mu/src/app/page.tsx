"use client";
import React from "react";
import LoginFooter from "@/components/login/loginFooter";
import Source from "@/components/web/source";
import WebHeader from "@/components/web/webHeader";
import ScrollIntro from "@/components/web/scrollIntro";

function Page() {
  return (
    <div
      className="
        min-h-screen w-full
        flex flex-col
        bg-black
        supports-[height:100dvh]:min-h-[100dvh]
        supports-[height:100svh]:min-h-[100svh]
      "
    >
      <WebHeader />
      <ScrollIntro />
      <Source />
      <LoginFooter />
    </div>
  );
}

export default Page;

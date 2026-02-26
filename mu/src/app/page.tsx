"use client";
import React from "react";
import { motion } from "framer-motion";
import LoginFooter from "@/components/login/loginFooter";
import { inter, roboto } from "./fonts";
import Source from "@/components/web/source";
// import Support from "@/components/web/support";
import WebHeader from "@/components/web/webHeader";
import ScrollIntro from "@/components/web/scrollIntro";

function Page() {
  return (
    <div
      className="
        min-h-screen w-full
        flex flex-col
        bg-black
        overflow-y-auto
        supports-[height:100dvh]:min-h-[100dvh]
        supports-[height:100svh]:min-h-[100svh]
      "
    >
      <WebHeader/>
      <ScrollIntro />
      <Source />
      <LoginFooter />
    </div>
  );
}

export default Page;

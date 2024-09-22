"use client";
import AudioPlayer from "@/components/audioPlayer";
// import AdSense from '@/components/adsterra';
import Drawer from "@/components/drawer";
import IframeComp from "@/components/iframeComp";
import React, { useEffect, useState } from "react";

function Page() {
  const [isDesktop, setIsDesktop] = useState(false);

  // Function to check the window width
  const updateMedia = () => {
    setIsDesktop(window.innerWidth >= 768);
  };

  useEffect(() => {
    updateMedia();
    window.addEventListener("resize", updateMedia);

    return () => window.removeEventListener("resize", updateMedia);
  }, []);

  return (
    <div className="h-screen w-screen dark:bg-slate-950 bg-slate-300 overflow-y-auto">
      {isDesktop && <Drawer />}
      <div className="hidden md:flex flex-row flex-wrap  h-4/6 w-auto ml-40 justify-center items-center mr-4">
        <IframeComp />
        <AudioPlayer />
      </div>
    </div>
  );
}

export default Page;

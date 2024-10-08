"use client";
import AudioList from "@/components/audioList";
import AudioPlayer from "@/components/audioPlayer";
import Drawer from "@/components/drawer";
import IframeComp from "@/components/iframeComp";
import MobileAudioList from "@/components/mobileAudioList";
import MobileHeader from "@/components/mobileHeader";
import MobilePlayerModal from "@/components/mobilePlayerModal";
import { useToPlay } from "@/contextApi/toPlay";
import React, { useEffect, useState } from "react";

function Page() {
  const [isDesktop, setIsDesktop] = useState(false);

  const { id } = useToPlay();

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
      {!isDesktop && <MobileHeader/>}
      {isDesktop && <Drawer />}
      {isDesktop && (
        <>
          <div className="hidden md:flex flex-row flex-wrap  h-4/6 w-auto ml-40 justify-center items-center mr-4">
            <IframeComp />
            <AudioPlayer />
          </div>
          <div className="hidden md:block h-4/6 w-auto ml-40 justify-center items-center mr-8">
            <AudioList />
          </div>
        </>
      )}
        {!isDesktop && <MobileAudioList/>}
        {!isDesktop && id !== "" && <MobilePlayerModal />}
    </div>
  );
}

export default Page;

"use client";
import AudioList from "@/components/home/audioList";
import Header from "@/components/header";
import AudioPlayerModal from "@/components/home/audioPlayerModal";
import React, { useState } from "react";

export type Audio = {
  _id: string;
  name: string;
  category: string;
  fileUrl: string;
  favourite: boolean;
};

function Page() {
    const [audios, setAudios] = useState<Audio[]>([]);
  return (
   <div
      className="
        min-h-screen w-full
        flex flex-col
        bg-slate-300 dark:bg-slate-950
        overflow-y-auto
        supports-[height:100dvh]:min-h-[100dvh]
        supports-[height:100svh]:min-h-[100svh]
      "
    >
      <Header />
      <AudioList onLoaded={setAudios} />
      <AudioPlayerModal audios={audios} />
    </div>
  );
}

export default Page;

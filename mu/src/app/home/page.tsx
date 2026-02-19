"use client";
import AudioList from "@/components/home/audioList";
import Header from "@/components/header";
import AudioPlayerModal from "@/components/home/audioPlayerModal";
import React, { useEffect, useState } from "react";
import { verifyCookie } from "../api/client/services/auth/api";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contextApi/auth";

export type Audio = {
  _id: string;
  name: string;
  category: string;
  fileUrl: string;
  favourite: boolean;
};

function Page() {
  const [audios, setAudios] = useState<Audio[]>([]);
  const router = useRouter();
  const { toggleAuth } = useAuth();

  useEffect(() => {
    const fetchCookieStatus = async () => {
      try {
        const response = await verifyCookie();
        if (!response.success) {
          alert("Your session has expired. Please log in again.");
          toggleAuth(false);
          router.push("/login");
        }
        toggleAuth(true);
      } catch (error) {
        alert(
          "An error occurred while verifying your session. Please log in again.",
        );
        toggleAuth(false);
        router.push("/login");
      }
    };
    fetchCookieStatus();
  }, []);

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
      <AudioList onLoaded={setAudios} />
      <AudioPlayerModal audios={audios} />
    </div>
  );
}

export default Page;

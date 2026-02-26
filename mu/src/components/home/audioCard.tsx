"use client";
import React, { useState } from "react";
import {
  Pause,
  Play,
} from "lucide-react";

interface Audio {
  idPass: string;
  currentPlayingId: string;
  name: string;
  artist: string;
  favourite: boolean;
  handleId: (id: string) => void;
}

export default function AudioCard({
  idPass,
  currentPlayingId,
  name,
  artist,
  favourite,
  handleId,
}: Audio) {
  const [idPlaying, setIdPlaying] = useState("");
  const isCurrentlyPlaying = currentPlayingId === idPass;

  // Play/Pause handler
  const handlePlay = () => {
    if (idPlaying === idPass) {
      setIdPlaying("");
      handleId("");
      return;
    } else {
      setIdPlaying(idPass);
      handleId(idPass);
    }
  };

  return (
    <div
      key={idPass}
      className="group bg-white dark:bg-slate-900 rounded-2xl p-4 border-none shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-between w-60 md:w-80"
    >
      <div className="flex items-center gap-4 overflow-hidden">
        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
          <button
            onClick={handlePlay}
            className={`p-3 bg-blue-50 dark:bg-blue-900/20 ${isCurrentlyPlaying ? "hover:bg-red-400 dark:hover:bg-red-600" : "hover:bg-green-400 dark:hover:bg-green-500"} text-black dark:text-white rounded-full `}
            title={isCurrentlyPlaying ? "Pause" : "Play"}
          >
            {isCurrentlyPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
          </button>
        </div>
        <div className="min-w-0">
          <h3 className="text-sm text-black dark:text-white truncate">
            {name}
          </h3>
          <span className="text-sm text-slate-600 dark:text-slate-400 font-mono">
            Artist: {artist}
          </span>
        </div>
      </div>
    </div>
  );
}

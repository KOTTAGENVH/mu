"use client";
import React, { useState, useCallback } from "react";
import { Pause, Play } from "lucide-react";
import { useMask } from "@/contextApi/mask";

interface Audio {
  idPass: string;
  currentPlayingId: string;
  name: string;
  artist: string;
  handleId: (id: string) => void;
}

export default function AudioCard({
  idPass,
  currentPlayingId,
  name,
  artist,
  handleId,
}: Audio) {
  const { maskStatus } = useMask();
  const isPlaying = currentPlayingId === idPass;
  const [pressed, setPressed] = useState(false);

  const handlePlay = useCallback(() => {
    setPressed(true);
    setTimeout(() => setPressed(false), 150);
    handleId(isPlaying ? "" : idPass);
  }, [isPlaying, idPass, handleId]);

  return (
    <>
      <style>{`
        @keyframes dot-pulse {
          0%, 100% { opacity: 1;   transform: scale(1);    }
          50%       { opacity: 0.4; transform: scale(0.75); }
        }
        .dot-1 { animation: dot-pulse 1.2s ease-in-out infinite; animation-delay: 0s;    }
        .dot-2 { animation: dot-pulse 1.2s ease-in-out infinite; animation-delay: 0.2s;  }
        .dot-3 { animation: dot-pulse 1.2s ease-in-out infinite; animation-delay: 0.4s;  }
      `}</style>

      <div
        className={`
          relative bg-white dark:bg-slate-900
          rounded-2xl px-4 py-3.5
          flex items-center gap-4
          w-60 md:w-80 mx-auto
          transition-all duration-200
          ring-1
          ${
            isPlaying
              ? "ring-blue-200 dark:ring-blue-800 shadow-md shadow-blue-100/60 dark:shadow-blue-950/60"
              : "ring-slate-100 dark:ring-slate-800 shadow-sm hover:shadow-md hover:ring-slate-200 dark:hover:ring-slate-700"
          }
        `}
      >
        <span
          className={`
            absolute left-0 top-1/2 -translate-y-1/2
            w-[3px] rounded-r-full bg-blue-500 dark:bg-blue-400
            transition-all duration-200
            ${isPlaying ? "h-7 opacity-100" : "h-0 opacity-0"}
          `}
        />
        <button
          onClick={handlePlay}
          title={isPlaying ? "Pause" : "Play"}
          style={{
            transform: pressed ? "scale(0.88)" : "scale(1)",
            transition: "transform 0.15s ease",
          }}
          className={`
            flex-shrink-0 h-10 w-10
            flex items-center justify-center
            rounded-full focus:outline-none
            transition-colors duration-200
            ${
              isPlaying
                ? "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-500 dark:hover:text-red-400"
                : "bg-blue-50 dark:bg-blue-900/20 text-blue-500 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40"
            }
          `}
        >
          {isPlaying ? (
            <Pause className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4 translate-x-px" />
          )}
        </button>
        <div className="min-w-0 flex-1">
          <h3
            className={`
              text-sm font-semibold truncate leading-tight
              transition-colors duration-200
              ${
                isPlaying
                  ? "text-blue-700 dark:text-blue-300"
                  : "text-slate-900 dark:text-white"
              }
            `}
          >
            {maskStatus ? "xxxx" : name}
          </h3>
          <span className="block text-xs text-slate-400 dark:text-slate-500 font-mono truncate mt-0.5">
            {maskStatus ? "mubynk" : artist}
          </span>
        </div>
        <div
          className={`
            flex-shrink-0 flex items-center gap-[4px]
            transition-opacity duration-200
            ${isPlaying ? "opacity-100" : "opacity-0"}
          `}
          aria-hidden="true"
        >
          <span className="dot-1 w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-blue-400" />
          <span className="dot-2 w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-blue-400" />
          <span className="dot-3 w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-blue-400" />
        </div>
      </div>
    </>
  );
}

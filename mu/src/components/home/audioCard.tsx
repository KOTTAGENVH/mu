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

const EQUALIZER_BARS = [
  { delay: "0s",    duration: "0.65s" },
  { delay: "0.15s", duration: "0.80s" },
  { delay: "0.05s", duration: "0.55s" },
  { delay: "0.25s", duration: "0.70s" },
];

export default function AudioCard({
  idPass,
  currentPlayingId,
  name,
  artist,
  handleId,
}: Audio) {
  const { maskStatus } = useMask();
  const isPlaying = currentPlayingId === idPass;
  const [rippling, setRippling] = useState(false);

  const handlePlay = useCallback(() => {
    setRippling(true);
    setTimeout(() => setRippling(false), 500);
    handleId(isPlaying ? "" : idPass);
  }, [isPlaying, idPass, handleId]);

  return (
    <>
      <style>{`
        @keyframes eq-bounce {
          0%, 100% { height: 4px;  }
          50%       { height: 12px; }
        }
        @keyframes ripple-out {
          0%   { transform: scale(1);   opacity: 0.35; }
          100% { transform: scale(2.2); opacity: 0;    }
        }
        @keyframes pulse-ring {
          0%   { transform: scale(1);   opacity: 0.5; }
          70%  { transform: scale(1.55); opacity: 0;  }
          100% { transform: scale(1.55); opacity: 0;  }
        }
        .eq-bar {
          animation: eq-bounce linear infinite;
        }
        .ripple {
          animation: ripple-out 0.5s ease-out forwards;
        }
        .pulse-ring {
          animation: pulse-ring 1.4s ease-out infinite;
        }
      `}</style>

      <div
        className={`
          relative group bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm
          flex items-center justify-between w-60 md:w-80 mx-auto overflow-hidden
          transition-all duration-300 ease-out
          ${isPlaying
            ? "shadow-md shadow-blue-100 dark:shadow-blue-950 ring-1 ring-blue-200 dark:ring-blue-800"
            : "hover:shadow-md ring-1 ring-transparent hover:ring-slate-100 dark:hover:ring-slate-800"
          }
        `}
      >
        <span
          className={`
            absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full
            bg-blue-500 dark:bg-blue-400 transition-all duration-300
            ${isPlaying ? "h-8 opacity-100" : "h-0 opacity-0"}
          `}
        />
        <div className="flex items-center gap-4 overflow-hidden">
          <div className="relative flex-shrink-0 h-10 w-10">
            {isPlaying && (
              <span className="pulse-ring absolute inset-0 rounded-full bg-blue-400 dark:bg-blue-500" />
            )}
            {rippling && (
              <span className="ripple absolute inset-0 rounded-full bg-blue-300 dark:bg-blue-600" />
            )}

            <button
              onClick={handlePlay}
              title={isPlaying ? "Pause" : "Play"}
              className={`
                relative z-10 h-10 w-10 flex items-center justify-center rounded-full
                transition-all duration-200 focus:outline-none active:scale-90
                ${isPlaying
                  ? "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-500 dark:hover:text-red-400"
                  : "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-green-100 dark:hover:bg-green-900/30 hover:text-green-600 dark:hover:text-green-400"
                }
              `}
            >
              {isPlaying
                ? <Pause className="w-4 h-4" />
                : <Play  className="w-4 h-4 translate-x-px" />
              }
            </button>
          </div>
          <div className="min-w-0">
            <h3
              className={`
                text-sm font-medium truncate transition-colors duration-200
                ${isPlaying
                  ? "text-blue-700 dark:text-blue-300"
                  : "text-black dark:text-white"
                }
              `}
            >
              {maskStatus ? "xxxx" : name}
            </h3>

            <span className="block text-xs text-slate-500 dark:text-slate-400 font-mono truncate">
              {maskStatus ? "mubynk" : artist}
            </span>
            <div
              className={`
                flex items-end gap-[3px] mt-1.5 h-3
                transition-opacity duration-300
                ${isPlaying ? "opacity-100" : "opacity-0"}
              `}
              aria-hidden="true"
            >
              {EQUALIZER_BARS.map(({ delay, duration }, i) => (
                <span
                  key={i}
                  className="eq-bar w-[3px] rounded-full bg-blue-500 dark:bg-blue-400"
                  style={{
                    animationDelay: delay,
                    animationDuration: duration,
                    animationPlayState: isPlaying ? "running" : "paused",
                    height: "4px",
                  }}
                />
              ))}
            </div>
          </div>
        </div>
        <span
          className={`
            pointer-events-none absolute inset-0 rounded-2xl
            bg-gradient-to-r from-blue-50/0 via-blue-50/40 to-blue-50/0
            dark:from-blue-900/0 dark:via-blue-900/20 dark:to-blue-900/0
            transition-opacity duration-500
            ${isPlaying ? "opacity-100" : "opacity-0"}
          `}
        />
      </div>
    </>
  );
}
"use client";
import React, { useState, useCallback, useEffect } from "react";
import {
  Pause,
  Play,
  Heart,
  Layers,
  Clock,
  Pencil,
  Trash2,
  Music,
} from "lucide-react";
import { useMask } from "@/contextApi/mask";
import { updateSong } from "@/app/api/client/services/audio/api";

interface Audio {
  idPass: string;
  currentPlayingId?: string;
  name: string;
  artist: string;
  handleId?: (id: string) => void;
  categoryName?: string;
  favourite?: boolean;
  lastPlayedAt?: string | null;
  playCount?: number;
  skipCount?: number;
  maxEngagement?: number;
  onFavouriteChange?: (id: string, favourite: boolean) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

function timeAgo(value?: string | null) {
  if (!value) return "Never played";
  const date = new Date(value);
  if (isNaN(date.getTime())) return "Never played";

  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;

  const sameYear = date.getFullYear() === new Date().getFullYear();
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    ...(sameYear ? {} : { year: "numeric" }),
  });
}

const iconButton = `
  h-9 w-9 flex-shrink-0 flex items-center justify-center rounded-full
  transition-colors duration-150
  focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
  disabled:opacity-40 disabled:cursor-not-allowed
`;

export default function AudioCard({
  idPass,
  currentPlayingId = "",
  name,
  artist,
  handleId,
  categoryName,
  favourite = false,
  lastPlayedAt = null,
  playCount = 0,
  skipCount = 0,
  maxEngagement,
  onFavouriteChange,
  onEdit,
  onDelete,
}: Audio) {
  const { maskStatus } = useMask();
  const canPlay = Boolean(handleId);
  const isPlaying = canPlay && currentPlayingId === idPass;
  const [pressed, setPressed] = useState(false);
  const [isFavourite, setIsFavourite] = useState(favourite);
  const [saving, setSaving] = useState(false);

  useEffect(() => setIsFavourite(favourite), [favourite]);

  const handlePlay = useCallback(() => {
    setPressed(true);
    setTimeout(() => setPressed(false), 150);
    handleId?.(isPlaying ? "" : idPass);
  }, [isPlaying, idPass, handleId]);

  const displayName = maskStatus ? "xxxx" : name;
  const displayArtist = maskStatus ? "mubynk" : artist;

  const total = playCount + skipCount;
  const scale =
    maxEngagement && maxEngagement > 0 ? maxEngagement : Math.max(total, 1);
  const playsWidth = (playCount / scale) * 100;
  const skipsWidth = (skipCount / scale) * 100;
  const skipRate = total > 0 ? Math.round((skipCount / total) * 100) : 0;

  const toggleFavourite = async () => {
    if (saving) return;
    const next = !isFavourite;
    setIsFavourite(next);
    setSaving(true);
    try {
      const res = await updateSong(idPass, { favourite: next });
      if (!res?.success) throw new Error("Update failed");
      onFavouriteChange?.(idPass, next);
    } catch {
      setIsFavourite(!next);
    } finally {
      setSaving(false);
    }
  };

  const hasActions = Boolean(onEdit || onDelete);

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
          relative w-full rounded-2xl p-4 sm:p-5
          bg-white dark:bg-[#0e1628]
          ring-1 transition-all duration-200
          ${
            isPlaying
              ? "ring-blue-200 dark:ring-blue-800 shadow-md shadow-blue-100/60 dark:shadow-blue-950/60"
              : "ring-slate-200 dark:ring-white/[0.07] shadow-sm hover:shadow-md hover:ring-slate-300 dark:hover:ring-white/[0.14]"
          }
        `}
      >
        <span
          className={`
            absolute left-0 top-[38px] sm:top-[44px] -translate-y-1/2
            w-[3px] rounded-r-full bg-blue-500 dark:bg-blue-400
            transition-all duration-200
            ${isPlaying ? "h-7 opacity-100" : "h-0 opacity-0"}
          `}
        />
        <div className="flex items-start gap-3 sm:gap-4">
          {canPlay ? (
            <button
              type="button"
              onClick={handlePlay}
              title={isPlaying ? "Pause" : "Play"}
              aria-label={
                isPlaying ? `Pause ${displayName}` : `Play ${displayName}`
              }
              style={{
                transform: pressed ? "scale(0.88)" : "scale(1)",
                transition: "transform 0.15s ease",
              }}
              className={`
              flex-shrink-0 h-11 w-11 sm:h-12 sm:w-12
              flex items-center justify-center rounded-xl
              focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
              transition-colors duration-200
              ${
                isPlaying
                  ? "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-500 dark:hover:text-red-400"
                  : "bg-blue-50 dark:bg-[#1a2745] text-blue-500 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-[#20305a]"
              }
            `}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 sm:w-[18px] sm:h-[18px] fill-current" />
              ) : (
                <Play className="w-4 h-4 sm:w-[18px] sm:h-[18px] translate-x-px fill-current" />
              )}
            </button>
          ) : (
            <div
              aria-hidden="true"
              className="flex-shrink-0 h-11 w-11 sm:h-12 sm:w-12 flex items-center justify-center rounded-xl bg-blue-50 text-blue-500 dark:bg-[#1a2745] dark:text-blue-400"
            >
              <Music className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
            </div>
          )}
          <div className="min-w-0 flex-1 pt-0.5">
            <h3
              title={displayName}
              className={`
                line-clamp-2  min-h-[2.75em] break-words text-[15px] sm:text-base font-bold leading-snug
                transition-colors duration-200
                ${isPlaying ? "text-blue-700 dark:text-blue-300" : "text-slate-900 dark:text-white"}
              `}
            >
              {displayName}
            </h3>
            <p
              title={displayArtist}
              className="mt-1 truncate text-sm text-blue-600 dark:text-blue-400"
            >
              {displayArtist}
            </p>
          </div>
          {isPlaying && (
            <div
              className="-mt-2 h-10 flex-shrink-0 flex items-center gap-[4px]"
              aria-hidden="true"
            >
              <span className="dot-1 w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-blue-400" />
              <span className="dot-2 w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-blue-400" />
              <span className="dot-3 w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-blue-400" />
            </div>
          )}

          <button
            type="button"
            onClick={toggleFavourite}
            aria-pressed={isFavourite}
            aria-label={
              isFavourite
                ? `Remove ${displayName} from favourites`
                : `Add ${displayName} to favourites`
            }
            className={`
              -mr-2 -mt-2 h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-full
              transition-[color,transform] duration-150 active:scale-90
              focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
              ${
                isFavourite
                  ? "text-rose-500"
                  : "text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-200"
              }
            `}
          >
            <Heart className={`w-5 h-5 ${isFavourite ? "fill-current" : ""}`} />
          </button>
        </div>
        <div className="mt-4 sm:mt-5">
          <div
            role="img"
            aria-label={`${playCount} plays and ${skipCount} skips`}
            className="flex h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-[#1c2538]"
          >
            <div
              className="h-full bg-blue-500 transition-[width] duration-500 motion-reduce:transition-none"
              style={{ width: `${playsWidth}%` }}
            />
            <div
              className="h-full bg-red-500 transition-[width] duration-500 motion-reduce:transition-none"
              style={{ width: `${skipsWidth}%` }}
            />
          </div>

          <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 font-mono text-xs">
            {total === 0 ? (
              <span className="text-slate-500 dark:text-slate-400">
                No plays yet
              </span>
            ) : (
              <>
                <span className="text-blue-600 dark:text-blue-400">
                  {playCount} {playCount === 1 ? "play" : "plays"}
                </span>
                <span className="text-red-500 dark:text-red-400">
                  {skipCount} {skipCount === 1 ? "skip" : "skips"}
                </span>
                <span className="text-slate-500 dark:text-slate-400">
                  {skipRate}% skipped
                </span>
              </>
            )}
          </p>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-slate-100 pt-3.5 dark:border-white/[0.07]">
          {categoryName && (
            <span className="inline-flex min-w-0 max-w-full items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-white/[0.06] dark:text-slate-200">
              <Layers className="h-3 w-3 flex-shrink-0" aria-hidden="true" />
              <span className="truncate">{categoryName}</span>
            </span>
          )}
          <span
            title={
              lastPlayedAt ? new Date(lastPlayedAt).toLocaleString() : undefined
            }
            suppressHydrationWarning
            className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs text-slate-500 dark:text-slate-400"
          >
            <Clock className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
            <span className="sr-only">Last played </span>
            {timeAgo(lastPlayedAt)}
          </span>
          <span className="ml-auto flex-shrink-0 font-mono text-xs text-slate-400 dark:text-slate-500">
            #{idPass}
          </span>

          {hasActions && (
            <div className="-my-1 -mr-1.5 flex flex-shrink-0 items-center gap-0.5">
              {onEdit && (
                <button
                  type="button"
                  onClick={() => onEdit(idPass)}
                  title="Edit"
                  aria-label={`Edit ${displayName}`}
                  className={`${iconButton} text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-500 dark:hover:bg-white/[0.06] dark:hover:text-slate-200`}
                >
                  <Pencil className="h-4 w-4" />
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(idPass)}
                  title="Delete"
                  aria-label={`Delete ${displayName}`}
                  className={`${iconButton} text-slate-400 hover:bg-red-50 hover:text-red-500 dark:text-slate-500 dark:hover:bg-red-900/30 dark:hover:text-red-400`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

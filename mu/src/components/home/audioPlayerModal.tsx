import React, { useState, useEffect, useRef, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useCurrentPlay } from "@/contextApi/currentPlay";
import {
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  Repeat,
  Shuffle,
} from "lucide-react";
import { inter, roboto } from "@/app/fonts";
import {
  streamSongById,
  streamSongs,
} from "@/app/api/client/services/audio/api";

interface Category {
  id: string;
  name: string;
}

interface AudioList {
  id: string;
  name: string;
  artist: string;
  categotry: Category;
  fileUrl: string;
  favourite: boolean;
  lastPlayed: string;
  playCount: number;
  skipCount: number;
}

export interface AudioItem {
  id?: string;
  _id?: string;
  name: string;
  artist?: string;
  category: string;
  fileUrl: string;
  favourite: boolean;
}

interface AudioPlayerModalProps {
  id: string;
  handleId: (id: string) => void;
}

function AudioPlayerModal({ id, handleId }: AudioPlayerModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [audioList, setAudioList] = useState<AudioItem[]>([]);
  const [currentAudioIndex, setCurrentAudioIndex] = useState<number>(0);
  const [isLooping, setIsLooping] = useState<boolean>(false);
  const [isShuffling, setIsShuffling] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [streamingAudio, setStreamingAudio] = useState<AudioList[] | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [audioById, setAudioById] = useState<AudioList[] | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playerRef = useRef<HTMLDivElement | null>(null);
  const audioListRef = useRef<AudioItem[]>([]);
  const [pause, setPause] = useState<boolean>(true);

  const fetchStreamAudio = useCallback(async () => {
    try {
      setLoading(true);
      const response = await streamSongs();
      const data = await response;

      if (data && data.success) {
        setStreamingAudio(data.uploads);
        setAudioList((prev) => (prev.length === 0 ? data.uploads : prev));
        return data.uploads;
      } else {
        setStreamingAudio([]);
      }
    } catch (error) {
      // console.error("Failed to fetch streaming audios", error);
      alert("An error occurred while fetching streaming audios.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStreamAudio();
  }, [fetchStreamAudio]);

  const fetchStreamAudioById = useCallback(async (id: string) => {
    try {
      setLoading(true);
      const response = await streamSongById(id);
      const data = await response;

      if (data && data.success) {
        setAudioById(data.uploads);
      } else {
        setAudioById([]);
      }
    } catch (error) {
      // console.error("Failed to fetch streaming audios", error);
      alert("An error occurred while fetching streaming audios.");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleNext = useCallback(async () => {
    const el = audioRef.current;
    if (el) {
      el.pause();
      el.currentTime = 0;
    }

    const len = audioList.length;
    if (len === 0) return;

    if (isShuffling) {
      let rand = Math.floor(Math.random() * len);
      if (len > 1 && rand === currentAudioIndex) rand = (rand + 1) % len;
      const nextId = audioList[rand]?.id || audioList[rand]?._id || "";
      if (nextId) handleId(nextId);
      setCurrentAudioIndex(rand);
      return;
    }

    let nextIndex = currentAudioIndex + 1;

    // If we hit the end of the batch, fetch the next 20!
    if (nextIndex >= audioList.length) {
      setIsLoading(true);
      const moreTracks = await fetchStreamAudio();

      if (moreTracks && moreTracks.length > 0) {
        setAudioList((prev) => {
          const updated = [...prev, ...moreTracks];
          audioListRef.current = updated;
          return updated;
        });

        // Let it continue to the new track
        const nextId = moreTracks[0]?.id || moreTracks[0]?._id || "";
        if (nextId) handleId(nextId);
        setCurrentAudioIndex(nextIndex);
      } else {
        const nextId = audioList[0]?.id || audioList[0]?._id || "";
        if (nextId) handleId(nextId);
        setCurrentAudioIndex(0);
      }
      setIsLoading(false);
      return;
    }

    const nextId = audioList[nextIndex]?.id || audioList[nextIndex]?._id || "";
    if (nextId) handleId(nextId);
    setCurrentAudioIndex(nextIndex);
  }, [audioList, currentAudioIndex, isShuffling]);

  const handleNextRef = useRef(handleNext);
  useEffect(() => {
    handleNextRef.current = handleNext;
  }, [handleNext]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onLoaded = () => setDuration(el.duration || 0);
    const onDurationChange = () => setDuration(el.duration || 0);
    const onEnded = () => handleNextRef.current();

    const handleTimeUpdate = () => {
      setCurrentTime(el.currentTime);
      setDuration(el.duration);
    };

    setCurrentTime(el.currentTime || 0);
    setDuration(el.duration || 0);
    el.addEventListener("timeupdate", handleTimeUpdate);
    el.addEventListener("loadedmetadata", onLoaded);
    el.addEventListener("durationchange", onDurationChange);
    el.addEventListener("ended", onEnded);

    return () => {
      el.removeEventListener("timeupdate", handleTimeUpdate);
      el.removeEventListener("loadedmetadata", onLoaded);
      el.removeEventListener("durationchange", onDurationChange);
      el.removeEventListener("ended", onEnded);
    };
  }, [audioList, currentAudioIndex]);

  // Play/Pause safe logic
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    let cancelled = false;

    if (pause) {
      try {
        el.pause();
      } catch {}
      return () => {
        cancelled = true;
      };
    }

    const tryPlay = () => {
      if (cancelled) return;
      el.play().catch((err) => {
        // Ignore expected autoplay policy errors
      });
    };

    if (el.readyState >= 2) {
      tryPlay();
    } else {
      const onCanPlay = () => {
        el.removeEventListener("canplay", onCanPlay);
        tryPlay();
      };
      el.addEventListener("canplay", onCanPlay);
      return () => {
        cancelled = true;
        el.removeEventListener("canplay", onCanPlay);
      };
    }
    return () => {
      cancelled = true;
    };
  }, [currentAudioIndex, pause]);

  // Expose sizing variables for UI adjustments
  useEffect(() => {
    const setPlayerHeight = () => {
      const h = playerRef.current?.offsetHeight ?? 0;
      document.documentElement.style.setProperty("--player-height", `${h}px`);
      document.dispatchEvent(
        new CustomEvent("player-size-change", { detail: h }),
      );
    };
    setPlayerHeight();
    const ro = new ResizeObserver(() => setPlayerHeight());
    if (playerRef.current) ro.observe(playerRef.current);
    window.addEventListener("resize", setPlayerHeight);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", setPlayerHeight);
      document.documentElement.style.removeProperty("--player-height");
    };
  }, []);

  const handlePrev = () => {
    const el = audioRef.current;
    if (el && typeof el.currentTime === "number" && el.currentTime > 5) {
      el.currentTime = 0;
      return;
    }
    setCurrentAudioIndex((prev) => {
      const nextIdx = prev === 0 ? audioList.length - 1 : prev - 1;
      const nextId = audioList[nextIdx]?.id || audioList[nextIdx]?._id || "";
      if (nextId) handleId(nextId);
      return nextIdx;
    });
  };

  const handleAudio = () => {
    const currentTrackId =
      audioList[currentAudioIndex]?.id ||
      audioList[currentAudioIndex]?._id ||
      "";
    if (!pause) {
      if (currentTrackId) handleId(currentTrackId);
      audioRef.current?.pause();
    } else {
      if (currentTrackId) handleId(currentTrackId);
      audioRef.current?.play().catch(() => {});
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  return (
    <div
      ref={playerRef}
      className="fixed bottom-0 left-0 w-full bg-white/5 backdrop-blur-2xl border-t border-white/10 shadow-2xl z-50"
    >
      {audioList.length > 0 && (
        <audio
          preload="metadata"
          ref={audioRef}
          src={audioList[currentAudioIndex]?.fileUrl || ""}
          loop={isLooping}
          onPlay={() => setPause(false)}
          onPause={() => setPause(true)}
        />
      )}
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <div className="flex flex-col space-y-4">
          <div className="text-center sm:text-left">
            <h2
              className={`${inter.className} text-xl font-bold text-black dark:text-white mb-1 tracking-tight truncate`}
            >
              {audioList[currentAudioIndex]?.name || "Loading..."}
            </h2>
            <p
              className={`${roboto.className} text-md text-black/70 dark:text-white/70 font-medium truncate`}
            >
              {audioList[currentAudioIndex]?.artist || "Unknown Artist"}
            </p>
          </div>

          <div className="flex items-center space-x-3 sm:space-x-4">
            <span
              className={`${roboto.className} text-sm font-medium text-black dark:text-white min-w-[3rem] text-center`}
            >
              {formatTime(currentTime)}
            </span>
            <div className="flex-1 relative">
              <input
                type="range"
                className="w-full h-2 bg-white/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
                min="0"
                max={duration || 0}
                value={currentTime}
                onChange={(e) => {
                  if (audioRef.current) {
                    const newTime = parseFloat(e.target.value);
                    audioRef.current.currentTime = newTime;
                    setCurrentTime(newTime);
                  }
                }}
                style={{
                  background: `linear-gradient(to right, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.8) ${(currentTime / duration) * 100 || 0}%, rgba(255,255,255,0.2) ${(currentTime / duration) * 100 || 0}%, rgba(255,255,255,0.2) 100%)`,
                }}
              />
            </div>
            <span
              className={`${roboto.className} text-sm font-medium text-black dark:text-white min-w-[3rem] text-center`}
            >
              {formatTime(duration)}
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            <button
              onClick={() => setIsShuffling(!isShuffling)}
              className="p-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md shadow-lg"
            >
              <Shuffle
                className={`w-4 h-4 sm:w-6 sm:h-6 ${isShuffling ? "text-blue-400" : "text-black dark:text-white"}`}
              />
            </button>
            <button
              onClick={handlePrev}
              className="p-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md shadow-lg"
            >
              <ChevronLeft className="w-4 h-4 sm:w-6 sm:h-6 text-black dark:text-white" />
            </button>
            <button
              onClick={handleAudio}
              className="p-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md shadow-lg"
            >
              {pause ? (
                <Play className="w-4 h-4 sm:w-6 sm:h-6 text-black dark:text-white" />
              ) : (
                <Pause className="w-4 h-4 sm:w-6 sm:h-6 text-black dark:text-white" />
              )}
            </button>
            <button
              onClick={handleNext}
              disabled={isLoading}
              className={`p-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md shadow-lg ${isLoading ? "opacity-50" : ""}`}
            >
              <ChevronRight className="w-4 h-4 sm:w-6 sm:h-6 text-black dark:text-white" />
            </button>
            <button
              onClick={() => setIsLooping(!isLooping)}
              className="p-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md shadow-lg"
            >
              <Repeat
                className={`w-4 h-4 sm:w-6 sm:h-6 ${isLooping ? "text-blue-400" : "text-black dark:text-white"}`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AudioPlayerModal;

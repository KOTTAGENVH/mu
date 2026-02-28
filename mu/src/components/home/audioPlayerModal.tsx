import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  Pause,
  Play,
  Repeat,
  Shuffle,
} from "lucide-react";
import { inter, roboto } from "@/app/fonts";
import {
  streamSongById,
  streamSongs,
  updateSkipCount,
  updateSong,
} from "@/app/api/client/services/audio/api";
import { useMask } from "@/contextApi/mask";

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
  const { maskStatus } = useMask();
  const [isLoading, setIsLoadingSync] = useState(false);
  const [audioList, setAudioList] = useState<AudioItem[]>([]);
  const [currentAudioIndex, setCurrentAudioIndex] = useState<number>(0);
  const [isLooping, setIsLooping] = useState<boolean>(false);
  const [isShuffling, setIsShuffling] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [batchFetchedAt, setBatchFetchedAt] = useState<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playerRef = useRef<HTMLDivElement | null>(null);
  const [pause, setPause] = useState<boolean>(true);
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const isRecovering = useRef(false);
  const isLoadingRef = useRef(false);
  const currentTrackUrl = audioList[currentAudioIndex]?.fileUrl;

  const fetchStreamAudio = useCallback(async (forceRefresh = false) => {
    if (isLoadingRef.current) return;
    try {
      setIsLoadingSync(true);
      const response = await streamSongs();
      const data = await response;

      if (data && data.success) {
        setAudioList((prev) =>
          prev.length === 0 || forceRefresh ? data.uploads : prev,
        );
        setBatchFetchedAt(Date.now());

        return data;
      } else {
        setAudioList([]);
        return [];
      }
    } catch (error) {
      // console.error("Failed to fetch streaming audios", error);
      alert("An error occurred while fetching streaming audios.");
    } finally {
      setIsLoadingSync(false);
      isLoadingRef.current = false;
    }
  }, []);

  useEffect(() => {
    fetchStreamAudio();
  }, [fetchStreamAudio]);

  const fetchStreamAudioById = useCallback(
    async (id: string): Promise<AudioList | null> => {
      try {
        setIsLoadingSync(true);
        const response = await streamSongById(id);
        const data = await response;

        if (data && data.success) {
          return data.track ?? null;
        } else {
          return null;
        }
      } catch (error) {
        // console.error("Failed to fetch streaming audios", error);
        alert("An error occurred while fetching streaming audios.");
        return null;
      } finally {
        setIsLoadingSync(false);
      }
    },
    [],
  );

  const handleSkipCount = useCallback(
    async (id: string, action: "skip" | "play") => {
      try {
        const response = await updateSkipCount(id, action);
        if (!response.success) {
          throw new Error(response.message || "Failed to update skip count");
        }
      } catch (error) {
        alert("An error occurred while updating skip count.");
      }
    },
    [],
  );

  const handleNext = useCallback(async () => {
    if (isRecovering.current) return;
    const el = audioRef.current;
    if (el && el.duration > 0) {
      const percentPlayed = el.currentTime / el.duration;
      if (percentPlayed < 0.9) {
        const currentTrackId =
          audioList[currentAudioIndex]?.id || audioList[currentAudioIndex]?._id;
        if (currentTrackId) {
          handleSkipCount(currentTrackId, "skip").catch(() => {
            alert("An error occurred while updating skip count.");
          });
        }
      }
    }
    setPause(false);

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

    const isBatchExpired = Date.now() - batchFetchedAt > 3000000;
    const nextIndex = currentAudioIndex + 1;

    if (nextIndex >= audioList.length || isBatchExpired) {
      if (audioRef.current) audioRef.current.src = "";
      setIsLoadingSync(true);
      const response = await streamSongs();
      const moreTracks = Array.isArray(response) ? response : response?.uploads;

      if (moreTracks && moreTracks.length > 0) {
        setAudioList((prev) => [...prev, ...moreTracks]);

        const nextId = moreTracks[0]?.id || "";
        if (nextId) handleId(nextId);
        setCurrentAudioIndex(nextIndex);
      } else {
        setCurrentAudioIndex(0);
      }
      setIsLoadingSync(false);
      return;
    }

    const nextId = audioList[nextIndex]?.id || "";
    if (nextId) handleId(nextId);
    setCurrentAudioIndex(nextIndex);
  }, [
    audioList,
    currentAudioIndex,
    isShuffling,
    handleId,
    batchFetchedAt,
    handleSkipCount,
  ]);

  const handleNextRef = useRef(handleNext);
  useEffect(() => {
    handleNextRef.current = handleNext;
  }, [handleNext]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    // if (audioRef.current) {
    //   audioRef.current.load();
    // }
    const onLoaded = () => setDuration(el.duration || 0);
    const onDurationChange = () => setDuration(el.duration || 0);
    const onEnded = () => {
      const currentTrackId = audioList[currentAudioIndex]?.id;

      if (currentTrackId) {
        handleSkipCount(currentTrackId, "play").catch(() => {});
      }

      if (handleNextRef.current) {
        handleNextRef.current();
      }
    };

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
  }, [audioList, currentTrackUrl, currentAudioIndex, handleSkipCount]);

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
        console.error("Play failed:", err);
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

  const handlePrev = useCallback(() => {
    setPause(false);
    const el = audioRef.current;
    if (el && typeof el.currentTime === "number" && el.currentTime > 5) {
      el.currentTime = 0;
      return;
    }
    const nextIdx =
      currentAudioIndex === 0 ? audioList.length - 1 : currentAudioIndex - 1;
    const nextId = audioList[nextIdx]?.id || "";
    if (nextId) handleId(nextId);
    setCurrentAudioIndex(nextIdx);
  }, [audioList, currentAudioIndex, handleId]);

  const handleAudio = () => {
    const currentTrackId = audioList[currentAudioIndex]?.id || "";
    // if (!pause) {
    //   if (currentTrackId) handleId(currentTrackId);
    //   audioRef.current?.pause();
    // } else {
    //   if (currentTrackId) handleId(currentTrackId);
    //   audioRef.current?.play().catch(() => {});
    // }
    if (currentTrackId) handleId(currentTrackId);

    setPause((prev) => !prev);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  const handleAudioError = async () => {
    if (isRecovering.current || isLoadingRef.current) return;

    isRecovering.current = true;
    isLoadingRef.current = true;
    setIsLoadingSync(true);
    setPause(true);

    console.log(
      "URL Expired. Terminating current audio stream and fetching fresh URLs...",
    );

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current.load();
    }

    const currentTrack = audioList[currentAudioIndex];
    const trackId = currentTrack?.id || currentTrack?._id;

    if (!trackId) {
      cleanupRecovery();
      handleNext();
      return;
    }

    try {
      const response = await streamSongs();
      const freshBatch = response?.uploads || [];

      if (freshBatch.length > 0) {
        const updatedCurrentTrack = freshBatch.find(
          (t: AudioItem) => (t.id || t._id) === trackId,
        );

        setAudioList(freshBatch);

        if (updatedCurrentTrack) {
          const newIdx = freshBatch.findIndex(
            (t: AudioItem) => (t.id || t._id) === trackId,
          );
          setCurrentAudioIndex(newIdx);

          if (audioRef.current) {
            audioRef.current.src = updatedCurrentTrack.fileUrl;
            audioRef.current.load();
          }
        } else {
          setCurrentAudioIndex(0);
        }

        setBatchFetchedAt(Date.now());

        setTimeout(() => {
          setPause(false);
          cleanupRecovery();
        }, 500);
      } else {
        throw new Error("Empty batch received");
      }
    } catch (error) {
      console.error("Critical recovery failure:", error);
      cleanupRecovery();
      handleNext();
    }
  };

  const cleanupRecovery = () => {
    isRecovering.current = false;
    isLoadingRef.current = false;
    setIsLoadingSync(false);
  };
  useEffect(() => {
    const playExternalSong = async () => {
      if (!id) {
        setPause(true);
        return;
      }
      const currentlyPlayingId =
        audioList[currentAudioIndex]?.id || audioList[currentAudioIndex]?._id;
      if (id === currentlyPlayingId) {
        setPause(false);
        return;
      }

      const existingIndex = audioList.findIndex(
        (track) => track.id === id || track._id === id,
      );

      if (existingIndex !== -1) {
        setCurrentAudioIndex(existingIndex);
        setPause(false);
      } else {
        setIsLoadingSync(true);
        const newTrack = await fetchStreamAudioById(id);

        if (newTrack) {
          const newTrackAsItem: AudioItem = {
            id: newTrack.id,
            name: newTrack.name,
            artist: newTrack.artist,
            category: newTrack.categotry?.name ?? "",
            fileUrl: newTrack.fileUrl,
            favourite: newTrack.favourite,
          };

          let insertedIndex = 0;
          setAudioList((prev) => {
            const newList = [...prev];
            if (newList.length === 0) {
              insertedIndex = 0;
              return [newTrackAsItem];
            } else {
              const insertAt = currentAudioIndex + 1;
              newList.splice(insertAt, 0, newTrackAsItem);
              insertedIndex = insertAt;
              return newList;
            }
          });

          setCurrentAudioIndex((prev) =>
            prev === audioList.length ? 0 : prev + 1,
          );
          setCurrentAudioIndex(insertedIndex);
          setPause(false);
        }
        setIsLoadingSync(false);
      }
    };

    playExternalSong();
  }, [id, audioList, currentAudioIndex, fetchStreamAudioById]);

  useEffect(() => {
    if (audioList.length > 0 && audioList[currentAudioIndex]) {
      setIsFavorite(audioList[currentAudioIndex].favourite);
    }
  }, [currentAudioIndex, audioList]);

  useEffect(() => {
    if ("mediaSession" in navigator && audioList.length > 0) {
      const currentTrack = audioList[currentAudioIndex];

      if (!currentTrack) return;
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.name || "Unknown Track",
        artist: currentTrack.artist || "Unknown Artist",
        album: currentTrack.category || "Audio Stream",
        artwork: [{ src: "/mu.jpg", sizes: "512x512", type: "image/png" }],
      });
      navigator.mediaSession.setActionHandler("play", () => {
        setPause(false);
      });

      navigator.mediaSession.setActionHandler("pause", () => {
        setPause(true);
      });

      navigator.mediaSession.setActionHandler("previoustrack", () => {
        handlePrev();
      });

      navigator.mediaSession.setActionHandler("nexttrack", () => {
        if (handleNextRef.current) {
          handleNextRef.current();
        }
      });
    }
  }, [currentAudioIndex, audioList, handlePrev]);

  //hande favourite edit
  const handleFavoriteToggle = async () => {
    const currentTrack = audioList[currentAudioIndex];
    const trackId = currentTrack?.id || currentTrack?._id;

    if (!trackId) return;

    const newFavoriteStatus = !isFavorite;

    setIsFavorite(newFavoriteStatus);
    setAudioList((prev) => {
      const newList = [...prev];
      newList[currentAudioIndex] = {
        ...newList[currentAudioIndex],
        favourite: newFavoriteStatus,
      };
      return newList;
    });

    try {
      await updateSong(trackId, { favourite: newFavoriteStatus });
    } catch (error) {
      // console.error("Error updating favorite:", error);
      alert("Failed to update favorite status.");

      setIsFavorite(!newFavoriteStatus);
      setAudioList((prev) => {
        const newList = [...prev];
        newList[currentAudioIndex] = {
          ...newList[currentAudioIndex],
          favourite: !newFavoriteStatus,
        };
        return newList;
      });
    }
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
          onError={handleAudioError}
        />
      )}
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <div className="flex flex-col space-y-4">
          <div className="text-center sm:text-left">
            {isLoading || audioList.length === 0 ? (
              <div className="flex flex-col items-center sm:items-start space-y-2 py-1">
                <div className="h-6 w-48 bg-gray-300 dark:bg-gray-700 rounded-md animate-pulse"></div>
                <div className="h-4 w-32 bg-gray-200 dark:bg-gray-800 rounded-md animate-pulse"></div>
              </div>
            ) : (
              <>
                <h2
                  className={`${inter.className} text-xl font-bold text-black dark:text-white mb-1 tracking-tight truncate`}
                >
                  {maskStatus ? "xxxx" : audioList[currentAudioIndex]?.name}
                </h2>
                <p
                  className={`${roboto.className} text-md text-black/70 dark:text-white/70 font-medium truncate`}
                >
                  {maskStatus ? "mubynk" : audioList[currentAudioIndex]?.artist}
                </p>
              </>
            )}
          </div>

          <div className="flex items-center space-x-3 sm:space-x-4">
            <span
              className={`${roboto.className} text-sm font-medium text-black dark:text-white min-w-[3rem] text-center`}
            >
              {formatTime(currentTime)}
            </span>
            <div className="flex-1 relative">
              <input
                disabled={isLoading || audioList.length === 0}
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
              aria-label="shuffle"
              title="shuffle"
              disabled={isLoading || audioList.length === 0}
              onClick={() => setIsShuffling(!isShuffling)}
              className="p-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md shadow-lg"
            >
              <Shuffle
                className={`w-4 h-4 sm:w-6 sm:h-6 ${isShuffling ? "text-blue-400" : "text-black dark:text-white"}`}
              />
            </button>
            <button
              aria-label="previous"
              title="previous"
              onClick={handlePrev}
              disabled={isLoading || audioList.length === 0}
              className="p-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md shadow-lg"
            >
              <ChevronLeft className="w-4 h-4 sm:w-6 sm:h-6 text-black dark:text-white" />
            </button>
            <button
              aria-label={pause ? "play" : "pause"}
              title={pause ? "play" : "pause"}
              disabled={isLoading || audioList.length === 0}
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
              aria-label="next"
              title="next"
              disabled={isLoading || audioList.length === 0}
              onClick={handleNext}
              className={`p-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md shadow-lg ${isLoading ? "opacity-50" : ""}`}
            >
              <ChevronRight className="w-4 h-4 sm:w-6 sm:h-6 text-black dark:text-white" />
            </button>
            <button
              aria-label="loop"
              title="loop"
              disabled={isLoading || audioList.length === 0}
              onClick={() => setIsLooping(!isLooping)}
              className="p-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md shadow-lg"
            >
              <Repeat
                className={`w-4 h-4 sm:w-6 sm:h-6 ${isLooping ? "text-blue-400" : "text-black dark:text-white"}`}
              />
            </button>
            <button
              aria-label="favorite"
              title="favorite"
              disabled={isLoading || audioList.length === 0}
              onClick={handleFavoriteToggle}
              className="p-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md shadow-lg"
            >
              <Heart
                className={`w-4 h-4 sm:w-6 sm:h-6 ${isFavorite ? "text-red-500 fill-red-500" : "text-black dark:text-white"}`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AudioPlayerModal;

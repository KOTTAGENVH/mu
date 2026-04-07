import { useState, useEffect, useRef, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  Heart,
  Pause,
  Play,
  Repeat,
  Shuffle,
  X,
} from "lucide-react";
import { inter, roboto } from "@/app/fonts";
import {
  streamSongById,
  streamSongs,
  updateSkipPlayCount,
  updateSong,
} from "@/app/api/client/services/audio/api";
import { useMask } from "@/contextApi/mask";
import { useAudioEq } from "@/contextApi/audioEnhance";
import { getAllCategories } from "@/app/api/client/services/categories/api";

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
  fetchedAt?: number;
}

export interface AudioItem {
  id?: string;
  name: string;
  artist?: string;
  category: string;
  fileUrl: string;
  favourite: boolean;
  fetchedAt?: number;
}

interface AudioPlayerModalProps {
  id: string;
  handleId: (id: string) => void;
}

function AudioPlayerModal({ id, handleId }: AudioPlayerModalProps) {
  const { maskStatus } = useMask();
  const { eqValues, pan, useCompressor } = useAudioEq();
  const [isLoading, setIsLoadingSync] = useState(false);
  const [audioList, setAudioList] = useState<AudioItem[]>([]);
  const [currentAudioIndex, setCurrentAudioIndex] = useState<number>(0);
  const [categoryListClicked, setCategoryListClicked] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLooping, setIsLooping] = useState<boolean>(false);
  const [isShuffling, setIsShuffling] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playerRef = useRef<HTMLDivElement | null>(null);
  const [pause, setPause] = useState<boolean>(true);
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const currentTrackUrl = audioList[currentAudioIndex]?.fileUrl;
  const isRecovering = useRef(false);
  const isLoadingRef = useRef(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const lastCountedTrackIdRef = useRef<string | null>(null);
  const retryCountRef = useRef(0);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const compressorRef = useRef<DynamicsCompressorNode | null>(null);
  const pannerRef = useRef<StereoPannerNode | null>(null);
  const audioListRef = useRef<AudioItem[]>([]);
  const filtersRef = useRef<Record<string, BiquadFilterNode>>({});
  const currentAudioIndexRef = useRef<number>(currentAudioIndex);
  const activeCategoryName =
    categories.find((cat) => cat.id === selectedCategory)?.name || "";

  useEffect(() => {
    audioListRef.current = audioList;
  }, [audioList]);

  useEffect(() => {
    currentAudioIndexRef.current = currentAudioIndex;
  }, [currentAudioIndex]);

  useEffect(() => {
    if (!audioRef.current || sourceRef.current) return;

    try {
      const audioCtx = new (
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext
      )();

      audioCtxRef.current = audioCtx;

      const source = audioCtx.createMediaElementSource(audioRef.current);
      sourceRef.current = source;

      const compressor = audioCtx.createDynamicsCompressor();
      compressor.threshold.value = -24;
      compressor.knee.value = 30;
      compressor.ratio.value = 12;
      compressor.attack.value = 0.003;
      compressor.release.value = 0.25;
      compressorRef.current = compressor;

      const panner = audioCtx.createStereoPanner();
      panner.pan.value = 0;
      pannerRef.current = panner;

      const frequencies = [100, 300, 1000, 4000, 12000];
      const types: BiquadFilterType[] = [
        "lowshelf",
        "peaking",
        "peaking",
        "peaking",
        "highshelf",
      ];

      let prevNode: AudioNode | null = null;

      frequencies.forEach((freq, index) => {
        const filter = audioCtx.createBiquadFilter();
        filter.type = types[index];
        filter.frequency.value = freq;
        if (types[index] === "peaking") filter.Q.value = 1;
        filter.gain.value = 0;

        filtersRef.current[freq.toString()] = filter;
        if (prevNode) {
          prevNode.connect(filter);
        }
        prevNode = filter;
      });
    } catch (error) {
      console.error("Web Audio API initialization failed:", error);
    }
  }, [audioList.length]);

  useEffect(() => {
    if (
      !audioCtxRef.current ||
      !sourceRef.current ||
      !compressorRef.current ||
      !pannerRef.current
    )
      return;

    const source = sourceRef.current;
    const compressor = compressorRef.current;
    const firstFilter = filtersRef.current["100"];
    const lastFilter = filtersRef.current["12000"];
    const panner = pannerRef.current;

    try {
      source.disconnect();
    } catch (e) {}
    try {
      lastFilter.disconnect();
    } catch (e) {}
    try {
      compressor.disconnect();
    } catch (e) {}

    if (useCompressor) {
      source.connect(compressor);
      compressor.connect(firstFilter);
    } else {
      compressor.disconnect();
      source.connect(firstFilter);
    }

    lastFilter.connect(panner);
    panner.connect(audioCtxRef.current.destination);
  }, [useCompressor, audioList.length]);

  useEffect(() => {
    Object.entries(eqValues).forEach(([freq, gain]) => {
      if (filtersRef.current[freq]) {
        filtersRef.current[freq].gain.value = gain;
      }
    });
  }, [eqValues]);

  useEffect(() => {
    if (pannerRef.current) pannerRef.current.pan.value = pan;
  }, [pan]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!categoryListClicked) return;

      const target = event.target as Node;

      if (
        (dropdownRef.current && dropdownRef.current.contains(target)) ||
        (event.target as HTMLElement).closest("[data-filter-button]")
      ) {
        return;
      }

      setCategoryListClicked(false);
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [categoryListClicked]);

  const getGradientClass = (name: string) => {
    if (!name) return "bg-gradient-to-br from-gray-500 to-gray-700";

    const gradients = [
      "bg-gradient-to-br from-pink-500 to-orange-400",
      "bg-gradient-to-br from-blue-500 to-purple-500",
      "bg-gradient-to-br from-green-400 to-blue-500",
      "bg-gradient-to-br from-yellow-400 to-red-500",
      "bg-gradient-to-br from-indigo-500 to-pink-500",
      "bg-gradient-to-br from-teal-400 to-emerald-600",
    ];

    const index = name.charCodeAt(0) % gradients.length;
    return gradients[index];
  };

  const fetchStreamAudio = useCallback(
    async (forceRefresh = false, category?: string) => {
      if (isLoadingRef.current) return;
      try {
        setIsLoadingSync(true);
        const lastSong = audioListRef.current.at(-1);
        const response = await streamSongs(lastSong?.artist, category);
        const data = await response;

        if (data && data.success) {
          const newUploads = data.uploads.map((track: any) => ({
            ...track,
            fetchedAt: Date.now(),
          }));
          if (forceRefresh) {
            const currentlyPlayingTrack =
              audioListRef.current[currentAudioIndexRef.current];
            if (currentlyPlayingTrack) {
              const filteredUploads = newUploads.filter(
                (track: any) => track.id !== currentlyPlayingTrack.id,
              );
              setAudioList([currentlyPlayingTrack, ...filteredUploads]);
            } else {
              setAudioList(newUploads);
            }
            setCurrentAudioIndex(0);
            setPause(false);
          } else {
            setAudioList((prev) => (prev.length === 0 ? newUploads : prev));
          }
          return data;
        } else {
          setAudioList([]);
          return [];
        }
      } catch (error) {
        // console.error("Failed to fetch streaming audios", error);
        alert("Error in fetchStreamAudio (Bulk fetch failed)");
      } finally {
        setIsLoadingSync(false);
        isLoadingRef.current = false;
      }
    },
    [],
  );

  useEffect(() => {
    fetchStreamAudio();
  }, [fetchStreamAudio]);

  const fetchCategories = useCallback(async () => {
    try {
      setIsLoadingSync(true);
      const response = await getAllCategories();
      const data = await response;

      if (data.success) {
        setCategories(data.category);
      } else {
        setCategories([]);
      }
    } catch (error) {
      //   console.error("Failed to fetch categories", error);
      alert("An error occurred while fetching categories.");
    } finally {
      setIsLoadingSync(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const fetchStreamAudioById = useCallback(
    async (id: string): Promise<AudioList | null> => {
      try {
        setIsLoadingSync(true);
        const response = await streamSongById(id);
        const data = await response;

        if (data && data.success) {
          return { ...data.track, fetchedAt: Date.now() ?? null };
        } else {
          return null;
        }
      } catch (error) {
        // console.error("Failed to fetch streaming audios", error);
        alert("Error in fetchStreamAudioById (Single fetch failed)");
        return null;
      } finally {
        setIsLoadingSync(false);
      }
    },
    [],
  );

  const handleSkipPlayCount = useCallback(
    async (id: string, action: "skip" | "play") => {
      try {
        const response = await updateSkipPlayCount(id, action);
        if (!response.success) {
          throw new Error(response.message || "Failed to update skip count");
        }
      } catch (error) {
        // console.error("Failed to update skip count");
        alert("An error occurred while updating skip count.");
      }
    },
    [],
  );

  const handleNext = useCallback(async () => {
    if (isRecovering.current) return;

    const currentList = audioListRef.current;
    const len = currentList.length;
    if (len === 0) return;

    const el = audioRef.current;
    if (el && el.duration > 0) {
      const percentPlayed = el.currentTime / el.duration;
      if (percentPlayed < 0.9) {
        const currentTrackId = currentList[currentAudioIndex]?.id;
        if (currentTrackId) {
          handleSkipPlayCount(currentTrackId, "skip").catch(() => {
            // console.error("Failed to update skip count");
            alert("An error occurred while updating skip count.");
          });
        }
      }
    }
    el?.play().catch((err) => {
      if (err.name !== "AbortError") {
        // console.error("Play failed:", err);
      } else {
        // console.error("Unknown error: ", err);
      }
    });
    setPause(false);

    if (isShuffling) {
      let rand = Math.floor(Math.random() * len);
      if (len > 1 && rand === currentAudioIndex) rand = (rand + 1) % len;
      const nextId = currentList[rand]?.id || "";
      if (nextId) handleId(nextId);
      setCurrentAudioIndex(rand);
      return;
    }

    // const isBatchExpired = Date.now() - batchFetchedAt > 3000000;
    const nextIndex = currentAudioIndex + 1;

    if (nextIndex >= len) {
      if (audioRef.current) audioRef.current.src = "";
      setIsLoadingSync(true);
      const lastSong = currentList.at(-1);
      const response = await streamSongs(lastSong?.artist);
      const moreTracks = Array.isArray(response) ? response : response?.uploads;

      if (moreTracks && moreTracks.length > 0) {
        //sliding window of 30
        const maxHistory = 30;
        const previousTracksToKeep = currentList.slice(-maxHistory);
        const stampedTracks = moreTracks.map((track: any) => ({
          ...track,
          fetchedAt: Date.now(),
        }));
        setAudioList([...previousTracksToKeep, ...stampedTracks]);
        const newTrackIndex = previousTracksToKeep.length;

        const nextId = moreTracks[0]?.id || "";
        if (nextId) handleId(nextId);
        setCurrentAudioIndex(newTrackIndex);
      } else {
        setCurrentAudioIndex(0);
      }
      setIsLoadingSync(false);
      return;
    }

    const nextId = currentList[nextIndex]?.id || "";
    if (nextId) handleId(nextId);
    setCurrentAudioIndex(nextIndex);
  }, [
    currentAudioIndex,
    isShuffling,
    handleId,
    // batchFetchedAt,
    handleSkipPlayCount,
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
    const onLoaded = () => {
      const currentTrackId = audioListRef.current[currentAudioIndex]?.id;
      setDuration(el.duration || 0);
      if (currentTrackId && lastCountedTrackIdRef.current !== currentTrackId) {
        lastCountedTrackIdRef.current = currentTrackId;
        handleSkipPlayCount(currentTrackId, "play").catch(() => {
          // console.error("Failed to update play count");
          alert("An error occurred while updating play count.");
        });
      }
    };
    const onDurationChange = () => setDuration(el.duration || 0);
    const onEnded = () => {
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
  }, [currentTrackUrl, currentAudioIndex, handleSkipPlayCount]);

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
      if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
        audioCtxRef.current.resume();
      }
      el.play().catch((err) => {
        if (err.name !== "AbortError") {
          alert("Audio Play failed an error occured!");
          console.error("Play failed:", err);
        }
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
    const el = audioRef.current;

    if (el && typeof el.currentTime === "number" && el.currentTime > 5) {
      el.currentTime = 0;
      el.play().catch((err) => {
        if (err.name !== "AbortError") {
          // console.error("Play failed:", err);
        } else {
          // console.error("Unknown error: ", err);
        }
      });
      setPause(false);
      return;
    }

    el?.play().catch((err) => {
      if (err.name !== "AbortError") {
        // console.error("Play failed:", err);
      } else {
        // console.error("Unknown error: ", err);
      }
    });
    setPause(false);

    const nextIdx =
      currentAudioIndex === 0 ? audioList.length - 1 : currentAudioIndex - 1;
    const nextId = audioList[nextIdx]?.id || "";
    if (nextId) handleId(nextId);
    setCurrentAudioIndex(nextIdx);
  }, [audioList, currentAudioIndex, handleId]);

  const handleAudio = () => {
    const el = audioRef.current;
    if (!el) return;

    const currentTrackId = audioList[currentAudioIndex]?.id || "";
    if (currentTrackId) handleId(currentTrackId);
    if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }

    if (pause) {
      el.play().catch((err) => {
        if (err.name !== "AbortError") {
          // console.error("Play failed:", err);
        } else {
          // console.error("Unknown error: ", err);
        }
      });
    } else {
      el.pause();
    }

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

    const savedTime = audioRef.current?.currentTime || currentTime;

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute("src");
      audioRef.current.load();
    }

    const currentTrack = audioList[currentAudioIndex];
    const trackId = currentTrack?.id;

    if (!trackId) {
      cleanupRecovery();
      handleNext();
      return;
    }
    if (retryCountRef.current > 3) {
      alert("Unable to load audio. The page will now refresh to fix this.");
      setPause(true);
      cleanupRecovery();
      window.location.reload();
      return;
    }
    retryCountRef.current += 1;

    const tracksToFetch = [{ index: currentAudioIndex, id: trackId }];
    const cacheLookahead = 5;

    for (let i = 1; i <= cacheLookahead; i++) {
      const nextIndex = currentAudioIndex + i;
      if (nextIndex < audioList.length && audioList[nextIndex]?.id) {
        tracksToFetch.push({ index: nextIndex, id: audioList[nextIndex].id });
      }
    }

    try {
      const fetchCacheTracks = tracksToFetch.map((track) =>
        fetchStreamAudioById(track.id).then((data) => ({
          index: track.index,
          data,
        })),
      );

      const fetchedResults = await Promise.all(fetchCacheTracks);

      const currentTrackResult = fetchedResults.find(
        (r) => r.index === currentAudioIndex,
      );

      if (currentTrackResult?.data?.fileUrl) {
        setAudioList((prev) => {
          const newList = [...prev];

          fetchedResults.forEach((result) => {
            if (result.data && result.data.fileUrl && newList[result.index]) {
              newList[result.index] = {
                ...newList[result.index],
                fileUrl: result.data.fileUrl,
                fetchedAt: Date.now(),
              };
            }
          });

          return newList;
        });

        if (audioRef.current) {
          audioRef.current.src = currentTrackResult.data.fileUrl;
          audioRef.current.load();
          const restoreTime = () => {
            if (audioRef.current) {
              audioRef.current.currentTime = savedTime;
              audioRef.current.removeEventListener(
                "loadedmetadata",
                restoreTime,
              );
            }
          };

          audioRef.current.addEventListener("loadedmetadata", restoreTime);
        }

        setTimeout(() => {
          setPause(false);
          cleanupRecovery();
        }, 500);
      } else {
        throw new Error("Empty track received during recovery");
      }
    } catch (error) {
      // console.error("Critical recovery failure:", error);
      alert("Something went wrong. Please reload the app.");
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

      const currentIndex = currentAudioIndexRef.current;
      const currentList = audioListRef.current;
      const currentlyPlayingId = currentList[currentIndex]?.id;
      if (id === currentlyPlayingId) {
        setPause(false);
        return;
      }

      const existingIndex = currentList.findIndex((track) => track.id === id);

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
            fetchedAt: newTrack.fetchedAt || Date.now(),
          };

          let finalInsertedIndex = 0;
          setAudioList((prev) => {
            let newList = [...prev];

            if (newList.length === 0) {
              finalInsertedIndex = 0;
              return [newTrackAsItem];
            }

            const insertAt = currentAudioIndexRef.current + 1;
            newList.splice(insertAt, 0, newTrackAsItem);

            const maxListSize = 60;
            if (newList.length > maxListSize) {
              const trimAmount = newList.length - maxListSize;
              newList = newList.slice(trimAmount);
              finalInsertedIndex = Math.max(0, insertAt - trimAmount);
            } else {
              finalInsertedIndex = insertAt;
            }
            return newList;
          });

          setCurrentAudioIndex(finalInsertedIndex);
          setPause(false);
        }
        setIsLoadingSync(false);
      }
    };

    playExternalSong();
  }, [id, audioList, fetchStreamAudioById]);

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
        title: maskStatus ? "xxxx" : currentTrack.name || "Unknown Track",
        artist: maskStatus ? "mubynk" : currentTrack.artist || "Unknown Artist",
        album: maskStatus ? "xxxx" : currentTrack.category || "Audio Stream",
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
  }, [currentAudioIndex, audioList, handlePrev, maskStatus]);

  //hande favourite edit
  const handleFavoriteToggle = async () => {
    const currentTrack = audioList[currentAudioIndex];
    const trackId = currentTrack?.id;

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
          crossOrigin="anonymous"
          loop={isLooping}
          onPlay={() => {
            setPause(false);
            retryCountRef.current = 0;
            if (
              audioCtxRef.current &&
              audioCtxRef.current.state === "suspended"
            ) {
              audioCtxRef.current.resume();
            }
          }}
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
                className="w-full h-2 bg-white/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full outline-none focus-none border-none"
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

          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 relative">
            {categoryListClicked && (
              <div
                ref={dropdownRef}
                className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-3 p-4 rounded-2xl flex flex-col gap-2 w-60 md:w-96 h-auto max-h-60 overflow-y-auto bg-white/10 dark:bg-white/5 backdrop-blur-md border-none shadow-lg [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-600 dark:[&::-webkit-scrollbar-thumb]:bg-gray-300"
              >
                <button
                  onClick={() => {
                    setSelectedCategory("");
                    fetchStreamAudio(true, "");
                    setCategoryListClicked(false);
                  }}
                  className={`px-4 py-2 rounded-xl border-none cursor-pointer ${
                    selectedCategory === ""
                      ? "bg-blue-200 dark:bg-blue-700 text-black dark:text-white"
                      : "bg-gray-100 text-black hover:bg-gray-200 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
                  } transition-colors duration-200`}
                >
                  All
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setSelectedCategory(cat?.id);
                      fetchStreamAudio(true, cat?.id);
                      setCategoryListClicked(false);
                    }}
                    className={`px-4 py-2 rounded-xl border-none cursor-pointer ${
                      selectedCategory === cat.id
                        ? "bg-blue-200 dark:bg-blue-700 text-black dark:text-white"
                        : "bg-gray-100 text-black hover:bg-gray-200 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
                    } transition-colors duration-200`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            )}
            <button
              aria-label="filter categories"
              title="Filter Categories"
              data-filter-button
              disabled={isLoading || audioList.length === 0}
              onClick={() => setCategoryListClicked(!categoryListClicked)}
              className={`p-3 rounded-full transition-colors backdrop-blur-md shadow-lg focus-none outline-none border-none ${
                isLoading ? "opacity-50" : ""
              } ${
                categoryListClicked
                  ? `bg-white/30 ring-2 ring-red-400`
                  : `${
                      selectedCategory !== "" && activeCategoryName
                        ? getGradientClass(activeCategoryName)
                        : "bg-white/10"
                    } hover:bg-white/20`
              }`}
            >
              {categoryListClicked ? (
                <X className="w-4 h-4 sm:w-6 sm:h-6 text-red-400" />
              ) : selectedCategory !== "" && activeCategoryName ? (
                <div
                  className={`w-4 h-4 sm:w-6 sm:h-6 flex items-center justify-center`}
                >
                  {activeCategoryName.charAt(0).toUpperCase()}
                </div>
              ) : (
                <Filter
                  className={`w-4 h-4 sm:w-6 sm:h-6 ${
                    selectedCategory !== ""
                      ? "text-blue-400"
                      : "text-black dark:text-white"
                  }`}
                />
              )}
            </button>
            <button
              aria-label="shuffle"
              title="shuffle"
              disabled={isLoading || audioList.length === 0}
              onClick={() => {
                setIsShuffling(!isShuffling);
              }}
              className={`p-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md shadow-lg focus-none outline-none border-none ${isLoading ? "opacity-50" : ""}`}
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
              className={`p-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md shadow-lg focus-none outline-none border-none ${isLoading ? "opacity-50" : ""}`}
            >
              <ChevronLeft className="w-4 h-4 sm:w-6 sm:h-6 text-black dark:text-white" />
            </button>
            <button
              aria-label={pause ? "play" : "pause"}
              title={pause ? "play" : "pause"}
              disabled={isLoading || audioList.length === 0}
              onClick={handleAudio}
              className={`p-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md shadow-lg focus-none outline-none border-none ${isLoading ? "opacity-50" : ""}`}
            >
              {pause ? (
                <Play
                  fill="currentColor"
                  className="w-4 h-4 sm:w-6 sm:h-6 text-black dark:text-white"
                />
              ) : (
                <Pause
                  fill="currentColor"
                  className="w-4 h-4 sm:w-6 sm:h-6 text-black dark:text-white"
                />
              )}
            </button>
            <button
              aria-label="next"
              title="next"
              disabled={isLoading || audioList.length === 0}
              onClick={handleNext}
              className={`p-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md shadow-lg  focus-none outline-none border-none ${isLoading ? "opacity-50" : ""}`}
            >
              <ChevronRight className="w-4 h-4 sm:w-6 sm:h-6 text-black dark:text-white" />
            </button>
            <button
              aria-label="loop"
              title="loop"
              disabled={isLoading || audioList.length === 0}
              onClick={() => setIsLooping(!isLooping)}
              className={`p-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md shadow-lg focus-none outline-none border-none ${isLoading ? "opacity-50" : ""}`}
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
              className={`p-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md shadow-lg focus-none outline-none border-none ${isLoading ? "opacity-50" : ""}`}
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

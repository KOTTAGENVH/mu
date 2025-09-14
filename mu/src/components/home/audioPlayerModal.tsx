import React, { useState, useEffect, useRef, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useCurrentPlay } from "@/contextApi/currentPlay";
import { ChevronLeft, ChevronRight, Filter, Pause, Play, Repeat, Shuffle } from "lucide-react";
import { inter, roboto } from "@/app/fonts";

interface Audio {
  _id: string;
  name: string;
  category: string;
  fileUrl: string;
  favourite: boolean;
}

function AudioPlayerModal({ audios = [] }: { audios?: Audio[] }) {
  const [audioList, setAudioList] = useState<Audio[]>([]);
  const [defaultAudioList, setDefaultAudioList] = useState<Audio[]>([]);
  const [currentAudioIndex, setCurrentAudioIndex] = useState<number>(0);
  const [isLooping, setIsLooping] = useState<boolean>(false);
  const [isShuffling, setIsShuffling] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isFavourite, setFavourite] = useState(false);
  const [isCategory, setCategory] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playerRef = useRef<HTMLDivElement | null>(null);  // Track actual player height to let audio list size around it
  const [isFilterOpen, setFilterOpen] = useState(false);
  const filterBtnRef = useRef<HTMLButtonElement | null>(null);
  const filterMenuRef = useRef<HTMLDivElement | null>(null);
  const preloadedAudiosRef = useRef<Map<string, HTMLAudioElement>>(new Map());   // Lightweight metadata preloading cache following least-recently-used eviction
  const preloadedOrderRef = useRef<string[]>([]);
  const fetchAbortRef = useRef<AbortController | null>(null);   // Track in-flight fetch to allow abort on unmount/navigation
  const PRELOAD_LIMIT = 6; // keep memory usage bounded
  const { toggleId, pause, id } = useCurrentPlay();
  const toggleFilterMenu = () => setFilterOpen((v) => !v);


  const categories = [
    "All",
    "Rap",
    "OldVibes",
    "Classic",
    "LK",
    "Free Style",
    "memory_lane",
    "favourite"
  ];

  useEffect(() => {
    setDefaultAudioList(audios);
    setAudioList(audios);
    setCurrentAudioIndex(audios.length ? 0 : -1);
  }, [audios]);

  // When a card updates the global id, sync the player to that track
  useEffect(() => {
    if (!id) return;
    const idx = audioList.findIndex((a) => a._id === id);
    if (idx !== -1 && idx !== currentAudioIndex) {
      setCurrentAudioIndex(idx);
    }
  }, [id, audioList, currentAudioIndex]);

  //  Monitor outside clicks to close the filter menu
  useEffect(() => {
    if (!isFilterOpen) return;
    const onClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        filterMenuRef.current &&
        !filterMenuRef.current.contains(target) &&
        filterBtnRef.current &&
        !filterBtnRef.current.contains(target)
      ) {
        setFilterOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFilterOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [isFilterOpen]);

  // Category selection handler
  const handlePickCategory = (cat: string) => {
    if (cat === "All") {
      setCategory("");         // reset to all categories
    } else if (cat === "favourite") {
      setFavourite((prev) => !prev); //toggle favourite filter
    } else {
      setCategory(cat);
    }
    setFilterOpen(false);
  };

  const pauseAudio = () => {
    if (audioRef.current) {
      toggleId(audioList[currentAudioIndex]?._id || "", true);
      audioRef.current.pause();
    }
  };

  // Play the previous song or restart the current song if it has played for more than 5 seconds
  const handlePrev = () => {
    const el = audioRef.current;
    if (el && typeof el.currentTime === "number") {
      if (el.currentTime > 5) {
        el.currentTime = 0;
        return;
      }
      setCurrentAudioIndex((prevIndex) => {
        const nextIdx = prevIndex === 0 ? audioList.length - 1 : prevIndex - 1;
        // Update global id so cards/UI reflect the active track
        const nextId = audioList[nextIdx]?._id || "";
        if (nextId) toggleId(nextId, false);
        return nextIdx;
      });
    }
  };

  // Play the next song or shuffle the songs if the shuffle button is enabled
  const handleNext = useCallback(async () => {
    const el = audioRef.current;
    if (el) { el.pause(); el.currentTime = 0; }

    if (isShuffling) {
      const len = audioList.length;
      if (len === 0) return;
      let rand = Math.floor(Math.random() * len);
      // avoid repeating the same track when possible
      if (len > 1 && rand === currentAudioIndex) rand = (rand + 1) % len;
      const nextId = audioList[rand]?._id || "";
      if (nextId) toggleId(nextId, false);
      setCurrentAudioIndex(rand);
      return;
    }

    //  next without shuffle
    const len = audioList.length;
    if (len === 0) return;
    let nextIndex = currentAudioIndex + 1;
    if (nextIndex >= len) nextIndex = 0;
    const nextId = audioList[nextIndex]?._id || "";
    if (nextId) toggleId(nextId, false);
    setCurrentAudioIndex(nextIndex);
  }, [audioList, currentAudioIndex, isShuffling, toggleId]);


  const toggleShuffle = () => {
    setIsShuffling(!isShuffling);
  };

  const toggleLoop = () => {
    if (audioRef.current) {
      audioRef.current.loop = !audioRef.current.loop;
      setIsLooping(audioRef.current.loop);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration);
    }
  };

  // Seek handler
  const handleSeek = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (audioRef.current) {
      const newTime = parseFloat(event.target.value);
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  // Play/pause toggle handler
  const handleAudio = () => {
    if (!pause) {
      pauseAudio();
    } else {
      // Mark as playing in global state
      toggleId(audioList[currentAudioIndex]?._id || "", false);
      // Also try to play immediately within the user gesture to satisfy autoplay policies
      const el = audioRef.current;
      if (el) {
        void el.play().catch((err: unknown) => {
          const name = typeof err === "object" && err && "name" in err ? String((err as { name: unknown }).name) : "";
          const msg = String(err);
          if (name === "AbortError") return; // ignore race conditions
          if (name === "NotAllowedError") return; // autoplay blocked until interaction
          if (/user didn't interact with the document/i.test(msg)) return; // Chrome-specific wording
          if (/interrupted by a new load request/i.test(msg)) return;
          console.error("Error playing audio:", err);
        });
      }
    }
  };

  // Filter favourite
  useEffect(() => {
    if (isFavourite) {
      const favouriteAudios = defaultAudioList.filter(a => a.favourite === true);
      setAudioList(favouriteAudios);
      setCurrentAudioIndex(favouriteAudios.length ? 0 : -1);
    } else {
      setAudioList(defaultAudioList);
    }
  }, [isFavourite, defaultAudioList]);

  useEffect(() => {
    // Filter by category
    if (isCategory !== "") {
      const filtered = defaultAudioList.filter(a => a.category === isCategory);
      setAudioList(filtered);
      if (filtered.length > 0) setCurrentAudioIndex(0);
      else { setCurrentAudioIndex(-1); alert("No audio found in this category"); }
    } else {
      setAudioList(defaultAudioList);
      setCurrentAudioIndex(defaultAudioList.length ? 0 : -1);
    }
  }, [isCategory, defaultAudioList]);


  // Abort any in flight request on unmount
  useEffect(() => {
    const controller = fetchAbortRef.current;
    return () => {
      try {
        controller?.abort();
      } catch { }
    };
  }, []);

  // Preload metadata for neighboring tracks to improve start time
  const preloadMetadata = useCallback((url?: string) => {
    if (!url) return;
    const cache = preloadedAudiosRef.current;
    if (cache.has(url)) return; // already cached
    try {
      const a = new Audio();
      a.preload = "metadata"; // small network footprint
      a.src = url;
      // Trigger metadata fetch
      a.load();
      cache.set(url, a);
      preloadedOrderRef.current.push(url);
      // Trim LRU
      if (preloadedOrderRef.current.length > PRELOAD_LIMIT) {
        const oldest = preloadedOrderRef.current.shift();
        if (oldest) {
          const old = cache.get(oldest);
          if (old) {
            try {
              old.src = ""; // release resource
              old.load();
            } catch { }
          }
          cache.delete(oldest);
        }
      }
    } catch { }
  }, []);

  useEffect(() => {
    if (audioList.length === 0) return;
    const len = audioList.length;
    const idx = currentAudioIndex;
    const next1 = audioList[(idx + 1) % len]?.fileUrl;
    const prev1 = audioList[(idx - 1 + len) % len]?.fileUrl;
    const next2 = audioList[(idx + 2) % len]?.fileUrl;
    const prev2 = audioList[(idx - 2 + len) % len]?.fileUrl;
    preloadMetadata(next1);
    preloadMetadata(prev1);
    preloadMetadata(next2);
    preloadMetadata(prev2);
  }, [currentAudioIndex, audioList, preloadMetadata]);

  // Keep a stable reference to handleNext for listeners
  const handleNextRef = useRef(handleNext);
  useEffect(() => { handleNextRef.current = handleNext; }, [handleNext]);

  // Attach media listeners and initialize values when audio element/src changes
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onLoaded = () => setDuration(el.duration || 0);
    const onDurationChange = () => setDuration(el.duration || 0);
    const onEnded = () => {
      handleNextRef.current();
    };
    // Initialize on bind
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


  // Centralized, safe play/pause-on-ready logic to avoid AbortErrors
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    let cancelled = false;

    // If globally paused, ensure element is paused
    if (pause) {
      try {
        el.pause();
      } catch { }
      return () => {
        cancelled = true;
      };
    }

    const tryPlay = () => {
      if (cancelled) return;
      el.play().catch((err: unknown) => {
        const name = typeof err === "object" && err && "name" in err ? String((err as { name: unknown }).name) : "";
        const msg = String(err);
        if (name === "AbortError") return; // ignore race conditions
        if (name === "NotAllowedError") return; // ignore autoplay policy blocks
        if (/user didn't interact with the document/i.test(msg)) return;
        if (/interrupted by a new load request/i.test(msg)) return;
        console.error("Error playing audio:", err);
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

  useEffect(() => {
    // Validate currentAudioIndex on list update
    if (audioList.length > 0 && currentAudioIndex >= audioList.length) {
      setCurrentAudioIndex(0); // Reset to a valid index
    }
  }, [audioList, currentAudioIndex]);

  // Expose the player's live height as a CSS variable and notify listeners
  useEffect(() => {
    const setPlayerHeight = () => {
      const h = playerRef.current?.offsetHeight ?? 0;
      document.documentElement.style.setProperty("--player-height", `${h}px`);
      // Notify any listeners that sizing changed
      document.dispatchEvent(new CustomEvent("player-size-change", { detail: h }));
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

  return (
    <div ref={playerRef} className="fixed bottom-0 left-0 w-full bg-white/5 backdrop-blur-2xl border-t border-white/10 shadow-2xl">
      {audioList.length > 0 && (
        <audio preload="metadata" ref={audioRef} src="/test.mp3" />
      )}
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <div className="flex flex-col space-y-4">
          <div className="text-center sm:text-left">
            <h2 className={`${inter.className} text-xl font-bold text-black dark:text-white mb-1 tracking-tight`}>
              {audioList[currentAudioIndex]?.name}
            </h2>
            <p className={`${roboto.className} text-md text-black/70 dark:text-white/70 font-medium`}>
              {audioList[currentAudioIndex]?.category === "memory_lane"
                ? "Memory Lane"
                : audioList[currentAudioIndex]?.category}
            </p>
          </div>
          <div className="flex items-center space-x-3 sm:space-x-4">
            <span className={`${roboto.className} text-sm font-medium text-black dark:text-white min-w-[3rem] text-center`}>
              {formatTime(currentTime)}
            </span>

            <div className="flex-1 relative">
              <input
                type="range"
                className="w-full h-2 bg-white/20 rounded-full appearance-none cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none
                  [&::-webkit-slider-thumb]:w-5
                  [&::-webkit-slider-thumb]:h-5
                  [&::-webkit-slider-thumb]:bg-white
                  [&::-webkit-slider-thumb]:rounded-full
                  [&::-webkit-slider-thumb]:shadow-lg
                  [&::-webkit-slider-thumb]:cursor-pointer
                  [&::-webkit-slider-thumb]:transition-all
                  [&::-webkit-slider-thumb]:hover:scale-110
                  [&::-moz-range-thumb]:w-5
                  [&::-moz-range-thumb]:h-5
                  [&::-moz-range-thumb]:bg-white
                  [&::-moz-range-thumb]:rounded-full
                  [&::-moz-range-thumb]:border-none
                  [&::-moz-range-thumb]:shadow-lg
                  [&::-moz-range-thumb]:cursor-pointer"
                min="0"
                max={duration || 0}
                value={currentTime}
                onChange={handleSeek}
                title={`${formatTime(currentTime)} / ${formatTime(duration || 0)}`}
                aria-label="Seek position"
                aria-valuemin={0}
                aria-valuemax={Math.max(0, Math.floor(duration || 0))}
                aria-valuenow={Math.floor(currentTime || 0)}
                aria-valuetext={`${formatTime(currentTime)} of ${formatTime(duration || 0)}`}
                style={{
                  background: `linear-gradient(to right, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.8) ${((currentTime / duration) * 100) || 0}%, rgba(255,255,255,0.2) ${((currentTime / duration) * 100) || 0}%, rgba(255,255,255,0.2) 100%)`
                }}
              />
            </div>

            <span className={`${roboto.className} text-sm font-medium text-black dark:text-white min-w-[3rem] text-center`}>
              {formatTime(duration)}
            </span>
          </div>
          <div className={`${roboto.className} flex flex-wrap items-center justify-center gap-2 sm:gap-3`}>
            <button
              title="Shuffle"
              className="flex items-center justify-center p-3  rounded-full 
                bg-white/10 hover:bg-white/20 active:bg-white/30
                backdrop-blur-md
                text-black dark:text-white
                shadow-lg hover:shadow-xl"
              onClick={toggleShuffle}
            >
              <Shuffle
                className={`w-4 h-4 sm:w-6 sm:h-6 ${isShuffling
                  ? "text-blue-400 dark:text-blue-300"
                  : "text-black dark:text-white"
                  }`}
              />
            </button>
            <button
              title="Previous"
              className="flex items-center justify-center p-3  rounded-full 
                bg-white/10 hover:bg-white/20 active:bg-white/30
                backdrop-blur-md
                text-black dark:text-white
                shadow-lg hover:shadow-xl"
              onClick={handlePrev}
            >
              <ChevronLeft className="w-4 h-4 sm:w-6 sm:h-6" />
            </button>
            <button
              title={pause ? "Play" : "Pause"}
              className="flex items-center justify-center p-3  rounded-full 
                bg-white/10 hover:bg-white/20 active:bg-white/30
                backdrop-blur-md
                text-black dark:text-white
                shadow-lg hover:shadow-xl"
              onClick={handleAudio}
            >
              {pause ? (
                <Play className="w-4 h-4 sm:w-6 sm:h-6" />
              ) : (
                <Pause className="w-4 h-4 sm:w-6 sm:h-6" />
              )}
            </button>
            <button
              title="Next"
              className="flex items-center justify-center p-3 rounded-full 
                bg-white/10 hover:bg-white/20 active:bg-white/30
                backdrop-blur-md border border-white/10
                text-black dark:text-white
                shadow-lg hover:shadow-xl"
              onClick={handleNext}
            >
              <ChevronRight className="w-4 h-4 sm:w-6 sm:h-6" />
            </button>
            <button
              title="Loop"
              className="flex items-center justify-center p-3 rounded-full 
                bg-white/10 hover:bg-white/20 active:bg-white/30
                backdrop-blur-md border border-white/10
                text-black dark:text-white
                shadow-lg hover:shadow-xl"
              onClick={toggleLoop}
            >
              <Repeat
                className={`w-4 h-4 sm:w-6 sm:h-6 ${isLooping
                  ? "text-blue-400 dark:text-blue-300"
                  : "text-black dark:text-white"
                  }`}
              />
            </button>
            <div className="relative">
              <AnimatePresence>
                {isFilterOpen && (
                  <motion.div
                    ref={filterMenuRef}
                    role="menu"
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="absolute bottom-full right-0 mb-3 w-48 origin-bottom-right
                      bg-white/85 dark:bg-slate-800/85 backdrop-blur-2xl 
                      border border-black/20 dark:border-white/20
                      rounded-2xl shadow-2xl overflow-hidden
                      [backdrop-filter:blur(20px)_saturate(1.5)_brightness(0.9)]
                      dark:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.1)]
                      shadow-[0_25px_50px_-12px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(0,0,0,0.1)]"
                  >
                    <div className="px-4 py-3 border-b border-black/20 dark:border-white/20 bg-white/[0.2] dark:bg-black/[0.2]">
                      <h3 className="text-lg font-semibold text-black dark:text-white">
                        Filter Categories
                      </h3>
                    </div>
                    <div className="max-h-64 overflow-y-auto p-2            [&::-webkit-scrollbar]:w-2
                      [&::-webkit-scrollbar-track]:rounded-none
      [&::-webkit-scrollbar-track]:bg-bg-gradient-one
      [&::-webkit-scrollbar-thumb]:rounded-none
      [&::-webkit-scrollbar-thumb]:bg-bg-gradient-six
      dark:[&::-webkit-scrollbar-track]:bg-neutral-700
      dark:[&::-webkit-scrollbar-thumb]:bg-neutral-500">
                      {categories.map((cat) => {
                        const isActive =
                          (cat === "All" && isCategory === "") ||
                          (cat !== "All" && cat !== "favourite" && isCategory === cat) ||
                          (cat === "favourite" && isFavourite);

                        return (
                          <button
                            key={cat}
                            role="menuitem"
                            className={`w-full text-left px-3 py-2.5 rounded-xl text-lg
                              font-medium transition-all duration-150
                              hover:bg-black/20 dark:hover:bg-white/20 active:bg-black/30 dark:active:bg-white/30
                              ${isActive
                                ? "bg-black/20 dark:bg-white/20 text-blue-600 dark:text-blue-400"
                                : "text-black dark:text-white"
                              }`}
                            onClick={() => handlePickCategory(cat)}
                          >
                            {cat === "memory_lane" ? "Memory Lane" :
                              cat.charAt(0).toUpperCase() + cat.slice(1)}
                          </button>
                        );
                      })}
                    </div>
                    <div className="p-2 border-t border-black/20 dark:border-white/20 bg-white/[0.2] dark:bg-black/[0.2]">
                      <button
                        className="w-full text-left px-3 py-2.5 rounded-xl text-lg
                          font-medium text-red-500 dark:text-red-400
                          hover:bg-red-500/20 active:bg-red-500/30
                          transition-all duration-150"
                        onClick={() => {
                          setCategory("");
                          setFavourite(false);
                          setFilterOpen(false);
                        }}
                      >
                        Clear Filters
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                ref={filterBtnRef}
                title="Filter"
                aria-haspopup="menu"
                aria-expanded={isFilterOpen}
                className="flex items-center justify-center p-3  rounded-full 
                  bg-white/10 hover:bg-white/20 active:bg-white/30
                  backdrop-blur-md border border-white/10
                  text-black dark:text-white
                  shadow-lg hover:shadow-xl"
                onClick={toggleFilterMenu}
              >
                <Filter className="w-4 h-4 sm:w-6 sm:h-6" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AudioPlayerModal;

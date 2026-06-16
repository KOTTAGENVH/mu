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
  Volume2,
  VolumeX,
  Music2,
  Loader2,
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
import ControlBtn from "./controlBtn";
import AudioVisualizer from "./audioVizualizer";

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

const URL_FRESH_MS = 50 * 60 * 1000;

  const normalizeTrack = (track: any): AudioItem => ({
    id: track.id,
    name: track.name,
    artist: track.artist,
    category:
      typeof track.category === "string"
        ? track.category
        : (track.category?.name ?? track.categotry?.name ?? ""),
    fileUrl: track.fileUrl,
    favourite: track.favourite,
    fetchedAt: track.fetchedAt ?? Date.now(),
  });


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
  const [volume, setVolume] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [showVolume, setShowVolume] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playerRef = useRef<HTMLDivElement | null>(null);
  const [pause, setPause] = useState<boolean>(true);
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const currentTrackUrl = audioList[currentAudioIndex]?.fileUrl;
  const isRecovering = useRef(false);
  const recoveryTimeRef = useRef<number | null>(null);
  const isLoadingRef = useRef(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const lastCountedTrackIdRef = useRef<string | null>(null);
  const retryCountRef = useRef(0);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const compressorRef = useRef<DynamicsCompressorNode | null>(null);
  const pannerRef = useRef<StereoPannerNode | null>(null);
  const audioListRef = useRef<AudioItem[]>([]);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const filtersRef = useRef<Record<string, BiquadFilterNode>>({});
  const currentAudioIndexRef = useRef<number>(currentAudioIndex);
  const selectedCategoryRef = useRef(selectedCategory);
  const volumeRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  const activeCategoryName =
    categories.find((cat) => cat.id === selectedCategory)?.name || "";
  const beginDrag = () => {
    isDraggingRef.current = true;
  };
  const endDrag = () => {
    isDraggingRef.current = false;
  };

  useEffect(() => {
    selectedCategoryRef.current = selectedCategory;
  }, [selectedCategory]);

  useEffect(() => {
    audioListRef.current = audioList;
  }, [audioList]);

  useEffect(() => {
    currentAudioIndexRef.current = currentAudioIndex;
  }, [currentAudioIndex]);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        showVolume &&
        volumeRef.current &&
        !volumeRef.current.contains(e.target as Node)
      ) {
        setShowVolume(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showVolume]);

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

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;

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
        if (prevNode) prevNode.connect(filter);
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
    try {
      panner.disconnect();
    } catch (e) {}

    if (useCompressor) {
      source.connect(compressor);
      compressor.connect(firstFilter);
    } else {
      compressor.disconnect();
      source.connect(firstFilter);
    }
    lastFilter.connect(panner);
    if (analyserRef.current) {
      try {
        analyserRef.current.disconnect();
      } catch {}
      panner.connect(analyserRef.current);
      analyserRef.current.connect(audioCtxRef.current.destination);
    } else {
      panner.connect(audioCtxRef.current.destination);
    }
  }, [useCompressor, audioList.length]);

  useEffect(() => {
    Object.entries(eqValues).forEach(([freq, gain]) => {
      if (filtersRef.current[freq]) filtersRef.current[freq].gain.value = gain;
    });
  }, [eqValues]);

  useEffect(() => {
    if (pannerRef.current) pannerRef.current.pan.value = pan;
  }, [pan]);

  useEffect(() => {
    if (!categoryListClicked) return;
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Element | null;
      if (!target) return;
      if (target.closest("[data-dropdown-content]")) return;
      setCategoryListClicked(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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
      isLoadingRef.current = true;
      try {
        setIsLoadingSync(true);
        const currentSong = audioListRef.current[currentAudioIndexRef.current];
        const response = await streamSongs(currentSong?.artist, category);
        const data = await response;
        if (data && data.success) {
          const newUploads = data.uploads.map(normalizeTrack);
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
      if (data.success) setCategories(data.category);
      else setCategories([]);
    } catch (error) {
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
        if (data && data.success)
          return { ...data.track, fetchedAt: Date.now() ?? null };
        else return null;
      } catch (error) {
        alert("Error in fetchStreamAudioById (Single fetch failed)");
        return null;
      } finally {
        setIsLoadingSync(false);
      }
    },
    [],
  );

  const ensureFreshUrl = useCallback(
    async (index: number): Promise<string | null> => {
      const track = audioListRef.current[index];
      if (!track?.id) return null;
      const age = Date.now() - (track.fetchedAt ?? 0);
      if (age < URL_FRESH_MS) return track.fileUrl;

      const fresh = await fetchStreamAudioById(track.id);
      if (!fresh?.fileUrl) return null;

      setAudioList((prev) => {
        const list = [...prev];
        if (list[index]) {
          list[index] = {
            ...list[index],
            fileUrl: fresh.fileUrl,
            fetchedAt: Date.now(),
          };
        }
        return list;
      });

      if (audioListRef.current[index]) {
        audioListRef.current = audioListRef.current.map((t, i) =>
          i === index
            ? { ...t, fileUrl: fresh.fileUrl, fetchedAt: Date.now() }
            : t,
        );
      }

      return fresh.fileUrl;
    },
    [fetchStreamAudioById],
  );

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    if (pause) {
      try {
        el.pause();
      } catch {}
      return () => {
        cancelled = true;
      };
    }

    const start = async () => {
      const savedTime = el.currentTime;

      const freshUrl = await ensureFreshUrl(currentAudioIndexRef.current);
      if (cancelled || !freshUrl) return;

      const needsReload = el.currentSrc !== freshUrl;
      if (needsReload) {
        el.src = freshUrl;
        el.load();
        if (savedTime > 0 && recoveryTimeRef.current === null) {
          recoveryTimeRef.current = savedTime;
        }
      }

      if (audioCtxRef.current?.state === "suspended")
        audioCtxRef.current.resume();

      const tryPlay = () => {
        if (cancelled) return;
        if (recoveryTimeRef.current !== null) {
          el.currentTime = recoveryTimeRef.current;
          recoveryTimeRef.current = null;
        }
        el.play().catch((err) => {
          if (err.name !== "AbortError") {
            console.error("Play failed:", err);
          }
        });
      };

      if (el.readyState >= 3) tryPlay();
      else {
        const onCanPlay = () => {
          el.removeEventListener("canplay", onCanPlay);
          tryPlay();
        };
        el.addEventListener("canplay", onCanPlay);
        timeoutId = setTimeout(() => {
          el.removeEventListener("canplay", onCanPlay);
          if (!cancelled) tryPlay();
        }, 3000);
      }
    };

    start();
    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [currentAudioIndex, pause, ensureFreshUrl]);

  const handleSkipPlayCount = useCallback(
    async (id: string, action: "skip" | "play") => {
      try {
        const response = await updateSkipPlayCount(id, action);
        if (!response.success)
          throw new Error(response.message || "Failed to update skip count");
      } catch (error) {
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
            alert("An error occurred while updating skip count.");
          });
        }
      }
    }

    if (isShuffling) {
      let rand = Math.floor(Math.random() * len);
      if (len > 1 && rand === currentAudioIndex) rand = (rand + 1) % len;
      const nextId = currentList[rand]?.id || "";
      if (nextId) handleId(nextId);
      setCurrentAudioIndex(rand);
      return;
    }
    const nextIndex = currentAudioIndex + 1;
    if (nextIndex >= len) {
      setIsLoadingSync(true);

      const currentSong = currentList[currentAudioIndex];
      const response = await streamSongs(
        currentSong?.artist,
        selectedCategoryRef.current || undefined,
      );

      const moreTracks = Array.isArray(response) ? response : response?.uploads;

      if (moreTracks && moreTracks.length > 0) {
        const maxHistory = 30;
        const previousTracksToKeep = currentList.slice(-maxHistory);
        const stampedTracks = moreTracks.map(normalizeTrack);

        const newList = [...previousTracksToKeep, ...stampedTracks];
        const newTrackIndex = previousTracksToKeep.length;
        const nextId = moreTracks[0]?.id || "";

        setAudioList(newList);
        setCurrentAudioIndex(newTrackIndex);
        setPause(false);
        if (nextId) handleId(nextId);
      } else {
        setCurrentAudioIndex(0);
      }
      setIsLoadingSync(false);
      return;
    }
    const nextId = currentList[nextIndex]?.id || "";
    if (nextId) handleId(nextId);
    setCurrentAudioIndex(nextIndex);
  }, [currentAudioIndex, isShuffling, handleId, handleSkipPlayCount]);

  const handleNextRef = useRef(handleNext);
  useEffect(() => {
    handleNextRef.current = handleNext;
  }, [handleNext]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onLoaded = () => {
      setDuration(el.duration || 0);
      const id = audioListRef.current[currentAudioIndex]?.id;
      if (id && lastCountedTrackIdRef.current !== id) {
        lastCountedTrackIdRef.current = id;
        handleSkipPlayCount(id, "play").catch(() => {});
      }
    };
    const onDurationChange = () => setDuration(el.duration || 0);
    const onEnded = () => {
      if (handleNextRef.current) handleNextRef.current();
    };

    const onWaiting = () => setIsBuffering(true);
    const onStalled = () => setIsBuffering(true);
    const onCanPlay = () => setIsBuffering(false);
    const onPlaying = () => setIsBuffering(false);

    const handleTimeUpdate = () => {
      if (!isDraggingRef.current) setCurrentTime(el.currentTime);
    };

    el.addEventListener("waiting", onWaiting);
    el.addEventListener("stalled", onStalled);
    el.addEventListener("canplay", onCanPlay);
    el.addEventListener("playing", onPlaying);
    el.addEventListener("timeupdate", handleTimeUpdate);
    el.addEventListener("loadedmetadata", onLoaded);

    el.addEventListener("durationchange", onDurationChange);
    el.addEventListener("ended", onEnded);
    return () => {
      el.removeEventListener("waiting", onWaiting);
      el.removeEventListener("stalled", onStalled);
      el.removeEventListener("canplay", onCanPlay);
      el.removeEventListener("playing", onPlaying);
      el.removeEventListener("durationchange", onDurationChange);
      el.removeEventListener("ended", onEnded);
      el.removeEventListener("timeupdate", handleTimeUpdate);
      el.removeEventListener("loadedmetadata", onLoaded);
    };
  }, [currentTrackUrl, currentAudioIndex, handleSkipPlayCount]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeAttribute("src");
        audioRef.current.load();
      }
      if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
        audioCtxRef.current.close().catch((err) => {
          console.error("Error closing AudioContext on unmount", err);
        });
      }
    };
  }, []);

  const handlePrev = useCallback(() => {
    const el = audioRef.current;
    if (el && typeof el.currentTime === "number" && el.currentTime > 5) {
      el.currentTime = 0;
      el.play().catch(() => {});
      setPause(false);
      return;
    }
    el?.play().catch(() => {});
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
    if (audioCtxRef.current && audioCtxRef.current.state === "suspended")
      audioCtxRef.current.resume();
    if (pause) el.play().catch(() => {});
    else el.pause();
    setPause((prev) => !prev);
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
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
        recoveryTimeRef.current = savedTime;

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

        const el = audioRef.current;
        if (!el) {
          cleanupRecovery();
          return;
        }

        el.src = currentTrackResult.data.fileUrl;
        el.load();

        const playWhenReady = () => {
          if (recoveryTimeRef.current !== null) {
            try {
              el.currentTime = recoveryTimeRef.current;
            } catch {}
            recoveryTimeRef.current = null;
          }
          if (audioCtxRef.current?.state === "suspended") {
            audioCtxRef.current.resume().catch(() => {});
          }

          el.play()
            .then(() => {
              setPause(false);
              retryCountRef.current = 0;
            })
            .catch((err) => {
              if (err.name !== "AbortError")
                console.warn("Recovery play failed:", err);
              setPause(true);
            })
            .finally(() => {
              cleanupRecovery();
            });
        };

        if (el.readyState >= 3) {
          playWhenReady();
        } else {
          const onReady = () => {
            el.removeEventListener("canplay", onReady);
            clearTimeout(safety);
            playWhenReady();
          };
          const safety = setTimeout(() => {
            el.removeEventListener("canplay", onReady);
            playWhenReady();
          }, 5000);
          el.addEventListener("canplay", onReady);
        }
      } else {
        throw new Error("Empty track received during recovery");
      }
    } catch (error) {
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
          const newTrackAsItem: AudioItem = normalizeTrack({
            ...newTrack,
            fetchedAt: newTrack.fetchedAt || Date.now(),
          });
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
      navigator.mediaSession.setActionHandler("play", () => setPause(false));
      navigator.mediaSession.setActionHandler("pause", () => setPause(true));
      navigator.mediaSession.setActionHandler("previoustrack", () =>
        handlePrev(),
      );
      navigator.mediaSession.setActionHandler("nexttrack", () => {
        if (handleNextRef.current) handleNextRef.current();
      });
    }
  }, [currentAudioIndex, audioList, handlePrev, maskStatus]);

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

  const currentTrack = audioList[currentAudioIndex];
  const rawCat = currentTrack?.category as unknown;

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;
  const trackName = maskStatus ? "xxxx" : (currentTrack?.name ?? "");
  const artistName = maskStatus ? "mubynk" : (currentTrack?.artist ?? "");
  const categoryName = maskStatus
    ? "xxxx"
    : typeof rawCat === "string"
      ? rawCat
      : ((rawCat as any)?.name ?? "");
  const gradientClass = getGradientClass(currentTrack?.name ?? "");

  return (
    <div
      ref={playerRef}
      className="fixed bottom-0 left-0 w-full bg-zinc-100 dark:bg-zinc-900 border-t border-white/10 shadow-2xl z-50"
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
            )
              audioCtxRef.current.resume();
          }}
          onPause={() => setPause(true)}
          onError={handleAudioError}
        />
      )}

      <div className="absolute top-0 left-0 w-full h-[2px] bg-black/5 dark:bg-white/5 overflow-hidden">
        <div
          className="h-full bg-black/40 dark:bg-white/40 transition-all duration-300"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex flex-col gap-2 sm:hidden">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-lg ${gradientClass} flex items-center justify-center flex-shrink-0`}
            >
              {isLoading || isBuffering ? (
                <div className="w-full h-full bg-black/10 dark:bg-white/10 rounded-lg" />
              ) : (
                <Music2 className="w-5 h-5 text-black dark:text-white" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              {isLoading || isBuffering || audioList.length === 0 ? (
                <>
                  <div className="h-4 w-32 bg-black/10 dark:bg-white/10 rounded animate-pulse mb-1" />
                  <div className="h-3 w-20 bg-black/5 dark:bg-white/5 rounded animate-pulse" />
                </>
              ) : (
                <>
                  <h2
                    className={`${inter.className} text-sm font-semibold text-black dark:text-white truncate`}
                    title={trackName}
                  >
                    {trackName || "—"}
                  </h2>
                  <div className="group relative min-w-0">
                    <p
                      className={`${roboto.className} text-xs text-black/50 dark:text-white/50 truncate cursor-default`}
                    >
                      {artistName || "Unknown Artist"}
                    </p>
                    {categoryName && (
                      <span
                        className={`${roboto.className} pointer-events-none absolute left-0 bottom-full mb-1 z-50 whitespace-nowrap rounded-lg px-2 py-1 text-[10px]
        bg-zinc-800 text-white dark:bg-zinc-100 dark:text-black shadow-lg
        opacity-0 translate-y-1 transition-all duration-150
        group-hover:opacity-100 group-hover:translate-y-0`}
                      >
                        {categoryName}
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>

            <ControlBtn
              label="favorite"
              title={
                isFavorite ? "Remove from favourites" : "Add to favourites"
              }
              disabled={isLoading || isBuffering || audioList.length === 0}
              onClick={handleFavoriteToggle}
              active={isFavorite}
            >
              <Heart
                className={`w-4 h-4 ${isFavorite ? "text-red-500 fill-red-500" : "text-black/40 dark:text-white/60"}`}
              />
            </ControlBtn>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`${roboto.className} text-[10px] tabular-nums text-black/40 dark:text-white/40 w-8 text-right flex-shrink-0`}
            >
              {formatTime(currentTime)}
            </span>
            <div className="flex-1 relative h-4 flex items-center">
              <div className="w-full h-1 bg-black/5 dark:bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-black/40 dark:bg-white/40 rounded-full"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <input
                disabled={isLoading || isBuffering || audioList.length === 0}
                type="range"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                min="0"
                max={duration || 0}
                step="0.1"
                value={currentTime}
                onMouseDown={beginDrag}
                onMouseUp={endDrag}
                onTouchStart={beginDrag}
                onTouchEnd={endDrag}
                onChange={(e) => {
                  const newTime = parseFloat(e.target.value);
                  setCurrentTime(newTime);
                  if (audioRef.current) audioRef.current.currentTime = newTime;
                }}
              />
            </div>
            <span
              className={`${roboto.className} text-[10px] tabular-nums text-black/50 dark:text-white/40 w-8 flex-shrink-0`}
            >
              {formatTime(duration)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <ControlBtn
              label="shuffle"
              title="Shuffle"
              disabled={isLoading || isBuffering || audioList.length === 0}
              active={isShuffling}
              onClick={() => setIsShuffling(!isShuffling)}
              small
            >
              <Shuffle className="w-4 h-4" />
            </ControlBtn>

            <div className="flex items-center gap-1">
              <ControlBtn
                label="previous"
                title="Previous"
                disabled={isLoading || isBuffering || audioList.length === 0}
                onClick={handlePrev}
              >
                <ChevronLeft className="w-5 h-5" />
              </ControlBtn>

              <button
                aria-label={pause ? "play" : "pause"}
                disabled={isLoading || isBuffering || audioList.length === 0}
                onClick={handleAudio}
                className={`w-12 h-12 rounded-full flex items-center justify-center border-none transition-all
            ${
              isLoading || isBuffering || audioList.length === 0
                ? "opacity-40 bg-white/10"
                : "bg-gray-100 dark:bg-gray-800 active:scale-95"
            }`}
              >
                {isLoading || isBuffering ? (
                  <Loader2 className="w-5 h-5 animate-spin text-black dark:text-white" />
                ) : pause ? (
                  <Play
                    fill="#000"
                    className="w-5 h-5 text-black dark:text-white translate-x-0.5"
                  />
                ) : (
                  <Pause
                    fill="#000"
                    className="w-5 h-5 text-black dark:text-white"
                  />
                )}
              </button>

              <ControlBtn
                label="next"
                title="Next"
                disabled={isLoading || isBuffering || audioList.length === 0}
                onClick={handleNext}
              >
                <ChevronRight className="w-5 h-5" />
              </ControlBtn>
            </div>

            <div className="flex items-center gap-1">
              <ControlBtn
                label="loop"
                title="Loop"
                disabled={isLoading || isBuffering || audioList.length === 0}
                active={isLooping}
                onClick={() => setIsLooping(!isLooping)}
                small
              >
                <Repeat className="w-4 h-4" />
              </ControlBtn>
              <div className="relative">
                {categoryListClicked && (
                  <div
                    ref={dropdownRef}
                    data-dropdown-content
                    className="absolute z-50 bottom-full right-0 mb-3 p-3 flex flex-col gap-1.5 w-52 max-h-56 overflow-y-auto bg-white/10 dark:bg-black/10 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-white/10 shadow-2xl"
                  >
                    <p
                      className={`${roboto.className} text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2 px-1`}
                    >
                      Category
                    </p>
                    <button
                      onClick={() => {
                        setSelectedCategory("");
                        fetchStreamAudio(true, "");
                        setCategoryListClicked(false);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-sm text-left border-none cursor-pointer ${
                        !selectedCategory
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
                          : "text-black dark:text-white"
                      }`}
                    >
                      All
                    </button>
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => {
                          setSelectedCategory(cat.id);
                          fetchStreamAudio(true, cat.id);
                          setCategoryListClicked(false);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-sm text-left border-none cursor-pointer ${
                          selectedCategory === cat.id
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
                            : "text-black dark:text-white"
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                )}
                <ControlBtn
                  label="filter"
                  title="Filter Categories"
                  data-filter-button
                  disabled={isLoading || isBuffering || audioList.length === 0}
                  active={categoryListClicked || selectedCategory !== ""}
                  onClick={() => setCategoryListClicked(!categoryListClicked)}
                  small
                >
                  {categoryListClicked ? (
                    <X className="w-4 h-4 text-red-400" />
                  ) : selectedCategory !== "" && activeCategoryName ? (
                    <span className="text-xs font-bold text-black dark:text-white">
                      {activeCategoryName.charAt(0).toUpperCase()}
                    </span>
                  ) : (
                    <Filter className="w-4 h-4" />
                  )}
                </ControlBtn>
              </div>
            </div>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-3 sm:gap-5">
          <div className="flex items-center gap-3 sm:gap-5 flex-1 basis-0 min-w-0">
            <div className="relative flex-shrink-0 hidden xs:flex sm:flex">
              <div
                className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl ${gradientClass} flex items-center justify-center shadow-none overflow-hidden transition-all duration-500`}
                style={{
                  boxShadow: !pause
                    ? "0 0 18px rgba(255,255,255,0.15), 0 4px 16px rgba(0,0,0,0.5)"
                    : "0 4px 16px rgba(0,0,0,0.4)",
                }}
              >
                {isLoading ? (
                  <div className="w-full h-full bg-black/10 dark:bg-white/10" />
                ) : (
                  <>
                    <Music2 className="w-6 h-6 text-black dark:text-white" />
                  </>
                )}
              </div>
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              {isLoading || isBuffering || audioList.length === 0 ? (
                <div className="space-y-2">
                  <div className="h-5 w-44 bg-black/10 dark:bg-white/10 rounded-md animate-pulse" />
                  <div className="h-3.5 w-28 bg-black/5 dark:bg-white/5 rounded-md animate-pulse" />
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="overflow-hidden">
                      <h2
                        className={`${inter.className} text-sm sm:text-base font-semibold text-black dark:text-white leading-tight truncate`}
                        title={trackName}
                      >
                        {trackName || "—"}
                      </h2>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="group relative min-w-0">
                        <p
                          className={`${roboto.className} text-xs text-black/50 dark:text-white/50 truncate cursor-default`}
                        >
                          {artistName || "Unknown Artist"}
                        </p>
                        {categoryName && (
                          <span
                            className={`${roboto.className} pointer-events-none absolute left-0 bottom-full mb-1 z-50 whitespace-nowrap rounded-lg px-2 py-1 text-[10px]
        bg-zinc-800 text-white dark:bg-zinc-100 dark:text-black shadow-lg
        opacity-0 translate-y-1 transition-all duration-150
        group-hover:opacity-100 group-hover:translate-y-0`}
                          >
                            {categoryName}
                          </span>
                        )}
                      </div>
                      {audioList.length > 1 && (
                        <span className="text-[10px] text-black/40 dark:text-white/25 font-mono tabular-nums flex-shrink-0">
                          {currentAudioIndex + 1}/{audioList.length}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="hidden lg:flex flex-shrink-0">
                    <AudioVisualizer analyser={analyserRef.current} />
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col items-center gap-2 flex-shrink-0 text-black/70 dark:text-white/70">
            <div className="flex items-center gap-1 sm:gap-2">
              <ControlBtn
                label="shuffle"
                title="Shuffle"
                disabled={isLoading || isBuffering || audioList.length === 0}
                active={isShuffling}
                onClick={() => setIsShuffling(!isShuffling)}
                small
              >
                <Shuffle className="w-4 h-4" />
              </ControlBtn>

              <ControlBtn
                label="previous"
                title="Previous"
                disabled={isLoading || isBuffering || audioList.length === 0}
                onClick={handlePrev}
              >
                <ChevronLeft className="w-5 h-5" />
              </ControlBtn>
              <button
                aria-label={pause ? "play" : "pause"}
                title={pause ? "Play" : "Pause"}
                disabled={isLoading || isBuffering || audioList.length === 0}
                onClick={handleAudio}
                className={`relative inline-flex items-center justify-center w-14 h-14 rounded-full border-none cursor-pointer outline-none transition-all duration-150 ease-out focus-none
                  ${
                    isLoading || isBuffering || audioList.length === 0
                      ? "opacity-40 cursor-not-allowed bg-white/10 dark:bg-black/10"
                      : "bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
                  }`}
              >
                {isLoading || isBuffering ? (
                  <Loader2 className="w-5 h-5 text-black dark:text-white animate-spin" />
                ) : pause ? (
                  <Play
                    fill="#000"
                    className="w-5 h-5 text-black dark:text-white translate-x-0.5"
                  />
                ) : (
                  <Pause
                    fill="#000"
                    className="w-5 h-5 text-black dark:text-white"
                  />
                )}
              </button>
              <ControlBtn
                label="next"
                title="Next"
                disabled={isLoading || isBuffering || audioList.length === 0}
                onClick={handleNext}
              >
                <ChevronRight className="w-5 h-5" />
              </ControlBtn>
              <ControlBtn
                label="loop"
                title="Loop"
                disabled={isLoading || isBuffering || audioList.length === 0}
                active={isLooping}
                onClick={() => setIsLooping(!isLooping)}
                small
              >
                <Repeat className="w-4 h-4" />
              </ControlBtn>
            </div>
            <div className="flex items-center gap-2 w-full max-w-xs sm:max-w-sm md:max-w-md">
              <span
                className={`${roboto.className} text-[10px] tabular-nums text-black/40 dark:text-white/40 w-8 text-right flex-shrink-0`}
              >
                {formatTime(currentTime)}
              </span>
              <div className="flex-1 relative group h-4 flex items-center">
                <div className="w-full h-1 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-black/40 dark:bg-white/40 rounded-full transition-none"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <input
                  disabled={isLoading || isBuffering || audioList.length === 0}
                  type="range"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-default"
                  min="0"
                  max={duration || 0}
                  step="0.1"
                  value={currentTime}
                  onMouseDown={beginDrag}
                  onMouseUp={endDrag}
                  onTouchStart={beginDrag}
                  onTouchEnd={endDrag}
                  onChange={(e) => {
                    const newTime = parseFloat(e.target.value);
                    setCurrentTime(newTime);
                    if (audioRef.current)
                      audioRef.current.currentTime = newTime;
                  }}
                />
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-black dark:bg-white rounded-full shadow pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                  style={{ left: `calc(${progressPct}% - 6px)` }}
                />
              </div>
              <span
                className={`${roboto.className} text-[10px] tabular-nums text-black/50 dark:text-white/40 w-8 flex-shrink-0`}
              >
                {formatTime(duration)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0 justify-end text-black/70 dark:text-white/70">
            <div ref={volumeRef} className="relative hidden sm:block">
              <ControlBtn
                label={isMuted ? "unmute" : "mute"}
                title={isMuted ? "Unmute" : "Mute"}
                disabled={isLoading || isBuffering || audioList.length === 0}
                onClick={() => {
                  if (!showVolume) setShowVolume(true);
                  else setIsMuted(!isMuted);
                }}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </ControlBtn>
              {showVolume && (
                <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2  bg-white/10 dark:bg-black/10 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-white/10 shadow-2xl rounded-2xl p-3">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={isMuted ? 0 : volume}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      setVolume(v);
                      setIsMuted(v === 0);
                    }}
                    className="w-24 h-1 appearance-none bg-black/10 dark:bg-white/20 rounded-full cursor-pointer
                      [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5
                      [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:bg-blue-500
                      [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow"
                    style={{
                      background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(isMuted ? 0 : volume) * 100}%, rgba(128,128,128,0.2) ${(isMuted ? 0 : volume) * 100}%, rgba(128,128,128,0.2) 100%)`,
                    }}
                  />
                  <span
                    className={`${roboto.className} text-[10px] text-black/60 dark:text-white/50 tabular-nums`}
                  >
                    {Math.round((isMuted ? 0 : volume) * 100)}%
                  </span>
                </div>
              )}
            </div>
            <div className="relative">
              {categoryListClicked && (
                <div
                  ref={dropdownRef}
                  data-dropdown-content
                  className="absolute z-50 bottom-full right-0 mb-3 p-3 flex flex-col gap-1.5 w-52 md:w-72 max-h-56 overflow-y-auto
                    bg-white/10 dark:bg-black/10 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-white/10 shadow-2xl
                    [&::-webkit-scrollbar]:w-1.5
              [&::-webkit-scrollbar-thumb]:rounded-full
              [&::-webkit-scrollbar-thumb]:bg-gray-300
              dark:[&::-webkit-scrollbar-thumb]:bg-gray-600"
                >
                  <p
                    className={`${roboto.className} text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2 px-1`}
                  >
                    Category
                  </p>
                  <button
                    onClick={() => {
                      setSelectedCategory("");
                      fetchStreamAudio(true, "");
                      setCategoryListClicked(false);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-sm text-left border-none cursor-pointer transition-colors duration-150       
                      ${
                        !selectedCategory
                          ? "bg-blue-100 text-blue-700 font-medium dark:bg-blue-900/50 dark:text-blue-300"
                          : "text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                  >
                    All
                  </button>
                  {categories.length === 0 && isLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="w-4 h-4 animate-spin text-black/60 dark:text-white/60" />
                    </div>
                  ) : (
                    categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => {
                          setSelectedCategory(cat.id);
                          fetchStreamAudio(true, cat.id);
                          setCategoryListClicked(false);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-sm text-left border-none cursor-pointer transition-colors duration-150
                              ${
                                selectedCategory === cat.id
                                  ? "bg-blue-100 text-blue-700 font-medium dark:bg-blue-900/50 dark:text-blue-300"
                                  : "text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                              }`}
                      >
                        {cat.name}
                      </button>
                    ))
                  )}
                </div>
              )}
              <ControlBtn
                label="filter categories"
                title="Filter Categories"
                data-filter-button
                disabled={isLoading || isBuffering || audioList.length === 0}
                active={categoryListClicked || selectedCategory !== ""}
                onClick={() => setCategoryListClicked(!categoryListClicked)}
              >
                {categoryListClicked ? (
                  <X className="w-4 h-4 text-red-400" />
                ) : selectedCategory !== "" && activeCategoryName ? (
                  <span className="text-xs font-bold text-black dark:text-white">
                    {" "}
                    {activeCategoryName.charAt(0).toUpperCase()}
                  </span>
                ) : (
                  <Filter className="w-4 h-4" />
                )}
              </ControlBtn>
            </div>
            <ControlBtn
              label="favorite"
              title={
                isFavorite ? "Remove from favourites" : "Add to favourites"
              }
              disabled={isLoading || isBuffering || audioList.length === 0}
              onClick={handleFavoriteToggle}
              active={isFavorite}
            >
              <Heart
                className={`w-4 h-4 transition-all duration-200 ${
                  isFavorite
                    ? "text-red-500 fill-red-500 scale-110"
                    : "text-black/30 dark:text-white/70"
                }`}
              />
            </ControlBtn>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AudioPlayerModal;

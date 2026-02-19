"use client";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useLayoutEffect,
} from "react";
import AudioCard from "./audioCard";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMagnifyingGlass,
  faMusic,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import { motion } from "framer-motion";
import { useModal } from "@/contextApi/modalOpen";
import EditModal from "./editModal";
import CategoryScroll from "./categoryScroll";
import { Roboto } from "next/font/google";

interface Audio {
  _id: string;
  name: string;
  category: string;
  fileUrl: string;
  favourite: boolean;
}

type AudioNorm = Audio & { nameLc: string; categoryLc: string };

const roboto = Roboto({ subsets: ["latin"], weight: ["400", "500", "700"] });

function AudioList({ onLoaded }: { onLoaded?: (list: Audio[]) => void }) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [listMaxH, setListMaxH] = useState<number | undefined>(undefined);
  const [allAudio, setAllAudio] = useState<AudioNorm[] | null>(null);
  const { Modal } = useModal();
  const listRef = useRef<HTMLDivElement | null>(null);
  const isFetchingRef = useRef(false);

  // Debounce search input to avoid filtering on each keystroke
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search), 200);
    return () => clearTimeout(id);
  }, [search]);

  const pushUpstream = useCallback(
    (list: AudioNorm[]) => {
      // AudioNorm is compatible with Audio
      const base: Audio[] = list.map(({ nameLc, categoryLc, ...rest }) => rest);
      onLoaded?.(base);
    },
    [onLoaded],
  );

  // Fetch audio from the API
  const fetchAudio = useCallback(
    async (signal?: AbortSignal) => {
      if (isFetchingRef.current) return;
      try {
        isFetchingRef.current = true;
        setLoading(true);

        const res = await fetch("/api/services/audio", { signal });

        if (res.status === 401) {
          window.location.href = "/";
          return;
        }
        const data = await res.json();
        const normalized: AudioNorm[] = (data.uploads || []).map(
          (a: Audio) => ({
            ...a,
            nameLc: a.name.toLowerCase(),
            categoryLc: a.category.toLowerCase(),
          }),
        );
        setAllAudio(normalized);
        pushUpstream(normalized); //Sen to parent for plater
        try {
          localStorage.setItem("mu_uploads_cache", JSON.stringify(normalized)); // Cache the normalized data
        } catch {
          console.warn("Storage quota exceeded while caching uploads.");
        }
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") {
          // ignore abort errors
        } else {
          console.error("Error fetching audio:", err);
          alert("Error fetching audio. Please try again later.");
        }
      } finally {
        isFetchingRef.current = false;
        setLoading(false);
      }
    },
    [pushUpstream],
  );

  //Get Category from child component to parent component
  const handleChooseCategory = useCallback(
    (category: string) => {
      if (category === selectedCategory) return; // no ops if unchanged
      setSelectedCategory(category);
    },
    [selectedCategory],
  );

  // Preload from cache quickly on mount (normalized if needed)
  useEffect(() => {
    try {
      const cached = localStorage.getItem("mu_uploads_cache");
      if (cached) {
        type RawAudio = Partial<Audio> &
          Partial<Pick<AudioNorm, "nameLc" | "categoryLc">>;
        const rawUnknown = JSON.parse(cached) as unknown;
        const rawArray: RawAudio[] = Array.isArray(rawUnknown)
          ? (rawUnknown as RawAudio[])
          : [];
        const list: AudioNorm[] = rawArray.map((a) => ({
          _id: String(a._id ?? ""),
          name: String(a.name ?? ""),
          category: String(a.category ?? ""),
          fileUrl: String(a.fileUrl ?? ""),
          favourite: Boolean(a.favourite),
          nameLc:
            typeof a.nameLc === "string"
              ? a.nameLc
              : String(a.name ?? "").toLowerCase(),
          categoryLc:
            typeof a.categoryLc === "string"
              ? a.categoryLc
              : String(a.category ?? "").toLowerCase(),
        }));
        setAllAudio(list);
        pushUpstream(list); //  send cached to parent
        setLoading(false);
      }
    } catch {
      console.warn("Storage quota exceeded while caching uploads.");
    }
  }, [pushUpstream]);

  // Memoized filtered list combining category and search
  const filteredAudio = useMemo(() => {
    const base = allAudio ?? [];
    const q = debouncedSearch.trim().toLowerCase();
    const matchCategory = (a: AudioNorm) => {
      if (selectedCategory === "All") return true;
      if (selectedCategory === "Favourite") return a.favourite === true;
      return a.categoryLc === selectedCategory.trim().toLowerCase();
    };
    const matchSearch = (a: AudioNorm) => {
      if (!q) return true;
      return a.nameLc.includes(q) || a.categoryLc.includes(q);
    };
    return base.filter((a) => matchCategory(a) && matchSearch(a));
  }, [allAudio, selectedCategory, debouncedSearch]);

  useEffect(() => {
    const ctl = new AbortController();
    fetchAudio(ctl.signal);
    return () => ctl.abort();
  }, [fetchAudio]);

  // Dynamically size list to fit between header/category and bottom player
  const measureAndSetHeight = useCallback(() => {
    const top = listRef.current?.getBoundingClientRect().top ?? 0;
    const playerVar = getComputedStyle(document.documentElement)
      .getPropertyValue("--player-height")
      .trim();
    const playerH = parseFloat(playerVar || "0") || 0;
    const h = Math.max(120, window.innerHeight - playerH - top - 8);
    setListMaxH(h);
  }, []);

  //useLayoutEffect similar to useEffect but it fires synchronously after all DOM mutations
  useLayoutEffect(() => {
    let raf1 = requestAnimationFrame(() => {
      measureAndSetHeight();

      raf1 = requestAnimationFrame(() => {
        measureAndSetHeight();
      });
    });

    const onResize = () => measureAndSetHeight();
    const onPlayerSize = () => measureAndSetHeight();
    window.addEventListener("resize", onResize);
    document.addEventListener(
      "player-size-change",
      onPlayerSize as EventListener,
    );

    return () => {
      cancelAnimationFrame(raf1);
      window.removeEventListener("resize", onResize);
      document.removeEventListener(
        "player-size-change",
        onPlayerSize as EventListener,
      );
    };
  }, [measureAndSetHeight]);

  useEffect(() => {
    requestAnimationFrame(() => measureAndSetHeight());
  }, [allAudio, selectedCategory, debouncedSearch, measureAndSetHeight]);
  return (
    <div className="justify-center items-center w-auto h-auto mt-20 mx-4 px-3 lg:mx-16 lg:px-6">
      <CategoryScroll onChooseCategory={handleChooseCategory} />
      <div
        className={`dark:text-white bg-transparent  text-black  relative flex-1  rounded-2xl overflow-visible`}
        tabIndex={0}
        onBlur={(e) => {
          const next = e.relatedTarget as Node | null;
          if (!next || !e.currentTarget.contains(next)) {
          }
        }}
      >
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
          }}
          onFocus={() => {}}
          className={`${roboto.className} text-lg w-full p-3 pr-12 pl-4 focus:outline-none dark:placeholder-white dark:text-white text-black placeholder-black dark:placeholder-white bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full cursor-pointer`}
          placeholder="Search Audio"
        />
        {search.length > 0 ? (
          <FontAwesomeIcon
            icon={faTimes}
            onClick={() => {
              setSearch("");
            }}
            className="absolute top-4 right-4 text-red-500 w-5 h-5 cursor-pointer hover:text-red-600 transition-colors duration-200"
          />
        ) : (
          <FontAwesomeIcon
            icon={faMagnifyingGlass}
            className={`absolute top-4 right-4 dark:text-white text-black w-5 h-5`}
          />
        )}
      </div>
      {loading && filteredAudio.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="min-h-[40vh] flex flex-col items-center justify-center text-center py-10"
        >
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-black dark:text-white text-lg font-medium">
            Loading your audio...
          </p>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Please wait a moment
          </span>
        </motion.div>
      )}

      {!loading && filteredAudio?.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="min-h-[40vh] flex flex-col items-center justify-center text-center py-10"
        >
          <FontAwesomeIcon
            icon={faMusic}
            className="w-12 h-12 text-gray-400 dark:text-gray-500 mb-4 animate-bounce"
          />
          <p className="text-black dark:text-white text-lg font-medium">
            No audio found
          </p>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Try a different search or category
          </span>
        </motion.div>
      )}

      <div
        ref={listRef}
        style={{ maxHeight: listMaxH }}
        className="flex-1 min-h-0 overflow-y-auto w-auto flex flex-row flex-wrap justify-center md:justify-around items-center overflow-x-hidden bg-transparent mt-6 p-4 rounded-l-2xl rounded-r-xl
      [&::-webkit-scrollbar]:w-2
      [&::-webkit-scrollbar-track]:rounded-full
      [&::-webkit-scrollbar-track]:bg-bg-gradient-one
      [&::-webkit-scrollbar-thumb]:rounded-full
      [&::-webkit-scrollbar-thumb]:bg-bg-gradient-six
      dark:[&::-webkit-scrollbar-track]:bg-neutral-700
      dark:[&::-webkit-scrollbar-thumb]:bg-neutral-500"
      >
        {filteredAudio?.length > 0 &&
          filteredAudio?.map((audio) => (
            <AudioCard
              key={audio._id}
              idPass={audio._id}
              name={audio.name}
              category={audio.category}
              favourite={audio.favourite}
            />
          ))}
      </div>
      {Modal && <EditModal />}
    </div>
  );
}

export default AudioList;

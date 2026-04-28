"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import AudioCard from "./audioCard";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMusic, faTimes } from "@fortawesome/free-solid-svg-icons";
import { motion, AnimatePresence } from "framer-motion";
import { getAllSongs } from "@/app/api/client/services/audio/api";
import { useSearch } from "@/contextApi/sematicSearch";
import { getAllCategories } from "@/app/api/client/services/categories/api";
import { Search, X, SlidersHorizontal } from "lucide-react";
import AudioPlayerModal from "./audioPlayerModal";
import SkeletonCard from "./skelitonCard";

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

interface PaginationData {
  currentPage: number;
  perPage: number;
  totalAudio: number;
  totalPages: number;
}

interface Category {
  id: string;
  name: string;
}

function AudioList() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [paginationData, setPaginationData] = useState<PaginationData | null>(
    null,
  );
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryPanelOpen, setCategoryPanelOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [allAudio, setAllAudio] = useState<AudioList[] | null>(null);
  const [id, setId] = useState<string | null>(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const listRef = useRef<HTMLDivElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isLoadMore = useRef(false);
  const { sematicSearch } = useSearch();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (debouncedSearch !== undefined) {
      setCurrentPage(1);
      isLoadMore.current = false;
      fetchAudio(debouncedSearch, selectedCategory?.id ?? "");
    }
  }, [debouncedSearch]);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await getAllCategories();
      if (response.success) setCategories(response.category);
      else setCategories([]);
    } catch {
      alert("An error occurred while fetching categories.");
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const fetchAudio = useCallback(
    async (searchTerm: string, category: string, append = false) => {
      try {
        setLoading(true);
        const response = await getAllSongs(
          currentPage,
          2,
          searchTerm,
          category,
          sematicSearch,
        );

        if (response.success) {
          setAllAudio((prev) =>
            append && prev
              ? [
                  ...prev,
                  ...response.uploads.filter(
                    (newItem: { id: string }) =>
                      !prev.some((existing) => existing.id === newItem.id),
                  ),
                ]
              : response.uploads,
          );
          setPaginationData({
            currentPage: response?.pagination?.currentPage || 1,
            perPage: response?.pagination?.perPage,
            totalAudio: response?.pagination?.totalAudio,
            totalPages: response?.pagination?.totalPages,
          });
        } else {
          setAllAudio([]);
        }
      } catch {
        alert("An error occurred while fetching audios.");
      } finally {
        setLoading(false);
      }
    },
    [currentPage, sematicSearch],
  );

  useEffect(() => {
    fetchAudio("", "", isLoadMore.current);
  }, [fetchAudio]);

  useEffect(() => {
    if (!categoryPanelOpen) return;
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        dropdownRef.current?.contains(target) ||
        (event.target as HTMLElement).closest("[data-filter-button]")
      )
        return;
      setCategoryPanelOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [categoryPanelOpen]);

  const handleSearchClear = () => {
    setSearch("");
    setDebouncedSearch("");
    fetchAudio("", selectedCategory?.id ?? "");
  };

  const handleCategorySelect = (cat: Category | null) => {
    setCurrentPage(1);
    isLoadMore.current = false;
    setSelectedCategory(cat);
    fetchAudio(search, cat?.id ?? "");
    setCategoryPanelOpen(false);
  };

  const totalLoaded = allAudio?.length ?? 0;
  const totalAudio = paginationData?.totalAudio ?? 0;

  return (
    <div className="justify-center items-center w-auto h-auto mt-20 mx-4 px-3 lg:mx-16 lg:px-6">
      <div className="relative flex items-center gap-2 w-full">
        <button
          data-filter-button
          title="Filter by category"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={() => setCategoryPanelOpen((v) => !v)}
          className={`flex-none inline-flex items-center justify-center w-10 h-10 rounded-full border-none cursor-pointer transition-colors
            ${
              categoryPanelOpen || selectedCategory
                ? "bg-blue-500 text-white hover:bg-blue-600"
                : "bg-gray-100 text-black hover:bg-gray-200 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
            }`}
        >
          <SlidersHorizontal className="w-4 h-4 stroke-[2.5]" />
        </button>
        <div className={`relative flex-1 transition-all duration-300 `}>
          <Search
            className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-200 pointer-events-none
              ${isSearchFocused ? "text-blue-500" : "text-gray-400 dark:text-gray-500"}`}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            onKeyDown={(e) => {
              if (e.key === "Enter")
                fetchAudio(search, selectedCategory?.id ?? "");
              if (e.key === "Escape") handleSearchClear();
            }}
            className="text-base  w-full pl-10 pr-10 py-3 bg-black/10 dark:bg-white/10 backdrop-blur-sm border-none rounded-2xl
              text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400
              focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-200"
            placeholder="What are you in the mood for?"
          />
          {loading && search.length > 0 && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <svg
                className="w-4 h-4 text-blue-500 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
          )}

          {search.length > 0 && !loading && (
            <button
              onClick={handleSearchClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors duration-200 w-5 h-5 flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {selectedCategory && (
          <motion.div
            initial={{ opacity: 0, y: -6, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -6, height: 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-2 mt-3 overflow-hidden"
          >
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Filtering by:
            </span>
            <button
              onClick={() => handleCategorySelect(null)}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium
                bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300
                hover:bg-blue-200 dark:hover:bg-blue-900 transition-colors"
            >
              {selectedCategory.name}
              <X className="w-3 h-3" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {categoryPanelOpen && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="absolute z-50 mt-2 p-3 w-64 md:w-80 max-h-64 overflow-y-auto
             bg-white/10 dark:bg-black/10 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-white/10 shadow-2xl
              [&::-webkit-scrollbar]:w-1.5
              [&::-webkit-scrollbar-thumb]:rounded-full
              [&::-webkit-scrollbar-thumb]:bg-gray-300
              dark:[&::-webkit-scrollbar-thumb]:bg-gray-600"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2 px-1">
              Categories
            </p>
            <div className="flex flex-col gap-1">
              <button
                onClick={() => handleCategorySelect(null)}
                className={`px-3 py-2 rounded-xl text-sm text-left border-none cursor-pointer transition-colors duration-150
                  ${
                    !selectedCategory
                      ? "bg-blue-100 text-blue-700 font-medium dark:bg-blue-900/50 dark:text-blue-300"
                      : "text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
              >
                All music
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategorySelect(cat)}
                  className={`px-3 py-2 rounded-xl text-sm text-left border-none cursor-pointer transition-colors duration-150
                    ${
                      selectedCategory?.id === cat.id
                        ? "bg-blue-100 text-blue-700 font-medium dark:bg-blue-900/50 dark:text-blue-300"
                        : "text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading && (!allAudio || allAudio.length === 0) && (
        <div className="flex-1 min-h-0 overflow-y-auto w-full grid grid-cols-1 sm:grid-cols-[repeat(auto-fill,minmax(20rem,1fr))] gap-6 content-start overflow-x-hidden bg-transparent mt-6 p-4 rounded-2xl">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {!loading && allAudio?.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: "backOut" }}
          className="min-h-[40vh] flex flex-col items-center justify-center text-center py-10 gap-3"
        >
          <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-1">
            <FontAwesomeIcon
              icon={faMusic}
              className="w-7 h-7 text-gray-400 dark:text-gray-500"
            />
          </div>
          <p className="text-black dark:text-white text-lg font-medium">
            No audio found
          </p>
          <span className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
            Try a different search term or clear the active filter
          </span>
          {(search || selectedCategory) && (
            <button
              onClick={() => {
                setSearch("");
                setDebouncedSearch("");
                setSelectedCategory(null);
                fetchAudio("", "");
              }}
              className="mt-2 px-4 py-2 rounded-xl text-sm bg-gray-100 dark:bg-gray-800 text-black dark:text-white
                hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors border-none cursor-pointer"
            >
              Clear all filters
            </button>
          )}
        </motion.div>
      )}
      <div
        ref={listRef}
        className="flex-1 min-h-0 overflow-y-auto w-full grid grid-cols-1 sm:grid-cols-[repeat(auto-fill,minmax(20rem,1fr))] gap-6 content-start overflow-x-hidden bg-transparent mt-6 p-4 rounded-2xl"
      >
        <AnimatePresence mode="popLayout">
          {allAudio &&
            allAudio.length > 0 &&
            allAudio.map((audio, index) => (
              <motion.div
                key={audio.id}
                layout
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{
                  duration: 0.25,
                  delay: Math.min(index * 0.04, 0.3),
                }}
                className="w-full"
              >
                <AudioCard
                  idPass={audio.id}
                  currentPlayingId={id || ""}
                  name={audio.name}
                  artist={audio.artist}
                  handleId={(id) => setId(id)}
                />
              </motion.div>
            ))}
        </AnimatePresence>
      </div>
      {paginationData && currentPage < paginationData.totalPages && (
        <div className="w-full flex flex-col items-center gap-2 pb-6 mt-2">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Showing {totalLoaded} of {totalAudio} tracks
          </p>
          <div className="w-48 h-1 rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-blue-500 transition-all duration-500"
              style={{
                width: `${totalAudio > 0 ? (totalLoaded / totalAudio) * 100 : 0}%`,
              }}
            />
          </div>
          <button
            onClick={() => {
              isLoadMore.current = true;
              setCurrentPage((p) => p + 1);
            }}
            disabled={loading}
            className="w-36 py-3 mt-1 rounded-full bg-gray-800 dark:bg-gray-700 text-white hover:bg-gray-700 dark:hover:bg-gray-600
              flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed
              transition-all duration-200 active:scale-95 text-sm font-medium"
          >
            {loading ? (
              <svg
                className="w-4 h-4 text-white animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            ) : (
              "Load more"
            )}
          </button>
        </div>
      )}

      <div
        className="h-56 w-full shrink-0 pointer-events-none"
        aria-hidden="true"
      />

      <AudioPlayerModal id={id!} handleId={(id) => setId(id)} />
    </div>
  );
}

export default AudioList;

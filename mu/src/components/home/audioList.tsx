"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import AudioCard from "./audioCard";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMusic, faTimes } from "@fortawesome/free-solid-svg-icons";
import { motion } from "framer-motion";
import { getAllSongs } from "@/app/api/client/services/audio/api";
import { useSearch } from "@/contextApi/sematicSearch";
import { getAllCategories } from "@/app/api/client/services/categories/api";
import Loader from "../loader";
import { Filter, Search } from "lucide-react";
import AudioPlayerModal from "./audioPlayerModal";

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
  const [paginationData, setPaginationData] = useState<PaginationData | null>(
    null,
  );
  const [selectedCategory, setSelectedCategory] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryListClicked, setCategoryListClicked] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [allAudio, setAllAudio] = useState<AudioList[] | null>(null);
  const [id, setId] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isLoadMore = useRef(false);
  const { sematicSearch } = useSearch();

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
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
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const fetchAudio = useCallback(
    async (search: string, category: string, append = false) => {
      try {
        setLoading(true);
        const response = await getAllSongs(
          currentPage,
          2,
          search,
          category,
          sematicSearch,
        );
        const data = await response;

        if (data.success) {
          setAllAudio((prev) =>
            append && prev
              ? [
                  ...prev,
                  ...data.uploads.filter(
                    (newItem: { id: string }) =>
                      !prev.some((existing) => existing.id === newItem.id),
                  ),
                ]
              : data.uploads,
          );
          setPaginationData({
            currentPage: data?.pagination?.currentPage || 1,
            perPage: data?.pagination?.perPage,
            totalAudio: data?.pagination?.totalAudio,
            totalPages: data?.pagination?.totalPages,
          });
        } else {
          setAllAudio([]);
        }
      } catch (error) {
        // console.error("Failed to fetch audios", error);
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

  return (
    <div className="justify-center items-center w-auto h-auto mt-20 mx-4 px-3 lg:mx-16 lg:px-6">
      <div
        className={`dark:text-white bg-transparent text-black relative flex flex-wrap items-center justify-center gap-2 w-full rounded-2xl overflow-visible`}
        tabIndex={0}
      >
        <button
          data-filter-button
          title="Category filter"
          className="hidden md:inline-flex flex-none items-center justify-center w-10 h-10 rounded-full border-none cursor-pointer bg-gray-100 text-black hover:bg-gray-200 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700 transition-colors"
          aria-hidden="true"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={() => {
            setCategoryListClicked((v) => !v);
          }}
        >
          <Filter className="w-4 h-4 stroke-[3]" />
        </button>
        <div className="relative flex-1 min-w-[250px]">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-sm w-full pl-6 pr-10 py-3 bg-black/20 dark:bg-white/20 backdrop-blur-sm border-none rounded-2xl text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-200"
            placeholder="What are you in the mood for?"
          />

          {search.length > 0 && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 w-8 h-8 flex items-center justify-center cursor-pointer hover:text-red-600 transition-colors duration-200"
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          )}
        </div>
        <button
          title="Search"
          className="hidden md:inline-flex flex-none items-center justify-center w-10 h-10 rounded-full border-none cursor-pointer bg-gray-100 text-black hover:bg-gray-200 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700 transition-colors"
          aria-hidden="true"
          onClick={() => {
            fetchAudio(search, "");
          }}
        >
          <Search className="w-4 h-4 stroke-[3]" />
        </button>
      </div>
      <div className="flex flex-row flex-wrap items-center gap-4 mt-4 w-full justify-center">
        <button
          data-filter-button
          title="Category filter"
          className="md:hidden inline-flex flex-none items-center justify-center w-10 h-10 rounded-full border-none cursor-pointer bg-gray-100 text-black hover:bg-gray-200 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700 transition-colors"
          aria-hidden="true"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={() => {
            setCategoryListClicked((v) => !v);
          }}
        >
          <Filter className="w-4 h-4 stroke-[3]" />
        </button>
        <button
          title="Search"
          className="md:hidden flex-none inline-flex items-center justify-center w-10 h-10 rounded-full border-none cursor-pointer bg-gray-100 text-black hover:bg-gray-200 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700 transition-colors"
          aria-hidden="true"
          onClick={() => {
            fetchAudio(search, "");
          }}
        >
          <Search className="w-4 h-4 stroke-[3]" />
        </button>
      </div>

      {categoryListClicked && (
        <div
          ref={dropdownRef}
          className="absolute z-50 mt-2 p-4 rounded-2xl flex flex-col gap-2 justify-center w-60 md:w-96 h-auto max-h-60 overflow-y-auto
    bg-white/10 dark:bg-white/5 backdrop-blur-md border-none shadow-lg"
        >
          <button
            onClick={() => {
              setCurrentPage(1);
              setSelectedCategory("");
              fetchAudio("", "");
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
                setCurrentPage(1);
                setSelectedCategory(cat?.id);
                fetchAudio("", cat?.id);
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
      {loading && allAudio?.length === 0 && (
        <div className="min-h-[40vh] flex flex-col items-center justify-center text-center py-10">
          <Loader />
          <p className="text-black dark:text-white text-lg font-medium">
            Loading your audio...
          </p>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Please wait a moment
          </span>
        </div>
      )}

      {!loading && allAudio?.length === 0 && (
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
        className="justify-items-center justify-center flex-1 min-h-0 overflow-y-auto w-full grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-6 content-start overflow-x-hidden bg-transparent mt-6 p-4 rounded-2xl"
      >
        {allAudio &&
          allAudio.length > 0 &&
          allAudio.map((audio) => (
            <AudioCard
              key={audio.id}
              idPass={audio.id}
              currentPlayingId={id || ""}
              name={audio.name}
              artist={audio.artist}
              handleId={(id) => {
                setId(id);
              }}
            />
          ))}
      </div>
      {paginationData && currentPage < paginationData.totalPages && (
        <div className="w-full flex justify-center pb-6">
          <button
            onClick={() => {
              isLoadMore.current = true;
              setCurrentPage((p) => p + 1);
            }}
            className="w-32 py-3 mt-2 rounded-full bg-gray-800 text-white hover:bg-gray-700"
          >
            Load more
          </button>
        </div>
      )}
      <div
        className="h-56 md:h-48 lg:h-40 w-full shrink-0 pointer-events-none"
        aria-hidden="true"
      />
      <AudioPlayerModal
        id={id!}
        handleId={(id) => {
          setId(id);
        }}
      />
    </div>
  );
}

export default AudioList;

"use client";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import AudioCard from "./audioCard";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMusic } from "@fortawesome/free-solid-svg-icons";
import {
  getAllSongs,
  type SongFilters,
} from "@/app/api/client/services/audio/api";
import FilterPanel, {
  default_filters,
  getFilterChips,
  toApiFilters,
  type Category,
  type FilterState,
} from "./audioFilterPanel";
import { useSearch } from "@/contextApi/sematicSearch";
import { getAllCategories } from "@/app/api/client/services/categories/api";
import { Search, X, SlidersHorizontal } from "lucide-react";
import AudioPlayerModal from "./audioPlayerModal";
import SkeletonCard from "./skelitonCard";
import { useAppleWebkit } from "@/hooks/useAppleWebkit";
import { panelSurface } from "@/lib/surfaceDropdown";

interface Track {
  id: string;
  name: string;
  artist: string;
  category: Category | null;
  fileUrl: string;
  favourite: boolean;
  lastPlayedAt: string | null;
  playCount: number;
  skipCount: number;
}

interface PaginationData {
  currentPage: number;
  perPage: number;
  totalAudio: number;
  totalPages: number;
}

interface Query {
  search: string;
  categoryId: string;
  filters: SongFilters;
  page: number;
}

const pageSize = 12;
const initialQuery: Query = {
  search: "",
  categoryId: "",
  filters: {},
  page: 1,
};

function AudioList() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [paginationData, setPaginationData] = useState<PaginationData | null>(
    null,
  );
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [allAudio, setAllAudio] = useState<Track[] | null>(null);
  const [filters, setFilters] = useState<FilterState>(default_filters);
  const [panelOpen, setPanelOpen] = useState(false);
  const filterButtonRef = useRef<HTMLButtonElement | null>(null);
  const [id, setId] = useState<string | null>(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [query, setQuery] = useState<Query>(initialQuery);
  const reqId = useRef(0);
  const listRef = useRef<HTMLDivElement | null>(null);
  const { sematicSearch } = useSearch();
  const isAppleWebkit = useAppleWebkit();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setQuery((q) =>
      q.search === debouncedSearch
        ? q
        : { ...q, search: debouncedSearch, page: 1 },
    );
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
    async ({ search, categoryId, filters: apiFilters, page }: Query) => {
      const myReq = ++reqId.current;
      const append = page > 1;
      try {
        setLoading(true);
        const response = await getAllSongs(
          page,
          pageSize,
          search,
          categoryId,
          sematicSearch,
          apiFilters,
        );
        if (myReq !== reqId.current) return;

        if (response.success) {
          setAllAudio((prev) =>
            append && prev
              ? [
                  ...prev,
                  ...response.uploads.filter(
                    (n: { id: string }) => !prev.some((e) => e.id === n.id),
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
        if (myReq === reqId.current)
          alert("An error occurred while fetching audios.");
      } finally {
        if (myReq === reqId.current) setLoading(false);
      }
    },
    [sematicSearch],
  );

  useEffect(() => {
    fetchAudio(query);
  }, [query, fetchAudio]);

  const applyFilters = useCallback((next: FilterState) => {
    setFilters(next);
    setQuery((q) => ({
      ...q,
      categoryId: next.category?.id ?? "",
      filters: toApiFilters(next),
      page: 1,
    }));
    setPanelOpen(false);
  }, []);

  const closePanel = useCallback(() => setPanelOpen(false), []);
  const chips = useMemo(() => getFilterChips(filters), [filters]);

  const clearEverything = () => {
    setSearch("");
    setDebouncedSearch("");
    setFilters(default_filters);
    setQuery(initialQuery);
  };

  const handleFavouriteChange = useCallback(
    (trackId: string, favourite: boolean) => {
      setAllAudio((prev) =>
        prev
          ? prev.map((a) => (a.id === trackId ? { ...a, favourite } : a))
          : prev,
      );
    },
    [],
  );

  const maxEngagement = useMemo(
    () =>
      Math.max(
        1,
        ...(allAudio ?? []).map((a) => (a.playCount ?? 0) + (a.skipCount ?? 0)),
      ),
    [allAudio],
  );

  const handleSearchClear = () => {
    setSearch("");
  };

  const totalLoaded = allAudio?.length ?? 0;
  const totalAudio = paginationData?.totalAudio ?? 0;

  return (
    <div className="justify-center items-center w-auto h-auto mt-20 mx-4 px-3 lg:mx-16 lg:px-6">
      <div className="relative flex items-center gap-2 w-full">
        <button
          ref={filterButtonRef}
          type="button"
          onClick={() => setPanelOpen((v) => !v)}
          aria-haspopup="dialog"
          aria-expanded={panelOpen}
          aria-label={
            chips.length ? `Filters, ${chips.length} active` : "Filters"
          }
          title="Filters"
          className={`relative flex-none inline-flex h-12 w-12 items-center justify-center rounded-2xl border-none cursor-pointer transition-colors
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60
            ${
              panelOpen || chips.length > 0
                ? "bg-blue-500 text-white hover:bg-blue-600"
                : "bg-black/10 text-black hover:bg-black/15 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
            }`}
        >
          <SlidersHorizontal className="h-4 w-4 stroke-[2.5]" />
          {chips.length > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-white px-1 text-[11px] font-bold text-blue-600 shadow">
              {chips.length}
            </span>
          )}
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

        <FilterPanel
          open={panelOpen}
          onClose={closePanel}
          applied={filters}
          onApply={applyFilters}
          categories={categories}
          surfaceClass={panelSurface(isAppleWebkit)}
          anchorRef={filterButtonRef}
        />
      </div>

      {chips.length > 0 && (
        <div
          className="rise -mx-3 mt-3 flex items-center gap-2 overflow-x-auto px-3 pb-1
            [scrollbar-width:none] [&::-webkit-scrollbar]:hidden
            sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0"
        >
          {chips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => applyFilters(chip.clear(filters))}
              aria-label={`Remove filter: ${chip.label}`}
              className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border-none px-3 py-1.5 text-xs font-medium cursor-pointer
                bg-blue-100 text-blue-700 transition-colors hover:bg-blue-200
                dark:bg-blue-900/50 dark:text-blue-300 dark:hover:bg-blue-900"
            >
              {chip.label}
              <X className="h-3 w-3" />
            </button>
          ))}
          {chips.length > 1 && (
            <button
              type="button"
              onClick={() => applyFilters(default_filters)}
              className="shrink-0 whitespace-nowrap rounded-full border-none bg-transparent px-2 py-1.5 text-xs font-medium text-gray-500 cursor-pointer
                hover:text-black hover:underline dark:text-gray-400 dark:hover:text-white"
            >
              Clear all
            </button>
          )}
        </div>
      )}

      {loading && (!allAudio || allAudio.length === 0) && (
        <div className="flex-1 min-h-0 overflow-y-auto w-full grid grid-cols-1 sm:grid-cols-[repeat(auto-fill,minmax(20rem,1fr))] gap-6 content-start overflow-x-hidden bg-transparent mt-6 p-4 rounded-2xl">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {!loading && allAudio?.length === 0 && (
        <div className="rise min-h-[40vh] flex flex-col items-center justify-center text-center py-10 gap-3">
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
            {chips.length > 0
              ? "No tracks match these filters. Remove one above or clear them all."
              : "Try a different song or artist name."}
          </span>
          {(search || chips.length > 0) && (
            <button
              onClick={clearEverything}
              className="mt-2 px-4 py-2 rounded-xl text-sm bg-gray-100 dark:bg-gray-800 text-black dark:text-white
                hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors border-none cursor-pointer"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}
      <div
        ref={listRef}
        className="flex-1 min-h-0 overflow-y-auto w-full grid grid-cols-1 sm:grid-cols-[repeat(auto-fill,minmax(20rem,1fr))] gap-6 content-start justify-items-center overflow-x-hidden bg-transparent mt-6 p-4 rounded-2xl"
      >
        {allAudio &&
          allAudio.length > 0 &&
          allAudio.map((audio, index) => (
            <div
              key={audio.id}
              className="rise w-full"
              style={{ animationDelay: `${Math.min(index * 40, 300)}ms` }}
            >
              <AudioCard
                idPass={audio.id}
                currentPlayingId={id || ""}
                name={audio.name}
                artist={audio.artist}
                handleId={(id) => setId(id)}
                categoryName={audio.category?.name}
                favourite={audio.favourite}
                lastPlayedAt={audio.lastPlayedAt}
                playCount={audio.playCount}
                skipCount={audio.skipCount}
                maxEngagement={maxEngagement}
                onFavouriteChange={handleFavouriteChange}
              />
            </div>
          ))}
      </div>
      {paginationData && query.page < paginationData.totalPages && (
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
            onClick={() => setQuery((q) => ({ ...q, page: q.page + 1 }))}
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

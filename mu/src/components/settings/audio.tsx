"use client";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMagnifyingGlass,
  faLayerGroup,
} from "@fortawesome/free-solid-svg-icons";
import Loader from "@/components/loader";
import {
  deleteSong,
  getAllSongs,
  type SongFilters,
} from "@/app/api/client/services/audio/api";
import { getAllCategories } from "@/app/api/client/services/categories/api";
import { useAppleWebkit } from "@/hooks/useAppleWebkit";
import { panelSurface } from "@/lib/surfaceDropdown";
import FilterPanel, {
  default_filters,
  getFilterChips,
  toApiFilters,
  type Category,
  type FilterState,
} from "../home/audioFilterPanel";
import { useSearch } from "@/contextApi/sematicSearch";
import EditAudioModal from "./editAudioModal";
import {
  ArrowLeftCircleIcon,
  ArrowRightCircleIcon,
  SlidersHorizontal,
  X,
} from "lucide-react";
import AudioCard from "../home/audioCard";
import { useMask } from "@/contextApi/mask";
import DeleteSongModal from "./deleteConfirmation";

interface Track {
  id: string;
  name: string;
  artist: string;
  category: { id: string; name: string } | null;
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

function ManageAudio() {
  const [audios, setAudios] = useState<Track[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [paginationData, setPaginationData] = useState<PaginationData | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editAudioId, setEditAudioId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const { sematicSearch } = useSearch();
  const { maskStatus } = useMask();
  const [filters, setFilters] = useState<FilterState>(default_filters);
  const [apiFilters, setApiFilters] = useState<SongFilters>({});
  const [categories, setCategories] = useState<Category[]>([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const filterButtonRef = useRef<HTMLButtonElement | null>(null);
  const isAppleWebkit = useAppleWebkit();
  const categoryId = filters.category?.id ?? "";

  useEffect(() => {
    getAllCategories()
      .then((res) => setCategories(res.success ? res.category : []))
      .catch(() => setCategories([]));
  }, []);

  const baseBtnClass =
    "mt-20 w-12 h-12 inline-flex items-center justify-center rounded-full border-none cursor-pointer transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed";

  const activeBtnClass =
    "bg-gray-300 text-black font-semibold shadow-inner dark:bg-gray-600 dark:text-white";

  const defaultBtnClass =
    "bg-gray-100 text-black enabled:hover:bg-gray-200 dark:bg-gray-800 dark:text-white dark:enabled:hover:bg-gray-700";

  const fetchAudios = useCallback(
    async ({ silent = false } = {}) => {
      try {
        if (!silent) setIsLoading(true);
        const response = await getAllSongs(
          currentPage,
          30,
          searchQuery,
          categoryId,
          sematicSearch,
          apiFilters,
        );
        const data = await response;

        if (data.success) {
          setAudios(data.uploads);
          setPaginationData({
            currentPage: data?.pagination?.currentPage || 1,
            perPage: data?.pagination?.perPage,
            totalAudio: data?.pagination?.totalAudio,
            totalPages: data?.pagination?.totalPages,
          });
        } else {
          setAudios([]);
        }
      } catch (error) {
        // console.error("Failed to fetch audios", error);
        alert("An error occurred while fetching audios.");
      } finally {
        if (!silent) setIsLoading(false);
      }
    },
    [currentPage, sematicSearch, searchQuery, categoryId, apiFilters],
  );

  useEffect(() => {
    fetchAudios();
  }, [fetchAudios]);

  const handleEdit = useCallback((id: string) => {
    setEditAudioId(id);
    setShowEditModal(true);
  }, []);

  const openDelete = useCallback(
    (id: string) => {
      const track = audios.find((a) => a.id === id);
      setDeleteTarget({
        id,
        name: maskStatus ? "xxxx" : (track?.name ?? "this audio"),
      });
    },
    [audios, maskStatus],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        const data = await deleteSong(id);
        if (!data.success) throw new Error(data.message || "Failed to delete");
      } catch (error) {
        alert(
          error instanceof Error
            ? error.message
            : "An error occurred while deleting.",
        );
        throw error;
      }

      setAudios((prev) => prev.filter((a) => a.id !== id));
      if (audios.length === 1 && currentPage > 1) {
        setCurrentPage((p) => p - 1);
      } else {
        fetchAudios({ silent: true });
      }
    },
    [audios.length, currentPage, fetchAudios],
  );

  const handleFavouriteChange = useCallback(
    (id: string, favourite: boolean) => {
      setAudios((prev) =>
        prev.map((a) => (a.id === id ? { ...a, favourite } : a)),
      );
    },
    [],
  );

  const maxEngagement = useMemo(
    () =>
      Math.max(
        1,
        ...audios.map((a) => (a.playCount ?? 0) + (a.skipCount ?? 0)),
      ),
    [audios],
  );

  const applyFilters = useCallback((next: FilterState) => {
    setFilters(next);
    setApiFilters(toApiFilters(next));
    setCurrentPage(1);
    setPanelOpen(false);
  }, []);

  const closePanel = useCallback(() => setPanelOpen(false), []);
  const chips = useMemo(() => getFilterChips(filters), [filters]);

  const renderPagination = (
    totalItems: number,
    currentPage: number,
    setCurrentPage: React.Dispatch<React.SetStateAction<number>>,
  ) => {
    if (!paginationData || totalItems === 0) return null;
    const itemsPerPage = paginationData?.perPage || 30;
    const totalPages =
      paginationData?.totalPages || Math.ceil(totalItems / itemsPerPage);

    const maxVisiblePages = 3;

    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    return (
      <div
        className={`flex flex-row flex-wrap justify-center gap-2 w-auto my-4 mx-2 px-3 lg:mx-16 lg:px-6`}
      >
        <button
          title="Previous"
          disabled={currentPage === 1}
          aria-label="Previous Page Button"
          onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
          className={`${baseBtnClass} ${defaultBtnClass}`}
        >
          <ArrowLeftCircleIcon className="" />
        </button>

        {startPage > 1 && (
          <button
            className={`${baseBtnClass} ${currentPage === 1 ? activeBtnClass : defaultBtnClass}`}
            onClick={() => setCurrentPage(1)}
          >
            1
          </button>
        )}
        {startPage > 1 && (
          <span className={`mt-20 px-2 text-black dark:text-white`}>...</span>
        )}

        {Array.from({ length: endPage - startPage + 1 }, (_, index) => {
          const page = startPage + index;
          const isCurrent = currentPage === page;

          return (
            <button
              key={page}
              className={`${baseBtnClass} ${
                isCurrent ? activeBtnClass : defaultBtnClass
              }`}
              onClick={() => setCurrentPage(page)}
            >
              {page}
            </button>
          );
        })}
        {endPage < totalPages - 2 && (
          <span className={`mt-20 px-2 text-black dark:text-white`}>...</span>
        )}
        {endPage < totalPages && (
          <button
            className={`${baseBtnClass} ${currentPage === totalPages ? activeBtnClass : defaultBtnClass}`}
            onClick={() => setCurrentPage(totalPages)}
          >
            {totalPages}
          </button>
        )}
        <button
          title="Next"
          aria-label="Next Page Button"
          disabled={currentPage === totalPages}
          onClick={() =>
            setCurrentPage((prev) => Math.min(totalPages, prev + 1))
          }
          className={`${baseBtnClass} ${defaultBtnClass}`}
        >
          <ArrowRightCircleIcon className="" />
        </button>
      </div>
    );
  };

  return (
    <div className="w-full max-w-5xl mx-auto mt-8 px-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-xl md:text-2xl font-bold text-black dark:text-white">
              Manage Audio
            </h2>
            {paginationData && (
              <span
                className="rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-slate-700
                  dark:bg-white/[0.08] dark:text-slate-300"
              >
                {(paginationData.totalAudio ?? 0).toLocaleString()}{" "}
                {paginationData.totalAudio === 1 ? "track" : "tracks"}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            View, search, and manage your audio files.
          </p>
        </div>
        <div className="relative flex w-full items-center gap-2 md:w-auto">
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
            className={`relative flex-none inline-flex h-10 w-10 items-center justify-center rounded-2xl border-none cursor-pointer transition-colors
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
              ${
                panelOpen || chips.length > 0
                  ? "bg-blue-500 text-white hover:bg-blue-600"
                  : "bg-white text-black hover:bg-gray-100 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
              }`}
          >
            <SlidersHorizontal className="h-4 w-4 stroke-[2.5]" />
            {chips.length > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-white px-1 text-[11px] font-bold text-blue-600 shadow">
                {chips.length}
              </span>
            )}
          </button>

          <div className="relative min-w-0 flex-1 md:w-72 md:flex-none">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FontAwesomeIcon
                icon={faMagnifyingGlass}
                className="text-gray-400 h-4 w-4"
              />
            </div>
            <input
              type="text"
              placeholder="Search audios..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="block w-full pl-10 pr-3 py-2.5 border-none rounded-2xl leading-5 bg-white text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:placeholder-slate-500 text-base sm:text-sm transition-colors duration-200"
            />
          </div>

          <FilterPanel
            open={panelOpen}
            onClose={closePanel}
            applied={filters}
            onApply={applyFilters}
            categories={categories}
            surfaceClass={panelSurface(isAppleWebkit)}
            anchorRef={filterButtonRef}
            align="right"
          />
        </div>
      </div>
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader />
        </div>
      ) : audios.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {audios.map((audio) => (
            <AudioCard
              key={audio.id}
              idPass={audio.id}
              name={audio.name}
              artist={audio.artist}
              categoryName={audio.category?.name}
              favourite={audio.favourite}
              lastPlayedAt={audio.lastPlayedAt}
              playCount={audio.playCount}
              skipCount={audio.skipCount}
              maxEngagement={maxEngagement}
              onFavouriteChange={handleFavouriteChange}
              onEdit={handleEdit}
              onDelete={openDelete}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-gray-300 dark:border-slate-700">
          <FontAwesomeIcon
            icon={faLayerGroup}
            className="h-12 w-12 text-gray-300 dark:text-slate-600 mb-4"
          />
          <h3 className="text-lg font-medium text-black dark:text-white">
            No audios found
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            {searchQuery
              ? `No results for "${searchQuery}"`
              : "Get started by adding a new audio file."}
          </p>
        </div>
      )}
      {paginationData &&
        !isLoading &&
        audios.length > 0 &&
        renderPagination(
          paginationData.totalAudio,
          currentPage,
          setCurrentPage,
        )}
      {showEditModal && editAudioId && (
        <EditAudioModal
          id={editAudioId}
          handleClose={() => {
            setShowEditModal(false);
            setEditAudioId(null);
          }}
          onSuccess={() => fetchAudios({ silent: true })}
        />
      )}
      {deleteTarget && (
        <DeleteSongModal
          id={deleteTarget.id}
          songName={deleteTarget.name}
          leastlistened={false}
          handleDelete={handleDelete}
          handleClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

export default ManageAudio;

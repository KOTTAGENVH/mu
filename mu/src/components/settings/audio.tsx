"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMagnifyingGlass,
  faPenToSquare,
  faTrashCan,
  faLayerGroup,
} from "@fortawesome/free-solid-svg-icons";
import Loader from "@/components/loader";
import { deleteSong, getAllSongs } from "@/app/api/client/services/audio/api";
import { useSearch } from "@/contextApi/sematicSearch";
import EditAudioModal from "./editAudioModal";
import { ArrowLeftCircleIcon, ArrowRightCircleIcon } from "lucide-react";
import { useMask } from "@/contextApi/mask";

interface AudioList {
  id: string;
  name: string;
  artist: string;
}

interface PaginationData {
  currentPage: number;
  perPage: number;
  totalAudio: number;
  totalPages: number;
}

function ManageAudio() {
  const [audios, setAudios] = useState<AudioList[]>([]);
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

  const baseBtnClass =
    "mt-20 w-12 h-12 inline-flex items-center justify-center rounded-full border-none cursor-pointer transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed";

  const activeBtnClass =
    "bg-gray-300 text-black font-semibold shadow-inner dark:bg-gray-600 dark:text-white";

  const defaultBtnClass =
    "bg-gray-100 text-black enabled:hover:bg-gray-200 dark:bg-gray-800 dark:text-white dark:enabled:hover:bg-gray-700";

  const fetchAudios = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await getAllSongs(
        currentPage,
        30,
        searchQuery,
        "",
        sematicSearch,
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
      setIsLoading(false);
    }
  }, [currentPage, sematicSearch, searchQuery]);

  useEffect(() => {
    fetchAudios();
  }, [fetchAudios]);

  const handleEdit = useCallback((id: string) => {
    setEditAudioId(id);
    setShowEditModal(true);
  }, []);

  const handleDelete = useCallback(
    async (id: string) => {
      if (!confirm("Are you sure you want to delete this audio?")) return;

      try {
        setIsLoading(true);
        setAudios((prev) => prev.filter((wl) => wl.id !== id));

        const response = await deleteSong(id);

        const data = await response;
        if (!data.success) {
          alert("Failed to delete: " + data.message);
          fetchAudios();
        }
      } catch (error) {
        console.error("Delete failed", error);
        alert("An error occurred while deleting.");
        fetchAudios();
      } finally {
        setIsLoading(false);
      }
    },
    [fetchAudios],
  );

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
          <span className={`px-2 text-black dark:text-white`}>...</span>
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
          <h2 className="text-xl md:text-2xl font-bold text-black dark:text-white">
            Manage Audio
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            View, search, and manage your audio files.
          </p>
        </div>
        <div className="flex flex-row flex-wrap items-center gap-2">
          <div className="relative w-full md:w-72">
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
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-2.5 border-none rounded-2xl leading-5 bg-white text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:placeholder-slate-500 sm:text-sm transition-colors duration-200"
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader />
        </div>
      ) : audios.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {audios.map((audio) => (
            <div
              key={audio.id}
              className="group bg-white dark:bg-slate-900 rounded-2xl p-4 border-none shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-between"
            >
              <div className="flex items-center gap-4 overflow-hidden">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <FontAwesomeIcon icon={faLayerGroup} className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm text-black dark:text-white truncate">
                    {maskStatus ? "xxxx" : audio.name}
                  </h3>
                  <span className="text-sm text-slate-600 dark:text-slate-400 font-mono">
                    Artist: {maskStatus ? "mubynk" : audio.artist}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <button
                  onClick={() => handleEdit(audio.id)}
                  title="Edit"
                  className={`inline-flex items-center justify-center w-auto py-3 px-3 rounded-full border-none cursor-pointer bg-gray-100 text-black hover:bg-gray-200 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700`}
                >
                  <FontAwesomeIcon icon={faPenToSquare} className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(audio.id)}
                  title="Delete"
                  className={`inline-flex items-center justify-center w-auto py-3 px-3 rounded-full border-none cursor-pointer bg-red-100 text-black hover:bg-red-200 dark:bg-red-900/30 dark:text-white dark:hover:bg-red-800`}
                >
                  <FontAwesomeIcon icon={faTrashCan} className="h-4 w-4" />
                </button>
              </div>
            </div>
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
          onSuccess={fetchAudios}
        />
      )}
    </div>
  );
}

export default ManageAudio;

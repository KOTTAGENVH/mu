"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMagnifyingGlass,
  faTrashCan,
  faListCheck,
} from "@fortawesome/free-solid-svg-icons";
import Loader from "@/components/loader";
import {
  ArrowLeftCircleIcon,
  ArrowRightCircleIcon,
  Music,
  Tag,
  ListChecks,
  Activity as ActivityIcon,
} from "lucide-react";
import { useMask } from "@/contextApi/mask";
import {
  getAllActivity,
  deleteActivity,
} from "@/app/api/client/services/activity/api";
import DeleteActivityModal from "./activityDeleteModal";

interface ActivityList {
  id: string;
  taskname: string;
  type: string;
  action: string;
  date: string;
  time: string;
  timezone: string;
}

interface ModalState {
  isOpen: boolean;
  isClearAll: boolean;
  id?: string;
  taskname?: string;
}

interface PaginationData {
  currentPage: number;
  perPage: number;
  totalActivities: number;
  totalPages: number;
}

const typeMetaMap: Record<string, { label: string; Icon: React.ElementType }> =
  {
    audio: { label: "Audio", Icon: Music },
    category: { label: "Category", Icon: Tag },
    wishlist: { label: "List", Icon: ListChecks },
    list: { label: "List", Icon: ListChecks },
  };

const capitalize = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : "");

const getTypeMeta = (type: string) =>
  typeMetaMap[type?.toLowerCase()] ?? {
    label: capitalize(type) || "Other",
    Icon: ActivityIcon,
  };

const green =
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300";
const blue = "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300";
const red = "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300";
const grey =
  "bg-slate-100 text-slate-700 dark:bg-white/[0.08] dark:text-slate-300";

const actionStyles: Record<string, string> = {
  create: green,
  add: green,
  upload: green,
  edit: blue,
  update: blue,
  delete: red,
  remove: red,
};

const actionClass = (action: string) =>
  actionStyles[action?.toLowerCase()] ?? grey;

const pill =
  "inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold";

function ManageActivity() {
  const [activities, setActivities] = useState<ActivityList[]>([]);
  const [paginationData, setPaginationData] = useState<PaginationData | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    isClearAll: false,
  });
  const { maskStatus } = useMask();

  const baseBtnClass =
    "mt-20 w-12 h-12 inline-flex items-center justify-center rounded-full border-none cursor-pointer transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed";

  const activeBtnClass =
    "bg-gray-300 text-black font-semibold shadow-inner dark:bg-gray-600 dark:text-white";

  const defaultBtnClass =
    "bg-gray-100 text-black enabled:hover:bg-gray-200 dark:bg-gray-800 dark:text-white dark:enabled:hover:bg-gray-700";

  const fetchActivities = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getAllActivity(currentPage, 30, debouncedQuery);
      if (data.success) {
        setActivities(data.activities);
        setPaginationData({
          currentPage: data?.pagination?.page || 1,
          perPage: data?.pagination?.limit || 30,
          totalActivities: data?.pagination?.total || 0,
          totalPages: data?.pagination?.totalPages || 1,
        });
      } else {
        setActivities([]);
      }
    } catch (error) {
      console.error("Failed to fetch activities", error);
      alert("An error occurred while fetching activities.");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, debouncedQuery]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const executeDelete = useCallback(
    async (id: string) => {
      try {
        setActivities((prev) => prev.filter((activity) => activity.id !== id));
        const data = await deleteActivity(id);

        if (!data.success) {
          alert("Failed to delete: " + data.message);
          fetchActivities();
        }
      } catch (error) {
        console.error("Delete failed", error);
        alert("An error occurred while deleting.");
        fetchActivities();
      } finally {
        setModalState({ isOpen: false, isClearAll: false });
      }
    },
    [fetchActivities],
  );

  const executeClearAll = async () => {
    try {
      const data = await deleteActivity("");

      if (data.success) {
        setActivities([]);
        setPaginationData(null);
        setCurrentPage(1);
      } else {
        alert("Failed to clear activities: " + data.message);
        fetchActivities();
      }
    } catch (error) {
      console.error("Clear all failed", error);
      alert("An error occurred while clearing activities.");
      fetchActivities();
    } finally {
      setModalState({ isOpen: false, isClearAll: false });
    }
  };

  const openDeleteModal = (id: string, taskname: string) => {
    setModalState({
      isOpen: true,
      isClearAll: false,
      id,
      taskname,
    });
  };

  const openClearAllModal = () => {
    setModalState({
      isOpen: true,
      isClearAll: true,
    });
  };

  const rows = useMemo(
    () =>
      activities.map((a) => ({
        ...a,
        meta: getTypeMeta(a.type),
        actionCls: actionClass(a.action),
        shownName: maskStatus
          ? "xxxx-masked-xxxx"
          : a.taskname || "Unknown task",
        shownId: maskStatus ? "xxxx" : a.id,
        shownDate: maskStatus ? "xx/xx/xxxx" : a.date,
        shownTime: maskStatus ? "xx:xx:xx" : `${a.time} ${a.timezone}`,
      })),
    [activities, maskStatus],
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
    <>
      <div className="w-full max-w-5xl mx-auto mt-8 px-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-xl md:text-2xl font-bold text-black dark:text-white">
                Manage Activity
              </h2>
              {paginationData && (
                <span
                  className="rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-slate-700
                    dark:bg-white/[0.08] dark:text-slate-300"
                >
                  {paginationData.totalActivities.toLocaleString()}{" "}
                  {paginationData.totalActivities === 1
                    ? "activity"
                    : "activities"}
                </span>
              )}
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              View, search, and manage your activity logs.
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
                placeholder="Search activities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 border-none rounded-2xl leading-5 bg-white text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:placeholder-slate-500 sm:text-sm transition-colors duration-200 shadow-sm"
              />
            </div>
            <button
              onClick={openClearAllModal}
              disabled={activities.length === 0 || isLoading}
              className={`p-2 rounded-2xl border-none cursor-pointer transition-colors duration-200 bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-800`}
              title="Clear all activity logs"
            >
              <FontAwesomeIcon icon={faTrashCan} className="mr-2 h-4 w-4" />
              Clear All
            </button>
          </div>
        </div>
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader />
          </div>
        ) : activities.length > 0 ? (
          <>
            <ul className="space-y-3 md:hidden">
              {rows.map((a) => (
                <li
                  key={a.id}
                  className="rounded-2xl bg-white p-4 ring-1 ring-slate-200 dark:bg-[#0e1628] dark:ring-white/[0.07]"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                      <a.meta.Icon className="h-4 w-4" aria-hidden="true" />
                    </div>
                    <p className="min-w-0 flex-1 break-words pt-1.5 text-sm font-medium leading-snug text-black dark:text-white">
                      {a.shownName}
                    </p>
                    <button
                      onClick={() => openDeleteModal(a.id, a.shownName)}
                      title="Delete activity"
                      aria-label={`Delete activity ${a.shownId}`}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-none cursor-pointer bg-red-100 text-red-600 transition-colors hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-800/50"
                    >
                      <FontAwesomeIcon
                        icon={faTrashCan}
                        className="h-3.5 w-3.5"
                      />
                    </button>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className={`${pill} ${grey}`}>{a.meta.label}</span>
                    <span className={`${pill} ${a.actionCls}`}>
                      {capitalize(a.action)}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {a.shownDate} · {a.shownTime}
                    </span>
                    <span className="ml-auto font-mono text-xs text-slate-400 dark:text-slate-500">
                      #{a.shownId}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
            <div
              className="hidden md:block overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-slate-800 dark:bg-[#0e1628]
                [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-thumb]:bg-gray-600"
            >
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 dark:border-slate-700 dark:bg-slate-800/50">
                    <th className="px-5 py-3.5 text-sm font-semibold text-gray-900 dark:text-white">
                      Activity
                    </th>
                    <th className="px-4 py-3.5 text-sm font-semibold text-gray-900 dark:text-white">
                      Type
                    </th>
                    <th className="px-4 py-3.5 text-sm font-semibold text-gray-900 dark:text-white">
                      Action
                    </th>
                    <th className="px-4 py-3.5 text-sm font-semibold text-gray-900 dark:text-white">
                      When
                    </th>
                    <th className="px-4 py-3.5 text-sm font-semibold text-gray-900 dark:text-white">
                      ID
                    </th>
                    <th className="px-5 py-3.5">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                  {rows.map((a) => (
                    <tr
                      key={a.id}
                      className="group transition-colors duration-150 hover:bg-gray-50 dark:hover:bg-slate-800/40"
                    >
                      <td className="px-5 py-4">
                        <div className="flex min-w-[18rem] items-start gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                            <a.meta.Icon
                              className="h-4 w-4"
                              aria-hidden="true"
                            />
                          </div>
                          <span className="break-words pt-1 text-sm font-medium leading-snug text-black dark:text-white">
                            {a.shownName}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`${pill} ${grey}`}>
                          {a.meta.label}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`${pill} ${a.actionCls}`}>
                          {capitalize(a.action)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4">
                        <div className="text-sm text-slate-700 dark:text-slate-300">
                          {a.shownDate}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {a.shownTime}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4">
                        <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
                          {a.shownId}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => openDeleteModal(a.id, a.shownName)}
                          title="Delete activity"
                          aria-label={`Delete activity ${a.shownId}`}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full border-none cursor-pointer bg-red-100 text-red-600 transition-all duration-200
                            hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-800/50
                            opacity-0 group-hover:opacity-100 focus-visible:opacity-100
                            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                        >
                          <FontAwesomeIcon
                            icon={faTrashCan}
                            className="h-3.5 w-3.5"
                          />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="text-center py-12 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-gray-300 dark:border-slate-700">
            <FontAwesomeIcon
              icon={faListCheck}
              className="h-12 w-12 text-gray-300 dark:text-slate-600 mb-4"
            />
            <h3 className="text-lg font-medium text-black dark:text-white">
              No activities found
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              {searchQuery
                ? `No results for "${searchQuery}"`
                : "There are currently no activity logs to display."}
            </p>
          </div>
        )}
        {paginationData &&
          !isLoading &&
          activities.length > 0 &&
          renderPagination(
            paginationData.totalActivities,
            currentPage,
            setCurrentPage,
          )}
      </div>
      {modalState.isOpen && (
        <DeleteActivityModal
          isClearAllMode={modalState.isClearAll}
          id={modalState.id}
          taskname={modalState.taskname}
          handleClose={() =>
            setModalState({ isOpen: false, isClearAll: false })
          }
          handleDelete={executeDelete}
          handleClearAll={executeClearAll}
        />
      )}
    </>
  );
}

export default ManageActivity;

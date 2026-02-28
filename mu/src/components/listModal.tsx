import React, { useState, useEffect, useCallback, useMemo } from "react";
import Loader from "./loader";
import {
  getWishlists,
  deleteWishlist,
} from "@/app/api/client/services/list/api";

interface WishList {
  id: string;
  name: string;
}

interface WishListModalProps {
  handleClose: () => void;
}

export default function WishListMoadal({ handleClose }: WishListModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [wishLists, setWishLists] = useState<WishList[]>([]);

  useEffect(() => {
    setTimeout(() => setIsVisible(true), 10);
  }, []);

  const actionBtnClass =
    "p-2 rounded-full border-none cursor-pointer transition-colors duration-200";

  const closeModal = () => {
    setIsVisible(false);
    setTimeout(() => {
      handleClose();
    }, 200);
  };

  const fetchWishLists = useCallback(async () => {
    try {
      setIsLoaded(true);
      const response = await getWishlists();
      const data = await response;

      if (data.success) {
        setWishLists(data.lists || []);
      } else {
        setWishLists([]);
      }
    } catch (error) {
      alert("An error occurred while fetching wish lists.");
    } finally {
      setIsLoaded(false);
    }
  }, []);

  useEffect(() => {
    fetchWishLists();
  }, [fetchWishLists]);

  const handleDelete = useCallback(
    async (id: string) => {
      if (!confirm("Are you sure you want to delete this wish list?")) return;

      try {
        setWishLists((prev) => prev.filter((wl) => wl.id !== id));
        const response = await deleteWishlist(id);
        const data = await response;

        if (!data.success) {
          alert("Failed to delete: " + data.message);
          fetchWishLists();
        }
      } catch (error) {
        console.error("Delete failed", error);
        fetchWishLists();
      }
    },
    [fetchWishLists],
  );

  const handleCopy = (id: string) => {
    navigator.clipboard.writeText(id);

    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const filteredLists = useMemo(() => {
    if (!searchQuery) return wishLists;
    return wishLists.filter((wl) =>
      wl.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [wishLists, searchQuery]);

  return (
    <div
      className={`fixed z-50 inset-0 overflow-y-auto transition-all duration-300 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
    >
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
        onClick={closeModal}
      />
      <div className="flex items-center justify-center min-h-screen p-4">
        <div
          className={`relative w-full max-w-md transform transition-all duration-300 ${
            isVisible ? "scale-100 translate-y-0" : "scale-95 translate-y-4"
          }`}
          role="dialog"
          aria-modal="true"
        >
          <div className="relative bg-white/10 dark:bg-black/10 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
            <div className="relative px-6 pt-6 pb-4 shrink-0">
              <div className="flex items-center justify-between">
                <h3 className="text-lg md:text-xl text-black dark:text-white font-bold">
                  Your Wish Lists
                </h3>
                <button
                  onClick={closeModal}
                  className="inline-flex items-center justify-center w-auto py-2 px-2 rounded-full border-none cursor-pointer bg-red-100 text-black hover:bg-red-200 dark:bg-red-900/30 dark:text-white dark:hover:bg-red-800 transition-colors"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
            <div className="relative px-6 pb-2 shrink-0">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="w-4 h-4 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    ></path>
                  </svg>
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="text-sm w-full pl-10 pr-4 py-3 bg-black/20 dark:bg-white/20 backdrop-blur-sm border-none rounded-2xl text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-200"
                  placeholder="Search wish lists..."
                />
              </div>
            </div>
            <div className="relative px-6 pb-6 overflow-y-auto flex-grow">
              {isLoaded ? (
                <div className="flex justify-center py-8">
                  <Loader />
                </div>
              ) : filteredLists.length > 0 ? (
                <div className="space-y-3 mt-2">
                  {filteredLists.map((list) => (
                    <div
                      key={list.id}
                      className="flex items-center justify-between p-3 rounded-2xl bg-white/5 dark:bg-black/20 border-noen hover:bg-white/10 dark:hover:bg-white/5 transition-colors"
                    >
                      <div className="min-w-0 flex-1 mr-4">
                        <p className="text-sm font-medium text-black dark:text-white truncate">
                          {list.name}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleCopy(list.id)}
                          title="Copy ID"
                          className={`${actionBtnClass} ${isCopied ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" : "bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-800"}`}
                        >
                          {isCopied ? (
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          ) : (
                            <>
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                ></path>
                              </svg>
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(list.id)}
                          title="Delete"
                          className={`${actionBtnClass} bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-800`}
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            ></path>
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {searchQuery
                      ? "No matching lists found."
                      : "No wish lists found."}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

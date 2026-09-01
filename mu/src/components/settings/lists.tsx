"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMagnifyingGlass,
  faPenToSquare,
  faTrashCan,
  faLayerGroup,
  faPlus,
} from "@fortawesome/free-solid-svg-icons";
import Loader from "@/components/loader";
import {
  deleteWishlist,
  getWishlists,
} from "@/app/api/client/services/list/api";
import AddWishListModal from "./addListsModal";
import EditWishListModal from "./editListsModal";

interface WishList {
  id: string;
  name: string;
}

function ManageWishList() {
  const [wishLists, setWishLists] = useState<WishList[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editWishListId, setEditWishListId] = useState<string | null>(null);
  const [editWishListName, setEditWishListName] = useState<string | null>(null);

  const baseBtnClass =
    "inline-flex items-center justify-center w-auto py-3 px-3 rounded-full border-none cursor-pointer";

  const defaultBtnClass =
    "bg-gray-100 text-black hover:bg-gray-200 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700";

  const fetchWishLists = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await getWishlists();
      const data = await response;

      if (data.success) {
        setWishLists(data.lists);
      } else {
        setWishLists([]);
      }
    } catch (error) {
      //   console.error("Failed to fetch wish lists", error);
      alert("An error occurred while fetching wish lists.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWishLists();
  }, [fetchWishLists]);

  const filteredWishLists = useMemo(() => {
    if (!searchQuery) return wishLists;
    const lowerQuery = searchQuery.toLowerCase();
    return wishLists.filter((wl) => wl.name.toLowerCase().includes(lowerQuery));
  }, [wishLists, searchQuery]);

  const handleEdit = useCallback((id: string, name:string) => {
    setEditWishListName(name);
    setEditWishListId(id);
    setShowEditModal(true);
  }, []);

  const handleDelete = useCallback(
    async (id: string) => {
      if (!confirm("Are you sure you want to delete this wish list?")) return;

      try {
        setIsLoading(true);
        setWishLists((prev) => prev.filter((wl) => wl.id !== id));

        const response = await deleteWishlist(id);

        const data = await response;
        if (!data.success) {
          alert("Failed to delete: " + data.message);
          fetchWishLists();
        }
      } catch (error) {
        console.error("Delete failed", error);
        alert("An error occurred while deleting.");
        fetchWishLists();
      } finally {
        setIsLoading(false);
      }
    },
    [fetchWishLists],
  );

  const handleAddWishList = () => {
    setShowAddModal(true);
  };

  return (
    <div className="w-full max-w-5xl mx-auto mt-8 px-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-black dark:text-white">
            Manage Wish Lists
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            View, search, and manage your audio wish lists.
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
              placeholder="Search wish lists..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-2.5 border-none rounded-2xl leading-5 bg-white text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:placeholder-slate-500 sm:text-sm transition-colors duration-200"
            />
          </div>
          <button
            title="Add Wish List"
            className={`${baseBtnClass} ${defaultBtnClass}`}
            onClick={handleAddWishList}
            aria-label="Add Wish List"
          >
            <FontAwesomeIcon icon={faPlus} className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader />
        </div>
      ) : filteredWishLists.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredWishLists.map((wishlist) => (
            <div
              key={wishlist.id}
              className="group bg-white dark:bg-slate-900 rounded-2xl p-4 border-none shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-between"
            >
              <div className="flex items-center gap-4 overflow-hidden">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <FontAwesomeIcon icon={faLayerGroup} className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm text-black dark:text-white truncate">
                    {wishlist.name}
                  </h3>
                  <span className="text-sm text-slate-600 dark:text-slate-400 font-mono">
                    ID: {wishlist.id}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <button
                  onClick={() => handleEdit(wishlist.id, wishlist.name)}
                  title="Edit"
                  className={`inline-flex items-center justify-center w-auto py-3 px-3 rounded-full border-none cursor-pointer bg-gray-100 text-black hover:bg-gray-200 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700`}
                >
                  <FontAwesomeIcon icon={faPenToSquare} className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(wishlist.id)}
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
            No wish lists found
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            {searchQuery
              ? `No results for "${searchQuery}"`
              : "Get started by adding a new wish list."}
          </p>
        </div>
      )}
      {showAddModal && (
        <AddWishListModal
          handleClose={() => setShowAddModal(false)}
          onSuccess={fetchWishLists}
        />
      )}

      {showEditModal && editWishListId && editWishListName && (
        <EditWishListModal
          id={editWishListId}
          name={editWishListName}
          handleClose={() => {
            setShowEditModal(false);
            setEditWishListId(null);
          }}
          onSuccess={fetchWishLists}
        />
      )}
    </div>
  );
}

export default ManageWishList;


"use client";
import React, { useCallback, useState } from "react";
import {
  Edit3,
  Headphones,
  Heart,
  Music,
  Pause,
  Play,
  Trash2
} from "lucide-react";
import { useModal } from "@/contextApi/modalOpen";
import { useCurrentPlay } from "@/contextApi/currentPlay";


interface Audio {
  idPass: string;
  name: string;
  category: string;
  favourite: boolean;
}

export default function AudioCard({ idPass, name, category, favourite }: Audio) {
  const [isLoading, setIsLoading] = useState(false);
  const [isFavourite, setIsFavourite] = useState(favourite);
  const { toggleModal } = useModal();
  const { toggleId, id, pause } = useCurrentPlay();
  const isCurrentlyPlaying = id === idPass && !pause;

  // Favourites handling function
  const handleFavourite = useCallback(async () => {
    setIsLoading(true);
    const previousState = isFavourite;
    setIsFavourite(!isFavourite);

    try {
      const res = await fetch("/api/services/audio", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ _id: idPass, favourite: !isFavourite }),
      });
      const data = await res.json();

      if (!data.success) {
        setIsFavourite(previousState); // Rollback on error
        console.error("Error updating favourite");
      }
    } catch (error) {
      setIsFavourite(previousState); // Rollback on error
      console.error("Error updating favourite");
    } finally {
      setIsLoading(false);
    }
  }, [idPass, isFavourite]);

  // Delete handling function
  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;

    setIsLoading(true);
    try {
      const res = await fetch("/api/services/audio", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ _id: idPass }),
      });
      const data = await res.json();

      if (data.success) {
        setTimeout(() => window.location.reload(), 300);
      } else {
        console.error("Error deleting audio");
      }
    } catch (error) {
      console.error("Error deleting audio");
    } finally {
      setIsLoading(false);
    }
  };

  // Modal open handler Edit one
  const handleModalOpen = () => {
    toggleModal(true, idPass, name, category);
  };

  // Play/Pause handler
  const handlePlay = () => {
    if (id === idPass && !pause) {
      toggleId(idPass, true);
      return;
    } else {
    toggleId(idPass, false);
    }
  };

  return (
    <div
      className="group relative w-80 h-56 m-3 rounded-2xl overflow-hidden bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900"
    >
      <div className="absolute inset-0 opacity-5 dark:opacity-10">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600"></div>
      </div>
      <div className="relative h-full flex flex-col">
        <div className="flex justify-between items-start p-4 pb-2">
          <span className="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full">
            {category}
          </span>
          <div className="relative">
            <button
              onClick={handleDelete}
              disabled={isLoading}
              className="
            p-3 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors "
            >
              <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
            </button>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="relative">
            {isCurrentlyPlaying ? (
              <div className="relative">
                <Music className="w-16 h-16 text-blue-600 dark:text-blue-400" />
                <div className="absolute inset-0 w-16 h-16 bg-blue-500 rounded-full animate-ping opacity-20"></div>
              </div>
            ) : (
              <Headphones className="w-16 h-16 text-gray-600 dark:text-gray-400" />
            )}
          </div>
        </div>
        <div className="p-4 pt-2">
          <h3 className="font-semibold text-gray-900 dark:text-white text-lg truncate mb-3">
            {name}
          </h3>
          <div className={`flex items-center justify-center gap-3 transition-all duration-300 opacity-100 transform translate-y-0`}>
            <button
              onClick={handleFavourite}
              disabled={isLoading}
              className={`p-3 rounded-full  ${isFavourite
                ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              title={isFavourite ? 'Remove from favourites' : 'Add to favourites'}
            >
              <Heart
                className={`w-4 h-4 ${isFavourite ? 'fill-current' : ''}`}
              />
            </button>
            <button
              onClick={handlePlay}
              className="p-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-full  shadow-lg hover:shadow-xl"
              title={isCurrentlyPlaying ? 'Pause' : 'Play'}
            >
              {isCurrentlyPlaying ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={handleModalOpen}
              className="p-3 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full "
              title="Edit audio"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          </div>
        </div>
        {isLoading && (
          <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 flex items-center justify-center rounded-xl">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>
    </div>
  );
}
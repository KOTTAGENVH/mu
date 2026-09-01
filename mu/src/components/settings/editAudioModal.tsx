import { getAllCategories } from "@/app/api/client/services/categories/api";
import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import Loader from "../loader";
import { getSongById, updateSong } from "@/app/api/client/services/audio/api";
import { useAppleWebkit } from "@/hooks/useAppleWebkit";
import { panelSurface } from "@/lib/surfaceDropdown";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { createPortal } from "react-dom";

interface EditCategoryModalProps {
  id: string;
  handleClose: () => void;
  onSuccess: () => void;
}

interface Category {
  id: string;
  name: string;
}

export default function EditAudioModal({
  id,
  handleClose,
  onSuccess,
}: EditCategoryModalProps) {
  const [newName, setNewName] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [newArtist, setNewArtist] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCategory, setCategory] = useState("");
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [coords, setCoords] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const isAppleWebkit = useAppleWebkit();

  const selectedCategoryName = useMemo(() => {
    const selected = categories.find((c) => c.id === isCategory);
    return selected ? selected.name : "Select category…";
  }, [isCategory, categories]);

  useEffect(() => {
    setTimeout(() => setIsVisible(true), 10);
  }, []);

  useEffect(() => {
    if (!isCategoryOpen) return;

    const place = () => {
      const el = triggerRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const panelH = 260;
      const openUp = r.bottom + panelH > window.innerHeight && r.top > panelH;
      setCoords({
        top: openUp ? r.top - panelH - 8 : r.bottom + 8,
        left: r.left,
        width: r.width,
      });
    };

    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [isCategoryOpen]);

  useEffect(() => {
    if (!isCategoryOpen) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t)) return;
      if (panelRef.current?.contains(t)) return;
      setIsCategoryOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsCategoryOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [isCategoryOpen]);

  const baseBtnClass =
    "inline-flex items-center justify-center w-auto py-3 px-3 rounded-2xl border-none cursor-pointer";

  const defaultBtnClass =
    "bg-gray-100 text-black hover:bg-gray-200 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700";

  const closeModal = () => {
    setIsVisible(false);
    setTimeout(() => {
      handleClose();
    }, 200);
  };

  //get audio by id
  const fetchAudio = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await getSongById(id);
      const data = await response;
      if (data.success) {
        setNewName(data.track.name);
        setNewArtist(data.track.artist);
        setCategory(data.track.category.id);
      } else {
        alert("Failed to fetch audio details.");
      }
    } catch (error) {
      alert("An error occurred while fetching audio details.");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  //get all categories
  const fetchCategories = useCallback(async () => {
    try {
      setIsLoading(true);
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
      setIsLoading(false);
    }
  }, []);

  //edit audio
  const handleEdit = async () => {
    try {
      //Validate the form
      if (!newName.trim() && !newArtist.trim() && !isCategory) {
        alert("Please fill in at least one field to update.");
        return;
      }

      if (newName.trim() && !/^[a-zA-Z]+$/.test(newName)) {
        alert(
          "Name can only contain letters (no numbers or special characters).",
        );
        return;
      }

      if (newArtist.trim() && !/^[a-zA-Z]+$/.test(newArtist)) {
        alert(
          "Artist can only contain letters (no numbers or special characters).",
        );
        return;
      }

      setIsLoaded(true);

      const updates: Record<string, string> = {};

      if (newName.trim()) updates.name = newName;
      if (newArtist.trim()) updates.artist = newArtist;
      if (isCategory) updates.categoryid = isCategory;

      const response = await updateSong(id, updates);
      const data = await response;

      if (data.success) {
        setIsLoaded(false);
        setIsSuccess(true);
        setTimeout(() => {
          closeModal();
          onSuccess();
        }, 1500);
      } else {
        alert(data.message || "Error editing audio. Please try again.");
        setIsLoaded(false);
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : "Error editing audio");
      setIsLoaded(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchAudio();
  }, [fetchCategories, fetchAudio]);

  return (
    <div
      className={`fixed z-50 inset-0 overflow-y-auto transition-all duration-300 ${isVisible ? "opacity-100" : "opacity-0"}`}
    >
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
        onClick={closeModal}
      />
      <div className="flex items-center justify-center min-h-screen p-4">
        {isLoaded ? (
          <Loader />
        ) : isSuccess ? (
          <div className="relative w-full max-w-md transform transition-all duration-300 scale-100">
            <div className="relative bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl border-none shadow-2xl overflow-hidden p-8">
              <div className="flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-300">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                  <svg
                    className="w-8 h-8 text-green-600 dark:text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    ></path>
                  </svg>
                </div>
                <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Success!
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Audio edited successfully.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {isLoaded && (
              <div className="absolute inset-0 flex items-center justify-center z-60">
                <div className="bg-white/20 dark:bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-white/20 shadow-2xl">
                  <div className="flex items-center space-x-3">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-white/30 border-t-black dark:border-t-white"></div>
                    <span
                      className={`text-black dark:text-white  text-sm font-medium`}
                    >
                      Editing audio...
                    </span>
                  </div>
                </div>
              </div>
            )}
            <div
              className={`relative w-full max-w-md transform transition-all duration-300 ${
                isVisible ? "scale-100 translate-y-0" : "scale-95 translate-y-4"
              }`}
              role="dialog"
              aria-modal="true"
            >
              <div className="relative bg-white/10 dark:bg-black/10 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-white/10 shadow-2xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
                <div className="relative px-6 pt-6 pb-4">
                  <div className="flex items-center justify-between">
                    <h3
                      className={`text-lg md:text-xl text-black dark:text-white`}
                    >
                      Edit Audio
                    </h3>
                    <button
                      disabled={isLoaded}
                      onClick={closeModal}
                      className={`inline-flex items-center justify-center w-auto py-3 px-3 rounded-full border-none cursor-pointer bg-red-100 text-black hover:bg-red-200 dark:bg-red-900/30 dark:text-white dark:hover:bg-red-800`}
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
                <div className={`relative px-6 pb-6 space-y-5`}>
                  <div className="space-y-2">
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-black dark:text-white"
                    >
                      Name
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="name"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="text-sm w-full px-4 py-3 bg-black/20 dark:bg-white/20 backdrop-blur-sm border-none rounded-2xl text-black dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-200"
                        placeholder="Enter audio name"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="category"
                      className="block text-sm font-medium text-black dark:text-white"
                    >
                      Artist
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="artist"
                        value={newArtist}
                        onChange={(e) => setNewArtist(e.target.value)}
                        className="text-sm w-full px-4 py-3 bg-black/20 dark:bg-white/20 backdrop-blur-sm border-none rounded-2xl text-black dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-200"
                        placeholder="Enter audio artist"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="category"
                      className="block text-sm font-medium text-black dark:text-white"
                    >
                      Category
                    </label>
                    <button
                      id="category"
                      ref={triggerRef}
                      type="button"
                      disabled={isLoading}
                      onClick={() => setIsCategoryOpen((open) => !open)}
                      aria-haspopup="listbox"
                      aria-expanded={isCategoryOpen}
                      className="w-full px-4 py-3 flex items-center justify-between gap-3 rounded-2xl border-none bg-gray-100 text-black hover:bg-gray-200 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700 outline-none cursor-pointer focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="truncate">{selectedCategoryName}</span>
                      <FontAwesomeIcon
                        icon={faChevronDown}
                        className={`w-3 h-3 flex-shrink-0 transition-transform ${isCategoryOpen ? "rotate-180" : ""}`}
                      />
                    </button>
                  </div>

                  {isCategoryOpen &&
                    coords &&
                    createPortal(
                      <div
                        ref={panelRef}
                        role="listbox"
                        style={{
                          top: coords.top,
                          left: coords.left,
                          minWidth: coords.width,
                        }}
                        className={`fixed z-[60] p-4 rounded-2xl flex flex-col gap-2
        w-[min(20rem,calc(100vw-3rem))] max-h-60 overflow-y-auto
        ${panelSurface(isAppleWebkit, "shadow-lg")}
        [&::-webkit-scrollbar]:w-1.5
        [&::-webkit-scrollbar-thumb]:rounded-full
        [&::-webkit-scrollbar-thumb]:bg-gray-300
        dark:[&::-webkit-scrollbar-thumb]:bg-gray-600`}
                      >
                        {categories.map((cat) => (
                          <button
                            key={cat.id}
                            type="button"
                            role="option"
                            aria-selected={isCategory === cat.id}
                            onClick={() => {
                              setCategory(cat.id);
                              setIsCategoryOpen(false);
                            }}
                            className={`px-4 py-2 rounded-xl border-none cursor-pointer text-left ${
                              isCategory === cat.id
                                ? "bg-blue-100 text-blue-700 font-medium dark:bg-blue-900/50 dark:text-blue-300"
                                : "text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                            }`}
                          >
                            {cat.name}
                          </button>
                        ))}
                      </div>,
                      document.body,
                    )}
                </div>
                <div
                  className={`relative px-6 pb-6 flex flex-col sm:flex-row-reverse gap-3`}
                >
                  <button
                    type="button"
                    onClick={handleEdit}
                    disabled={isLoaded}
                    className={`${baseBtnClass} ${defaultBtnClass}`}
                  >
                    {isLoaded ? "Editing..." : "Edit Audio"}
                  </button>

                  <button
                    disabled={isLoaded}
                    type="button"
                    onClick={closeModal}
                    className={`${baseBtnClass} ${defaultBtnClass}`}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

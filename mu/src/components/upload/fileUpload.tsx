import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronDown,
  faFileAudio,
  faFileCsv,
  faList,
  faSpinner,
  faUpload,
  faX,
} from "@fortawesome/free-solid-svg-icons";
import Loader from "../loader";
import { getAllCategories } from "@/app/api/client/services/categories/api";
import { uploadSong } from "@/app/api/client/services/audio/api";
import WishListMoadal from "../listModal";
import { Play, Pause } from "lucide-react";
import BulkCsvUpload from "./bulkUpload";
import { useAppleWebkit } from "@/hooks/useAppleWebkit";
import { panelSurface } from "@/lib/surfaceDropdown";

interface Category {
  id: string;
  name: string;
}

const max_upload_bytes = 500 * 1024 * 1024;
const max_files = 5;
const invisible_chars = /[\p{Cc}\p{Cf}\p{Co}\p{Cs}\p{Zl}\p{Zp}]/u;
const audio_ext = /\.(mp3|wav)$/i;

const FileUpload: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [mp3Files, setMp3Files] = useState<File[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCategory, setCategory] = useState("");
  const [artistName, setArtistName] = useState("");
  const [wishListModal, setWishListModal] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentPlay, setCurrentPlay] = useState<number | null>(null);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [bulkMode, setBulkMode] = useState(false);
  const isAppleWebkit = useAppleWebkit();

  const totalSizeMB = useMemo(() => {
    const totalBytes = mp3Files.reduce((acc, file) => acc + file.size, 0);
    return (totalBytes / 1048576).toFixed(2); // Convert bytes to MB
  }, [mp3Files]);

  const selectClass =
    "w-auto min-w-[160px] px-4 py-3 rounded-2xl border border-white/35 dark:border-white/20 bg-white/65 dark:bg-black/35 backdrop-blur-md text-slate-900 dark:text-gray-200 outline-none cursor-pointer focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 flex items-center gap-2";

  useEffect(() => {
    if (currentFile && audioRef.current) {
      const objectUrl = URL.createObjectURL(currentFile);
      audioRef.current.src = objectUrl;
      audioRef.current.play();

      return () => {
        URL.revokeObjectURL(objectUrl);
      };
    } else if (!currentFile && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
  }, [currentFile]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!isDropdownOpen) return;

      const target = event.target as Node;

      if (
        (dropdownRef.current && dropdownRef.current.contains(target)) ||
        (event.target as HTMLElement).closest("[data-filter-button]")
      ) {
        return;
      }

      setIsDropdownOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  // Function to process the MP3 files uploaded
  const processFiles = (files: File[]) => {
    if (files.length > max_files) {
      alert(`You can only upload a maximum of ${max_files} files.`);
      return;
    }

    const valid = files.filter(
      (file) => audio_ext.test(file.name) || file.type.startsWith("audio/"),
    );

    if (valid.length === 0) {
      alert("Only MP3 or WAV files are allowed.");
      return;
    }

    const tooBig = valid.find((file) => file.size > max_upload_bytes);
    if (tooBig) {
      alert(`"${tooBig.name}" is larger than 500 MB.`);
      return;
    }

    const empty = valid.find((file) => file.size === 0);
    if (empty) {
      alert(`"${empty.name}" is empty.`);
      return;
    }

    setMp3Files(valid);
    setCurrentFile(null);
    setCurrentPlay(null);
    setProgress(0);
    audioRef.current?.pause();
  };

  // Function to handle drag over event
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // Function to handle drop event
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  }, []);

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    processFiles(files);
  };

  // Function to open the file input dialog
  const handleClick = () => {
    fileInputRef.current?.click();
  };

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

  //Clear all states
  const handleClearUpload = useCallback(() => {
    setMp3Files([]);
    setCategory("");
    setArtistName("");
    setCurrentFile(null);
    setCurrentPlay(null);
    setProgress(0);

    if (audioRef.current) {
      audioRef.current?.pause();
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  //upload audio
  const handleUpload = useCallback(async () => {
    if (audioRef.current) {
      audioRef?.current.pause();
    }
    if (mp3Files.length === 0) {
      alert("Please select at least one MP3 file to upload.");
      return;
    }
    if (!isCategory) {
      alert("Please select a category before uploading.");
      return;
    }
    if (!artistName.trim()) {
      alert("Please enter the artist name before uploading.");
      return;
    }
    if (invisible_chars.test(artistName)) {
      alert("Artist name contains invisible or control characters.");
      return;
    }
    setIsLoading(true);
    try {
      const results = await Promise.allSettled(
        mp3Files.map((file) => {
          const songName = file.name
            .replace(/\.[^/.]+$/, "")
            .replace(new RegExp(invisible_chars.source, "gu"), "")
            .normalize("NFC")
            .trim();
          return uploadSong(file, songName, artistName, isCategory);
        }),
      );

      const failed = results.filter((r) => r.status === "rejected");
      if (failed.length === 0) {
        alert("All files uploaded successfully!");
      } else {
        const reason =
          failed[0].status === "rejected" ? String(failed[0].reason) : "";
        alert(
          `${results.length - failed.length} uploaded, ${failed.length} failed. ${reason}`,
        );
      }
    } catch (error) {
      // console.error(error);
      if (error instanceof Error) {
        alert(`Upload failed: ${error.message}`);
      } else {
        alert("An unknown error occurred during upload.");
      }
    } finally {
      setMp3Files([]);
      setCurrentFile(null);
      setCurrentPlay(null);
      setProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setIsLoading(false);
    }
  }, [mp3Files, isCategory, artistName, handleClearUpload]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    if (bulkMode) return;
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const isTypingInInput = e.target instanceof HTMLInputElement;

      if (e.key === "Enter" && !isLoading) {
        e.preventDefault();
        handleUpload();
      } else if (e.key === "Delete" || e.key === "Backspace") {
        if (!isTypingInInput) {
          e.preventDefault();
          handleClearUpload();
        }
      }
    };

    document.addEventListener("keydown", handleGlobalKeyDown);
    return () => document.removeEventListener("keydown", handleGlobalKeyDown);
  }, [handleUpload, handleClearUpload, bulkMode]);

  const selectedCategoryName = useMemo(() => {
    const selected = categories.find((cat) => cat.id === isCategory);
    return selected ? selected.name : "Select category…";
  }, [isCategory, categories]);

  const toggleBulkMode = () => {
    audioRef.current?.pause();
    setCurrentFile(null);
    setCurrentPlay(null);
    setProgress(0);
    setIsDropdownOpen(false);
    setBulkMode((on) => !on);
  };

  const handleAudio = (index: number) => {
    if (index === currentPlay) {
      if (isPlaying) {
        audioRef.current?.pause();
      } else {
        audioRef.current?.play();
      }
      return;
    }
    setCurrentPlay(index);
    setCurrentFile(mp3Files[index]);
  };

  return (
    <div className="flex-1 justify-center items-center w-auto  mx-4 px-3 lg:mx-16 lg:px-6 flex flex-col justify-center mt-20 md:mt-24 mb-20">
      <div className="flex flex-col md:flex-row flex-wrap items-center justify-between gap-4 w-full mb-6 w-full md:w-auto">
        {categories.length === 0 ? (
          <div className={`${selectClass} cursor-wait opacity-80`}>
            <FontAwesomeIcon
              icon={faSpinner}
              className="w-4 h-4 animate-spin"
            />
            <span className="text-sm">Loading...</span>
          </div>
        ) : (
          <div className="relative" ref={dropdownRef}>
            <button
              disabled={isLoading}
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-auto min-w-[160px] px-4 py-3 flex items-center justify-between gap-3 rounded-2xl border-none bg-gray-100 text-black hover:bg-gray-200 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700 backdrop-blur-md outline-none cursor-pointer focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>{selectedCategoryName}</span>
              <FontAwesomeIcon
                icon={faChevronDown}
                className={`w-3 h-3 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
              />
            </button>

            {isDropdownOpen && (
              <div
                className={`absolute z-50 mt-2 p-4 rounded-2xl flex flex-col gap-2 w-60 md:w-96
      h-auto max-h-60 overflow-y-auto
      ${panelSurface(isAppleWebkit, "shadow-lg")}
      [&::-webkit-scrollbar]:w-1.5
      [&::-webkit-scrollbar-thumb]:rounded-full
      [&::-webkit-scrollbar-thumb]:bg-gray-300
      dark:[&::-webkit-scrollbar-thumb]:bg-gray-600`}
              >
                {" "}
                <button
                  type="button"
                  onClick={() => {
                    setCategory("");
                    setIsDropdownOpen(false);
                  }}
                  className={`px-4 py-2 rounded-xl border-none cursor-pointer text-left ${
                    isCategory === ""
                      ? "bg-blue-100 text-blue-700 font-medium dark:bg-blue-900/50 dark:text-blue-300"
                      : "text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  Select category…
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setCategory(cat.id);
                      setIsDropdownOpen(false);
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
              </div>
            )}
          </div>
        )}
        <input
          disabled={isLoading}
          title="artist name"
          type="text"
          placeholder="Artist Name"
          value={artistName}
          onChange={(e) => setArtistName(e.target.value)}
          className="w-auto px-4 py-3 rounded-2xl border-none bg-gray-100 text-black hover:bg-gray-200 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700 backdrop-blur-md outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50  disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <div className="hidden sm:flex items-center px-2">
          <p className="font-mono text-sm text-slate-600 dark:text-slate-400">
            Total: {mp3Files.length > 0 ? `${totalSizeMB} MB` : "0 MB"}
          </p>
        </div>
        <div className="flex flex-row flex-wrap justify-center items-center gap-2">
          <button
            type="button"
            disabled={isLoading}
            title="Wishlist"
            aria-label="Wishlist"
            className="inline-flex items-center justify-center w-auto py-3 px-3 rounded-full border-none cursor-pointer  mr-4 bg-gray-100 text-black hover:bg-gray-200 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700  disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => setWishListModal(true)}
          >
            <FontAwesomeIcon icon={faList} className={"w-4 h-4"} />
          </button>
          <button
            type="button"
            disabled={isLoading}
            title={
              bulkMode ? "Back to drag and drop" : "Upload from a CSV list"
            }
            aria-label={
              bulkMode ? "Back to drag and drop" : "Upload from a CSV list"
            }
            aria-pressed={bulkMode}
            className={`inline-flex items-center justify-center w-auto py-3 px-3 rounded-full border-none cursor-pointer mr-4 disabled:opacity-50 disabled:cursor-not-allowed ${
              bulkMode
                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
                : "bg-gray-100 text-black hover:bg-gray-200 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
            }`}
            onClick={toggleBulkMode}
          >
            {bulkMode ? (
              <FontAwesomeIcon icon={faFileAudio} className={"w-4 h-4"} />
            ) : (
              <FontAwesomeIcon icon={faFileCsv} className={"w-4 h-4"} />
            )}
          </button>
          {!bulkMode && (
            <>
              <button
                type="submit"
                disabled={isLoading}
                title="Upload"
                aria-label="Upload"
                className="inline-flex items-center justify-center w-auto py-3 px-3 rounded-full border-none cursor-pointer  mr-4 bg-gray-100 text-black hover:bg-gray-200 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700  disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => handleUpload()}
              >
                <FontAwesomeIcon icon={faUpload} className={"w-4 h-4"} />
              </button>
              <button
                type="button"
                disabled={isLoading}
                title="Clear"
                aria-label="Clear"
                className="inline-flex items-center justify-center w-auto py-3 px-3 rounded-full border-none cursor-pointer  mr-4 bg-gray-100 text-red-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-red-400 dark:hover:bg-gray-700  disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => handleClearUpload()}
              >
                <FontAwesomeIcon icon={faX} className={"w-4 h-4"} />
              </button>
            </>
          )}
        </div>
      </div>
      {bulkMode ? (
        <BulkCsvUpload
          categories={categories}
          onClose={() => setBulkMode(false)}
        />
      ) : (
        <div
          className={`relative overflow-hidden md:w-[680px] w-[260px]  ${isLoading ? "disabled:opacity-50 disabled:cursor-not-allowed" : "cursor-pointer"} min-h-[360px] rounded-[2rem] bg-white/5 hover:bg-white/10 dark:bg-black/10 dark:hover:bg-black/20 backdrop-blur-2xl border border-white/20 dark:border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] outline-none focus-none transition-all duration-500`}
        >
          <div
            className={`w-full h-full min-h-[360px] flex flex-col items-center justify-center p-6 relative z-10 ${isLoading && "disabled:opacity-50 disabled:cursor-not-allowed"}`}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onDragLeave={handleDragLeave}
            onClick={handleClick}
          >
            {isLoading ? (
              <Loader />
            ) : (
              <>
                {mp3Files.length === 0 && (
                  <div className="flex flex-col items-center gap-6 text-center w-full mx-auto">
                    {" "}
                    <div className="p-6 rounded-full bg-transparent border-none dark:border-white/10">
                      <FontAwesomeIcon
                        icon={faUpload}
                        className="w-10 h-10 md:w-12 md:h-12  text-black dark:text-white"
                      />
                    </div>
                    <h1 className="text-lg md:text-xl text-black break-words dark:text-white font-bold">
                      Drag and Drop your MP3 files here or click to select
                    </h1>
                  </div>
                )}

                {mp3Files.length > 0 && (
                  <div className="w-full max-h-60 p-4 overflow-y-auto flex flex-col items-center [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-600 dark:[&::-webkit-scrollbar-thumb]:bg-gray-300">
                    {mp3Files.map((file, index) => (
                      <div
                        key={index}
                        className="w-full mt-4 p-4 rounded-2xl bg-gray-200 dark:bg-gray-700 text-left"
                      >
                        <div className="flex flex-row flex-wrap items-center gap-3 sm:gap-4 overflow-hidden">
                          {" "}
                          <div className="relative flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0">
                            {index === currentPlay && (
                              <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none">
                                <circle
                                  cx="50%"
                                  cy="50%"
                                  r="46%"
                                  className="stroke-gray-300 dark:stroke-gray-600 opacity-50"
                                  strokeWidth="2"
                                  fill="none"
                                />
                                <circle
                                  cx="50%"
                                  cy="50%"
                                  r="46%"
                                  className="stroke-blue-500 transition-all duration-100 ease-linear"
                                  strokeWidth="2"
                                  fill="none"
                                  strokeLinecap="round"
                                  style={{
                                    strokeDasharray: 100,
                                    strokeDashoffset: 100 - progress,
                                  }}
                                  pathLength="100"
                                />
                              </svg>
                            )}
                            <button
                              aria-label={
                                index === currentPlay && isPlaying
                                  ? "play"
                                  : "pause"
                              }
                              title={
                                index === currentPlay && isPlaying
                                  ? "play"
                                  : "pause"
                              }
                              disabled={isLoading || mp3Files.length === 0}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (index !== currentPlay) setProgress(0);
                                handleAudio(index);
                              }}
                              className="relative z-10 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 backdrop-blur-md shadow-none outline-none focus-none"
                            >
                              {index === currentPlay && isPlaying ? (
                                <Pause
                                  fill="currentColor"
                                  className="w-4 h-4 sm:w-5 sm:h-5 text-black dark:text-white"
                                />
                              ) : (
                                <Play
                                  fill="currentColor"
                                  className="w-4 h-4 sm:w-5 sm:h-5 text-black dark:text-white ml-0.5"
                                />
                              )}
                            </button>
                          </div>
                          <p className="m-0 text-sm opacity-90 truncate break-all text-slate-900 dark:text-white">
                            {index + 1}. {file.name}
                          </p>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
                            {(file.size / 1048576).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <input
                  disabled={isLoading}
                  title="file"
                  type="file"
                  accept=".mp3,.wav,audio/*"
                  multiple
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                />
              </>
            )}
          </div>
        </div>
      )}
      {currentFile !== null && (
        <audio
          preload="metadata"
          ref={audioRef}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onTimeUpdate={() => {
            if (audioRef.current) {
              const current = audioRef.current.currentTime;
              const total = audioRef.current.duration;
              setProgress((current / total) * 100 || 0);
            }
          }}
          onEnded={() => {
            setProgress(0);
            setCurrentPlay(null);
            setCurrentFile(null);
          }}
          onError={() => alert("Sorry an error occured in playing audio!!!")}
        />
      )}
      {wishListModal && (
        <WishListMoadal handleClose={() => setWishListModal(false)} />
      )}
    </div>
  );
};

export default FileUpload;

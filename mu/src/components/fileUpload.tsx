import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faList, faSpinner, faUpload } from "@fortawesome/free-solid-svg-icons";
import Loader from "./loader";
import { getAllCategories } from "@/app/api/client/services/categories/api";
import { uploadSong } from "@/app/api/client/services/audio/api";
import WishListMoadal from "./listModal";

interface Category {
  id: string;
  name: string;
}

const FileUpload: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [mp3Files, setMp3Files] = useState<File[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCategory, setCategory] = useState("");
  const [artistName, setArtistName] = useState("");
  const [wishListModal, setWishListModal] = useState(false);

  const totalSizeMB = useMemo(() => {
    const totalBytes = mp3Files.reduce((acc, file) => acc + file.size, 0);
    return (totalBytes / 1048576).toFixed(2); // Convert bytes to MB
  }, [mp3Files]);

  const selectClass =
    "w-auto min-w-[160px] px-4 py-3 rounded-2xl border border-white/35 dark:border-white/20 bg-white/65 dark:bg-black/35 backdrop-blur-md text-slate-900 dark:text-gray-200 outline-none cursor-pointer focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 flex items-center gap-2";

  // Function to process the MP3 files uploaded
  const processMP3Files = (files: File[]) => {
    if (files.length > 5) {
      alert("You can only upload a maximum of 5 files.");
      return;
    }

    const validMp3Files = files.filter((file) => file.type === "audio/mpeg");

    if (validMp3Files.length > 0) {
      setMp3Files(validMp3Files);
    } else {
      alert("Only MP3 files are allowed.");
    }
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
    processMP3Files(files);
  }, []);

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    processMP3Files(files);
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

  //upload audio
  const handleUpload = useCallback(async () => {
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
    if (!/^[a-zA-Z0-9\s]+$/.test(artistName)) {
      alert("Artist name can only contain letters and numbers.");
      return;
    }
    setIsLoading(true);
    try {
      const uploadPromises = mp3Files.map((file) => {
        const songName = file.name.replace(/\.[^/.]+$/, "");
        return uploadSong(file, songName, artistName, isCategory);
      });
      await Promise.all(uploadPromises);
      alert("All files uploaded successfully!");
      setMp3Files([]);
      setArtistName("");
    } catch (error) {
      // console.error(error);
      if (error instanceof Error) {
        alert(`Upload failed: ${error.message}`);
      } else {
        alert("An unknown error occurred during upload.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [mp3Files, isCategory, artistName]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return (
    <div className="uploadRoot">
      <div className="uploadControls">
        {categories.length === 0 ? (
          <div className={`${selectClass} cursor-wait opacity-80`}>
            <FontAwesomeIcon
              icon={faSpinner}
              className="w-4 h-4 animate-spin"
            />
            <span className="text-sm">Loading...</span>
          </div>
        ) : (
          <select
            disabled={isLoading}
            title="category"
            value={isCategory}
            className="w-auto px-4 py-3 rounded-2xl border-none bg-gray-100 text-black hover:bg-gray-200 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700 backdrop-blur-md outline-none cursor-pointer focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="" disabled>
              Select category…
            </option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        )}
        <input
          title="artist name"
          type="text"
          placeholder="Artist Name"
          value={artistName}
          onChange={(e) => setArtistName(e.target.value)}
          className="w-auto px-4 py-3 rounded-2xl border-none bg-gray-100 text-black hover:bg-gray-200 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700 backdrop-blur-md outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
        />
        <div className="uploadControls">
          <p className="font-mono text-sm text-slate-600 dark:text-slate-400">
            Total: {mp3Files.length > 0 ? `${totalSizeMB} MB` : "0 MB"}
          </p>
        </div>
        <div className="flex flex-row flex-wrap justify-center items-center gap-2">
          <button
            disabled={isLoading}
            title="Wishlist"
            aria-label="Wishlist"
            className="inline-flex items-center justify-center w-auto py-3 px-3 rounded-full border-none cursor-pointer  mr-4 bg-gray-100 text-black hover:bg-gray-200 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
            onClick={() => setWishListModal(true)}
          >
            <FontAwesomeIcon icon={faList} className={"w-4 h-4"} />
          </button>
          <button
            disabled={isLoading}
            title="Upload"
            aria-label="Upload"
            className="inline-flex items-center justify-center w-auto py-3 px-3 rounded-full border-none cursor-pointer  mr-4 bg-gray-100 text-black hover:bg-gray-200 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
            onClick={() => handleUpload()}
          >
            <FontAwesomeIcon icon={faUpload} className={"w-4 h-4"} />
          </button>
        </div>
      </div>
      <div className="uploadDropzoneWrap">
        <div
          className="uploadDropzone"
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
                <>
                  <FontAwesomeIcon
                    icon={faUpload}
                    className="w-[72px] h-[72px] md:w-[88px] md:h-[88px] animate-bounce text-black dark:text-white"
                  />
                  <h1 className="text-lg md:text-xl text-black dark:text-white font-bold p-3 md:p-4 max-w-prose">
                    Drag and Drop your MP3 file here or click to select
                  </h1>
                </>
              )}

              {mp3Files.length > 0 && (
                <div className="w-full max-h-60 overflow-y-auto flex flex-col items-center [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                  {mp3Files.map((file, index) => (
                    <div
                      key={index}
                      className="w-full max-w-[760px] mt-4 p-4 rounded-xl bg-gray-200 dark:bg-gray-700 text-left"
                    >
                      <p className="m-0 text-sm opacity-90 truncate break-words text-slate-900 dark:text-white">
                        {index + 1}. {file.name}
                      </p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
                        {(file.size / 1048576).toFixed(2)} MB
                      </p>
                    </div>
                  ))}
                </div>
              )}
              <input
                title="file"
                type="file"
                accept=".mp3"
                multiple
                ref={fileInputRef}
                onChange={handleFileChange}
                style={{ display: "none" }}
              />
            </>
          )}
        </div>
      </div>
      {wishListModal && (
        <WishListMoadal handleClose={() => setWishListModal(false)} />
      )}
    </div>
  );
};

export default FileUpload;

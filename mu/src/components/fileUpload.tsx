import React, { useCallback, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart, faUpload } from "@fortawesome/free-solid-svg-icons";
import { storage5 } from "@/config/firebase5";
import {
  getDownloadURL,
  list,
  ref,
  uploadBytesResumable,
} from "@firebase/storage";
import Loader from "./loader";

const FileUpload: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [mp3Files, setMp3Files] = useState<File[]>([]);
  const [isScanning, setScanning] = useState(false);
  const [isLoading, setLoading] = useState(false);
  const [isFavourite, setFavourite] = useState(false);
  const [isCategory, setCategory] = useState("");

  // Function to process the MP3 files uploaded
  const processMP3Files = (files: File[]) => {
    const mp3Files = files.filter((file) => file.type === "audio/mpeg");
    if (mp3Files.length > 0) {
      setMp3Files(mp3Files);
    } else {
      alert("Only MP3 files are allowed.");
    }
  };

  // Function to handle file upload
  const uploadFile = async (file: File) => {
    try {
      if (!isCategory) {
        alert("Please select a category");
        return;
      } else if (!file) {
        alert("Please upload a file.");
        return;
      } 
      setLoading(true);

      //Verify jwt cookie
      const res = await fetch("/api/services/cookieChecker", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message);
        console.error("Error verifying cookie:", data.message);
        setLoading(false);
        setScanning(false);
        return;
      }

      // Get a reference to the music directory in Firebase Storage
      const musicDirRef = ref(storage5, "music/");

      // Check if the file already exists
      const listResult = await list(musicDirRef);

      const fileExists = listResult.items.some(
        (itemRef) => itemRef.name === file.name
      );

      if (fileExists) {
        alert("File already exists.");
        setLoading(false);
        setScanning(false);
        setMp3Files([])
        return;
      }
      // Upload the file to Firebase Storage
      const storageRef = ref(storage5, `music/${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          // Handle upload progress (if needed)
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log(`Upload is ${progress}% done`);
        },
        (error) => {
          // Handle upload error
          console.error("Upload failed:", error);
          setLoading(false);
          setMp3Files([])
          alert("An error occurred while uploading the image.");
        },
        async () => {
          try {
            // Upload completed successfully, get the download URL
            const downloadUrl = await getDownloadURL(storageRef);

            //upload to mongodb
            const res = await fetch("/api/services/upload", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                name: file.name,
                category: isCategory,
                fileUrl: downloadUrl,
                favourite: isFavourite,
              }),
            });
            const data = await res.json();
            if (!res.ok) {
              alert(data.message);
              console.error("Error uploading to MongoDB:", data.message);
              setLoading(false);
              setMp3Files([])
            } else {
              alert("File uploaded successfully.");
              setLoading(false);
              setMp3Files([])
            }
          } catch (error) {
            console.error("Error getting download URL:", error);
            alert("An error occurred while uploading the image.");
            setLoading(false);
            setMp3Files([])
          }
          setLoading(false);
          setMp3Files([])
        }
      );
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("An error occurred while uploading the file.");
      setLoading(false);
      setScanning(false);
      setMp3Files([])
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

  // Function to handle favourite button click
  const handleFavourite = () => {
    setFavourite(!isFavourite);
  };

  return (
    <div className="h-4/5 w-auto">
      <div className="flex flex-row flex-wrap justify-around items-center m-4">
        <select
          title="category"
            className="w-auto px-4 py-3 bg-white/20 dark:bg-black/20 backdrop-blur-sm border border-white/30 dark:border-white/20 rounded-2xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-200 appearance-none cursor-pointer"
          onChange={(e) => {
            const selectedValue = e.target.value;
            if (selectedValue === "Rap") setCategory("Rap");
            else if (selectedValue === "OldVibes") setCategory("OldVibes");
            else if (selectedValue === "Classic") setCategory("Classic");
            else if (selectedValue === "LK") setCategory("LK");
            else if (selectedValue === "FreeStyle") setCategory("FreeStyle");
          }}
        >
  <option value="Rap" className="bg-white dark:bg-gray-800">Rap</option>
                    <option value="OldVibes" className="bg-white dark:bg-gray-800">Old Vibes</option>
                    <option value="Classic" className="bg-white dark:bg-gray-800">Classic</option>
                    <option value="LK" className="bg-white dark:bg-gray-800">LK</option>
                    <option value="Free Style" className="bg-white dark:bg-gray-800">Free Style</option>
                    <option value="memory_lane" className="bg-white dark:bg-gray-800">Memory Lane</option>
        </select>
        <button
          title="favourite"
          className={`w-auto flex justify-end 
            items-center text-black dark:text-white 
            mt-4  mb-4 space-x-2 
            p-3  rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 mr-4`}
          onClick={() => handleFavourite()}
        >
          <FontAwesomeIcon
            icon={faHeart}
            className={`w-4 h-4 ${isFavourite ? "text-red-500" : "text-black dark:text-white"
              }`}
          />
        </button>
      </div>
      <div className="flex items-center justify-center h-5/6 m-8 w-auto">
        <div
          className="flex flex-col items-center justify-center h-full w-10/12 rounded-3xl shadow-lg shadow-cyan-900/50 dark:shadow-cyan-100/20 p-4 border-2 border-dashed border-cyan-500 cursor-pointer relative"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onDragLeave={handleDragLeave}
          onClick={handleClick}
        >
          {isLoading || isScanning ? (
            <Loader />
          ) : (
            <>
              {mp3Files.length == 0 && (
                <>
                  <FontAwesomeIcon
                    icon={faUpload}
                    className="animate-bounce w-16 h-16 md:w-20 md:h-20 z-10"
                  />
                  <h1 className="text-xl md:text-2xl font-bold text-black dark:text-white subpixel-antialiased p-1 md:p-4 text-center z-10">
                    Drag and Drop your MP3 file here or click to select
                  </h1>
                </>
              )}
              {mp3Files.length > 0 && (
                <div className="mt-4 p-4 w-full text-center bg-gray-200 dark:bg-gray-700 rounded-lg">
                  <h2 className="text-lg font-semibold text-black dark:text-white">
                    Uploaded File:
                  </h2>
                  <p className="text-sm text-gray-800 dark:text-gray-300">
                    {mp3Files[0].name} (
                    {(mp3Files[0].size / 1048576).toFixed(2)} MB)
                  </p>
                </div>
              )}
              <input
                title="file"
                type="file"
                accept=".mp3"
                ref={fileInputRef}
                onChange={handleFileChange}
                style={{ display: "none" }} // Hide the file input
              />
            </>
          )}
        </div>
      </div>
      <div className="flex items-center justify-center items-center w-auto">
          <button
       className={`w-auto flex justify-end 
            items-center text-black dark:text-white 
            mt-4  mb-4 space-x-2 
            p-3  rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 mr-4`}
            onClick={() => uploadFile(mp3Files[0])}
            disabled={isScanning || isLoading}
          >
            <span className="text-sm md:text-lg">SUBMIT</span>
          </button>
      </div>
    </div>
  );
};

export default FileUpload;

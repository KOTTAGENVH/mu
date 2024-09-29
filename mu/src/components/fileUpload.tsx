import React, { useCallback, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart, faUpload } from "@fortawesome/free-solid-svg-icons";
import { storage1 } from "@/config/firebase1";
import { storage2 } from "@/config/firebase2";
import { storage3 } from "@/config/firebase3";
import { storage4 } from "@/config/firebase4";
import { storage5 } from "@/config/firebase5";
import { motion } from "framer-motion";
import {
  FirebaseStorage,
  getDownloadURL,
  list,
  ref,
  uploadBytesResumable,
} from "@firebase/storage";

const FileUpload: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [mp3Files, setMp3Files] = useState<File[]>([]);
  const [isScanning, setScanning] = useState(false);
  const [isLoading, setLoading] = useState(false);
  const [isFavourite, setFavourite] = useState(false);
  const [storage, setStorage] = useState<FirebaseStorage>(storage1);
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

  // // Function to scan the file for viruses
  // const scanFileForViruses = async (file: File): Promise<boolean> => {
  //   const formData = new FormData();
  //   formData.append("file", file);

  //   //Api key for VirusTotal
  //   const apiKey = process.env.NEXT_PUBLIC_VIRUS_TOTAL_API_KEY;
  //   if (!apiKey) {
  //     alert("VirusTotal API key not found.");
  //     return false;
  //   }

  //   const response = await fetch("https://www.virustotal.com/api/v3/files", {
  //     method: "POST",
  //     headers: {
  //       "x-apikey": apiKey,
  //     },
  //     body: formData,
  //   });

  //   const result = await response.json();
  //   if (!response.ok) {
  //     alert("Error uploading to VirusTotal. Please try again later.");
  //     console.error("Error uploading to VirusTotal:", result);
  //     return false;
  //   }

  //   const analysisId = result.data.id;

  //   return new Promise((resolve) => {
  //     const checkAnalysis = async () => {
  //       const analysisResponse = await fetch(
  //         `https://www.virustotal.com/api/v3/analyses/${analysisId}`,
  //         {
  //           headers: {
  //             "x-apikey": apiKey,
  //           },
  //         }
  //       );
  //       const analysisResult = await analysisResponse.json();
  //       if (analysisResult.data.attributes.status === "completed") {
  //         resolve(analysisResult.data.attributes.stats.malicious === 0);
  //       } else {
  //         setTimeout(checkAnalysis, 2000);
  //       }
  //     };
  //     checkAnalysis();
  //   });
  // };

  // Function to handle file upload
  const uploadFile = async (file: File) => {
    try {
      if (!isCategory) {
        alert("Please select a category");
        return;
      } else if (!file) {
        alert("Please upload a file.");
        return;
      } else if (!storage) {
        alert("Please select a storage.");
        return;
      }
      // // Scan the file for viruses
      // setScanning(true);
      // const isSafe = await scanFileForViruses(file);
      // setScanning(false);
      // if (!isSafe) {
      //   alert("The file contains viruses and cannot be uploaded.");
      //   return;
      // }
      // Set loading state
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
      const musicDirRef = ref(storage, "music/");

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
      const storageRef = ref(storage, `music/${file.name}`);
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
      <div className="hidden md:flex flex-row flex-wrap justify-center items-center">
        <motion.div
          className="box"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          <button
            className={`w-32 md:w-48 flex justify-center items-center 
      text-black dark:text-white text-neutral-700 ml-4 mt-4 space-x-2
      hover:bg-gradient-to-r from-indigo-500 from-10% via-sky-500 via-30% to-emerald-500 to-90% 
      p-2 rounded-tl-3xl rounded-bl-3xl shadow-lg shadow-cyan-900/50 dark:shadow-cyan-500/50 
      hover:shadow-none ${storage === storage1 ? "bg-red-500" : ""}`}
            onClick={() => setStorage(storage1)}
          >
            <span className="text-sm md:text-lg">Storage 1</span>
          </button>
        </motion.div>

        <motion.div
          className="box"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          <button
            className={`w-32 md:w-48 flex justify-center items-center 
      text-black dark:text-white text-neutral-700 mt-4 space-x-2
      hover:bg-gradient-to-r from-indigo-500 from-10% via-sky-500 via-30% to-emerald-500 to-90% 
      p-2 shadow-lg shadow-cyan-900/50 dark:shadow-cyan-500/50 
      hover:shadow-none md:rounded-none rounded-br-3xl rounded-tr-3xl ${
        storage === storage2 ? "bg-red-500" : ""
      }`}
            onClick={() => setStorage(storage2)}
          >
            <span className="text-sm md:text-lg">Storage 2</span>
          </button>
        </motion.div>

        <motion.div
          className="box"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          <button
            className={`w-32 md:w-48 flex justify-center items-center 
      text-black dark:text-white text-neutral-700 mt-4 space-x-2
      hover:bg-gradient-to-r from-indigo-500 from-10% via-sky-500 via-30% to-emerald-500 to-90% 
      p-2 shadow-lg shadow-cyan-900/50 dark:shadow-cyan-500/50 
      hover:shadow-none md:rounded-none rounded-bl-3xl rounded-tl-3xl ${
        storage === storage3 ? "bg-red-500" : ""
      }`}
            onClick={() => setStorage(storage3)}
          >
            <span className="text-sm md:text-lg">Storage 3</span>
          </button>
        </motion.div>

        <motion.div
          className="box"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          <button
            className={`w-32 md:w-48 flex justify-center items-center 
      text-black dark:text-white text-neutral-700 mt-4 space-x-2
      hover:bg-gradient-to-r from-indigo-500 from-10% via-sky-500 via-30% to-emerald-500 to-90% 
      p-2 shadow-lg shadow-cyan-900/50 dark:shadow-cyan-500/50 
      hover:shadow-none md:rounded-none rounded-br-3xl rounded-tr-3xl ${
        storage === storage4 ? "bg-red-500" : ""
      }`}
            onClick={() => setStorage(storage4)}
          >
            <span className="text-sm md:text-lg">Storage 4</span>
          </button>
        </motion.div>

        <motion.div
          className="box"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          <button
            className={`w-32 md:w-48  flex justify-center items-center 
      text-black dark:text-white text-neutral-700 mt-4 space-x-2
      hover:bg-gradient-to-r from-indigo-500 from-10% via-sky-500 via-30% to-emerald-500 to-90% 
      p-2 shadow-lg shadow-cyan-900/50 dark:shadow-cyan-500/50 
      hover:shadow-none  rounded-br-3xl rounded-tr-3xl ${
        storage === storage5 ? "bg-red-500" : ""
      }`}
            onClick={() => setStorage(storage5)}
          >
            <span className="text-sm md:text-lg">Storage 5</span>
          </button>
        </motion.div>
      </div>
      <div className="flex flex-row flex-wrap justify-center items-center m-4">
        <div className="md:hidden relative flex flex-col items-center">
          <select
            title="storage"
            className="dark:text-white text-black block w-28 m-4 p-2 border 
          border-gray-300 rounded-3xl shadow-lg shadow-cyan-900/50 dark:shadow-cyan-500/50 
      hover:shadow-none bg-white dark:bg-gray-800 dark:border-gray-800"
            onChange={(e) => {
              const selectedValue = e.target.value;
              if (selectedValue === "storage1") setStorage(storage1);
              else if (selectedValue === "storage2") setStorage(storage2);
              else if (selectedValue === "storage3") setStorage(storage3);
              else if (selectedValue === "storage4") setStorage(storage4);
              else if (selectedValue === "storage5") setStorage(storage5);
            }}
          >
            <option value="storage1">Storage 1</option>
            <option value="storage2">Storage 2</option>
            <option value="storage3">Storage 3</option>
            <option value="storage4">Storage 4</option>
            <option value="storage5">Storage 5</option>
          </select>
        </div>
        <select
          title="category"
          className="dark:text-white text-black block w-28 m-4 p-2 border 
          border-gray-300 rounded-3xl shadow-lg shadow-cyan-900/50 dark:shadow-cyan-500/50 
      hover:shadow-none bg-white dark:bg-gray-800 dark:border-gray-800"
          onChange={(e) => {
            const selectedValue = e.target.value;
            if (selectedValue === "Rap") setCategory("Rap");
            else if (selectedValue === "OldVibes") setCategory("OldVibes");
            else if (selectedValue === "Classic") setCategory("Classic");
            else if (selectedValue === "LK") setCategory("LK");
            else if (selectedValue === "FreeStyle") setCategory("FreeStyle");
          }}
        >
          <option value="Rap">Rap</option>
          <option value="OldVibes">OldVibes</option>
          <option value="Classic">Classic</option>
          <option value="LK">LK</option>
          <option value="FreeStyle">Free Style</option>
        </select>
        <motion.div
          className="box"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          <button
            title="favourite"
            className={`w-7 flex justify-center items-center 
      text-black dark:text-white text-neutral-700 m-4 p-2 space-x-2
      hover:bg-gradient-to-r from-indigo-500 from-10% via-sky-500 via-30% to-emerald-500 to-90% 
      rounded-3xl shadow-lg shadow-cyan-900/50 dark:shadow-cyan-500/50 
      hover:shadow-none `}
            onClick={() => handleFavourite()}
          >
            <FontAwesomeIcon
              icon={faHeart}
              className={`w-4 h-4 ${
                isFavourite ? "text-red-500" : "text-black dark:text-white"
              }`}
            />
          </button>
        </motion.div>
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
            <div className="absolute inset-0 bg-gray-100 bg-opacity-50 flex items-center justify-center rounded-3xl">
              <div
                className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full dark:border-cyan-500 border-cyan-500"
                role="status"
              >
                <span className="visually-hidden text-black dark:text-white">
                  Loading...
                </span>
              </div>
            </div>
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
        <motion.div
          className="box"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          <button
            className={`w-32 md:w-48 flex justify-center items-center 
      text-black dark:text-white text-neutral-700 m-4 space-x-2
      hover:bg-gradient-to-r from-indigo-500 from-10% via-sky-500 via-30% to-emerald-500 to-90% 
      p-2 rounded-3xl shadow-lg shadow-cyan-900/50 dark:shadow-cyan-500/50 
      hover:shadow-none`}
            onClick={() => uploadFile(mp3Files[0])}
            disabled={isScanning || isLoading}
          >
            <span className="text-sm md:text-lg">SUBMIT</span>
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default FileUpload;

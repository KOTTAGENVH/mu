import React, { useState } from "react";
import { motion } from "framer-motion";
import { youtubeDownloader } from "@/app/api/services/youtube_downloader";

interface ResponseInterface {
  status: number;
  data: {
    message: string;
    firebase_url: string;
    song_title: string;
  };
}

function UrlUpload() {
  const [isLink, setIsLink] = useState("");
  const [storage, setStorage] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [firebaseUrl, setFirebaseUrl] = useState("");
  const [name, setName] = useState("");

  // Check if the page is being accessed from localhost
  const isLocalhost =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";

  //call youtube downloader
  const handleUpload = async () => {
    try {
      if (!isLink) {
        alert("Please enter a valid URL");
        return;
      } else if (storage === 0) {
        alert("Please select a storage");
        return;
      } else if (storage > 5) {
        alert("Invalid storage");
        return;
      } else if (storage < 0) {
        alert("Invalid storage");
        return;
      } 
      setLoading(true);
      const response = await youtubeDownloader({
        link: isLink,
        storage_number: storage,
        token: process.env.NEXT_PUBLIC_API_TOKEN,
      })
      
      //Check if the response is successful
      if ('status' in response && response.status === 200) {
        const data = response as ResponseInterface;
        setFirebaseUrl(data.data.firebase_url);
        setName(data.data.song_title);
        alert(data.data.message);
        try {
        //Upload to Mongo DB
        const res = await fetch("/api/services/upload", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: name,
            category: "YTBMusic",
            fileUrl: firebaseUrl,
            favourite: false,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          alert(data.message);
          console.error("Error uploading to MongoDB:", data.message);
        } else {
          alert("File uploaded successfully.");
        }
      } catch (error) {
        console.error("Error uploading to MongoDB:", error);
        alert("An error occurred");
      }

      } else {
        alert("An error occurred");
      }
      setLoading(false);
      setIsLink("");
      setStorage(1);
    } catch (error) {
      console.log(error);
      alert("An error occurred");
    }
  };
  return (
    <div className="h-4/5 w-auto flex justify-center items-center">
      {loading && (
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
      )}
      {isLocalhost ? (
        <div className="h-2/5 w-4/5">
          <div className="hidden md:flex flex-row flex-wrap justify-center items-center m-4">
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
      hover:shadow-none ${storage === 1 ? "bg-red-500" : ""}`}
                onClick={() => setStorage(1)}
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
        storage === 2 ? "bg-red-500" : ""
      }`}
                onClick={() => setStorage(2)}
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
        storage === 3 ? "bg-red-500" : ""
      }`}
                onClick={() => setStorage(3)}
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
        storage === 4 ? "bg-red-500" : ""
      }`}
                onClick={() => setStorage(4)}
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
        storage === 5 ? "bg-red-500" : ""
      }`}
                onClick={() => setStorage(5)}
              >
                <span className="text-sm md:text-lg">Storage 5</span>
              </button>
            </motion.div>
          </div>
          <div className="md:hidden relative flex flex-col items-center">
            <select
              title="storage"
              className="dark:text-white text-black block w-28 m-4 p-2 border 
          border-gray-300 rounded-3xl shadow-lg shadow-cyan-900/50 dark:shadow-cyan-500/50 
      hover:shadow-none bg-white dark:bg-gray-800 dark:border-gray-800"
              onChange={(e) => {
                const selectedValue = e.target.value;
                if (selectedValue === "storage1") setStorage(1);
                else if (selectedValue === "storage2") setStorage(2);
                else if (selectedValue === "storage3") setStorage(3);
                else if (selectedValue === "storage4") setStorage(4);
                else if (selectedValue === "storage5") setStorage(5);
              }}
            >
              <option value="storage1">Storage 1</option>
              <option value="storage2">Storage 2</option>
              <option value="storage3">Storage 3</option>
              <option value="storage4">Storage 4</option>
              <option value="storage5">Storage 5</option>
            </select>
          </div>
          <h1 className="text-xl md:text-2xl">URL Upload</h1>
          <div className="flex flex-row">
            <input
              className="w-4/5 h-9 md:h-11 mt-4 shadow-lg shadow-cyan-900/50 dark:shadow-cyan-500/50 
      hover:shadow-none p-2 rounded-tl-3xl rounded-bl-3xl text-black"
              type="text"
              placeholder="Enter URL"
              value={isLink}
              onChange={(e) => setIsLink(e.target.value)}
            />
            <motion.div
              className="box"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <button
                className={`w-32 md:w-48 h-9 md:h-11 flex justify-center items-center 
      text-black dark:text-white text-neutral-700 mr-4 mt-4 space-x-2
      hover:bg-gradient-to-r from-indigo-500 from-10% via-sky-500 via-30% to-emerald-500 to-90% 
      p-2 rounded-tr-3xl rounded-br-3xl shadow-lg shadow-cyan-900/50 dark:shadow-cyan-500/50 
      hover:shadow-none`}
                onClick={handleUpload}
              >
                <span className="text-sm md:text-lg">Upload</span>
              </button>
            </motion.div>
          </div>
        </div>
      ) : (
        <h1 className="text-xl md:text-2xl">
          Sorry, you have not accessed via localhost
        </h1>
      )}
    </div>
  );
}

export default UrlUpload;

"use client";
import React, { useEffect, useState } from "react";
import OneAudioView from "./oneAudioView";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import { motion } from "framer-motion";
import { useModal } from "@/contextApi/modalOpen";
import EditModal from "./editModal";


interface Audio {
  _id: string;
  name: string;
  category: string;
  fileUrl: string;
  favourite: boolean;
}

function AudioList() {
  const [audioList, setAudioList] = useState<Audio[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const itemsPerPage = 3;
  const { Modal } = useModal();

  // Fetch audio from the API
  const fetchAudio = async () => {
    try {
      const res = await fetch("/api/services/audio", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });
      const data = await res.json();
      setAudioList(data.uploads);
    } catch (error) {
      console.error("Error fetching audio:", error);
    }
  };

  // Filter audio based on search
  const filteredAudio = () => {
    if (search === "") {
      fetchAudio();
    } else {
      const filteredAudio = audioList.filter(
        (audio) =>
          audio.name.toLowerCase().includes(search.toLowerCase()) ||
          audio.category.toLowerCase().includes(search.toLowerCase())
      );
      setAudioList(filteredAudio);
    }
  };

  // Fetch audio on component mount
  useEffect(() => {
    filteredAudio();
  }, [search]);

  // Calculate the index of the first and last item to display
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = audioList.slice(indexOfFirstItem, indexOfLastItem);

  // Handle page navigation
  const nextPage = () => {
    if (currentPage < Math.ceil(audioList.length / itemsPerPage)) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div className="flex justify-center items-center w-full h-auto">
      <div className="w-4/6 max-w-full bg-white bg-opacity-10 backdrop-blur-xl shadow-lg rounded-3xl shadow-cyan-900/50 dark:shadow-cyan-500/50 hover:shadow-none overflow-hidden">
        <div className="w-full h-full flex flex-col justify-between overflow-y-auto p-4">
          <input
            type="text"
            placeholder="Search"
            className="text-black dark:text-white w-full h-10 p-4 rounded-3xl shadow-lg shadow-cyan-900/50 dark:shadow-cyan-500/50 hover:shadow-none dark:bg-slate-950 bg-slate-300"
            onChange={(e) => setSearch(e.target.value)}
          />
          {currentItems.length === 0 && (
            <div className="text-center text-black dark:text-white">
              No audio found
            </div>
          )} 
          {currentItems.length > 0 && currentItems?.map((audio) => (
            <OneAudioView
              key={audio._id}
              idPass={audio._id}
              name={audio.name}
              category={audio.category}
              favourite={audio.favourite}
            />
          ))}

          {/* Pagination controls */}
          <div className="w-auto flex flex-row justify-center items-center p-2 m-4">
            <motion.div
              className="box"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <button
                title="Previous"
                className={`w-full md:w-auto flex justify-center items-center text-black dark:text-white text-neutral-700 mr-4 mt-4 mb-4 space-x-2 
            hover:bg-gradient-to-r from-indigo-500 from-10% via-sky-500 via-30% to-emerald-500 to-90% p-2 rounded-3xl 
            shadow-lg shadow-cyan-900/50 dark:shadow-cyan-500/50 hover:shadow-none`}
                onClick={prevPage}
                disabled={currentPage === 1}
              >
                <FontAwesomeIcon
                  icon={faChevronLeft}
                  className={`w-4 h-4 text-green-500 dark:text-green-300`}
                />
              </button>
            </motion.div>

            <span
              className="m-4 p-2 text-black dark:text-white rounded-3xl shadow-lg shadow-cyan-900/50 
          dark:shadow-cyan-500/50 hover:shadow-none"
            >
              Page {currentPage} of {Math.ceil(audioList.length / itemsPerPage)}
            </span>

            <motion.div
              className="box"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <button
                title="Next"
                className={`w-full md:w-auto flex justify-center items-center text-black dark:text-white text-neutral-700 mr-4 mt-4 mb-4 space-x-2 
            hover:bg-gradient-to-r from-indigo-500 from-10% via-sky-500 via-30% to-emerald-500 to-90% p-2 rounded-3xl 
            shadow-lg shadow-cyan-900/50 dark:shadow-cyan-500/50 hover:shadow-none`}
                onClick={nextPage}
                disabled={
                  currentPage === Math.ceil(audioList.length / itemsPerPage)
                }
              >
                <FontAwesomeIcon
                  icon={faChevronRight}
                  className={`w-4 h-4 text-green-500 dark:text-green-300`}
                />
              </button>
            </motion.div>
          </div>
        </div>
      </div>
      {Modal && <EditModal />}
    </div>
  );
}

export default AudioList;

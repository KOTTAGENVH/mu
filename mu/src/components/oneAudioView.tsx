"use client";
import React from "react";
import {
  faEdit,
  faHeart,
  faMusic,
  faPlay,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { motion } from "framer-motion";
import { useCurrentPlay } from "@/contextApi/currentPlay";
import { useModal } from "@/contextApi/modalOpen";
import { useToPlay } from "@/contextApi/toPlay";

//interface
interface Audio {
  idPass: string;
  name: string;
  category: string;
  favourite: boolean;
}
function OneAudioView({ idPass, name, category, favourite }: Audio) {
  const { id } = useCurrentPlay();
  const { toggleModal } = useModal();
  const { togglePlay } = useToPlay();

  //update favourite
  const handleFavourite = async () => {
    try {
      const res = await fetch("/api/services/audio", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ _id: idPass, favourite: !favourite }),
      });
      const data = await res.json();
      if (data.success) {
        alert("Favourite updated");
        window.location.reload();
      } else {
        alert("Error updating favourite");
        console.error("Error updating favourite");
      }
    } catch (error) {
      alert("Error updating favourite");
      console.error("Error updating favourite:", error);
    }
  };

  //Handle delete
  const handleDelete = async () => {
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
        alert("Audio deleted");
        window.location.reload();
      } else {
        alert("Error deleting audio");
        console.error("Error deleting audio");
      }
    } catch (error) {
      alert("Error deleting audio");
      console.error("Error deleting audio:", error);
    }
  };

  //handle Modal open
  const handleModalOpen = () => {
    toggleModal(true, idPass, name, category);
  };

  //handle play
  const handlePlay = () => {
    togglePlay(idPass); // Set the ID of the audio to play
  };


  return (
    <div className="w-full border-b-2 border-black dark:border-white h-20 p-4 flex justify-center items-center  ">
      <div className="w-auto h-auto flex flex-row flewx-wrapjustify-center items-center text-black dark:text-white">
        {id === idPass && (
          <FontAwesomeIcon
            icon={faMusic}
            className="w-4 h-4 text-green-500 dark:text-green-300 m-2"
          />
        )}
        <span className="text-lg text-black dark:text-white m-2">
          {name.slice(0, 10)}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-300 m-2">
          {category}
        </span>
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
                favourite.toString() === "true"
                  ? "text-red-500"
                  : "text-black dark:text-white"
              }`}
            />
          </button>
        </motion.div>
        <motion.div
          className="box"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          <button
            title="play"
            className={`w-7 flex justify-center items-center 
      text-black dark:text-white text-neutral-700 m-4 p-2 space-x-2
      hover:bg-gradient-to-r from-indigo-500 from-10% via-sky-500 via-30% to-emerald-500 to-90% 
      rounded-3xl shadow-lg shadow-cyan-900/50 dark:shadow-cyan-500/50 
      hover:shadow-none `}
            onClick={() => handlePlay()}
          >
            <FontAwesomeIcon
              icon={faPlay}
              className={`w-4 h-4 text-green-500 dark:text-green-300`}
            />
          </button>
        </motion.div>
        <motion.div
          className="box"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          <button
            title="update"
            className={`w-7 flex justify-center items-center 
      text-black dark:text-white text-neutral-700 m-4 p-2 space-x-2
      hover:bg-gradient-to-r from-indigo-500 from-10% via-sky-500 via-30% to-emerald-500 to-90% 
      rounded-3xl shadow-lg shadow-cyan-900/50 dark:shadow-cyan-500/50 
      hover:shadow-none `}
            onClick={() => handleModalOpen()}
          >
            <FontAwesomeIcon
              icon={faEdit}
              className={`w-4 h-4 text-blue-500 dark:text-blue-300`}
            />
          </button>
        </motion.div>
        <motion.div
          className="box"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          <button
            title="delete"
            className={`w-7 flex justify-center items-center 
      text-black dark:text-white text-neutral-700 m-4 p-2 space-x-2
      hover:bg-gradient-to-r from-indigo-500 from-10% via-sky-500 via-30% to-emerald-500 to-90% 
      rounded-3xl shadow-lg shadow-cyan-900/50 dark:shadow-cyan-500/50 
      hover:shadow-none `}
            onClick={() => handleDelete()}
          >
            <FontAwesomeIcon
              icon={faTrash}
              className={`w-4 h-4 text-red-500 dark:text-red-300`}
            />
          </button>
        </motion.div>
      </div>
    </div>
  );
}

export default OneAudioView;

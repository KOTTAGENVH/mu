import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  faChevronLeft,
  faChevronRight,
  faPause,
  faPlay,
  faRepeat,
  faShuffle,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Image from "next/image";

interface Audio {
  _id: string;
  name: string;
  category: string;
  fileUrl: string;
  favourite: boolean;
}

const AudioPlayer: React.FC = () => {
  const [audioList, setAudioList] = useState<Audio[]>([]);
  const [currentAudioIndex, setCurrentAudioIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLooping, setIsLooping] = useState<boolean>(false);
  const [isShuffling, setIsShuffling] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isLoading, setLoading] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Fetch audio from the API
  const fetchAudio = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/services/audio", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });
      const data = await res.json();
      setAudioList(data.uploads);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching audio:", error);
      setLoading(false);
      alert("Error fetching audio");
    }
  };

  useEffect(() => {
    fetchAudio();
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.addEventListener("timeupdate", handleTimeUpdate);
      audioRef.current.addEventListener("loadedmetadata", () => {
        setDuration(audioRef.current?.duration || 0);
      });
      audioRef.current.addEventListener("ended", () => {
        handleNext(); // Play the next song when the current one ends
      });
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener("timeupdate", handleTimeUpdate);
        audioRef.current.removeEventListener("ended", handleNext);
        audioRef.current.removeEventListener("loadedmetadata", () => {
          setDuration(audioRef.current?.duration || 0);
        });
      }
    };
  }, [currentAudioIndex]);

  const playAudio = () => {
    if (
      audioRef.current &&
      audioList.length > 0 &&
      audioList[currentAudioIndex]?.fileUrl
    ) {
      audioRef.current.play();
      setIsPlaying(true);
    } else {
      console.error(
        "Cannot play audio: invalid audio source or empty audio list."
      );
    }
  };

  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  // Play the previous song or restart the current song if it has played for more than 5 seconds
  const handlePrev = () => {
    if (audioRef.current && typeof audioRef.current.currentTime === "number") {
      if (audioRef.current.currentTime > 5) {
        audioRef.current.currentTime = 0;
      } else {
        setCurrentAudioIndex((prevIndex) =>
          prevIndex === 0 ? audioList.length - 1 : prevIndex - 1
        );
      }
  
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.load(); 
          if (isPlaying) {
            audioRef.current.play(); 
          }
        }
      }, 0);
    }
  };

  // Play the next song or shuffle the songs if the shuffle button is enabled
  const handleNext = () => {
    if (isShuffling) {
      setCurrentAudioIndex(Math.floor(Math.random() * audioList.length)); // Play a random song
    } else {

      setCurrentAudioIndex((prevIndex) =>
        prevIndex === audioList.length - 1 ? 0 : prevIndex + 1
      );

      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.load();
          if (isPlaying) {
            audioRef.current.play();
          }
        }
      }, 0);
    }
  };

  const toggleShuffle = () => {
    setIsShuffling(!isShuffling);
  };

  const toggleLoop = () => {
    if (audioRef.current) {
      audioRef.current.loop = !audioRef.current.loop;
      setIsLooping(audioRef.current.loop);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (audioRef.current) {
      const newTime = parseFloat(event.target.value);
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  const handleAudio = () => {
    if (isPlaying) {
      pauseAudio();
    } else {
      playAudio();
    }
  };

  return (
    <div className="rounded-3xl h-max  mb-4 w-2/5 bg-white bg-opacity-10 backdrop-blur-xl shadow-lg shadow-cyan-900/50 dark:shadow-cyan-500/50 hover:shadow-none p-4 justify-center items-center">
      {isLoading && (
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
      <Image
        src="/disc_tech.jpg"
        alt="Audio Player"
        width={100}
        height={100}
        className="rounded-3xl w-full h-60"
      />
      {audioList.length > 0 &&
        (console.log("audioList", audioList),
        console.log(
          "audioList[currentAudioIndex]",
          audioList[currentAudioIndex]
        ),
        (<audio ref={audioRef} src={audioList[currentAudioIndex]?.fileUrl} />))}
      <div className="flex flex-row items-center w-full mt-4">
        <span>{formatTime(currentTime)}</span>
        <input
          title="Seek"
          type="range"
          className="mx-4 w-full"
          min="0"
          max={duration || 0}
          value={currentTime}
          onChange={handleSeek}
        />
        <span>{formatTime(duration)}</span>
      </div>
      {/* Controls */}
      <div className="flex flex-row flex-wrap  w-full justify-center items-center mt-3">
        <motion.div
          className="box"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          <button
            title="Shuffle"
            className={`w-full md:w-full flex justify-center 
            items-center text-black dark:text-white text-neutral-700 mr-4 
            mt-4  mb-4 space-x-2 hover:bg-gradient-to-r from-indigo-500 from-10% via-sky-500 via-30% to-emerald-500 to-90% 
            p-2  rounded-3xl shadow-lg shadow-cyan-900/50 
            dark:shadow-cyan-500/50 hover:shadow-none `}
            onClick={toggleShuffle}
          >
            <FontAwesomeIcon
              icon={faShuffle}
              className={`w-4 h-4  ${
                isShuffling
                  ? "text-red-500 dark:text-red-300"
                  : "text-green-500 dark:text-green-300"
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
            title="Previous"
            className={`w-full md:w-full flex justify-center 
            items-center text-black dark:text-white text-neutral-700 mr-4 
            mt-4  mb-4 space-x-2 hover:bg-gradient-to-r from-indigo-500 from-10% via-sky-500 via-30% to-emerald-500 to-90% 
            p-2  rounded-3xl shadow-lg shadow-cyan-900/50 
            dark:shadow-cyan-500/50 hover:shadow-none`}
            onClick={handlePrev}
          >
            <FontAwesomeIcon
              icon={faChevronLeft}
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
            title="Play"
            className={`w-full md:w-full flex justify-center 
            items-center text-black dark:text-white text-neutral-700 mr-4 
            mt-4  mb-4 space-x-2 hover:bg-gradient-to-r from-indigo-500 from-10% via-sky-500 via-30% to-emerald-500 to-90% 
            p-2  rounded-3xl shadow-lg shadow-cyan-900/50 
            dark:shadow-cyan-500/50 hover:shadow-none`}
            onClick={handleAudio}
          >
            {isPlaying ? (
              <FontAwesomeIcon
                icon={faPause}
                className={`w-4 h-4 text-green-500 dark:text-green-300`}
              />
            ) : (
              <FontAwesomeIcon
                icon={faPlay}
                className={`w-4 h-4 text-green-500 dark:text-green-300`}
              />
            )}
          </button>
        </motion.div>
        <motion.div
          className="box"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          <button
            title="Next"
            className={`w-full md:w-full flex justify-center 
            items-center text-black dark:text-white text-neutral-700 mr-4 
            mt-4  mb-4 space-x-2 hover:bg-gradient-to-r from-indigo-500 from-10% via-sky-500 via-30% to-emerald-500 to-90% 
            p-2  rounded-3xl shadow-lg shadow-cyan-900/50 
            dark:shadow-cyan-500/50 hover:shadow-none`}
            onClick={handleNext}
          >
            <FontAwesomeIcon
              icon={faChevronRight}
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
            title="Loop"
            className={`w-full md:w-full flex justify-center 
            items-center text-black dark:text-white text-neutral-700 mr-4 
            mt-4  mb-4 space-x-2 hover:bg-gradient-to-r from-indigo-500 from-10% via-sky-500 via-30% to-emerald-500 to-90% 
            p-2  rounded-3xl shadow-lg shadow-cyan-900/50 
            dark:shadow-cyan-500/50 hover:shadow-none`}
            onClick={toggleLoop}
          >
            <FontAwesomeIcon
              icon={faRepeat}
              className={`w-4 h-4 ${
                isLooping
                  ? "text-red-500 dark:text-red-300"
                  : "text-green-500 dark:text-green-300 "
              }`}
            />
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default AudioPlayer;

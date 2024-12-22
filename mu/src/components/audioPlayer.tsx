import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  faChevronLeft,
  faChevronRight,
  faHeart,
  faPause,
  faPlay,
  faRepeat,
  faShuffle,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useCurrentPlay } from "@/contextApi/currentPlay";
import { useToPlay } from "@/contextApi/toPlay";

interface Audio {
  _id: string;
  name: string;
  category: string;
  fileUrl: string;
  favourite: boolean;
}

const AudioPlayer: React.FC = () => {
  const [audioList, setAudioList] = useState<Audio[]>([]);
  const [defaultAudioList, setDefaultAudioList] = useState<Audio[]>([]);
  const [currentAudioIndex, setCurrentAudioIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLooping, setIsLooping] = useState<boolean>(false);
  const [isShuffling, setIsShuffling] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isLoading, setLoading] = useState(false);
  const [isFavourite, setFavourite] = useState(false);
  const [isCategory, setCategory] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  //set current play id to context api
  const { toggleId } = useCurrentPlay();
  const { id } = useToPlay();

  // Fisher-Yates Shuffle Algorithm
  const shuffleArray = <T,>(array: T[]): T[] => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  };

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
      const uploads: Audio[] = data.uploads as Audio[];
      setAudioList(uploads);
      setDefaultAudioList(data.uploads);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching audio:", error);
      setLoading(false);
      alert("Error fetching audio");
    }
  };

  const playAudio = async () => {
    if (
      audioRef.current &&
      audioList.length > 0 &&
      currentAudioIndex >= 0 && // Ensure index is valid
      audioList[currentAudioIndex]?.fileUrl // Ensure the current audio has a valid URL
    ) {
      try {
        await audioRef.current.play(); // Wait for the play request to succeed
        setIsPlaying(true);
      } catch (error) {
        alert("Error playing audio");
        console.error("Error playing audio:", error);
      }
    } else {
      alert("Cannot play audio: invalid audio source or empty audio list.");
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
  const handleNext = async () => {
    if (audioRef.current) {
      audioRef.current.pause(); // Pause the current audio
      audioRef.current.currentTime = 0; // Reset the current time
    }

    if (isShuffling) {
      //Play song based on fisher-yates shuffle algorithm
      const shuffledList = shuffleArray([...audioList]);
      const nextIndex = shuffledList.findIndex(
        (audio) => audio._id === audioList[currentAudioIndex]._id
      );
      setCurrentAudioIndex(nextIndex);
    } else {
      //Tun off shuffle
      setCurrentAudioIndex((prevIndex) =>
        prevIndex === audioList.length - 1 ? 0 : prevIndex + 1
      );     
    }

    setTimeout(async () => {
      if (audioRef.current) {
        audioRef.current.load(); // Load the next audio
        if (isPlaying) {
          try {
            await audioRef.current.play(); // Play the next audio if isPlaying is true
          } catch (error) {
            console.error("Error playing audio:", error);
          }
        }
      }
    }, 0);
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

  // Filter favourite
  const handleFilterFavourite = async () => {
    setFavourite((prev) => !prev);
  };

  useEffect(() => {
    if (isFavourite) {
      // Filter the audioList for only favourites
      const favouriteAudios = audioList.filter(
        (audio) => audio.favourite === true
      );
      setAudioList(favouriteAudios);
      if (favouriteAudios.length > 0) {
        setCurrentAudioIndex(0);
      } else {
        setCurrentAudioIndex(-1);
      }
    } else {
      // Reset to original audio list when favourites are not filtered
      fetchAudio();
    }
  }, [isFavourite]);

  useEffect(() => {
    // Filter by category
    if (isCategory !== "") {
      const filteredAudios = defaultAudioList.filter(
        (audio) => audio.category == isCategory
      );
      setAudioList(filteredAudios);
      if (filteredAudios.length > 0) {
        setCurrentAudioIndex(0); // Reset to the first valid item
      } else {
        setCurrentAudioIndex(-1); // No valid audio to play
        alert("No audio found in this category");
      }
    } else {
      fetchAudio();
    }
  }, [isCategory]);

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
        handleNext(); 
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

  useEffect(() => {
    if (!audioList) {
      return;
    }
    if (audioList.length > 0 && audioList[currentAudioIndex]) {
      toggleId(audioList[currentAudioIndex]._id);
    }
  }, [currentAudioIndex, audioList, toggleId]);

  useEffect(() => {
    if (!audioList) {
      return;
    }
    const index = audioList.findIndex((audio) => audio._id === id);
    if (index !== -1) {
      setCurrentAudioIndex(index);
      playAudio(); // Play the audio when the ID changes
    }
  }, [id, audioList]);

  useEffect(() => {
    if (!audioList || audioList.length === 0) {
      return setCurrentAudioIndex(-1);
    }
    // Validate currentAudioIndex on list update
    if (audioList?.length > 0 && currentAudioIndex >= audioList?.length) {
      setCurrentAudioIndex(0); // Reset to a valid index
    }
  }, [audioList]);

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
      {audioList && audioList.length > 0 && (
        <audio ref={audioRef} src={audioList[currentAudioIndex]?.fileUrl} />
      )}

      {/** Audio name */}
      {isPlaying && (
        <div className="flex flex-row items-center w-auto mt-4 justify-center">
          <div className="overflow-hidden whitespace-nowrap">
            <span className="w-screen animate-marquee inline-block text-black dark:text-white">
              Audio: {audioList[currentAudioIndex]?.name}
            </span>
            <span className="w-screen animate-marquee inline-block ml-4 text-black dark:text-white">
              Category: {audioList[currentAudioIndex]?.category}
            </span>
          </div>
        </div>
      )}

      {/* Seek bar */}
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
            title="Favorite-Filter"
            className={`w-full md:w-full flex justify-center 
            items-center text-black dark:text-white text-neutral-700 mr-4 
            mt-4  mb-4 space-x-2 hover:bg-gradient-to-r from-indigo-500 from-10% via-sky-500 via-30% to-emerald-500 to-90% 
            p-2  rounded-3xl shadow-lg shadow-cyan-900/50 
            dark:shadow-cyan-500/50 hover:shadow-none`}
            onClick={handleFilterFavourite}
          >
            <FontAwesomeIcon
              icon={faHeart}
              className={`w-4 h-4 ${
                isFavourite
                  ? "text-red-500 dark:text-red-300"
                  : "text-green-500 dark:text-green-300 "
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
        <select
          title="Filter Category"
          className="bg-none w-full md:w-full mt-4 mb-4 p-4 rounded-3xl shadow-lg shadow-cyan-900/50 
            dark:shadow-cyan-500/50 hover:shadow-none dark:bg-slate-950 bg-slate-300"
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">All</option>
          <option value="Rap">Rap</option>
          <option value="Classic">Classic</option>
          <option value="OldVibes">OldVibes</option>
          <option value="LK">LK</option>
          <option value="Free Style">Free Style</option>
          <option value="YTBMusic">YTBMusic</option>
        </select>
      </div>
    </div>
  );
};

export default AudioPlayer;

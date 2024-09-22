import React from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faAdd,
  faAddressCard,
  faHouse,
  faImage,
  faRightFromBracket,
} from "@fortawesome/free-solid-svg-icons";
import { motion } from "framer-motion";
import Image from "next/image";
import { useTheme } from "@/contextApi/iframContext";

function Drawer() {

  const router = useRouter();
  const {toggleScene} = useTheme();

  //handle toggle scene
  const handleScene = () => {
    toggleScene();
  };
  

  // Handle home click
  const handleHome = () => {
    //Refresh the page
    window.location.reload();
  };

  // Handle add click
  const handleAdd = () => {
    router.push("/upload");
  };

// Handle about click
const handleAbout = () => {
    window.open("https://www.nowenkottage.com");
  };
  
  const handleLogout = async () => {
    try {
      // Call logout API to remove the cookie
      const response = await fetch("/api/services/logout", {
        method: "GET",
      });

      const data = await response.json();
      if (data.success) {
        router.push("/");
      } else {
        alert("Logout failed");
      }
    } catch (error) {
      console.error("Error during logout:", error);
      alert("An error occurred while logging out. Please try again.");
    }
  };
  return (
<div
  className={`fixed top-0 left-0 w-28 h-full bg-white bg-opacity-10 backdrop-blur-xl  shadow-lg text-white 
    transition-transform duration-300 ease-in-out transform translate-x-0 flex flex-col z-50`}
>
      <div className="p-4 flex-grow">
        <div className="flex items-center justify-center flex-1  flex-shrink-0 m-4">
          <Image
            src="/mu.png"
            alt="MU"
            width={60}
            height={100}
            className="w-12 h-12 md:w-12 md:h-12 rounded-3xl"
          />
        </div>
        <hr className="shadow-lg font-bold" />
        <motion.div
          className="box"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          <button
            title="Home"
            className={`w-full md:w-full flex justify-center 
            items-center text-black dark:text-white text-neutral-700 mr-4 
            mt-4  mb-4 space-x-2 hover:bg-gradient-to-r from-indigo-500 from-10% via-sky-500 via-30% to-emerald-500 to-90% 
            p-2  rounded-3xl shadow-lg shadow-cyan-900/50 
            dark:shadow-cyan-500/50 hover:shadow-none`}
            onClick={handleHome}
          >
            <FontAwesomeIcon
              icon={faHouse}
              className={`w-4 h-4 text-green-500 dark:text-green-300`}
            />
          </button>
        </motion.div>
        <hr className="shadow-lg font-bold" />
        <hr className="shadow-lg font-bold" />
        <motion.div
          className="box"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          <button
            title="Add"
            className={`w-full md:w-full flex justify-center 
            items-center text-black dark:text-white text-neutral-700 mr-4 
            mt-4  mb-4 space-x-2 hover:bg-gradient-to-r from-indigo-500 from-10% via-sky-500 via-30% to-emerald-500 to-90% 
            p-2  rounded-3xl shadow-lg shadow-cyan-900/50 
            dark:shadow-cyan-500/50 hover:shadow-none`}
            onClick={handleAdd}
          >
            <FontAwesomeIcon
              icon={faAdd}
              className={`w-4 h-4 text-yellow-600 dark:text-yellow-200`}
            />
          </button>
        </motion.div>
        <hr className="shadow-lg font-bold" />
        <hr className="shadow-lg font-bold" />
        <motion.div
          className="box"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          <button
            title="Change_Theme"
            className={`w-full md:w-full flex justify-center 
            items-center text-black dark:text-white text-neutral-700 mr-4 
            mt-4  mb-4 space-x-2 hover:bg-gradient-to-r from-indigo-500 from-10% via-sky-500 via-30% to-emerald-500 to-90% 
            p-2  rounded-3xl shadow-lg shadow-cyan-900/50 
            dark:shadow-cyan-500/50 hover:shadow-none`}
            onClick={handleScene}
          >
            <FontAwesomeIcon
              icon={faImage}
              className={`w-4 h-4 dark:text-cyan-200 text-cyan-600`}
            />
          </button>
        </motion.div>
        <hr className="shadow-lg font-bold" />
        <hr className="shadow-lg font-bold" />
        <motion.div
          className="box"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          <button
            title="About"
            className={`w-full md:w-full flex justify-center 
            items-center text-black dark:text-white text-neutral-700 mr-4 
            mt-4  mb-4 space-x-2 hover:bg-gradient-to-r from-indigo-500 from-10% via-sky-500 via-30% to-emerald-500 to-90% 
            p-2  rounded-3xl shadow-lg shadow-cyan-900/50 
            dark:shadow-cyan-500/50 hover:shadow-none`}
            onClick={handleAbout}
          >
            <FontAwesomeIcon
              icon={faAddressCard}
              className={`w-4 h-4 text-teal-600 dark:text-teal-200`}
            />
          </button>
        </motion.div>
        <hr className="shadow-lg font-bold" />
        <hr className="shadow-lg font-bold" />
      </div>
      <div className="p-4">
        <motion.div
          className="box"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          <button
            title="Logout"
            className={`w-full md:w-full flex justify-center 
            items-center text-black dark:text-white text-neutral-700 mr-4 
            mt-4  space-x-2 hover:bg-gradient-to-r from-indigo-500 from-10% via-sky-500 via-30% to-emerald-500 to-90% 
            p-2  rounded-3xl shadow-lg shadow-cyan-900/50 
            dark:shadow-cyan-500/50 hover:shadow-none`}
            onClick={handleLogout}
          >
            <FontAwesomeIcon
              icon={faRightFromBracket}
              className={`w-4 h-4 text-red-500`}
            />
          </button>
        </motion.div>
      </div>
    </div>
  );
}

export default Drawer;

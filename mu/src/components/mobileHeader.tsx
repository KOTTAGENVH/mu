"use client";
import Image from "next/image";
import React from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { motion } from "framer-motion";
import { faRightFromBracket } from "@fortawesome/free-solid-svg-icons";


function MobileHeader() {
  const router = useRouter();

  const handleLogoClick = () => {
    router.push("/");
  };

  const handleButtonClick = async () => {
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
    <div className="sticky top-0 flex justify-center">
      <nav className="flex items-center justify-between  bg-white bg-opacity-30 dark:bg-opacity-10 backdrop-blur-md p-2 w-4/5 m-4 rounded-full shadow-lg shadow-cyan-900/50 dark:shadow-cyan-100/20 hover:shadow-none">
        <div className="flex items-center flex-shrink-0 text-white md:mr-6">
          <motion.div
            className="box"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <button
            title="Logout"
             className="flex text-black dark:text-white items-center text-neutral-700  space-x-2 hover:bg-gradient-to-r from-indigo-500 from-10% via-sky-500 via-30% to-emerald-500 to-90% ... p-2 rounded-3xl shadow-lg shadow-cyan-900/50 dark:shadow-cyan-500/50 hover:shadow-none"
             >
              <FontAwesomeIcon
                icon={faRightFromBracket}
                className="w-4 h-4 md:w-6 md:h-6 text-red-500"
                onClick={handleButtonClick}
              />
            </button>
          </motion.div>
        </div>
        <div
          className="flex items-center justify-center flex-1  flex-shrink-0 cursor-pointer"
          onClick={handleLogoClick}
        >
          <Image
            src="/mu.png"
            alt="MU"
            width={60}
            height={100}
            className="w-12 h-12 md:w-20 md:h-20 rounded-3xl"
          />
        </div>
        <h1 className="text-sm md:text-xl font-bold text-black dark:text-white subpixel-antialiased p-1 md:p-4 text-center">
          MU 
        </h1>
      </nav>
    </div>
  );
}

export default MobileHeader;

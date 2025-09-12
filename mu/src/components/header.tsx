"use client";
import Image from "next/image";
import React from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAdd, faAddressCard, faHouse, faRightFromBracket } from "@fortawesome/free-solid-svg-icons";


function Header() {
  const router = useRouter();

  // Handle home click
  const handleHome = () => {
    router.push("/home");
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
    <div className="fixed top-0 left-0 w-full z-50">
      <nav className="flex items-center justify-center md:justify-between py-2 mx-4 px-3 lg:mx-16 lg:px-6 w-auto mt-4 mb-4">
        <div className="w-auto h-auto">
          <Image
            src="/mu.png"
            alt="MU"
            width={48}
            height={48}
            className="hidden md:block md:w-12 md:h-12 rounded-full cursor-pointer"
          />

        </div>
        <div className="flex items-end flex-shrink-0  w-auto h-auto" >
          <button
            title="Home"
            className={`w-auto flex justify-end 
            items-center text-black dark:text-white text-neutral-700
            mt-4  mb-4 space-x-2 
            p-3  rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 mr-4`}
            onClick={handleHome}
          >
            <FontAwesomeIcon
              icon={faHouse}
              className={`w-4 h-4 text-black dark:text-white`}
            />
          </button>
          <button
            title="Add"
            className={`w-auto flex justify-end 
            items-center text-black dark:text-white text-neutral-700
            mt-4  mb-4 space-x-2 
            p-3  rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 mr-4`}
            onClick={handleHome}
          >
            <FontAwesomeIcon
              icon={faAdd}
              className={`w-4 h-4 text-black dark:text-white`}
            />
          </button>
          <button
            title="About"
            className={`w-auto flex justify-end 
            items-center text-black dark:text-white text-neutral-700
            mt-4  mb-4 space-x-2 
            p-3  rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 mr-4`}
            onClick={handleAbout}
          >
            <FontAwesomeIcon
              icon={faAddressCard}
              className={`w-4 h-4 text-black dark:text-white`}
            />
          </button>
          <button
            title="Logout"
            className={`w-auto flex justify-end 
            items-center text-black dark:text-white text-neutral-700
            mt-4  mb-4 space-x-2 
            p-3  rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700`}
            onClick={handleLogout}
          >
            <FontAwesomeIcon
              icon={faRightFromBracket}
              className={`w-4 h-4 text-red-500 dark:text-red-400`}
            />
          </button>
        </div>
      </nav>
    </div>
  );
}

export default Header;

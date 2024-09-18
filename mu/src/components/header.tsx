"use client";
import Image from "next/image";
import React from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { motion } from "framer-motion";

interface HeaderProps {
  icon: IconProp;
  btnNav: string;
  text: string;
}
function Header({ icon, btnNav, text }: HeaderProps) {
  const router = useRouter();

  const handleLogoClick = () => {
    router.push("/");
  };

  const handleButtonClick = () => {
    router.push(btnNav);
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
            <button className="flex text-black dark:text-white items-center text-neutral-700 m-4 space-x-2 hover:bg-gradient-to-r from-indigo-500 from-10% via-sky-500 via-30% to-emerald-500 to-90% ... p-2 rounded-3xl shadow-lg shadow-cyan-900/50 dark:shadow-cyan-500/50 hover:shadow-none">
              <FontAwesomeIcon
                icon={icon}
                className="w-4 h-4 md:w-6 md:h-6"
                onClick={handleButtonClick}
              />
              <span className="text-sm md:text-lg">Back</span>
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
          {text}
        </h1>
      </nav>
    </div>
  );
}

export default Header;

"use client";
import { faArrowCircleLeft } from "@fortawesome/free-solid-svg-icons";
import React, { useState } from "react";
import Header from "@/components/header";
import { motion } from "framer-motion";
import UrlUpload from "@/components/urlUpload";
import FileUpload from "@/components/fileUpload";


function Page() {
  const [url, setUrl] = useState<boolean>(false);
  const [click, setClick] = useState<boolean>(false);

  //Handle url click
  const handleUrl = () => {
    setUrl(true);
    setClick(true);
  };

  //Handle file click
  const handleFile = () => {
    setUrl(false);
    setClick(true);
  };

  return (
    <div className="h-screen w-screen dark:bg-slate-950 bg-slate-300 overflow-auto">
      <Header icon={faArrowCircleLeft} btnNav="/" text="Audio Upload" />
      <div
        className={`flex flex-col h-5/6 ${
          !click ? "justify-center items-center" : ""
        }`}
      >
        <div className="flex flex-row flex-wrap justify-center items-center">
          <motion.div
            className="box"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <button
              className={`w-32 md:w-48 flex justify-center items-center 
          text-black dark:text-white text-neutral-700 ml-4 mt-4 ${
            !click ? "mb-4" : ""
          } space-x-2
           hover:bg-gradient-to-r from-indigo-500 from-10% via-sky-500 via-30% to-emerald-500 to-90% 
           p-2 rounded-tl-3xl rounded-bl-3xl shadow-lg shadow-cyan-900/50 dark:shadow-cyan-500/50 
           hover:shadow-none`}
              onClick={handleUrl}
            >
              <span className="text-sm md:text-lg">Upload via YTB</span>
            </button>
          </motion.div>
          <motion.div
            className="box"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <button
              className={`w-32 md:w-48 flex justify-center 
            items-center text-black dark:text-white text-neutral-700 mr-4 
            mt-4 ${
              !click ? "mb-4" : ""
            } space-x-2 hover:bg-gradient-to-r from-indigo-500 from-10% via-sky-500 via-30% to-emerald-500 to-90% 
            p-2 rounded-tr-3xl rounded-br-3xl shadow-lg shadow-cyan-900/50 
            dark:shadow-cyan-500/50 hover:shadow-none`}
              onClick={handleFile}
            >
              <span className="text-sm md:text-lg">Upload mp3</span>
            </button>
          </motion.div>
        </div>
        {url && click && <UrlUpload/>}
        {!url && click && <FileUpload />}
      </div>
   
    </div>
  );
}

export default Page;

import React from "react";
import { motion } from "framer-motion";

function UrlUpload() {
  // Check if the page is being accessed from localhost
  const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

  return (
    <div className="h-4/5 w-auto flex justify-center items-center">
      {isLocalhost ? (
        <div className="h-1/5 w-4/5">
          <h1 className="text-xl md:text-2xl">URL Upload</h1>
          <div className="flex flex-row">
            <input
              className="w-4/5 h-9 md:h-11 mt-4 shadow-lg shadow-cyan-900/50 dark:shadow-cyan-500/50 
      hover:shadow-none p-2 rounded-tl-3xl rounded-bl-3xl text-black"
              type="text"
              placeholder="Enter URL"
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
              >
                <span className="text-sm md:text-lg">Upload</span>
              </button>
            </motion.div>
          </div>
        </div>
      ) : (
        <h1 className="text-xl md:text-2xl">Sorry, you have not accessed via localhost</h1>
      )}
    </div>
  );
}

export default UrlUpload;

"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import LoginHeader from "@/components/loginHeader";
import { useRouter } from "next/navigation";

function Page() {
  const [token, setToken] = useState("");
  const [genratedToken, setGenratedToken] = useState("");
  const [isLoading, setLoading] = useState(false);

  const router = useRouter();

  //Generate a token
  const handleGenerateToken = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/services/generateToken", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      // Check if the response contains a token
      if (response.ok) {
        const data = await response.json();
        setGenratedToken(data.token);
        alert(`Token generated!`);
        setLoading(false);
      } else {
        alert(`Error generating token`);
        setLoading(false);
      }
    } catch (error) {
      alert(`Error generating token`);
      setLoading(false);
    }
  };

  //Validate token
  const handleValidateToken = async () => {
    try {
      setLoading(true);
      if (token === genratedToken && token !== "") {
        try {
          const response = await fetch("/api/services/cookierGenerator", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ genratedToken }),
          });
          if (!response.ok) {
            throw new Error("Error in generating cookie");
          } 

          if (response.ok) {
            alert(`Token Valid!`);
            setLoading(false);
            setToken("");
            setGenratedToken("");
            router.push("/home");
          }
        } catch (error) {
          alert(`Error in generating cookie`);
          setLoading(false);
          setToken("");
          setGenratedToken("");
          console.error(error);
          return;
        }
      } else {
        alert(`Token Invalid!`);
        setLoading(false);
        setToken("");
        setGenratedToken("");
      }
    } catch (error) {
      alert(`Error validating token`);
      setLoading(false);
      setToken("");
      setGenratedToken("");
      console.error(error);
    }
  };

  return (
    <div className="h-screen w-screen dark:bg-slate-950 bg-slate-300 overflow-auto">
      <LoginHeader />
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
      <div
        className={`flex flex-col h-5/6  w-screen justify-center items-center `}
      >
        <div className="flex flex-row">
          <input
            className="w-4/5 h-9 md:h-11 mt-4 shadow-lg shadow-cyan-900/50 dark:shadow-cyan-500/50 
      hover:shadow-none p-2 rounded-tl-3xl rounded-bl-3xl text-black"
            type="text"
            placeholder="Enter Token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
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
      hover:bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 
      p-2 rounded-tr-3xl rounded-br-3xl shadow-lg shadow-cyan-900/50 dark:shadow-cyan-500/50 
      hover:shadow-none`}
              onClick={handleValidateToken}
            >
              <span className="text-sm md:text-lg">Validate</span>
            </button>
          </motion.div>
        </div>
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
      p-2 rounded-3xl shadow-lg shadow-cyan-900/50 dark:shadow-cyan-500/50 
      hover:shadow-none`}
            onClick={handleGenerateToken}
          >
            <span className="text-sm md:text-lg">Generate Token</span>
          </button>
        </motion.div>
      </div>
    </div>
  );
}

export default Page;

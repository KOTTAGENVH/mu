"use client";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import LoginFooter from "@/components/login/loginFooter";
import { inter, roboto } from "./fonts";


function Page() {
  const [isLoading, setLoading] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const router = useRouter();

  //Get ip address
  const handleGetIp = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/services/ipChecker", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        const data = await response.json();
        setLoading(false);
        return data.ip;
      }
      else {
        setLoading(false);
        alert("Error fetching IP address");
        return null;
      }
    } catch (error) {
      setLoading(false);
      alert("Error fetching IP address");
      return null;
    }
  };

  //Generate a token
  const handleGenerateToken = async () => {
    try {
      setIsPressed(true);
      setIsStarting(true);
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 800));
      const ipAddress = await handleGetIp();
      if (!ipAddress) {
        setLoading(false);
        setIsPressed(false);
        setIsStarting(false);
        return;
      }
      const response = await fetch("/api/services/generateURLToken", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ip: ipAddress }),
      });

      // Check if the response contains a token
      if (response.ok) {
        alert(`Check Email!`);
        setLoading(false);
        setIsPressed(false);
        setIsStarting(false);
      } else {
        alert(`Error generating token`);
        setLoading(false);
        setIsPressed(false);
        setIsStarting(false);
      }
    } catch (error) {
      alert(`Error generating token`);
      setLoading(false);
      setIsPressed(false);
      setIsStarting(false);
    }
  };



  return (
     <div
      className="
        min-h-screen w-full
        flex flex-col
        bg-slate-300 dark:bg-slate-950
        overflow-y-auto
        supports-[height:100dvh]:min-h-[100dvh]
        supports-[height:100svh]:min-h-[100svh]
      "
    >
        <main className="flex-1 flex flex-col items-center justify-center px-4 py-6">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="text-center mb-8 max-w-2xl"
          >
            <h1 className={`${inter.className} text-3xl md:text-4xl lg:text-5xl text-white mb-4 leading-tight`}>
              Welcome to <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">MU</span>
            </h1>
            <p className={`${roboto.className} text-base md:text-lg text-gray-400 leading-relaxed`}>
              Generate your secure access token to continue. Check your email after token generation.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="relative"
            onClick={handleGenerateToken}
          >
            <div className="relative p-6 md:p-8 rounded-2xl flex flex-col items-center"
            onClick={handleGenerateToken}
            >
              <motion.button
                onClick={handleGenerateToken}
                disabled={isLoading || isStarting}
                onMouseDown={() => setIsPressed(true)}
                onMouseUp={() => !isLoading && setIsPressed(false)}
                onMouseLeave={() => !isLoading && setIsPressed(false)}
                className="relative group disabled:cursor-not-allowed"
                whileHover={{ scale: isLoading ? 1 : 1.03 }}
                whileTap={{ scale: isLoading ? 1 : 0.94 }}
              >
                <div className={`absolute inset-0 rounded-full transition-all duration-300 ${isStarting ? 'bg-gradient-to-r from-green-400 to-emerald-500' : isPressed ? 'bg-gradient-to-r from-yellow-400 to-orange-500' : 'bg-gradient-to-r from-blue-500 to-purple-600'}`} />
                <div className="absolute inset-1 bg-gray-900 rounded-full" />
                <div className={`relative w-32 h-32 md:w-40 md:h-40 bg-gradient-to-b from-gray-800 to-gray-900 rounded-full flex items-center justify-center border-4 transition-all duration-200 ${isPressed ? 'border-gray-600 ' : 'border-gray-700 '}`}>
                  <div className="flex flex-col items-center text-center select-none">
                    <div className="h-16 md:h-20 flex items-center justify-center mb-2">
                      {isStarting ? (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center">
                          <div className="w-8 h-8 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
                        </motion.div>
                      ) : (
                        <div className={`w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center transition-colors duration-200 ${isPressed ? 'bg-yellow-500/20 text-yellow-400' : 'bg-blue-500/20 text-blue-400 group-hover:bg-blue-500/30 group-hover:text-blue-300'}`}>
                          <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                  {isPressed && !isStarting && (
                    <motion.div className="absolute inset-0 bg-white/10 rounded-full" initial={{ scale: 0, opacity: 0.5 }} animate={{ scale: 1, opacity: 0 }} transition={{ duration: 0.6 }} />
                  )}
                </div>
              </motion.button>
              <motion.p className={`${roboto.className} text-gray-400 text-center mt-6 text-base md:text-lg`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
                {isStarting ? 'Generating secure token...' : 'Press to generate token'}
              </motion.p>
            </div>
          </motion.div>
        </main>
        <LoginFooter />
    </div>
  );
}

export default Page;

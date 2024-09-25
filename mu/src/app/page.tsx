"use client";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import LoginHeader from "@/components/loginHeader";
import { useRouter } from "next/navigation";

function Page() {
  const [isLoading, setLoading] = useState(false);

  const router = useRouter();

  //Generate a token
  const handleGenerateToken = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/services/generateURLToken", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      console.log("data", data);
      // Check if the response contains a token
      if (response.ok) {
        alert(`Check Email!`);
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
  useEffect(() => {
    const validateAndGenerateToken = async () => {
      // Check URL for token
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get("token");

      if (token) {
        try {
          // Validate token
          const response = await fetch("/api/services/validateURLToken", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ token }),
          });
          if (response.ok) {
            // Generate token
            const responseGenerator = await fetch(
              "/api/services/cookierGenerator",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ token }),
              }
            );

            if (responseGenerator.ok) {
              alert("Token validated!");
              router.push(`/home`);
            } else {
              alert("Error generating token");
            }
          } else {
            const data = await response.json();
            alert("Error validating token" + data.message);
          }
        } catch (error) {
          console.error("Error during token validation/generation:", error);
        }
      } else {
        // Check if token is in cookie
        const cookieToken = document.cookie
          .split(";")
          .find((c) => c.trim().startsWith("token="));

        if (cookieToken) {
          // Redirect to login page
          router.push(`/login`);
        }
      }
    };

    validateAndGenerateToken();
  }, [router]);

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

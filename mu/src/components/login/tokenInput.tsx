import React, { useState } from "react";
import { inter, roboto } from "../../app/fonts";
import Image from "next/image";
import { motion } from "framer-motion";
import * as Yup from "yup";
import { useFormik } from "formik";
import { verifyAuthToken } from "@/app/api/client/services/auth/api";
import Loader from "../loader";
import OTPInput from "./otpInputField";
import { ArrowLeft, Mail } from "lucide-react";

interface TokenInputProps {
  backToLogin?: boolean;
  handleSetToken: (value: boolean) => void;
}

function TokenInput({ backToLogin, handleSetToken }: TokenInputProps) {
  const [isLoading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

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
      } else {
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

  const handleSecretView = () => {
    setLoading(true);
    setTimeout(() => {
      handleSetToken(false);
      setLoading(false);
    }, 500);
  };

  const formik = useFormik({
    initialValues: { token: "" },
    validationSchema: Yup.object({
      token: Yup.string()
        .matches(/^\d{6}$/, "Token must be exactly 6 digits")
        .required("Token is required"),
    }),
    onSubmit: async (values) => {
      try {
        setLoading(true);
        const ipAddress = await handleGetIp();
        if (!ipAddress) {
          setLoading(false);
          return;
        }
        const response = await verifyAuthToken(ipAddress, values.token);
        formik.setFieldValue("token", "");
        formik.setTouched({ token: false });
        if (!response.success) {
          alert(response.message);
        }
        if (response.success) {
          setIsSuccess(true);
          setTimeout(() => {
            setIsSuccess(false);
          }, 4000);
        }
      } catch (error) {
        formik.setFieldValue("token", "");
        formik.setTouched({ token: false });
        // console.error("Error verifying token:", error);
        alert("Failed to verify token. Please try again.");
      } finally {
        setLoading(false);
      }
    },
  });

  return (
    <motion.form
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className="flex flex-col items-center text-center mb-8 w-full max-w-2xl bg-gray-100/60 dark:bg-gray-800/60 rounded-2xl p-8"
    >
      <div
        className={`${backToLogin ? "hidden" : "block"} w-full h-full rounded-2xl overflow-hidden`}
      >
        <button
          type="button"
          onClick={() => handleSecretView()}
          disabled={isLoading}
          className={` 
          w-auto flex items-center justify-center gap-2
          text-black dark:text-white mt-6 mb-4 px-6 py-3
          rounded-full bg-gray-300 dark:bg-gray-700
          hover:bg-green-400 dark:hover:bg-gray-600
          text-sm font-medium cursor-pointer 
        `}
        >
          <ArrowLeft size={16} />
          Back
        </button>
      </div>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-white/30 dark:bg-black/40 backdrop-blur-md"
        >
          <Loader />
        </motion.div>
      )}
      <Image
        src="/mu.png"
        alt="MU"
        width={98}
        height={98}
        className="mx-auto p-2 w-20 h-24 md:w-32 md:h-32 rounded-full object-cover transition-colors"
        priority
        draggable={false}
      />
      {isSuccess ? (
        <motion.div
          key="success"
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center text-center w-full gap-5"
        >
          <div className="relative flex items-center justify-center w-20 h-20">
            <motion.span
              className="absolute inset-0 rounded-full bg-emerald-500/20 dark:bg-emerald-500/10"
              initial={{ scale: 0.6, opacity: 0.8 }}
              animate={{ scale: 1.5, opacity: 0 }}
              transition={{ duration: 0.9, delay: 0.45 }}
            />
            <motion.span
              className="absolute inset-0 rounded-full bg-emerald-500/30 dark:bg-emerald-500/15"
              initial={{ scale: 0.6, opacity: 0.8 }}
              animate={{ scale: 1.2, opacity: 0 }}
              transition={{ duration: 0.7, delay: 0.55 }}
            />
            <svg
              viewBox="0 0 52 52"
              className="w-16 h-16"
              fill="none"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <motion.circle
                cx="26"
                cy="26"
                r="22"
                className="stroke-emerald-500 dark:stroke-emerald-400"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.55, ease: "easeOut" }}
              />
              <motion.path
                d="M14 26l8 8 16-16"
                className="stroke-emerald-600 dark:stroke-emerald-300"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.35, ease: "easeOut", delay: 0.5 }}
              />
            </svg>
          </div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.4 }}
            className={`${inter.className} text-3xl md:text-4xl lg:text-5xl font-bold text-black dark:text-white leading-tight`}
          >
            Token{" "}
            <span className="bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent">
              Verified!
            </span>
          </motion.h1>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.4 }}
            className="flex items-start gap-3 w-full bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-200 dark:border-emerald-500/20 rounded-xl px-4 py-3.5 text-left"
          >
            <div className="mt-0.5 shrink-0 w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-center">
              <Mail
                size={15}
                className="text-emerald-600 dark:text-emerald-400"
              />
            </div>
            <div>
              <p
                className={`${roboto.className} text-sm font-medium text-emerald-800 dark:text-emerald-300`}
              >
                Check your inbox
              </p>
              <p
                className={`${roboto.className} text-xs text-emerald-600 dark:text-emerald-500/70 mt-0.5 leading-snug`}
              >
                Can&apos;t find it? Check your{" "}
                <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                  Spam
                </span>{" "}
                or{" "}
                <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                  Promotions
                </span>{" "}
                folder.
              </p>
            </div>
          </motion.div>
        </motion.div>
      ) : (
        <>
          <h1
            className={`${inter.className} text-3xl md:text-4xl lg:text-5xl text-black dark:text-white mb-6 leading-tight`}
          >
            Welcome to{" "}
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              MU
            </span>
          </h1>
          <p
            className={`${roboto.className} w-full text-left text-base md:text-lg text-black dark:text-gray-400 leading-relaxed mb-4`}
          >
            Enter your 6-digit token
          </p>
          <OTPInput
            value={formik.values.token}
            onChange={(val) => formik.setFieldValue("token", val)}
            error={
              formik.touched.token && formik.errors.token
                ? formik.errors.token
                : undefined
            }
          />
          <button
            type="submit"
            onClick={() => formik.handleSubmit()}
            disabled={isLoading || formik.values.token.length < 6}
            className={`
          w-auto flex items-center justify-center gap-2
          text-black dark:text-white mt-6 mb-4 px-6 py-3
          rounded-full bg-gray-300 dark:bg-gray-700
          text-sm font-medium
          ${isLoading || formik.values.token.length < 6 ? "opacity-50 cursor-not-allowed" : " hover:bg-green-400 dark:hover:bg-gray-600"}
        `}
          >
            Verify Token
          </button>
        </>
      )}
    </motion.form>
  );
}

export default TokenInput;

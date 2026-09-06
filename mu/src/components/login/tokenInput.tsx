import React, { useState } from "react";
import { inter, roboto } from "../../app/fonts";
import Image from "next/image";
import * as Yup from "yup";
import { useFormik } from "formik";
import { verifyAuthToken } from "@/app/api/client/services/auth/api";
import Loader from "../loader";
import OTPInput from "./otpInputField";
import { ArrowLeft, Music, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contextApi/auth";

interface TokenInputProps {
  backToLogin?: boolean;
  handleSetToken: (value: boolean) => void;
}

function TokenInput({ backToLogin, handleSetToken }: TokenInputProps) {
  const [isLoading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const router = useRouter();
  const { toggleAuth } = useAuth();

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
        setErrorMsg("");
        const response = await verifyAuthToken(values.token);
        formik.setFieldValue("token", "");
        formik.setTouched({ token: false });
        if (!response.success) {
          setErrorMsg(response.message || "Invalid token. Please try again.");
          return;
        }

        setIsSuccess(true);
        toggleAuth(true);
        setTimeout(() => {
          router.push("/home");
        }, 1200);
      } catch (error) {
        formik.setFieldValue("token", "");
        formik.setTouched({ token: false });
        // console.error("Error verifying token:", error);
        setErrorMsg("A network error occurred. Please check your connection.");
      } finally {
        setLoading(false);
      }
    },
  });

  return (
    <form className="rise flex flex-col items-center text-center mb-8 w-full max-w-2xl bg-gray-100/60 dark:bg-gray-800/60 rounded-2xl p-8">
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
        <div className="fade-in fixed inset-0 z-50 flex items-center justify-center bg-white/30 dark:bg-black/40 backdrop-blur-md">
          <Loader />
        </div>
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
        <div className="rise flex flex-col items-center text-center w-full gap-5">
          <div className="relative flex items-center justify-center w-20 h-20">
            <span className="ripple absolute inset-0 rounded-full bg-emerald-500/20 dark:bg-emerald-500/10" />
            <span className="ripple-sm absolute inset-0 rounded-full bg-emerald-500/30 dark:bg-emerald-500/15" />
            <svg
              viewBox="0 0 52 52"
              className="w-16 h-16"
              fill="none"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle
                cx="26"
                cy="26"
                r="22"
                className="draw-circle stroke-emerald-500 dark:stroke-emerald-400"
              />
              <path
                d="M14 26l8 8 16-16"
                className="draw-check stroke-emerald-600 dark:stroke-emerald-300"
              />
            </svg>
          </div>
          <h1
            className={`${inter.className} rise text-3xl md:text-4xl lg:text-5xl font-bold text-black dark:text-white leading-tight`}
            style={{ animationDelay: "450ms" }}
          >
            Token{" "}
            <span className="bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent">
              Verified!
            </span>
          </h1>
          <div
            className="rise flex items-start gap-3 w-full bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-200 dark:border-emerald-500/20 rounded-xl px-4 py-3.5 text-left"
            style={{ animationDelay: "600ms" }}
          >
            <div className="mt-0.5 shrink-0 w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-center">
              <Music
                size={15}
                className="text-emerald-600 dark:text-emerald-400"
              />
            </div>
            <div>
              <p
                className={`${roboto.className} text-sm font-medium text-emerald-800 dark:text-emerald-300`}
              >
                Logged in successfully
              </p>
              <p
                className={`${roboto.className} text-xs text-emerald-600 dark:text-emerald-500/70 mt-0.5 leading-snug`}
              >
                Taking you to your library…
              </p>
            </div>
          </div>
        </div>
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
            Enter your 6 digit token
          </p>
          <OTPInput
            value={formik.values.token}
            onChange={(val) => {
              formik.setFieldValue("token", val);
              if (errorMsg) setErrorMsg("");
            }}
            error={
              formik.touched.token && formik.errors.token
                ? formik.errors.token
                : undefined
            }
          />
          {errorMsg && (
            <div className="rise flex items-start gap-3 w-full mt-4 bg-rose-50 dark:bg-rose-500/5 border border-rose-200 dark:border-rose-500/20 rounded-xl px-4 py-3.5 text-left">
              <div className="mt-0.5 shrink-0 w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 flex items-center justify-center">
                <AlertCircle
                  size={15}
                  className="text-rose-600 dark:text-rose-400"
                />
              </div>
              <div>
                <p
                  className={`${roboto.className} text-sm font-medium text-rose-800 dark:text-rose-300`}
                >
                  Verification failed
                </p>
                <p
                  className={`${roboto.className} text-xs text-rose-600 dark:text-rose-500/70 mt-0.5 leading-snug`}
                >
                  {errorMsg}
                </p>
              </div>
            </div>
          )}
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
    </form>
  );
}

export default TokenInput;

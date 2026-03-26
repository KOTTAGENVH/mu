"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LoginFooter from "@/components/login/loginFooter";
import TokenInput from "@/components/login/tokenInput";
import {
  checkAuthStatus,
  validateGenCookie,
} from "../api/client/services/auth/api";
import Loader from "@/components/loader";
import QrScan from "@/components/login/qrScan";
import { useAuth } from "@/contextApi/auth";

function Page() {
  const [isLoading, setLoading] = useState(false);
  const [isTokenInput, setTokenInput] = useState(false);
  const [isQrScan, setQrScan] = useState(false);
  const [otpPathUrl, setOtpPathUrl] = useState("");
  const [secret, setSecret] = useState("");
  const { toggleAuth } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const fetchAuthStatus = async () => {
      try {
        setLoading(true);
        const response = await checkAuthStatus();
        if (response.success && response.message === "authenticated") {
          setLoading(false);
          setTokenInput(false);
          setQrScan(false);
          toggleAuth(true);
          router.push("/home");
        } else if (response.success == true) {
          setLoading(false);
          setTokenInput(true);
          toggleAuth(false);
        } else {
          setLoading(false);
          setTokenInput(false);
          setQrScan(true);
          setOtpPathUrl(response.otpauthUrl);
          setSecret(response.secret);
          toggleAuth(false);
        }
      } catch (error) {
        setLoading(false);
        setTokenInput(false);
        setQrScan(false);
        toggleAuth(false);
        alert("Sorry, an error occurred while checking authentication status.");
      }
    };
    fetchAuthStatus();
}, [router, toggleAuth]);

  //Validate token
  useEffect(() => {
    const validateAndGenerateToken = async () => {
      // Check URL for token
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get("token");

      if (token) {
        try {
          // Validate token
          const response = await validateGenCookie(token);
          if (response.success) {
            router.push(`/home`);
          } else {
            alert(response.message);
          }
        } catch (error) {
          alert("Sorry, an error occurred while validating the token.");
          // console.error("Error during token validation/generation:", error);
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
      <div className="relative z-10 flex flex-col min-h-screen">
        <main className="flex-1 flex flex-col items-center justify-center px-4 py-6 ">
          {isLoading && <Loader />}
          {!isLoading && isTokenInput && (
            <TokenInput backToLogin={isTokenInput} handleSetToken={setTokenInput} />
          )}
          {!isLoading && !isTokenInput && isQrScan && (
            <QrScan
              url={otpPathUrl}
              secret={secret}
              handleSetToken={setTokenInput}
            />
          )}
        </main>
        <LoginFooter />
      </div>
    </div>
  );
}

export default Page;

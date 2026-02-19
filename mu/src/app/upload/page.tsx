"use client";
import React, { useEffect } from "react";
import Header from "@/components/header";
import FileUpload from "@/components/fileUpload";
import { useRouter } from "next/navigation";
import { verifyCookie } from "../api/client/services/auth/api";
import { useAuth } from "@/contextApi/auth";

function Page() {
  const router = useRouter();
  const { toggleAuth } = useAuth();

  useEffect(() => {
    const fetchCookieStatus = async () => {
      try {
        const response = await verifyCookie();
        if (!response.success) {
          alert("Your session has expired. Please log in again.");
          toggleAuth(false);
          router.push("/login");
        }
        toggleAuth(true);
      } catch (error) {
        alert(
          "An error occurred while verifying your session. Please log in again.",
        );
        toggleAuth(false);
        router.push("/login");
      }
    };
    fetchCookieStatus();
  }, []);

  return (
    <div className="uploadPage">
      <Header />
      <div className="uploadPageBody">
        <FileUpload />
      </div>
    </div>
  );
}

export default Page;

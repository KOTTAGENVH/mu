"use client";
import Image from "next/image";
import React from "react";
import { useRouter } from "next/navigation";

function LoginHeader() {
  const router = useRouter();

  const handleLogoClick = () => {
    router.push("/");
  };

  return (
    <div className="sticky top-0 flex justify-center">
      <nav className="flex items-center justify-between  bg-white bg-opacity-30 dark:bg-opacity-10 backdrop-blur-md p-2 w-4/5 m-4 rounded-full shadow-lg shadow-cyan-900/50 dark:shadow-cyan-100/20 hover:shadow-none">
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
      </nav>
    </div>
  );
}

export default LoginHeader;

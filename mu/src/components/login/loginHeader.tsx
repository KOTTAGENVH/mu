"use client";
import Image from "next/image";
import React from "react";
import { useRouter } from "next/navigation";

function LoginHeader() {
  const router = useRouter();
  const handleLogoClick = () => {
    router.push("/home");
  };

  return (
    <div className="sticky top-10 z-50 bg-transparent ">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center justify-center h-16 md:h-20 ">
          <div
            className="flex items-center cursor-pointer"
            onClick={handleLogoClick}
          >
            <div className="relative">
              <Image
                src="/mu.png"
                alt="MU"
                width={56}
                height={56}
                className="p-2 w-16 h-16 md:w-24 md:h-24 rounded-full object-cover border-4 border-white/30 hover:border-white/60 transition-"
                priority
              />
            </div>
          </div>
        </nav>
      </div>
    </div>
  );
}

export default LoginHeader;

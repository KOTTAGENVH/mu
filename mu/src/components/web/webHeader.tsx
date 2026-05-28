"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { LogIn } from "lucide-react";

function WebHeader() {
  const router = useRouter();

  const navigatePage = (path: string) => {
    router.push(path);
  };

  const navButtonClass =
    "flex items-center justify-center w-8 h-8 rounded-full text-white/80 " +
    "transition-colors duration-200 hover:bg-white/20 hover:text-white";

  return (
    <div className="fixed top-6 left-4 right-4 z-50 rounded-2xl bg-transparent">
      <nav className="w-full ">
        <div className="flex items-center justify-between mx-4 px-2 py-4 lg:mx-14 lg:px-6">
          <div className="h-auto w-auto">
            <Image
              src="/mu.jpg"
              width={60}
              height={60}
              alt="MUBYNK Logo"
              onClick={() => navigatePage("/")}
              className="cursor-pointer select-none rounded-2xl transition-opacity duration-300"
              onLoad={(event) =>
                event.currentTarget.classList.remove("opacity-0")
              }
              draggable="false"
              priority={true}
            />
          </div>
          <div
            className="flex h-auto w-auto flex-row items-center gap-8 
  bg-white/10 backdrop-blur-[12px] 
  border-none rounded-full px-2 py-2"
          >
            <motion.div className="relative">
              <button
                className={navButtonClass}
                aria-label="login-button"
                title="login-button"
                onClick={() => navigatePage("/login")}
              >
                <LogIn className="w-4 h-4" />
              </button>
            </motion.div>
          </div>
        </div>
      </nav>
    </div>
  );
}

export default WebHeader;

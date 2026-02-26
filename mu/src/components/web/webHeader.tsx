"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

function WebHeader() {
  const router = useRouter();

  const navigatePage = (path: string) => {
    router.push(path);
  };

  const navButtonClass =
    "group relative pb-1 text-sm font-medium tracking-wide text-white/80 transition-colors hover:text-white " +
    "after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:origin-bottom-right after:scale-x-0 after:bg-white " +
    "after:transition-transform after:duration-300 after:ease-out hover:after:origin-bottom-left hover:after:scale-x-100";

  return (
    <div className="fixed top-0 left-0 z-50 w-full">
      <nav className="w-full bg-transparent backdrop-blur-[12px]">
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
          <div className="flex h-auto w-auto flex-row items-center gap-8">
            <motion.div className="relative">
              <div className="inline-block">
                <button
                  className={navButtonClass}
                  aria-label="login-button"
                  title="login-button"
                  onClick={() => navigatePage("/login")}
                >
                  Login
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </nav>
    </div>
  );
}

export default WebHeader;

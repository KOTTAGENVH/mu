"use client";
import Image from "next/image";
import React, { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faGear,
  faHouse,
  faRightFromBracket,
  faRightToBracket,
  faUpload,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@/contextApi/auth";
import { logout } from "@/app/api/client/services/auth/api";

function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const headerRef = useRef<HTMLDivElement>(null);
  const { authStatus } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Handle home click
  const handleHome = () => {
    router.push("/home");
  };

  // Handle login click
  const handleLogin = () => {
    router.push("/login");
  };

  //Handle add click
  const handleAdd = () => {
    router.push("/upload");
  };

  // Handle settings click
  const handleSettings = () => {
    router.push("/settings");
  };

  const handleLogout = async () => {
    try {
      const response = await logout();

      const data = await response;
      if (data.success) {
        router.push("/");
      } else {
        alert("Logout failed");
      }
    } catch (error) {
      console.error("Error during logout:", error);
      alert("An error occurred while logging out. Please try again.");
    }
  };

  const glassClasses = isScrolled
    ? "bg-slate-900/40 backdrop-blur-xl dark:bg-slate-950/40 transition-all duration-300 ease-out"
    : "transition-all duration-300 ease-out";

  const baseBtnClass =
    "inline-flex items-center justify-center w-auto py-3 px-3 rounded-full border-none cursor-pointer  mr-4";

  const defaultBtnClass =
    "bg-gray-100 text-black hover:bg-gray-200 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700";

  const activeBtnClass =
    "bg-gray-300 text-black font-semibold shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)] dark:bg-gray-600 dark:text-white dark:shadow-[inset_0_2px_4px_rgba(0,0,0,0.25)]";

  // Helper to choose class based on route
  const getBtnClass = (path: string) =>
    `${baseBtnClass} ${pathname?.includes(path) ? activeBtnClass : defaultBtnClass}`;

  return (
    <div className={`fixed top-0 left-0 w-full z-50 ${glassClasses}`}>
      <nav className="flex items-center justify-center py-2 my-4 mx-4 px-3 lg:mx-16 lg:px-6 md:justify-between">
        <div className="hidden md:block">
          <Image
            src="/mu.png"
            alt="MU"
            width={48}
            height={48}
            className="w-12 h-12 rounded-full cursor-pointer"
            onClick={handleHome}
            priority
          />
        </div>
        <div className="flex items-center shrink-0 md:items-end">
          {pathname?.includes("/legal") && (
            <button
              title="login"
              className={`${baseBtnClass} ${defaultBtnClass}`}
              onClick={handleLogin}
              aria-label="Login"
            >
              <FontAwesomeIcon icon={faRightToBracket} className="w-4 h-4" />
            </button>
          )}

          {authStatus && (
            <>
              <button
                title="Home"
                className={getBtnClass("/home")}
                onClick={handleHome}
                aria-label="Home"
              >
                <FontAwesomeIcon icon={faHouse} className="w-4 h-4" />
              </button>

              <button
                title="Upload Audio"
                aria-label="Upload Audio"
                className={getBtnClass("/upload")}
                onClick={handleAdd}
              >
                <FontAwesomeIcon icon={faUpload} className="w-4 h-4" />
              </button>

              <button
                title="Settings"
                aria-label=" Settings"
                className={getBtnClass("/settings")}
                onClick={handleSettings}
              >
                <FontAwesomeIcon icon={faGear} className="w-4 h-4" />
              </button>

              <button
                title="Logout"
                className="inline-flex items-center justify-center w-auto py-3 px-3 rounded-full border-none cursor-pointer transition-all duration-150 ease-in-out focus-visible:outline-2 focus-visible:outline-blue-500/65 focus-visible:outline-offset-2 active:translate-y-[0.5px] bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
                onClick={handleLogout}
                aria-label="Logout"
              >
                <FontAwesomeIcon
                  icon={faRightFromBracket}
                  className="w-4 h-4 text-red-500 dark:text-red-400"
                />
              </button>
            </>
          )}
        </div>
      </nav>
    </div>
  );
}

export default Header;

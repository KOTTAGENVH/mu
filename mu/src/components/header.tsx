"use client";
import Image from "next/image";
import React, { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  faGear,
  faHouse,
  faMicrophone,
  faNewspaper,
  faRightFromBracket,
  faRightToBracket,
  faUpload,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@/contextApi/auth";
import { logout } from "@/app/api/client/services/auth/api";
import NavButton from "./headerNavBtn";
import { motion, AnimatePresence } from "framer-motion";

function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { authStatus } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const handleHome = () => router.push("/home");
  const handleLogin = () => router.push("/login");
  const handleAdd = () => router.push("/upload");
  const handleSettings = () => router.push("/settings");
  const handleMicTalk = () => router.push("/mictalk");
  const handleNews = () => router.push("/news");

  const handleLogout = async (all: boolean = false) => {
    try {
      setMenuOpen(false);
      const data = await logout(all);
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

  const isActive = (path: string) => !!pathname?.includes(path);

  const glassClass = isScrolled
    ? "bg-white/60 dark:bg-slate-950/60 backdrop-blur-xl shadow-[0_1px_0_rgba(0,0,0,0.06)] dark:shadow-[0_1px_0_rgba(255,255,255,0.04)]"
    : "bg-transparent";

  return (
    <div
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ease-out ${glassClass}`}
    >
      <nav
        className={`flex items-center justify-center py-3 my-3 mx-4 px-3 lg:mx-16 lg:px-6 md:justify-between transition-all duration-500 ease-out`}
      >
        <div className="hidden md:flex items-center gap-3">
          <div className="relative group cursor-pointer" onClick={handleHome}>
            <div className="absolute inset-0 rounded-full bg-slate-200/60 dark:bg-slate-700/40 scale-0 group-hover:scale-110 transition-transform duration-200 ease-out" />
            <Image
              src="/mu.png"
              alt="MU"
              width={44}
              height={44}
              className="relative w-11 h-11 rounded-full ring-2 ring-transparent group-hover:ring-slate-300 dark:group-hover:ring-slate-600 transition-all duration-200"
              priority
            />
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {pathname?.includes("/legal") && !authStatus && (
            <NavButton
              icon={faRightToBracket}
              label="Log in"
              onClick={handleLogin}
              ariaLabel="Login"
            />
          )}

          {authStatus && (
            <>
              <NavButton
                icon={faHouse}
                label="Home"
                active={isActive("/home")}
                onClick={handleHome}
                ariaLabel="Home"
              />

              <NavButton
                icon={faUpload}
                label="Upload Audio"
                active={isActive("/upload")}
                onClick={handleAdd}
                ariaLabel="Upload Audio"
              />

              <NavButton
                icon={faMicrophone}
                label="Mic Talk"
                active={isActive("/mictalk")}
                onClick={handleMicTalk}
                ariaLabel="Mic Talk"
              />

              <NavButton
                icon={faNewspaper}
                label="News"
                active={isActive("/news")}
                onClick={handleNews}
                ariaLabel="News"
              />

              <NavButton
                icon={faGear}
                label="Settings"
                active={isActive("/settings")}
                onClick={handleSettings}
                ariaLabel="Settings"
              />
              <span className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-1 rounded-full" />

              <div className="relative" ref={menuRef}>
                <NavButton
                  icon={faRightFromBracket}
                  label="Log out"
                  danger
                  onClick={() => setMenuOpen((o) => !o)}
                  ariaLabel="Logout"
                />
                <AnimatePresence>
                  {menuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.97 }}
                      transition={{ duration: 0.18, ease: "easeOut" }}
                      className="absolute right-0 z-50 mt-2 p-2 w-56
                        bg-white/10 dark:bg-black/10 backdrop-blur-xl rounded-2xl
                        border border-white/20 dark:border-white/10 shadow-2xl"
                    >
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2 px-2 pt-1">
                        Session
                      </p>
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => handleLogout(false)}
                          className="px-3 py-2 rounded-xl text-sm text-left border-none cursor-pointer transition-colors duration-150
                            text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                          Log out this device
                        </button>
                        <button
                          onClick={() => handleLogout(true)}
                          className="px-3 py-2 rounded-xl text-sm text-left border-none cursor-pointer transition-colors duration-150
                            text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/10 font-medium"
                        >
                          Log out all devices
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          )}
        </div>
      </nav>
    </div>
  );
}

export default Header;

"use client";
import Image from "next/image";
import React, { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  faGear,
  faHouse,
  faMicrophone,
  faRightFromBracket,
  faRightToBracket,
  faUpload,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@/contextApi/auth";
import { logout } from "@/app/api/client/services/auth/api";
import NavButton from "./headerNavBtn";


function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { authStatus } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleHome = () => router.push("/home");
  const handleLogin = () => router.push("/login");
  const handleAdd = () => router.push("/upload");
  const handleSettings = () => router.push("/settings");
  const handleMicTalk = () => router.push("/mictalk");

  const handleLogout = async () => {
    try {
      const data = await logout();
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
                icon={faGear}
                label="Settings"
                active={isActive("/settings")}
                onClick={handleSettings}
                ariaLabel="Settings"
              />
              <span className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-1 rounded-full" />

              <NavButton
                icon={faRightFromBracket}
                label="Log out"
                danger
                onClick={handleLogout}
                ariaLabel="Logout"
              />
            </>
          )}
        </div>
      </nav>
    </div>
  );
}

export default Header;
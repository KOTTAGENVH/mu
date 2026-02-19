"use client";
import Image from "next/image";
import React, { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faAdd,
  faAddressCard,
  faHouse,
  faRightFromBracket,
  faRightToBracket,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@/contextApi/auth";

function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const headerRef = useRef<HTMLDivElement>(null);
  const { authStatus } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      if (headerRef.current) {
        if (window.scrollY > 10) {
          headerRef.current.classList.add("muHeaderGlass");
        } else {
          headerRef.current.classList.remove("muHeaderGlass");
        }
      }
    };
    window.addEventListener("scroll", handleScroll);
    handleScroll();
    requestAnimationFrame(handleScroll);
    window.addEventListener("load", handleScroll);
    window.addEventListener("pageshow", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("load", handleScroll);
      window.removeEventListener("pageshow", handleScroll);
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

  // Handle about click
  const handleAbout = () => {
    window.open("https://www.nowenkottage.com");
  };

  const handleLogout = async () => {
    try {
      // Call logout API to remove the cookie
      const response = await fetch("/api/services/logout", {
        method: "GET",
      });

      const data = await response.json();
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

  return (
    <div className="muHeaderRoot" ref={headerRef}>
      <nav className="muHeaderNav">
        <div className="muHeaderLogoWrap">
          <Image
            src="/mu.png"
            alt="MU"
            width={48}
            height={48}
            className="muHeaderLogo"
            onClick={handleHome}
          />
        </div>
        <div className="muHeaderActions">
          {pathname?.includes("/legal") && (
            <button
              title="login"
              className="muHeaderBtn muHeaderBtnSpaced"
              onClick={handleLogin}
            >
              <FontAwesomeIcon
                icon={faRightToBracket}
                className="muHeaderIcon"
              />
            </button>
          )}
          {authStatus && (
            <>
              {pathname?.includes("/upload") && (
                <button
                  title="Home"
                  className="muHeaderBtn muHeaderBtnSpaced"
                  onClick={handleHome}
                >
                  <FontAwesomeIcon icon={faHouse} className="muHeaderIcon" />
                </button>
              )}
              <button
                title="Add"
                className="muHeaderBtn muHeaderBtnSpaced"
                onClick={handleAdd}
              >
                <FontAwesomeIcon icon={faAdd} className="muHeaderIcon" />
              </button>
              <button
                title="About"
                className="muHeaderBtn muHeaderBtnSpaced"
                onClick={handleAbout}
              >
                <FontAwesomeIcon
                  icon={faAddressCard}
                  className="muHeaderIcon"
                />
              </button>
              <button
                title="Logout"
                className="muHeaderBtn"
                onClick={handleLogout}
              >
                <FontAwesomeIcon
                  icon={faRightFromBracket}
                  className="muHeaderIcon muHeaderIconLogout"
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

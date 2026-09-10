"use client";
import React, { useEffect, useState } from "react";
import Header from "@/components/header";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { deleteAccount, verifyCookie } from "../api/client/services/auth/api";
import { useAuth } from "@/contextApi/auth";
import SettingCardRender from "@/components/settings/cardRender";
import StatusDisplay from "@/components/settings/statusDisplay";
import ManageCategories from "@/components/settings/categories";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLeftLong } from "@fortawesome/free-solid-svg-icons";
import ManageWishList from "@/components/settings/lists";
import { useSearch } from "@/contextApi/sematicSearch";
import Loader from "@/components/loader";
import ManageAudio from "@/components/settings/audio";
import LoginFooter from "@/components/login/loginFooter";
import { useMask } from "@/contextApi/mask";
import { useAudioEq } from "@/contextApi/audioEnhance";
import ManageActivty from "@/components/settings/activityManager";
import { useVisualizer } from "@/contextApi/audioVizualizer";
import ChangeAppModal from "@/components/settings/changeApp";
import { downloadUploadsPdf } from "../api/client/services/report/api";

function Page() {
  const router = useRouter();
  const { toggleAuth } = useAuth();
  const { toggleSearch, sematicSearch } = useSearch();
  const { maskStatus, toggleMask } = useMask();
  const { useCompressor, setUseCompressor, resetEq } = useAudioEq();
  const { cycleMode } = useVisualizer();
  const [activeSetting, setActiveSetting] = useState<number | null>(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const fetchCookieStatus = async () => {
      const from = encodeURIComponent(
        window.location.pathname + window.location.search
      );
      try {
        const response = await verifyCookie();
        if (!response.success) {
          alert("Your session has expired. Please log in again.");
          toggleAuth(false);
          router.replace(`/login?from=${from}`);
          return;
        }
        toggleAuth(true);
      } catch (error) {
        alert("An error occurred while verifying your session. Please log in again.");
        toggleAuth(false);
        router.replace(`/login?from=${from}`);
      }
    };
    fetchCookieStatus();
  }, [router, toggleAuth]);

  const baseBtnClass =
    "inline-flex items-center justify-center w-auto py-3 px-3 rounded-full border-none cursor-pointer  mr-4";

  const defaultBtnClass =
    "bg-gray-100 text-black hover:bg-gray-200 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700";

  const handleSettingClick = async (id: number) => {
    if (id === 3) {
      toggleSearch(!sematicSearch);
      return;
    }
    if (id === 4) {
      setShowResetModal(true);
      return;
    }
    if (id === 6) {
      toggleMask(!maskStatus);
      return;
    }
    if (id === 7) {
      resetEq();
      return;
    }
    if (id === 8) {
      setUseCompressor(!useCompressor);
      return;
    }
    if (id === 9) {
      cycleMode();
      return;
    }
    if (id === 11) {
      await handleDownloadData();
      return;
    }
    setActiveSetting(id);
  };

  const handleDeleteAccount = async () => {
    try {
      setIsLoading(true);
      const data = await deleteAccount();

      if (data.success) {
        localStorage.clear();
        toggleAuth(false);
        router.push("/login");
        return;
      }
      alert("Failed to reset authenticator. Please try again.");
    } catch (error) {
      alert(
        "An error occurred while resetting authenticator. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const renderContent = () => {
    switch (activeSetting) {
      case 1:
        return <ManageCategories />;
      case 2:
        return <ManageWishList />;
      case 5:
        return <ManageAudio />;
      case 10:
        return <ManageActivty />;
      default:
        return (
          <>
            <StatusDisplay />
            <SettingCardRender onSettingSelect={handleSettingClick} />
          </>
        );
    }
  };

  const handleDownloadData = async () => {
    if (isExporting) return;
    try {
      setIsExporting(true);
      await downloadUploadsPdf();
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Sorry, an error occurred while building the report. Please try again later.",
      );
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div
      className="
        min-h-screen w-full
        flex flex-col
        bg-slate-300 dark:bg-slate-950
        supports-[height:100dvh]:min-h-[100dvh]
        supports-[height:100svh]:min-h-[100svh]
      "
    >
      <Header />
      {isLoading ? (
        <div className="w-auto h-auto mt-20 mx-4 px-3 lg:mx-16 lg:px-6 py-4 flex items-center justify-center">
          <Loader />
        </div>
      ) : (
        <div className="w-auto h-auto mt-20 mx-4 px-3 lg:mx-16 lg:px-6 py-4">
          {activeSetting !== null && (
            <button
              onClick={() => setActiveSetting(null)}
              className={`${baseBtnClass} ${defaultBtnClass}`}
              title="Back to settings overview"
              aria-label="Back to settings overview"
            >
              <FontAwesomeIcon icon={faLeftLong} className="w-4 h-4" />
            </button>
          )}

          {renderContent()}
        </div>
      )}
      {showResetModal && (
        <ChangeAppModal
          handleClose={() => setShowResetModal(false)}
          handleConfirm={handleDeleteAccount}
        />
      )}
      <LoginFooter />
    </div>
  );
}

export default Page;

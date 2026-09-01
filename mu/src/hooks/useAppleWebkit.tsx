"use client";
import { useEffect, useState } from "react";

export function useAppleWebkit() {
  const [isAppleWebkit, setIsAppleWebkit] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;

    const isIOS =
      /iPad|iPhone|iPod/.test(ua) ||
      (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);

    const isSafari =
      /Safari/.test(ua) &&
      !/Chrome|Chromium|CriOS|FxiOS|Edg|OPR|Android/.test(ua);

    setIsAppleWebkit(isIOS || isSafari);
  }, []);

  return isAppleWebkit;
}

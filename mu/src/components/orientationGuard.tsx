"use client";

import { useEffect, useState } from "react";

export default function OrientationGuard() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(orientation: landscape)");

    const update = () => {
      const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      setShow(isMobile && mq.matches);
    };

    update();
    mq.addEventListener("change", update);
    window.addEventListener("resize", update);
    const onOrientationChange = () => update();
    window.addEventListener("orientationchange", onOrientationChange);
    return () => {
      mq.removeEventListener("change", update);
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", onOrientationChange);
    };
  }, []);

  if (!show) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.9)",
        color: "white",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "2rem",
      }}
      role="dialog"
      aria-live="assertive"
      aria-label="Rotate device"
    >
      <div>
        <p style={{ fontSize: 18, opacity: 0.9 }}>Please rotate your device</p>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginTop: 8 }}>Portrait mode only</h1>
      </div>
    </div>
  );
}

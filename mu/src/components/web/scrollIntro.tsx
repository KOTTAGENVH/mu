"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

const TOTAL_FRAMES = 417;
const FILE_EXT = "webp";
const FRAME_PATH = "/frames";
const SCROLL_LENGTH_VH = 350;

const QUOTES = [
  "Open source. Fully yours.",
  "No ads. No tracking.",
  "Plays what you actually like.",
  "Smart search, instant finds.",
  "Wishlist → queued.",
  "Your categories. Your flow.",
  "2FA built in.",
  "Stats you can see. Storage you control.",
  "Private by design.",
  "Made for your home screen.",
];

function pad5(n: number) {
  return String(n).padStart(5, "0");
}

function frameUrl(frameIndex1Based: number) {
  return `${FRAME_PATH}/frame_${pad5(frameIndex1Based)}.${FILE_EXT}`;
}

export default function ScrollIntro() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const imagesRef = useRef<(HTMLImageElement | null)[]>(
    Array(TOTAL_FRAMES).fill(null),
  );
  const loadedRef = useRef<boolean[]>(Array(TOTAL_FRAMES).fill(false));
  const rafRef = useRef<number | null>(null);

  const [progress, setProgress] = useState(0); // 0..1

  const revealStart = 0.82;
  const showText = progress < revealStart;

  const quoteIndex = useMemo(() => {
    const t = Math.min(progress / revealStart, 0.999);
    return Math.floor(t * QUOTES.length);
  }, [progress]);

  const frameIndex = useMemo(() => {
    const idx0 = Math.round(progress * (TOTAL_FRAMES - 1));
    return idx0 + 1;
  }, [progress]);

  function drawFrame(idx1: number) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = imagesRef.current[idx1 - 1];
    if (!img || !img.complete) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    const cw = Math.max(1, Math.floor(rect.width * dpr));
    const ch = Math.max(1, Math.floor(rect.height * dpr));

    if (canvas.width !== cw || canvas.height !== ch) {
      canvas.width = cw;
      canvas.height = ch;
    }

    const iw = img.naturalWidth;
    const ih = img.naturalHeight;
    const scale = Math.max(cw / iw, ch / ih);
    const sw = iw * scale;
    const sh = ih * scale;
    const dx = (cw - sw) / 2;
    const dy = (ch - sh) / 2;

    ctx.clearRect(0, 0, cw, ch);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, dx, dy, sw, sh);
  }

  function ensureLoaded(idx1: number) {
    const i = idx1 - 1;
    if (loadedRef.current[i]) return;

    const img = new Image();
    img.src = frameUrl(idx1);
    img.decoding = "async";
    img.onload = () => {
      loadedRef.current[i] = true;
      imagesRef.current[i] = img;
      drawFrame(idx1);
    };
    img.onerror = () => {
      loadedRef.current[i] = false;
    };

    imagesRef.current[i] = img;
  }

  function preloadWindow(centerIdx1: number, radius = 10) {
    const start = Math.max(1, centerIdx1 - radius);
    const end = Math.min(TOTAL_FRAMES, centerIdx1 + radius);
    for (let f = start; f <= end; f++) ensureLoaded(f);
  }

  useEffect(() => {
    ensureLoaded(1);

    const idle = (cb: () => void) => {
      if ("requestIdleCallback" in window)
        return (window as any).requestIdleCallback(cb);
      return setTimeout(cb, 50);
    };

    const idleId = idle(() => {
      for (let f = 1; f <= TOTAL_FRAMES; f += 6) ensureLoaded(f);
    });

    return () => {
      if ("cancelIdleCallback" in window)
        (window as any).cancelIdleCallback(idleId);
      else clearTimeout(idleId);
    };
  }, []);

  useEffect(() => {
    preloadWindow(frameIndex, 12);
    drawFrame(frameIndex);
  }, [frameIndex]);

  useEffect(() => {
    function onScroll() {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const vh = window.innerHeight;
      const total = rect.height - vh;
      const scrolled = Math.min(Math.max(-rect.top, 0), total);
      const p = total > 0 ? scrolled / total : 0;

      setProgress(p);
    }

    const onScrollRaf = () => {
      if (rafRef.current) return;
      rafRef.current = window.requestAnimationFrame(() => {
        rafRef.current = null;
        onScroll();
      });
    };

    window.addEventListener("scroll", onScrollRaf, { passive: true });
    window.addEventListener("resize", onScrollRaf);
    onScroll();

    return () => {
      window.removeEventListener("scroll", onScrollRaf);
      window.removeEventListener("resize", onScrollRaf);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <section
      ref={sectionRef as any}
      style={{
        height: `${SCROLL_LENGTH_VH}vh`,
        background: "#000",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "sticky",
          top: 0,
          height: "100vh",
          overflow: "hidden",
          background: "#000",
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            width: "100%",
            height: "100%",
            display: "block",
            background: "#000",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            padding: "clamp(20px, 5vw, 64px)",
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              maxWidth: 920,
              width: "100%",
              opacity: showText ? 1 : 0,
              transition: "opacity 500ms ease",
            }}
          >
            <div
              style={{
                color: "rgba(255,255,255,0.92)",
                fontSize: "clamp(20px, 3vw, 44px)",
                fontWeight: 600,
                lineHeight: 1.1,
                letterSpacing: "-0.02em",
                textShadow: "0 2px 18px rgba(0,0,0,0.55)",
              }}
            >
              {QUOTES[quoteIndex]}
            </div>
            <div
              style={{
                marginTop: 16,
                height: 2,
                width: "min(420px, 70%)",
                background: "rgba(255,255,255,0.12)",
                borderRadius: 999,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${Math.min(progress / revealStart, 1) * 100}%`,
                  background: "rgba(255,255,255,0.6)",
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

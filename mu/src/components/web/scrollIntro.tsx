"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import NextImage from "next/image";
import WebLoader from "./webLoader";

const total_frames = 415;
const file_ext = "png";
const frame_path = process.env.NEXT_PUBLIC_R2_PUBLIC_BUCKET_IMG;
const scroll_length_vh = 450;
const frame_offset = 2;

const quotes = [
  "Open source. Fully yours.",
  "No ads. No tracking.",
  "Plays what you actually like.",
  "Smart search, instant finds.",
  "Add you wishlist, download later.",
  "Your categories. Your flow.",
  "Virtual Microphone",
  "2FA built in.",
  "Stats you can see. Storage you control.",
  "Private by design.",
];

declare global {
  interface Window {
    requestIdleCallback: (
      callback: IdleRequestCallback,
      options?: IdleRequestOptions,
    ) => number;
    cancelIdleCallback: (handle: number) => void;
  }
}

function pad5(n: number) {
  return String(n).padStart(5, "0");
}

function frameUrl(frameIndex1Based: number) {
  const safeIndex = Math.min(frameIndex1Based, total_frames);
  return `${frame_path}/mubynk-${pad5(safeIndex + frame_offset)}.${file_ext}`;
}

export default function ScrollIntro() {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameIndexRef = useRef(1);
  const imagesRef = useRef<(HTMLImageElement | null)[]>(
    Array(total_frames).fill(null),
  );
  const loadedRef = useRef<boolean[]>(Array(total_frames).fill(false));
  const rafRef = useRef<number | null>(null);

  const [progress, setProgress] = useState(0);
  const [firstFrameLoaded, setFirstFrameLoaded] = useState(false);

  const revealStart = 0.75;
  const animationEnd = 0.85;
  const showText = progress < revealStart;

  const quoteIndex = useMemo(() => {
    const t = Math.min(progress / revealStart, 0.999);
    return Math.floor(t * quotes.length);
  }, [progress]);

  const frameIndex = useMemo(() => {
    const t = Math.min(progress / animationEnd, 1);
    const idx0 = Math.round(t * (total_frames - 1));
    return idx0 + 1;
  }, [progress]);

  const drawFrame = useCallback((idx1: number) => {
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
  }, []);

  const ensureLoaded = useCallback(
    (idx1: number) => {
      const i = idx1 - 1;
      if (loadedRef.current[i]) return;

      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = frameUrl(idx1);
      img.decoding = "async";
      img.onload = () => {
        loadedRef.current[i] = true;
        imagesRef.current[i] = img;

        if (idx1 === 1) {
          setFirstFrameLoaded(true);
        }

        if (idx1 === frameIndexRef.current) drawFrame(idx1);
      };
      img.onerror = () => {
        loadedRef.current[i] = false;
      };

      imagesRef.current[i] = img;
    },
    [drawFrame],
  );

  const preloadWindow = useCallback(
    (centerIdx1: number, radius = 10) => {
      const start = Math.max(1, centerIdx1 - radius);
      const end = Math.min(total_frames, centerIdx1 + radius);
      for (let f = start; f <= end; f++) ensureLoaded(f);
    },
    [ensureLoaded],
  );

  useEffect(() => {
    frameIndexRef.current = frameIndex;
  }, [frameIndex]);

  useEffect(() => {
    ensureLoaded(1);

    const idle = (cb: () => void) => {
      if ("requestIdleCallback" in window)
        return window.requestIdleCallback(cb);
      return setTimeout(cb, 50);
    };

    const idleId = idle(() => {
      for (let f = 1; f <= total_frames; f += 6) ensureLoaded(f);
    });

    return () => {
      if ("cancelIdleCallback" in window)
        window.cancelIdleCallback(idleId as number);
      else clearTimeout(idleId);
    };
  }, [ensureLoaded]);

  useEffect(() => {
    if (firstFrameLoaded && progress === 0) {
      drawFrame(1);
    }
  }, [firstFrameLoaded, progress, drawFrame]);

  useEffect(() => {
    preloadWindow(frameIndex, 12);
    drawFrame(frameIndex);
  }, [frameIndex, drawFrame, preloadWindow]);

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
    <>
      <style>{`
        .responsive-text-wrapper {
          align-items: center;
        }
        .responsive-text-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }
        @media (min-width: 768px) {
          .responsive-text-wrapper {
            align-items: flex-end;
          }
          .responsive-text-content {
            align-items: flex-start;
            text-align: left;
          }
        }
      `}</style>
      <section
        ref={sectionRef}
        style={{
          height: `${scroll_length_vh}vh`,
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
          {!firstFrameLoaded && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#000",
                zIndex: 50,
                color: "rgba(255,255,255,0.7)",
                fontSize: "1.2rem",
                fontFamily: "sans-serif",
              }}
            >
              <WebLoader />
            </div>
          )}
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
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
              opacity: !showText ? 1 : 0,
              transition: "opacity 800ms ease, transform 800ms ease",
              transform: !showText ? "scale(1)" : "scale(0.95)",
            }}
          >
            <NextImage
              src="/mu.png"
              alt="MUBYNK Logo"
              width={240}
              height={240}
              className="rounded-full "
              priority
            />
          </div>
          <div
            className="responsive-text-wrapper"
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
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
                {quotes[quoteIndex]}
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
    </>
  );
}

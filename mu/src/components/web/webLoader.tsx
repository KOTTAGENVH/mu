"use client";

import React, { useEffect, useRef, useState } from "react";

type WebLoaderProps = {
  progress?: number;
  className?: string;
  show_percent?: boolean;
  label?: string;
};

const bar_count = 48;
const bar_w = 3;
const gap = 3;
const max_h = 46;
const min_h = 5;

const total_w = bar_count * bar_w + (bar_count - 1) * gap;
const view_w = total_w + 20;
const view_h = 92;
const center_y = 46;

const round2 = (n: number) => Math.round(n * 100) / 100;

const heights = Array.from({ length: bar_count }, (_, i) => {
  const a = Math.sin(i * 0.7) * 0.5 + 0.5;
  const b = Math.sin(i * 1.9 + 1.3) * 0.5 + 0.5;
  const c = Math.sin(i * 0.31 + 2.7) * 0.5 + 0.5;
  const env = Math.sin((i / (bar_count - 1)) * Math.PI) * 0.45 + 0.55;
  const v = (a * 0.45 + b * 0.35 + c * 0.2) * env;
  return round2(min_h + v * (max_h - min_h));
});

function WebLoader({
  progress,
  className = "",
  show_percent = true,
  label = "Loading",
}: WebLoaderProps) {
  const is_determinate = typeof progress === "number";
  const [time, set_time] = useState(0);
  const raf = useRef<number | null>(null);
  const start = useRef<number | null>(null);

  useEffect(() => {
    if (is_determinate) return;
    const loop = (now: number) => {
      if (start.current === null) start.current = now;
      set_time((now - start.current) / 1600);
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [is_determinate]);

  const p = is_determinate ? Math.min(1, Math.max(0, progress as number)) : 0;
  const pct = Math.round(p * 100);
  const playhead = p * bar_count;
  const head_index = Math.floor(playhead);

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <svg
        className="h-[92px] w-[320px] max-w-full"
        viewBox={`0 0 ${view_w} ${view_h}`}
        role="img"
        aria-label={`${label} ${pct}%`}
        aria-live="polite"
      >
        <defs>
          <linearGradient id="wf_played" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.55" />
            <stop offset="50%" stopColor="#FFFFFF" stopOpacity="1" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.55" />
          </linearGradient>

          <style>{`
            @keyframes wf_breathe {
              0%, 100% { transform: scaleY(0.82); }
              50%      { transform: scaleY(1.12); }
            }
            @keyframes wf_sweep {
              0%   { transform: translateX(-12%); opacity: 0; }
              12%  { opacity: 1; }
              88%  { opacity: 1; }
              100% { transform: translateX(112%); opacity: 0; }
            }
            .wf-bar {
              transform-box: fill-box;
              transform-origin: center;
              will-change: transform;
            }
            .wf-sweep { animation: wf_sweep 1.9s ease-in-out infinite; }
            @media (prefers-reduced-motion: reduce) {
              .wf-bar, .wf-sweep { animation: none !important; }
            }
          `}</style>
        </defs>

        <g transform="translate(10 0)">
          {heights.map((h, i) => {
            const x = i * (bar_w + gap);
            const played = i < head_index;
            const is_head = is_determinate && i === head_index;

            const wave = is_determinate
              ? 1
              : 0.75 +
                0.45 * (Math.sin(time * Math.PI * 2 + i * 0.42) * 0.5 + 0.5);

            const bar_h = round2(h * wave);
            const bar_y = round2(center_y - bar_h / 2);

            return (
              <rect
                key={i}
                className="wf-bar"
                x={x}
                y={bar_y}
                width={bar_w}
                height={bar_h}
                rx={bar_w / 2}
                fill={played || is_head ? "url(#wf_played)" : "#FFFFFF"}
                opacity={played || is_head ? 1 : 0.16}
                style={
                  is_head
                    ? { animation: "wf_breathe 0.7s ease-in-out infinite" }
                    : undefined
                }
              />
            );
          })}

          {is_determinate && p > 0 && p < 1 && (
            <rect
              x={round2(playhead * (bar_w + gap) - 0.5)}
              y={center_y - max_h / 2 - 4}
              width="1"
              height={max_h + 8}
              fill="#FFFFFF"
              opacity="0.45"
            />
          )}

          {!is_determinate && (
            <g className="wf-sweep">
              <rect
                x="-40"
                y={center_y - max_h / 2 - 6}
                width="80"
                height={max_h + 12}
                fill="#FFFFFF"
                opacity="0.06"
              />
            </g>
          )}
        </g>

        {show_percent && is_determinate && (
          <text
            x={view_w / 2}
            y={view_h - 12}
            dx="-3"
            textAnchor="middle"
            fill="#FFFFFF"
            fillOpacity="0.45"
            fontSize="10"
            letterSpacing="5"
            fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
          >
            {pct}%
          </text>
        )}
      </svg>
    </div>
  );
}

export default WebLoader;
import { memo } from "react";
import type { Color, PieceType } from "../../../lib/games/chess/types";

export const pieceIdPrefix = "mu-chess-";

interface Tones {
  fill: string;
  stroke: string;
  detail: string;
  shine: string;
}
const tones: Record<Color, Tones> = {
  w: {
    fill: `url(#${pieceIdPrefix}gw)`,
    stroke: "#232833",
    detail: "#232833",
    shine: "rgba(255,255,255,.95)",
  },
  b: {
    fill: `url(#${pieceIdPrefix}gb)`,
    stroke: "#0A0C0F",
    detail: "#DCE1E8",
    shine: "rgba(255,255,255,.28)",
  },
};

function Shape({ type, color }: { type: PieceType; color: Color }) {
  const t = tones[color];
  const a = {
    fill: t.fill,
    stroke: t.stroke,
    strokeWidth: 2.4,
    strokeLinejoin: "round" as const,
    strokeLinecap: "round" as const,
  };
  const line = (d: string, w = 1.8, col = t.detail, op?: number) => (
    <path
      d={d}
      fill="none"
      stroke={col}
      strokeWidth={w}
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity={op}
    />
  );
  const shine = (d: string) => line(d, 3, t.shine);
  const base = (
    <path
      {...a}
      d="M20 88.5c0-2.5 2-4.5 4.5-4.5h51c2.5 0 4.5 2 4.5 4.5V92a2.5 2.5 0 0 1-2.5 2.5h-55A2.5 2.5 0 0 1 20 92z"
    />
  );
  switch (type) {
    case "P":
      return (
        <>
          {base}
          <path {...a} d="M29 84C30 77 37 74 41 70L59 70C63 74 70 77 71 84Z" />
          <path {...a} d="M42 70C44 63 44 58 43 53L57 53C56 58 56 63 58 70Z" />
          <ellipse {...a} cx={50} cy={52.5} rx={13.5} ry={4.2} />
          <circle {...a} cx={50} cy={37} r={13.5} />
          {shine("M43.5 31a8 8 0 0 1 7-4.5")}
        </>
      );
    case "R":
      return (
        <>
          {base}
          <path {...a} d="M25 84C27 78 31 76 34 74L66 74C69 76 73 78 75 84Z" />
          <path {...a} d="M35 74L37 45L63 45L65 74Z" />
          <path {...a} d="M31 45L31 39.5L69 39.5L69 45Z" />
          <path
            {...a}
            d="M29 39.5L29 21L38 21L38 27L45.5 27L45.5 21L54.5 21L54.5 27L62 27L62 21L71 21L71 39.5Z"
          />
          {line("M37.6 60H62.4", 1.6, t.detail, 0.45)}
          {shine("M41 49L40 70")}
        </>
      );
    case "B":
      return (
        <>
          {base}
          <path {...a} d="M29 84C30 78 36 75 40 72L60 72C64 75 70 78 71 84Z" />
          <path {...a} d="M41 72C43 66 43 62 42 58L58 58C57 62 57 66 59 72Z" />
          <ellipse {...a} cx={50} cy={57.5} rx={15} ry={4.2} />
          <path
            {...a}
            d="M50 19C62 28 67 38 63 48C61 53 56 55 50 55C44 55 39 53 37 48C33 38 38 28 50 19Z"
          />
          <circle {...a} cx={50} cy={14.5} r={5} />
          {line("M55 30L46 42", 3)}
          {shine("M43.5 31C40.5 36 40 41 41 45.5")}
        </>
      );
    case "N":
      return (
        <>
          {base}
          <path {...a} d="M26 84C28 78 33 76 37 74L68 74C71 77 74 80 74 84Z" />
          <path
            {...a}
            d="M37 74C36 65 40 59 47 54C41 55 35 57 30 60C26 62 21 60 20 56C19 52 21 48 25 45C31 40 36 34 40 28C41 24 42 20 45 17L47 10L51.5 16.5C63 18 73 26 76 40C79 54 75 65 69 74Z"
          />
          <circle cx={41} cy={33} r={2.7} fill={t.detail} />
          <circle cx={24.6} cy={51.6} r={1.7} fill={t.detail} />
          {line("M57 21C67 29 71 42 71 57", 1.8, t.detail, 0.45)}
          {shine("M44 22C41 28 36 35 30 41")}
        </>
      );
    case "Q":
      return (
        <>
          {base}
          <path {...a} d="M24 84C26 77 33 74 38 71L62 71C67 74 74 77 76 84Z" />
          <path {...a} d="M38 71C40 60 38 51 31 41L69 41C62 51 60 60 62 71Z" />
          <ellipse {...a} cx={50} cy={71} rx={13} ry={3.4} />
          <path
            {...a}
            d="M31 42L22 21L35 32L38 15L45 30L50 11L55 30L62 15L65 32L78 21L69 42Z"
          />
          <ellipse {...a} cx={50} cy={42} rx={20} ry={4.2} />
          {[
            [22, 19],
            [38, 13],
            [50, 9],
            [62, 13],
            [78, 19],
          ].map(([x, y]) => (
            <circle key={x} {...a} cx={x} cy={y} r={4} />
          ))}
          {shine("M40.5 47C42.5 54 43 61 42 66.5")}
        </>
      );
    case "K":
      return (
        <>
          {base}
          <path {...a} d="M24 84C26 77 33 74 38 71L62 71C67 74 74 77 76 84Z" />
          <path {...a} d="M38 71C40 62 39 55 35 46L65 46C61 55 60 62 62 71Z" />
          <ellipse {...a} cx={50} cy={71} rx={13} ry={3.4} />
          <path
            {...a}
            d="M33 46C27 38 29 29 37 28C42 27.5 46 30 50 34C54 30 58 27.5 63 28C71 29 73 38 67 46Z"
          />
          <ellipse {...a} cx={50} cy={46} rx={18} ry={4.2} />
          <path {...a} d="M47 7H53V13H59V19H53V30H47V19H41V13H47Z" />
          {line("M50 34.5V44", 1.6, t.detail, 0.5)}
          {shine("M40.5 51C42 57 42.5 62 42 66.5")}
        </>
      );
  }
}

const allPieceTypes: PieceType[] = ["P", "N", "B", "R", "Q", "K"];

export const PieceDefs = memo(function PieceDefs() {
  return (
    <svg
      width="0"
      height="0"
      style={{ position: "absolute" }}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={`${pieceIdPrefix}gw`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset=".5" stopColor="#EEF1F5" />
          <stop offset="1" stopColor="#C3CAD4" />
        </linearGradient>
        <linearGradient id={`${pieceIdPrefix}gb`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6D7480" />
          <stop offset=".45" stopColor="#3A3F48" />
          <stop offset="1" stopColor="#17191E" />
        </linearGradient>
        {(["w", "b"] as Color[]).map((c) =>
          allPieceTypes.map((t) => (
            <symbol
              key={c + t}
              id={`${pieceIdPrefix}${c}${t}`}
              viewBox="0 0 100 100"
            >
              <Shape type={t} color={c} />
            </symbol>
          )),
        )}
      </defs>
    </svg>
  );
});

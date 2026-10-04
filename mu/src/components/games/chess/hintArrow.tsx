import { memo } from "react";
import styles from "../../../css/chessGame.module.css";
import type { Color } from "@/lib/games/chess/types";
import { uciSquares, viewPosition } from "@/lib/games/chess/squares";

export const HintArrow = memo(function HintArrow({
  uci,
  bottom,
}: {
  uci: string | null;
  bottom: Color;
}) {
  if (!uci) return null;
  const [from, to] = uciSquares(uci);
  const a = viewPosition(from, bottom),
    b = viewPosition(to, bottom);
  const x1 = a.col + 0.5,
    y1 = a.row + 0.5,
    x2 = b.col + 0.5,
    y2 = b.row + 0.5;
  const len = Math.hypot(x2 - x1, y2 - y1),
    ux = (x2 - x1) / len,
    uy = (y2 - y1) / len;
  const hx = x2 - ux * 0.32,
    hy = y2 - uy * 0.32,
    ex = x2 - ux * 0.12,
    ey = y2 - uy * 0.12,
    nx = -uy,
    ny = ux,
    w = 0.3;
  return (
    <svg
      className={styles.arrows}
      viewBox="0 0 8 8"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <line
        x1={x1 + ux * 0.2}
        y1={y1 + uy * 0.2}
        x2={hx}
        y2={hy}
        className={styles.arrowLine}
        strokeWidth={0.17}
        strokeLinecap="round"
      />
      <polygon
        points={`${ex},${ey} ${hx + nx * w},${hy + ny * w} ${hx - nx * w},${hy - ny * w}`}
        className={styles.arrowHead}
      />
    </svg>
  );
});

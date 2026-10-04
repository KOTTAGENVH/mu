import { memo, useMemo } from "react";
import styles from "@/css/chessGame.module.css";
import type { DiagramPosition } from "@/lib/games/chess/diagram";
import { pieceLabel } from "@/lib/games/chess/pieces";
import { fileLetters } from "@/lib/games/chess/squares";
import { PieceIcon } from "../pieceIcon";

export interface RuleDiagramProps {
  position: DiagramPosition;
  dots?: readonly string[];
  rings?: readonly string[];
  highlights?: readonly string[];
  check?: string;
  arrows?: readonly string[];
  fadedArrows?: readonly string[];
  caption?: string;
  label: string;
}

const ranks = [8, 7, 6, 5, 4, 3, 2, 1];
const xy = (name: string) => ({
  x: name.charCodeAt(0) - 97 + 0.5,
  y: 8 - Number(name[1]) + 0.5,
});

function Arrow({ uci, faded }: { uci: string; faded?: boolean }) {
  const a = xy(uci.slice(0, 2)),
    b = xy(uci.slice(2, 4));
  const len = Math.hypot(b.x - a.x, b.y - a.y),
    ux = (b.x - a.x) / len,
    uy = (b.y - a.y) / len;
  const hx = b.x - ux * 0.32,
    hy = b.y - uy * 0.32,
    ex = b.x - ux * 0.1,
    ey = b.y - uy * 0.1,
    nx = -uy,
    ny = ux,
    w = 0.28;
  return (
    <g className={faded ? styles.diagramArrowFaded : styles.diagramArrow}>
      <line
        x1={a.x + ux * 0.2}
        y1={a.y + uy * 0.2}
        x2={hx}
        y2={hy}
        strokeWidth={0.16}
        strokeLinecap="round"
      />
      <polygon
        points={`${ex},${ey} ${hx + nx * w},${hy + ny * w} ${hx - nx * w},${hy - ny * w}`}
      />
    </g>
  );
}

export const RuleDiagram = memo(function RuleDiagram({
  position,
  dots = [],
  rings = [],
  highlights = [],
  check,
  arrows = [],
  fadedArrows = [],
  caption,
  label,
}: RuleDiagramProps) {
  const sets = useMemo(
    () => ({
      dots: new Set(dots),
      rings: new Set(rings),
      hl: new Set(highlights),
    }),
    [dots, rings, highlights],
  );
  return (
    <figure className={styles.diagram}>
      <div className={styles.diagramBoard} role="img" aria-label={label}>
        {ranks.map((rank, r) =>
          fileLetters.split("").map((file, f) => {
            const name = file + rank,
              code = position[name];
            const cls = [
              styles.dSq,
              (r + f) % 2 === 1 && styles.dDark,
              sets.hl.has(name) && styles.dHl,
              check === name && styles.dCheck,
              sets.dots.has(name) && styles.dDot,
              sets.rings.has(name) && styles.dRing,
            ]
              .filter(Boolean)
              .join(" ");
            return (
              <div
                key={name}
                className={cls}
                title={code ? `${name}: ${pieceLabel(code)}` : name}
              >
                {f === 0 && (
                  <span className={styles.dRank} aria-hidden="true">
                    {rank}
                  </span>
                )}
                {r === 7 && (
                  <span className={styles.dFile} aria-hidden="true">
                    {file}
                  </span>
                )}
                {code && <PieceIcon code={code} className={styles.dPiece} />}
              </div>
            );
          }),
        )}
        {(arrows.length > 0 || fadedArrows.length > 0) && (
          <svg
            className={styles.diagramArrows}
            viewBox="0 0 8 8"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            {fadedArrows.map((u) => (
              <Arrow key={"f" + u} uci={u} faded />
            ))}
            {arrows.map((u) => (
              <Arrow key={u} uci={u} />
            ))}
          </svg>
        )}
      </div>
      {caption && (
        <figcaption className={styles.diagramCaption}>{caption}</figcaption>
      )}
    </figure>
  );
});

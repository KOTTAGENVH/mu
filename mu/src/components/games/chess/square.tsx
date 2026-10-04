import { memo } from "react";
import styles from "../../../css/chessGame.module.css";

export const squareFlags = {
  dark: 1,
  last: 2,
  selected: 4,
  check: 8,
  target: 16,
  capture: 32,
  hover: 64,
  cursor: 128,
} as const;

interface SquareProps {
  domId: string;
  flags: number;
  label: string;
  fileLabel?: string;
  rankLabel?: string;
}

export const Square = memo(function Square({
  domId,
  flags,
  label,
  fileLabel,
  rankLabel,
}: SquareProps) {
  const cls = [
    styles.sq,
    flags & squareFlags.dark && styles.sqDark,
    flags & squareFlags.last && styles.sqLast,
    flags & squareFlags.selected && styles.sqSelected,
    flags & squareFlags.check && styles.sqCheck,
    flags & squareFlags.target && styles.sqTarget,
    flags & squareFlags.capture && styles.sqCapture,
    flags & squareFlags.hover && styles.sqHover,
    flags & squareFlags.cursor && styles.sqCursor,
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <div
      id={domId}
      className={cls}
      role="gridcell"
      aria-label={label}
      aria-selected={!!(flags & squareFlags.selected)}
    >
      {rankLabel && (
        <span
          className={`${styles.coord} ${styles.coordRank}`}
          aria-hidden="true"
        >
          {rankLabel}
        </span>
      )}
      {fileLabel && (
        <span
          className={`${styles.coord} ${styles.coordFile}`}
          aria-hidden="true"
        >
          {fileLabel}
        </span>
      )}
      <span className={styles.mark} aria-hidden="true" />
    </div>
  );
});

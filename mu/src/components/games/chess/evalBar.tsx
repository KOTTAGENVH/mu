import { memo } from "react";
import styles from "../../../css/chessGame.module.css";
import type { Color } from "../../../lib/games/chess/types";
import { evalPercent, formatEval } from "../../../lib/games/chess/format";

export const EvalBar = memo(function EvalBar({
  scoreWhite,
  bottom,
}: {
  scoreWhite: number;
  bottom: Color;
}) {
  const pct = evalPercent(scoreWhite);
  return (
    <div
      className={`${styles.evalbar} ${bottom === "b" ? styles.evalFlip : ""}`}
      role="img"
      aria-label={`Evaluation ${formatEval(scoreWhite)} for White`}
    >
      <div
        className={styles.evalFill}
        style={{ height: `${pct.toFixed(1)}%` }}
      />
    </div>
  );
});

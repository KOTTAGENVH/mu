import { memo } from "react";
import styles from "../../../css/chessGame.module.css";
import type { EngineReport } from "../../../lib/games/chess/types";
import { formatCount, formatEval } from "../../../lib/games/chess/format";

export const EnginePanel = memo(function EnginePanel({
  report,
  line,
}: {
  report: EngineReport | null;
  line: string;
}) {
  return (
    <section
      className={`${styles.card} ${styles.engineCard}`}
      aria-label="Engine analysis"
    >
      <div className={styles.cardHead}>
        <h2>Engine analysis</h2>
        <span className={styles.speed}>
          {report && report.time > 200 && report.nodes
            ? `${formatCount(Math.round((report.nodes / report.time) * 1000))} positions/s`
            : ""}
        </span>
      </div>
      <dl className={styles.stats}>
        <div>
          <dt>Evaluation</dt>
          <dd>{report ? formatEval(report.scoreWhite) : "0.0"}</dd>
        </div>
        <div>
          <dt>Depth</dt>
          <dd>
            {report
              ? report.book
                ? "Book"
                : report.depth || "\u2013"
              : "\u2013"}
          </dd>
        </div>
        <div>
          <dt>Positions</dt>
          <dd>
            {report && report.nodes ? formatCount(report.nodes) : "\u2013"}
          </dd>
        </div>
      </dl>
      <p className={styles.pv}>
        {report?.book ? (
          <>
            <b>Opening book.</b> Playing a well-known line.
          </>
        ) : line ? (
          <>
            <b>Best line</b> {line}
          </>
        ) : (
          "The engine\u2019s best line appears here after it moves."
        )}
      </p>
    </section>
  );
});

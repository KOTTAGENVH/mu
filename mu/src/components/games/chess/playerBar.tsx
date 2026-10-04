import { memo } from "react";
import styles from "../../../css/chessGame.module.css";
import type { Color, PieceType } from "../../../lib/games/chess/types";
import { PieceIcon } from "./pieceIcon";

interface Props {
  color: Color;
  name: string;
  tag?: string;
  active: boolean;
  thinking?: string | null;
  captured: PieceType[];
  lead: number;
}

export const PlayerBar = memo(function PlayerBar({
  color,
  name,
  tag,
  active,
  thinking,
  captured,
  lead,
}: Props) {
  const opp: Color = color === "w" ? "b" : "w";
  return (
    <div className={`${styles.player} ${active ? styles.playerActive : ""}`}>
      <div className={styles.avatar}>
        <PieceIcon code={`${color}K`} />
      </div>
      <div className={styles.playerInfo}>
        <div className={styles.playerName}>
          <span>{name}</span>
          {tag && <span className={styles.tag}>{tag}</span>}
          {active && !thinking && (
            <span className={styles.toMove} aria-label="to move" />
          )}
        </div>
        {(captured.length > 0 || lead > 0) && (
          <div
            className={styles.captured}
            aria-label={`Captured ${captured.length} pieces${lead ? `, ahead by ${lead}` : ""}`}
          >
            {captured.map((t, i) => (
              <PieceIcon
                key={i}
                code={`${opp}${t}`}
                className={styles.capIcon}
              />
            ))}
            {lead > 0 && <span className={styles.lead}>+{lead}</span>}
          </div>
        )}
      </div>
      {thinking && (
        <div className={styles.thinking} role="status">
          <i />
          <i />
          <i />
          <span>{thinking}</span>
        </div>
      )}
    </div>
  );
});

import { memo } from "react";
import styles from "../../../css/chessGame.module.css";
import type { PieceCode } from "../../../lib/games/chess/types";
import { Modal } from "./modal";
import { PieceIcon } from "./pieceIcon";

interface Props {
  open: boolean;
  title: string;
  detail: string;
  icon: PieceCode;
  onNewGame: () => void;
  onReview: () => void;
  onClose: () => void;
}

export const GameOverDialog = memo(function GameOverDialog({
  open,
  title,
  detail,
  icon,
  onNewGame,
  onReview,
  onClose,
}: Props) {
  return (
    <Modal
      open={open}
      title={title}
      description={detail}
      onClose={onClose}
      icon={<PieceIcon code={icon} className={styles.resultIcon} />}
      footer={
        <>
          <button type="button" className={styles.btn} onClick={onReview}>
            Review game
          </button>
          <button
            type="button"
            className={`${styles.btn} ${styles.primary}`}
            data-autofocus
            onClick={onNewGame}
          >
            New game
          </button>
        </>
      }
    />
  );
});

import { memo } from "react";
import styles from "../../../../css/chessGame.module.css";
import { Modal } from "../modal";
import { RulesBook } from "./rulesBook";

export const RulesDialog = memo(function RulesDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Modal
      open={open}
      size="large"
      title="How to play chess"
      description="Everything you need to start playing, with examples."
      onClose={onClose}
      footer={
        <button
          type="button"
          className={`${styles.btn} ${styles.primary}`}
          onClick={onClose}
        >
          Got it
        </button>
      }
    >
      <RulesBook />
    </Modal>
  );
});

import { memo } from "react";
import styles from "../../../css/chessGame.module.css";

export const StatusPanel = memo(function StatusPanel({
  title,
  detail,
}: {
  title: string;
  detail: string;
}) {
  return (
    <div
      className={`${styles.card} ${styles.status}`}
      role="status"
      aria-live="polite"
    >
      <div className={styles.statusTitle}>{title}</div>
      <div className={styles.statusDetail}>{detail}</div>
    </div>
  );
});

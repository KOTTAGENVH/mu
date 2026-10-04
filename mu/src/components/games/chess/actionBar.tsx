import { memo } from "react";
import styles from "../../../css/chessGame.module.css";
import { Icon, type IconName } from "./icons";

export interface Action {
  id: string;
  label: string;
  icon: IconName;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}

export const ActionBar = memo(function ActionBar({
  actions,
}: {
  actions: Action[];
}) {
  return (
    <div
      className={`${styles.card} ${styles.actions}`}
      style={{
        gridTemplateColumns: `repeat(${actions.length}, minmax(0, 1fr))`,
      }}
    >
      {actions.map((a) => (
        <button
          key={a.id}
          type="button"
          className={`${styles.btn} ${styles.actionBtn} ${a.danger ? styles.danger : ""}`}
          disabled={a.disabled}
          onClick={a.onClick}
        >
          <Icon name={a.icon} />
          <span>{a.label}</span>
        </button>
      ))}
    </div>
  );
});

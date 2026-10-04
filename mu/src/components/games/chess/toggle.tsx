import { memo } from "react";
import styles from "../../../css/chessGame.module.css";

export const Toggle = memo(function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className={styles.toggle}
      onClick={() => onChange(!checked)}
    >
      <span className={styles.toggleText}>
        <b>{label}</b>
        {hint && <small>{hint}</small>}
      </span>
      <span className={styles.switch} aria-hidden="true" />
    </button>
  );
});

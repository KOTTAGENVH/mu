import { memo, useEffect, useRef, type ReactNode } from "react";
import styles from "../../../css/chessGame.module.css";
import { Icon } from "./icons";

interface Props {
  sans: string[];
  ply: number;
  reviewing: boolean;
  onSelect: (ply: number | null) => void;
  emptyText: string;
}

export const MoveList = memo(function MoveList({
  sans,
  ply,
  reviewing,
  onSelect,
  emptyText,
}: Props) {
  const listRef = useRef<HTMLOListElement>(null);
  const n = sans.length;

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const cur = list.querySelector<HTMLElement>('[aria-current="true"]');
    if (!cur) {
      list.scrollTop = list.scrollHeight;
      return;
    }
    const top = cur.offsetTop - list.offsetTop;
    if (
      top < list.scrollTop ||
      top > list.scrollTop + list.clientHeight - cur.offsetHeight
    )
      list.scrollTop = top - list.clientHeight / 2;
  }, [ply, n]);

  const rows: ReactNode[] = [];
  for (let i = 0; i < n; i += 2) {
    const cell = (k: number) =>
      k < n ? (
        <button
          type="button"
          className={ply === k + 1 ? styles.moveCurrent : undefined}
          aria-current={ply === k + 1 ? "true" : undefined}
          onClick={() => onSelect(k + 1)}
        >
          {sans[k]}
        </button>
      ) : (
        <span />
      );
    rows.push(
      <li key={i}>
        <span className={styles.moveNo}>{i / 2 + 1}.</span>
        {cell(i)}
        {cell(i + 1)}
      </li>,
    );
  }

  return (
    <section
      className={`${styles.card} ${styles.movesCard}`}
      aria-label="Moves"
    >
      <div className={styles.cardHead}>
        <h2>Moves</h2>
        <div className={styles.nav}>
          <button
            type="button"
            className={styles.iconBtn}
            aria-label="First position"
            disabled={ply === 0}
            onClick={() => onSelect(0)}
          >
            <Icon name="first" />
          </button>
          <button
            type="button"
            className={styles.iconBtn}
            aria-label="Previous move"
            disabled={ply === 0}
            onClick={() => onSelect(ply - 1)}
          >
            <Icon name="prev" />
          </button>
          <button
            type="button"
            className={styles.iconBtn}
            aria-label="Next move"
            disabled={ply === n}
            onClick={() => onSelect(ply + 1)}
          >
            <Icon name="next" />
          </button>
          <button
            type="button"
            className={styles.iconBtn}
            aria-label="Latest move"
            disabled={ply === n}
            onClick={() => onSelect(null)}
          >
            <Icon name="last" />
          </button>
        </div>
      </div>
      <ol ref={listRef} className={styles.moveList}>
        {n === 0 ? <li className={styles.movesEmpty}>{emptyText}</li> : rows}
      </ol>
      {reviewing && (
        <div className={styles.review}>
          <span>
            {ply === 0
              ? "Viewing the starting position"
              : `Viewing move ${Math.ceil(ply / 2)}${ply % 2 ? "" : "\u2026"}`}
          </span>
          <button
            type="button"
            className={styles.btn}
            onClick={() => onSelect(null)}
          >
            Back to game
          </button>
        </div>
      )}
    </section>
  );
});

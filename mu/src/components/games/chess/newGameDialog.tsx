import { memo, useEffect, useState } from "react";
import styles from "../../../css/chessGame.module.css";
import { levels } from "@/engines/chess/levels";
import type {
  Color,
  GameConfig,
  GameMode,
} from "../../../lib/games/chess/types";
import { Icon } from "./icons";
import { Modal } from "./modal";
import { PieceIcon } from "./pieceIcon";
import { Toggle } from "./toggle";

export type SideChoice = Color | "random";

interface Props {
  open: boolean;
  initial: GameConfig;
  autoRotate: boolean;
  canCancel: boolean;
  onStart: (
    mode: GameMode,
    side: SideChoice,
    level: number,
    autoRotate: boolean,
  ) => void;
  onClose: () => void;
  onShowRules: () => void;
}

export const NewGameDialog = memo(function NewGameDialog({
  open,
  initial,
  autoRotate,
  canCancel,
  onStart,
  onClose,
  onShowRules,
}: Props) {
  const [mode, setMode] = useState<GameMode>(initial.mode);
  const [side, setSide] = useState<SideChoice>(initial.humanColor);
  const [level, setLevel] = useState(initial.level);
  const [rotate, setRotate] = useState(autoRotate);

  useEffect(() => {
    if (!open) return;
    setMode(initial.mode);
    setSide(initial.humanColor);
    setLevel(initial.level);
    setRotate(autoRotate);
  }, [open, initial, autoRotate]);

  return (
    <Modal
      open={open}
      title="New game"
      description="Play the computer, or two players on one device."
      onClose={canCancel ? onClose : undefined}
      footer={
        <>
          {canCancel && (
            <button type="button" className={styles.btn} onClick={onClose}>
              Cancel
            </button>
          )}
          <button
            type="button"
            className={`${styles.btn} ${styles.primary}`}
            data-autofocus
            onClick={() => onStart(mode, side, level, rotate)}
          >
            Start game
          </button>
        </>
      }
    >
      <div className={styles.field}>
        <div className={styles.fieldLabel} id="ng-mode">
          Opponent
        </div>
        <div
          className={styles.modeCards}
          role="radiogroup"
          aria-labelledby="ng-mode"
        >
          <button
            type="button"
            role="radio"
            aria-checked={mode === "computer"}
            className={styles.modeCard}
            onClick={() => setMode("computer")}
          >
            <Icon name="cpu" />
            <b>Computer</b>
            <span>Six strength levels</span>
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={mode === "local"}
            className={styles.modeCard}
            onClick={() => setMode("local")}
          >
            <Icon name="people" />
            <b>Two players</b>
            <span>Same device, take turns</span>
          </button>
        </div>
      </div>

      {mode === "computer" ? (
        <>
          <div className={styles.field}>
            <div className={styles.fieldLabel} id="ng-side">
              Play as
            </div>
            <div
              className={styles.seg}
              role="radiogroup"
              aria-labelledby="ng-side"
            >
              {(["w", "random", "b"] as SideChoice[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  role="radio"
                  aria-checked={side === s}
                  onClick={() => setSide(s)}
                >
                  {s === "random" ? (
                    <Icon name="random" />
                  ) : (
                    <PieceIcon code={`${s}K`} />
                  )}
                  {s === "w" ? "White" : s === "b" ? "Black" : "Random"}
                </button>
              ))}
            </div>
          </div>
          <div className={styles.field}>
            <div className={styles.fieldLabel} id="ng-level">
              Strength
            </div>
            <div
              className={styles.levels}
              role="radiogroup"
              aria-labelledby="ng-level"
            >
              {levels.map((l, i) => (
                <button
                  key={l.name}
                  type="button"
                  role="radio"
                  aria-checked={level === i}
                  className={styles.level}
                  onClick={() => setLevel(i)}
                >
                  <span className={styles.pips} aria-hidden="true">
                    {levels.map((_, k) => (
                      <i
                        key={k}
                        className={k <= i ? styles.pipOn : undefined}
                      />
                    ))}
                  </span>
                  <span className={styles.levelText}>
                    <b>{l.name}</b>
                    <span>{l.description}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className={styles.field}>
          <Toggle
            label="Turn the board each move"
            hint="The side to move is always at the bottom. Best when passing one phone or tablet back and forth."
            checked={rotate}
            onChange={setRotate}
          />
        </div>
      )}
      <button type="button" className={styles.linkBtn} onClick={onShowRules}>
        <Icon name="book" />
        New to chess? Learn how to play
      </button>
    </Modal>
  );
});

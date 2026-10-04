import { memo } from "react";
import styles from "../../../css/chessGame.module.css";
import type {
  BoardTheme,
  GameMode,
  Settings,
} from "../../../lib/games/chess/types";
import { Modal } from "./modal";
import { Toggle } from "./toggle";

export const boardThemes: {
  id: BoardTheme;
  name: string;
  light: string;
  dark: string;
}[] = [
  { id: "slate", name: "Slate", light: "#DCE3EB", dark: "#7C8EA6" },
  { id: "walnut", name: "Walnut", light: "#ECD9B8", dark: "#A97B52" },
  { id: "emerald", name: "Emerald", light: "#E6ECDE", dark: "#6B9678" },
  { id: "graphite", name: "Graphite", light: "#D3D7DD", dark: "#6D737D" },
];

interface Props {
  open: boolean;
  settings: Settings;
  mode: GameMode;
  onChange: (patch: Partial<Settings>) => void;
  onClose: () => void;
}

export const SettingsDialog = memo(function SettingsDialog({
  open,
  settings,
  mode,
  onChange,
  onClose,
}: Props) {
  return (
    <Modal
      open={open}
      title="Settings"
      description="Changes apply right away and are saved on this device."
      onClose={onClose}
      footer={
        <button
          type="button"
          className={`${styles.btn} ${styles.primary}`}
          onClick={onClose}
        >
          Done
        </button>
      }
    >
      <div className={styles.field}>
        <div className={styles.fieldLabel} id="st-theme">
          Board
        </div>
        <div
          className={styles.swatches}
          role="radiogroup"
          aria-labelledby="st-theme"
        >
          {boardThemes.map((t) => (
            <button
              key={t.id}
              type="button"
              role="radio"
              aria-checked={settings.theme === t.id}
              className={styles.swatch}
              onClick={() => onChange({ theme: t.id })}
            >
              <span className={styles.mini} aria-hidden="true">
                <i style={{ background: t.light }} />
                <i style={{ background: t.dark }} />
                <i style={{ background: t.dark }} />
                <i style={{ background: t.light }} />
              </span>
              {t.name}
            </button>
          ))}
        </div>
      </div>
      <div className={styles.toggleList}>
        <Toggle
          label="Move sounds"
          checked={settings.sound}
          onChange={(v) => onChange({ sound: v })}
        />
        <Toggle
          label="Show legal moves"
          checked={settings.showLegalMoves}
          onChange={(v) => onChange({ showLegalMoves: v })}
        />
        <Toggle
          label="Show coordinates"
          checked={settings.coordinates}
          onChange={(v) => onChange({ coordinates: v })}
        />
        {mode === "computer" && (
          <Toggle
            label="Show evaluation"
            hint="Evaluation bar and engine analysis."
            checked={settings.showEvaluation}
            onChange={(v) => onChange({ showEvaluation: v })}
          />
        )}
        {mode === "local" && (
          <Toggle
            label="Turn the board each move"
            hint="Keeps the side to move at the bottom."
            checked={settings.autoRotate}
            onChange={(v) => onChange({ autoRotate: v })}
          />
        )}
      </div>
    </Modal>
  );
});

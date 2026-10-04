import {
  memo,
  useEffect,
  useRef,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import styles from "../../../../src/css/chessGame.module.css";
import type { PromotionChoice } from "@/hooks/useBoardInteraction";
import type { Color, PieceType } from "@/lib/games/chess/types";
import { promotionLabel } from "@/lib/games/chess/pieces";
import { viewPosition } from "@/lib/games/chess/squares";
import { PieceIcon } from "./pieceIcon";

const promotionOrder: PieceType[] = ["Q", "N", "R", "B"];

interface Props {
  choice: PromotionChoice;
  bottom: Color;
  onChoose: (m: number) => void;
  onCancel: () => void;
}

export const PromotionPicker = memo(function PromotionPicker({
  choice,
  bottom,
  onChoose,
  onCancel,
}: Props) {
  const first = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    first.current?.focus();
  }, []);
  const pos = viewPosition(choice.to, bottom);
  const fromTop = pos.row === 0;
  return (
    <>
      <div
        className={styles.promoCover}
        onPointerDown={(e: PointerEvent<HTMLDivElement>) => {
          e.stopPropagation();
          onCancel();
        }}
      />
      <div
        className={styles.promo}
        role="dialog"
        aria-label="Choose a piece for promotion"
        style={{
          left: `${pos.col * 12.5}%`,
          top: fromTop ? 0 : "auto",
          bottom: fromTop ? "auto" : 0,
        }}
        onPointerDown={(e: PointerEvent<HTMLDivElement>) => e.stopPropagation()}
        onKeyDown={(e: KeyboardEvent<HTMLDivElement>) => {
          if (e.key === "Escape") {
            e.stopPropagation();
            onCancel();
          }
        }}
      >
        {promotionOrder.map((t, i) => {
          const m = choice.options[t];
          if (m === undefined) return null;
          return (
            <button
              key={t}
              ref={i === 0 ? first : undefined}
              type="button"
              aria-label={`Promote to ${promotionLabel(t)}`}
              onClick={() => onChoose(m)}
            >
              <PieceIcon code={`${choice.color}${t}`} />
            </button>
          );
        })}
      </div>
    </>
  );
});

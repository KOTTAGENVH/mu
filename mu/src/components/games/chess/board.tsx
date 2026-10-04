import { memo, useCallback, useId, useMemo, useRef } from "react";
import styles from "../../../css/chessGame.module.css";
import type { DecodedMove } from "@/engines/chess/engine";
import { useBoardInteraction } from "@/hooks/useBoardInteraction";
import type {
  BoardPiece,
  BoardTheme,
  Color,
} from "../../../lib/games/chess/types";
import { pieceLabel } from "@/lib/games/chess/pieces";
import {
  fileLetters,
  isLightSquare,
  screenOrder,
  squareName,
} from "../../../lib/games/chess/squares";
import { HintArrow } from "./hintArrow";
import { PieceLayer } from "./pieceLayer";
import { PromotionPicker } from "./promotionPicker";
import { squareFlags, Square } from "./square";

export interface BoardProps {
  pieces: BoardPiece[];
  bottom: Color;
  theme: BoardTheme;
  coordinates: boolean;
  showLegalMoves: boolean;
  lastMove: [number, number] | null;
  checkSquare: number;
  hint: string | null;
  legal: number[];
  movable: Color | null;
  decode: (m: number) => DecodedMove;
  onMove: (m: number) => void;
  onBlocked?: () => void;
  onInteract?: () => void;
  label: string;
}

const rows = [0, 1, 2, 3, 4, 5, 6, 7];

export const Board = memo(function Board(p: BoardProps) {
  const boardRef = useRef<HTMLDivElement>(null);
  const pieceEls = useRef(new Map<number, HTMLDivElement>());
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const register = useCallback((id: number, el: HTMLDivElement | null) => {
    if (el) pieceEls.current.set(id, el);
    else pieceEls.current.delete(id);
  }, []);
  const getPieceElement = useCallback(
    (id: number) => pieceEls.current.get(id),
    [],
  );

  const ix = useBoardInteraction({
    boardRef,
    pieces: p.pieces,
    bottom: p.bottom,
    legal: p.legal,
    movable: p.movable,
    decode: p.decode,
    getPieceElement,
    draggingClass: styles.dragging,
    onMove: p.onMove,
    onBlocked: p.onBlocked,
    onInteract: p.onInteract,
  });

  const order = useMemo(() => screenOrder(p.bottom), [p.bottom]);
  const codeAt = useMemo(() => {
    const map = new Map<number, BoardPiece["code"]>();
    for (const piece of p.pieces) map.set(piece.sq, piece.code);
    return map;
  }, [p.pieces]);

  const flagsFor = (sq: number): number => {
    let f = isLightSquare(sq) ? 0 : squareFlags.dark;
    if (p.lastMove && (sq === p.lastMove[0] || sq === p.lastMove[1]))
      f |= squareFlags.last;
    if (sq === ix.selected) f |= squareFlags.selected;
    if (sq === p.checkSquare) f |= squareFlags.check;
    if (p.showLegalMoves && ix.targets.has(sq))
      f |= squareFlags.target | (ix.targets.get(sq) ? squareFlags.capture : 0);
    if (sq === ix.hover) f |= squareFlags.hover;
    if (sq === ix.cursor) f |= squareFlags.cursor;
    return f;
  };

  return (
    <div
      ref={boardRef}
      className={styles.board}
      data-theme={p.theme}
      data-coords={p.coordinates ? "on" : "off"}
      role="grid"
      tabIndex={0}
      aria-label={p.label}
      aria-activedescendant={ix.cursor >= 0 ? `${uid}-${ix.cursor}` : undefined}
      {...ix.handlers}
    >
      <div className={styles.squares}>
        {rows.map((row) => (
          <div key={row} role="row" className={styles.boardRow}>
            {order.slice(row * 8, row * 8 + 8).map((sq, col) => {
              const code = codeAt.get(sq);
              return (
                <Square
                  key={sq}
                  domId={`${uid}-${sq}`}
                  flags={flagsFor(sq)}
                  label={`${squareName(sq)}${code ? ", " + pieceLabel(code) : ""}`}
                  rankLabel={col === 0 ? String((sq >> 4) + 1) : undefined}
                  fileLabel={row === 7 ? fileLetters[sq & 7] : undefined}
                />
              );
            })}
          </div>
        ))}
      </div>
      <PieceLayer pieces={p.pieces} bottom={p.bottom} register={register} />
      <HintArrow uci={p.hint} bottom={p.bottom} />
      {ix.promotion && (
        <PromotionPicker
          choice={ix.promotion}
          bottom={p.bottom}
          onChoose={ix.choosePromotion}
          onCancel={ix.cancelPromotion}
        />
      )}
    </div>
  );
});

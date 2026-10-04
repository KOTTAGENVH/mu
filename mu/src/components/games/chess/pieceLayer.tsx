import { memo, useCallback } from "react";
import styles from "../../../css/chessGame.module.css";
import { pieceTransform } from "@/hooks/useBoardInteraction";
import type {
  BoardPiece,
  Color,
  PieceCode,
} from "../../../lib/games/chess/types";
import { viewPosition } from "@/lib/games/chess/squares";
import { PieceIcon } from "./pieceIcon";

type Register = (id: number, el: HTMLDivElement | null) => void;

const Piece = memo(function Piece({
  id,
  code,
  col,
  row,
  register,
}: {
  id: number;
  code: PieceCode;
  col: number;
  row: number;
  register: Register;
}) {
  const ref = useCallback(
    (el: HTMLDivElement | null) => register(id, el),
    [id, register],
  );
  return (
    <div
      ref={ref}
      className={styles.piece}
      style={{ transform: pieceTransform(col, row) }}
    >
      <PieceIcon code={code} />
    </div>
  );
});

export const PieceLayer = memo(function PieceLayer({
  pieces,
  bottom,
  register,
}: {
  pieces: BoardPiece[];
  bottom: Color;
  register: Register;
}) {
  return (
    <div className={styles.pieces} aria-hidden="true">
      {pieces.map((p) => {
        const v = viewPosition(p.sq, bottom);
        return (
          <Piece
            key={p.id}
            id={p.id}
            code={p.code}
            col={v.col}
            row={v.row}
            register={register}
          />
        );
      })}
    </div>
  );
});

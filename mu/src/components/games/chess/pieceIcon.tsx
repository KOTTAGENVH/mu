import { memo } from "react";
import type { PieceCode } from "../../../lib/games/chess/types";
import { pieceIdPrefix } from "./pieceDefs";

export const PieceIcon = memo(function PieceIcon({
  code,
  className,
}: {
  code: PieceCode;
  className?: string;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 100 100"
      aria-hidden="true"
      focusable="false"
    >
      <use href={`#${pieceIdPrefix}${code}`} />
    </svg>
  );
});

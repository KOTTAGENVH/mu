import type { Color, PieceType } from "./types";
import { pieceTypeLetters, pieceValue } from "./pieces";

const startingCounts: Record<Exclude<PieceType, "K">, number> = {
  Q: 1,
  R: 2,
  B: 2,
  N: 2,
  P: 8,
};
const capturedOrder: Exclude<PieceType, "K">[] = ["Q", "R", "B", "N", "P"];

export interface MaterialSummary {
  captured: Record<Color, PieceType[]>;
  lead: Record<Color, number>;
}

export function summarizeMaterial(board: Int8Array): MaterialSummary {
  const count: Record<Color, Record<string, number>> = {
    w: { Q: 0, R: 0, B: 0, N: 0, P: 0 },
    b: { Q: 0, R: 0, B: 0, N: 0, P: 0 },
  };
  const total: Record<Color, number> = { w: 0, b: 0 };
  for (let sq = 0; sq < 128; sq++) {
    if (sq & 0x88) {
      sq += 7;
      continue;
    }
    const p = board[sq];
    if (!p || (p & 7) === 6) continue;
    const c: Color = p & 8 ? "b" : "w",
      t = pieceTypeLetters[p & 7] as PieceType;
    count[c][t]++;
    total[c] += pieceValue[t];
  }
  const missing = (victim: Color): PieceType[] => {
    const out: PieceType[] = [];
    for (const t of capturedOrder)
      for (
        let i = Math.max(0, startingCounts[t] - count[victim][t]);
        i > 0;
        i--
      )
        out.push(t);
    return out;
  };
  return {
    captured: { w: missing("b"), b: missing("w") },
    lead: {
      w: Math.max(0, total.w - total.b),
      b: Math.max(0, total.b - total.w),
    },
  };
}

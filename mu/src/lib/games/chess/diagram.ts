import type { PieceCode, PieceType } from "./types";
import { squareFromName, squareName } from "./squares";

export type DiagramPosition = Readonly<Record<string, PieceCode>>;

const fenPieceCodes: Record<string, PieceCode> = {
  P: "wP",
  N: "wN",
  B: "wB",
  R: "wR",
  Q: "wQ",
  K: "wK",
  p: "bP",
  n: "bN",
  b: "bB",
  r: "bR",
  q: "bQ",
  k: "bK",
};

export function positionFromFen(fen: string): DiagramPosition {
  const out: Record<string, PieceCode> = {};
  fen
    .split(" ")[0]
    .split("/")
    .forEach((row, i) => {
      let file = 0;
      for (const ch of row) {
        if (ch >= "1" && ch <= "8") {
          file += Number(ch);
          continue;
        }
        out["abcdefgh"[file] + (8 - i)] = fenPieceCodes[ch];
        file++;
      }
    });
  return out;
}

const pieceSteps: Record<PieceType, number[]> = {
  K: [1, -1, 16, -16, 17, 15, -17, -15],
  Q: [1, -1, 16, -16, 17, 15, -17, -15],
  R: [1, -1, 16, -16],
  B: [17, 15, -17, -15],
  N: [33, 31, 18, 14, -33, -31, -18, -14],
  P: [],
};

export function reachableSquares(
  position: DiagramPosition,
  from: string,
): { moves: string[]; captures: string[] } {
  const piece = position[from];
  const moves: string[] = [],
    captures: string[] = [];
  if (!piece) return { moves, captures };
  const color = piece[0],
    type = piece[1] as PieceType,
    start = squareFromName(from);
  const at = (sq: number) => position[squareName(sq)];
  const visit = (sq: number): boolean => {
    if (sq & 0x88) return false;
    const other = at(sq);
    if (!other) {
      moves.push(squareName(sq));
      return true;
    }
    if (other[0] !== color) captures.push(squareName(sq));
    return false;
  };
  if (type === "P") {
    const dir = color === "w" ? 16 : -16,
      home = color === "w" ? 1 : 6;
    const one = start + dir;
    if (!(one & 0x88) && !at(one)) {
      moves.push(squareName(one));
      const two = one + dir;
      if (start >> 4 === home && !at(two)) moves.push(squareName(two));
    }
    for (const side of [-1, 1]) {
      const t = start + dir + side;
      if (!(t & 0x88) && at(t) && at(t)![0] !== color)
        captures.push(squareName(t));
    }
  } else if (type === "K" || type === "N") {
    for (const step of pieceSteps[type]) visit(start + step);
  } else {
    for (const step of pieceSteps[type]) {
      let sq = start + step;
      while (visit(sq)) sq += step;
    }
  }
  return { moves, captures };
}

import type { Color, PieceCode, PieceType } from "./types";

export const pieceTypeLetters = " PNBRQK";
const pieceNames: Record<PieceType, string> = {
  P: "pawn",
  N: "knight",
  B: "bishop",
  R: "rook",
  Q: "queen",
  K: "king",
};
export const pieceValue: Record<PieceType, number> = {
  P: 1,
  N: 3,
  B: 3,
  R: 5,
  Q: 9,
  K: 0,
};

export function pieceCode(p: number): PieceCode | null {
  if (!p) return null;
  return ((p & 8 ? "b" : "w") + pieceTypeLetters[p & 7]) as PieceCode;
}
export const colorOf = (code: PieceCode): Color => code[0] as Color;
export const typeOf = (code: PieceCode): PieceType => code[1] as PieceType;
export const colorName = (c: Color): string => (c === "w" ? "White" : "Black");
export const opposite = (c: Color): Color => (c === "w" ? "b" : "w");
export const pieceLabel = (code: PieceCode): string =>
  `${colorName(colorOf(code)).toLowerCase()} ${pieceNames[typeOf(code)]}`;
export const promotionLabel = (t: PieceType): string => pieceNames[t];

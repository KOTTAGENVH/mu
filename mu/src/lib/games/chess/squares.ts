import type { Color } from "./types";

export const fileLetters = "abcdefgh";

export const fileOf = (sq: number): number => sq & 7;
export const rankOf = (sq: number): number => sq >> 4;
export const squareName = (sq: number): string =>
  fileLetters[sq & 7] + ((sq >> 4) + 1);
export const squareFromName = (name: string): number =>
  (name.charCodeAt(1) - 49) * 16 + (name.charCodeAt(0) - 97);
export const isLightSquare = (sq: number): boolean =>
  (((sq >> 4) + (sq & 7)) & 1) === 1;

export const allSquares: readonly number[] = Array.from(
  { length: 64 },
  (_, i) => (i >> 3) * 16 + (i & 7),
);

export function viewPosition(
  sq: number,
  bottom: Color,
): { col: number; row: number } {
  const f = sq & 7,
    r = sq >> 4;
  return bottom === "b" ? { col: 7 - f, row: r } : { col: f, row: 7 - r };
}

export function squareAt(col: number, row: number, bottom: Color): number {
  return bottom === "b" ? row * 16 + (7 - col) : (7 - row) * 16 + col;
}

export function screenOrder(bottom: Color): number[] {
  const out: number[] = [];
  for (let row = 0; row < 8; row++)
    for (let col = 0; col < 8; col++) out.push(squareAt(col, row, bottom));
  return out;
}

export function uciSquares(uci: string): [number, number] {
  return [squareFromName(uci.slice(0, 2)), squareFromName(uci.slice(2, 4))];
}

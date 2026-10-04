export const empty = 0;
export const pawn = 1;
export const knight = 2;
export const bishop = 3;
export const rook = 4;
export const queen = 5;
export const king = 6;
export const white = 0;
export const black = 8;

export const typeOf = (piece: number): number => piece & 7;
export const colorOf = (piece: number): number => piece & 8;
export const colorIndex = (color: number): number => color >> 3;
export const opponentOf = (color: number): number => color ^ 8;

// ---------- squares ----------
export const boardSize = 128;
export const noSquare = -1;
export const isOffBoard = (square: number): boolean => (square & 0x88) !== 0;
export const rankOf = (square: number): number => square >> 4;
export const fileOf = (square: number): number => square & 7;

// Squares used by castling.
export const a1 = 0, b1 = 1, c1 = 2, d1 = 3, e1 = 4, f1 = 5, g1 = 6, h1 = 7;
export const a8 = 112, b8 = 113, c8 = 114, d8 = 115, e8 = 116, f8 = 117, g8 = 118, h8 = 119;

export const up = 16;
export const down = -16;

// ---------- castling rights (bit flags) ----------
export const castleWhiteKingside = 1;
export const castleWhiteQueenside = 2;
export const castleBlackKingside = 4;
export const castleBlackQueenside = 8;
export const allCastling = 15;

// ---------- move encoding ----------
export const flagCapture = 1;
export const flagEnPassant = 2;
export const flagCastle = 4;
export const flagDoublePush = 8;

export const encodeMove = (from: number, to: number, promotion: number, flags: number): number =>
  from | (to << 7) | (promotion << 14) | (flags << 17);
export const moveFrom = (move: number): number => move & 127;
export const moveTo = (move: number): number => (move >> 7) & 127;
export const movePromotion = (move: number): number => (move >> 14) & 7;
export const moveFlags = (move: number): number => move >> 17;

// ---------- movement directions (as 0x88 square offsets) ----------
export const knightJumps: readonly number[] = [33, 31, 18, 14, -33, -31, -18, -14];
export const allDirections: readonly number[] = [1, -1, 16, -16, 17, 15, -17, -15];
export const diagonals: readonly number[] = [17, 15, -17, -15];
export const straightLines: readonly number[] = [1, -1, 16, -16];

// ---------- search ----------
export const maxPly = 96;
export const movesPerPly = 256;
export const infinityScore = 32000;
export const mateScore = 30000;
export const mateThreshold = 29000;

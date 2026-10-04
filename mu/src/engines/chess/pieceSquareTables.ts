/**
 * Evaluation data: the engine's chess knowledge.
 *
 * All values are in centipawns (100 = one pawn). For every piece on the board, evaluate() adds
 * the piece's value plus its bonus from the table for its square, totals White and Black, and
 * subtracts. That difference (after the search looks ahead) is the evaluation and the bar.
 */

/**
 * What each piece type is worth, indexed by piece type:
 * [empty, pawn, knight, bishop, rook, queen, king]
 * The king's value only means "can never be traded": losing it ends the game.
 * Used for move ordering and quick capture checks; evaluate() uses the same base values.
 */

export const pieceValues: readonly number[] = [
  0, 100, 320, 330, 500, 950, 20000,
];

/*
 * Piece square tables: a bonus (+) or penalty (-) for a piece standing on each square.
 *
 * Each table is the board seen from White's side, one row per rank:
 *   first row = rank 8 (a8 … h8), last row = rank 1 (a1 … h1).
 * Black reads the same tables mirrored, so both sides get the same bonuses.
 */

/** Pawns: big bonus on rank 7 (about to promote), bonus for central pawns on d4/e4,
 *  penalty for central pawns still on d2/e2 (they should advance to free the other pieces). */

export const pawnTable: readonly number[] = [
   0,   0,   0,   0,   0,   0,   0,   0,  // rank 8 (pawns never stand here: they promote)
  50,  50,  50,  50,  50,  50,  50,  50,  // rank 7
  10,  10,  20,  30,  30,  20,  10,  10,  // rank 6
   5,   5,  10,  25,  25,  10,   5,   5,  // rank 5
   0,   0,   0,  22,  22,   0,   0,   0,  // rank 4
   5,  -5, -10,   0,   0, -10,  -5,   5,  // rank 3
   5,  10,  10, -22, -22,  10,  10,   5,  // rank 2 (starting rank)
   0,   0,   0,   0,   0,   0,   0,   0,  // rank 1 (pawns never stand here)
];

/** Knights: strong in the centre (they reach 8 squares), weak on the edge and in the corners
 *  (only 2-4 squares). "A knight on the rim is dim." */
export const knightTable: readonly number[] = [
  -50, -40, -30, -30, -30, -30, -40, -50,  // rank 8
  -40, -20,   0,   0,   0,   0, -20, -40,  // rank 7
  -30,   0,  10,  15,  15,  10,   0, -30,  // rank 6
  -30,   5,  15,  20,  20,  15,   5, -30,  // rank 5
  -30,   0,  15,  20,  20,  15,   0, -30,  // rank 4
  -30,   5,  10,  15,  15,  10,   5, -30,  // rank 3
  -40, -20,   0,   5,   5,   0, -20, -40,  // rank 2
  -50, -40, -30, -30, -30, -30, -40, -50,  // rank 1
];

/** Bishops: prefer central squares and long open diagonals; avoid edges and corners. */
export const bishopTable: readonly number[] = [
  -20, -10, -10, -10, -10, -10, -10, -20,  // rank 8
  -10,   0,   0,   0,   0,   0,   0, -10,  // rank 7
  -10,   0,   5,  10,  10,   5,   0, -10,  // rank 6
  -10,   5,   5,  10,  10,   5,   5, -10,  // rank 5
  -10,   0,  10,  10,  10,  10,   0, -10,  // rank 4
  -10,  10,  10,  10,  10,  10,  10, -10,  // rank 3
  -10,   5,   0,   0,   0,   0,   5, -10,  // rank 2
  -20, -10, -10, -10, -10, -10, -10, -20,  // rank 1
];
 
/** Rooks: bonus on rank 7 (attacking the enemy pawns), small bonus for the central d1/e1
 *  squares, small penalty on the edge files. Open files are rewarded separately in evaluate(). */
export const rookTable: readonly number[] = [
   0,   0,   0,   0,   0,   0,   0,   0,  // rank 8
   5,  10,  10,  10,  10,  10,  10,   5,  // rank 7
  -5,   0,   0,   0,   0,   0,   0,  -5,  // rank 6
  -5,   0,   0,   0,   0,   0,   0,  -5,  // rank 5
  -5,   0,   0,   0,   0,   0,   0,  -5,  // rank 4
  -5,   0,   0,   0,   0,   0,   0,  -5,  // rank 3
  -5,   0,   0,   0,   0,   0,   0,  -5,  // rank 2
   0,   0,   0,   5,   5,   0,   0,   0,  // rank 1
];

/** Queen: a mild preference for the centre; the queen is strong almost anywhere. */
export const queenTable: readonly number[] = [
  -20, -10, -10,  -5,  -5, -10, -10, -20,  // rank 8
  -10,   0,   0,   0,   0,   0,   0, -10,  // rank 7
  -10,   0,   5,   5,   5,   5,   0, -10,  // rank 6
   -5,   0,   5,   5,   5,   5,   0,  -5,  // rank 5
    0,   0,   5,   5,   5,   5,   0,  -5,  // rank 4
  -10,   5,   5,   5,   5,   5,   0, -10,  // rank 3
  -10,   0,   5,   0,   0,   0,   0, -10,  // rank 2
  -20, -10, -10,  -5,  -5, -10, -10, -20,  // rank 1
];

/** King in the middlegame: hide. Best on g1/b1 (the castled squares, behind a wall of pawns);
 *  the centre and the enemy half are dangerous while many enemy pieces are still on the board. */
export const kingMiddlegameTable: readonly number[] = [
  -30, -40, -40, -50, -50, -40, -40, -30,  // rank 8
  -30, -40, -40, -50, -50, -40, -40, -30,  // rank 7
  -30, -40, -40, -50, -50, -40, -40, -30,  // rank 6
  -30, -40, -40, -50, -50, -40, -40, -30,  // rank 5
  -20, -30, -30, -40, -40, -30, -30, -20,  // rank 4
  -10, -20, -20, -20, -20, -20, -20, -10,  // rank 3
   20,  20,   0,   0,   0,   0,  20,  20,  // rank 2
   20,  30,  10,   0,   0,  10,  30,  20,  // rank 1
];

/** King in the endgame: the opposite. With few pieces left the king is safe, and it becomes a
 *  strong fighting piece in the centre; corners are bad. */
export const kingEndgameTable: readonly number[] = [
  -50, -40, -30, -20, -20, -30, -40, -50,  // rank 8
  -30, -20, -10,   0,   0, -10, -20, -30,  // rank 7
  -30, -10,  20,  30,  30,  20, -10, -30,  // rank 6
  -30, -10,  30,  40,  40,  30, -10, -30,  // rank 5
  -30, -10,  30,  40,  40,  30, -10, -30,  // rank 4
  -30, -10,  20,  30,  30,  20, -10, -30,  // rank 3
  -30, -30,   0,   0,   0,   0, -30, -30,  // rank 2
  -50, -30, -30, -30, -30, -30, -30, -50,  // rank 1
];

/*
 * Pawn bonuses by how far a pawn has advanced from its own side (index 0-7).
 * The last value is 0 because a pawn never stands on the final rank: it has already promoted.
 */
/** Endgame: the closer a pawn is to promoting, the more it is worth. */
export const pawnAdvanceEndgame: readonly number[] = [0, 5, 10, 20, 35, 60, 100, 0];
 
/** Passed pawn (no enemy pawn can block or capture it), middlegame bonus. */
export const passedPawnMiddlegame: readonly number[] = [0, 5, 10, 15, 25, 40, 60, 0];
 
/** Passed pawn, endgame bonus: bigger, because few pieces are left to stop it. */
export const passedPawnEndgame: readonly number[] = [0, 10, 20, 35, 60, 100, 150, 0];

/**
 * Game phase, used to blend the middlegame and endgame scores.
 * Knights and bishops count 1, rooks 2, queens 4: 4 + 4 + 8 + 8 = 24 with all pieces on the board.
 * As pieces are traded the phase falls towards 0, and the endgame score takes over.
 */
export const maxPhase = 24;

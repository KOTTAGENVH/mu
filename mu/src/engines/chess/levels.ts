import type { SearchOptions } from './engine';

export interface Level {
  name: string;
  description: string;
  search: SearchOptions;
  useBook: boolean;
}

/**
 * Strength levels.
 *
 * search.depth  – how many turns ahead to look. 1 = my move only, 2 = my move and their reply,
 *                 3 = adds my next move, and so on. Captures that follow are always played out
 *                 afterwards (quiescence), so even depth 1 sees "if I take, they take back".
 * search.noise  – random amount added to every move's score, in centipawns (100 = one pawn).
 *                 Each move gets a random bonus or penalty between -noise and +noise, so the
 *                 engine sometimes prefers a worse move, like a human mistake.
 * search.random – chance (0 to 1) of ignoring the search and playing a completely random legal move.
 * search.time   – thinking time in milliseconds. The engine searches depth 1, 2, 3... until the
 *                 time is up, and plays the best move from the deepest search it finished.
 *                 (It won't start a new depth after half the time has passed, so moves often
 *                 come a little sooner than the limit.)
 * useBook       – play the first few moves from the opening book (well known strong opening moves)
 *                 instead of thinking.
 */

export const levels: readonly Level[] = [
  // Looks only at its own move. Adds up to ±2.2 pawns of noise, so it can give away pieces,
  // and 1 in 4 moves is completely random. No opening book: its openings look like a beginner's.
  { name: 'Novice', description: 'Frequent mistakes. Good for learning.', search: { depth: 1, noise: 220, random: 0.25 }, useBook: false },

  // Sees your direct reply to its move, so it notices simple threats. ±0.9 pawns of noise
  // still makes it miss tactics and drop pawns. No random moves, no opening book.
  { name: 'Casual', description: 'Spots simple threats, misses tactics.', search: { depth: 2, noise: 90 }, useBook: false },

  // Looks 3 turns ahead (its move, your reply, its next move), enough to win pieces you leave
  // unprotected. Small noise (±0.25 pawns) only matters when moves are nearly equal. No opening book.
  { name: 'Club', description: 'Solid play that punishes loose pieces.', search: { depth: 3, noise: 25 }, useBook: false },

  // Full strength search with no noise: as deep as it gets in 1 second. Uses the opening book.
  { name: 'Expert', description: 'Full search, about 1 second per move.', search: { time: 1000 }, useBook: true },

  // Same as Expert with 2.5 seconds, so it reaches a deeper depth and plays more accurately.
  { name: 'Master', description: 'Deeper search, about 2.5 seconds per move.', search: { time: 2500 }, useBook: true },

  // Strongest: up to 5 seconds per move. Uses the opening book.
  { name: 'Grandmaster', description: 'Hardest. Full strength, up to 5 seconds per move.', search: { time: 5000 }, useBook: true },
];

export const defaultLevel  = levels.length - 1;
export const hintSearch: SearchOptions = { time: 1500 };
export const fallback_max_time = 2500;

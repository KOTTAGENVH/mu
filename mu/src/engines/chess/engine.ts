import type { Color } from '../../lib/games/chess/types';
import * as Constants from '../chess/constants';
import * as Tables from '../chess/pieceSquareTables';

const {
  a1, a8, allCastling, allDirections, b1, b8, bishop, black, boardSize, c1, c8,
  castleBlackKingside, castleBlackQueenside, castleWhiteKingside, castleWhiteQueenside,
  d1, d8, diagonals, down, e1, e8, empty, f1, f8, flagCapture, flagCastle, flagDoublePush,
  flagEnPassant, g1, g8, h1, h8, infinityScore, king, knight, knightJumps, mateScore, maxPly,
  movesPerPly, noSquare, pawn, queen, rook, straightLines, up, white, colorIndex, colorOf,
  encodeMove, fileOf, isOffBoard, moveFlags, moveFrom, movePromotion, moveTo, opponentOf, rankOf, typeOf,
} = Constants;

const {
  bishopTable, kingEndgameTable, kingMiddlegameTable, knightTable, maxPhase, passedPawnEndgame,
  passedPawnMiddlegame, pawnAdvanceEndgame, pawnTable, pieceValues, queenTable, rookTable,
} = Tables;

export interface SearchOptions {
  time?: number;
  depth?: number;
  noise?: number;
  random?: number;
}
export interface SearchInfo { depth: number; score: number; nodes: number; time: number; pv: number[] }
export interface SearchResult extends SearchInfo { move: number }
export interface DecodedMove { from: number; to: number; promo: number; flags: number }
export type GameStatusCode = '' | 'checkmate' | 'stalemate' | 'fifty' | 'material' | 'repetition';

export interface Engine {
  readonly startPosition: string;
  loadFen(fen: string): void;
  legalMoves(): number[];
  make(move: number): void;
  unmake(): void;
  inCheck(): boolean;
  san(move: number): string;
  toUci(move: number): string;
  fromUci(uci: string): number;
  status(): GameStatusCode;
  think(options: SearchOptions, onInfo?: (info: SearchInfo) => void): SearchResult | null;
  perft(depth: number): number; //performance test (counts every possible position reachable in eactly n half moves)
  evaluate(): number;
  readonly board: Int8Array;
  readonly turn: Color;
  readonly half: number;
  readonly ply: number;
  decode(move: number): DecodedMove;
  readonly flags: { capture: number; enPassant: number; castle: number; doublePush: number };
}

//forsyth notation
const startPosition = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const fenPieces: Record<string, number> = { p: pawn, n: knight, b: bishop, r: rook, q: queen, k: king };
const fileLetters = 'abcdefgh';
const pieceLetters = ' PNBRQK';
const promotionLetters = ' pnbrqk';

function castlingRookMove(kingTo: number): [number, number] {
  if (kingTo === g1) return [h1, f1];
  if (kingTo === c1) return [a1, d1];
  if (kingTo === g8) return [h8, f8];
  return [a8, d8];
}

export function createEngine(): Engine {
  const board = new Int8Array(boardSize);
  let sideToMove = white;
  let castlingRights = 0;
  let enPassantSquare = noSquare;
  let halfmoveClock = 0;
  let fullmoveNumber = 1;
  const kingSquare = new Int32Array(2);

  let hashLow = 0;
  let hashHigh = 0;
  let randomState = 0x2545f491 | 0;

  function nextRandom(): number {
    randomState ^= randomState << 13;
    randomState ^= randomState >>> 17;
    randomState ^= randomState << 5;
    return randomState | 0;
  }

  const pieceKeyLow = new Int32Array(16 * boardSize);
  const pieceKeyHigh = new Int32Array(16 * boardSize);
  for (let i = 0; i < pieceKeyLow.length; i++) { pieceKeyLow[i] = nextRandom(); pieceKeyHigh[i] = nextRandom(); }
  const sideKeyLow = nextRandom();
  const sideKeyHigh = nextRandom();
  const castlingKeyLow = new Int32Array(16);
  const castlingKeyHigh = new Int32Array(16);
  const enPassantKeyLow = new Int32Array(8);
  const enPassantKeyHigh = new Int32Array(8);
  for (let i = 0; i < 16; i++) { castlingKeyLow[i] = nextRandom(); castlingKeyHigh[i] = nextRandom(); }
  for (let i = 0; i < 8; i++) { enPassantKeyLow[i] = nextRandom(); enPassantKeyHigh[i] = nextRandom(); }

  function togglePieceHash(piece: number, square: number): void {
    hashLow ^= pieceKeyLow[piece * boardSize + square];
    hashHigh ^= pieceKeyHigh[piece * boardSize + square];
  }
  function toggleCastlingHash(rights: number): void { hashLow ^= castlingKeyLow[rights]; hashHigh ^= castlingKeyHigh[rights]; }
  function toggleEnPassantHash(square: number): void { hashLow ^= enPassantKeyLow[fileOf(square)]; hashHigh ^= enPassantKeyHigh[fileOf(square)]; }
  function toggleSideHash(): void { hashLow ^= sideKeyLow; hashHigh ^= sideKeyHigh; }

  function computeHash(): void {
    hashLow = 0; hashHigh = 0;
    for (let square = 0; square < boardSize; square++) {
      if (isOffBoard(square)) { square += 7; continue; }
      const piece = board[square];
      if (piece) togglePieceHash(piece, square);
    }
    if (sideToMove === black) toggleSideHash();
    toggleCastlingHash(castlingRights);
    if (enPassantSquare !== noSquare) toggleEnPassantHash(enPassantSquare);
  }
// ~ butwiwse flip 0 and 1
  const castlingMask = new Int8Array(boardSize).fill(allCastling);
  castlingMask[a1] = allCastling & ~castleWhiteQueenside;
  castlingMask[e1] = allCastling & ~(castleWhiteKingside | castleWhiteQueenside);
  castlingMask[h1] = allCastling & ~castleWhiteKingside;
  castlingMask[a8] = allCastling & ~castleBlackQueenside;
  castlingMask[e8] = allCastling & ~(castleBlackKingside | castleBlackQueenside);
  castlingMask[h8] = allCastling & ~castleBlackKingside;

  const undoCapacity = 2048;
  const undoMoves = new Int32Array(undoCapacity);
  const undoCaptured = new Int32Array(undoCapacity);
  const undoCastling = new Int32Array(undoCapacity);
  const undoEnPassant = new Int32Array(undoCapacity);
  const undoHalfmove = new Int32Array(undoCapacity);
  const undoFullmove = new Int32Array(undoCapacity);
  const undoHashLow = new Int32Array(undoCapacity);
  const undoHashHigh = new Int32Array(undoCapacity);
  let undoCount = 0;

  const positionHistory = new Int32Array(undoCapacity + 64);
  let historyLength = 0;

  //forsyth notation
  function loadFen(fen: string): void {
    board.fill(empty);
    const parts = fen.trim().split(/\s+/);
    const rows = parts[0].split('/');
    for (let row = 0; row < 8; row++) {
      const rank = 7 - row;
      let file = 0;
      for (const ch of rows[row]) {
        if (ch >= '1' && ch <= '8') { file += Number(ch); continue; }
        const lower = ch.toLowerCase();
        const type = fenPieces[lower];
        const color = ch === lower ? black : white;
        const square = rank * 16 + file;
        board[square] = type | color;
        if (type === king) kingSquare[colorIndex(color)] = square;
        file++;
      }
    }

    sideToMove = parts[1] === 'b' ? black : white;
    const castling = parts[2] || '-';
    castlingRights = 0;
    if (castling.includes('K')) castlingRights |= castleWhiteKingside;
    if (castling.includes('Q')) castlingRights |= castleWhiteQueenside;
    if (castling.includes('k')) castlingRights |= castleBlackKingside;
    if (castling.includes('q')) castlingRights |= castleBlackQueenside;
    enPassantSquare = noSquare;
    if (parts[3] && parts[3] !== '-') enPassantSquare = (parts[3].charCodeAt(1) - 49) * 16 + (parts[3].charCodeAt(0) - 97);
    halfmoveClock = Number(parts[4] || 0);
    fullmoveNumber = Number(parts[5] || 1);
    undoCount = 0;
    computeHash();
    historyLength = 0;
    positionHistory[historyLength++] = hashLow;
  }

  function isSquareAttacked(square: number, attacker: number): boolean {
    if (attacker === white) {
      let from = square - 15; if (!isOffBoard(from) && board[from] === pawn) return true;
      from = square - 17; if (!isOffBoard(from) && board[from] === pawn) return true;
    } else {
      let from = square + 15; if (!isOffBoard(from) && board[from] === (pawn | black)) return true;
      from = square + 17; if (!isOffBoard(from) && board[from] === (pawn | black)) return true;
    }
    const attackingKnight = knight | attacker, attackingKing = king | attacker, attackingBishop = bishop | attacker, attackingRook = rook | attacker, attackingQueen = queen | attacker;
    for (let i = 0; i < 8; i++) { const from = square + knightJumps[i]; if (!isOffBoard(from) && board[from] === attackingKnight) return true; }
    for (let i = 0; i < 8; i++) { const from = square + allDirections[i]; if (!isOffBoard(from) && board[from] === attackingKing) return true; }

    for (let i = 0; i < 4; i++) {
      const direction = diagonals[i];
      for (let from = square + direction; !isOffBoard(from); from += direction) {
        const piece = board[from];
        if (piece) { if (piece === attackingBishop || piece === attackingQueen) return true; break; }
      }
    }
    for (let i = 0; i < 4; i++) {
      const direction = straightLines[i];
      for (let from = square + direction; !isOffBoard(from); from += direction) {
        const piece = board[from];
        if (piece) { if (piece === attackingRook || piece === attackingQueen) return true; break; }
      }
    }
    return false;
  }
  function inCheck(): boolean { return isSquareAttacked(kingSquare[colorIndex(sideToMove)], opponentOf(sideToMove)); }
  function leftKingInCheck(): boolean { return isSquareAttacked(kingSquare[colorIndex(opponentOf(sideToMove))], sideToMove); }

  const moveBuffer = new Int32Array(maxPly * movesPerPly + movesPerPly);
  const moveScores = new Int32Array(maxPly * movesPerPly + movesPerPly);
  const legalMovesStart = maxPly * movesPerPly - movesPerPly;

  function addPromotions(count: number, from: number, to: number, flags: number): number {
    moveBuffer[count++] = encodeMove(from, to, queen, flags);
    moveBuffer[count++] = encodeMove(from, to, knight, flags);
    moveBuffer[count++] = encodeMove(from, to, rook, flags);
    moveBuffer[count++] = encodeMove(from, to, bishop, flags);
    return count;
  }
  
  function areSafe(a: number, b: number, c: number, attacker: number): boolean {
    return !isSquareAttacked(a, attacker) && !isSquareAttacked(b, attacker) && !isSquareAttacked(c, attacker);
  }

  function generateMoves(start: number, capturesOnly: boolean): number {
    let count = start;
    const us = sideToMove;
    const them = opponentOf(us);

    for (let from = 0; from < boardSize; from++) {
      if (isOffBoard(from)) { from += 7; continue; }
      const piece = board[from];
      if (!piece || colorOf(piece) !== us) continue;
      const type = typeOf(piece);

      if (type === pawn) {
        const forward = us === white ? up : down;
        const rank = rankOf(from);
        const startRank = us === white ? 1 : 6;
        const lastRankBeforePromotion = us === white ? 6 : 1;
        const oneStep = from + forward;
        if (!board[oneStep]) {
          if (rank === lastRankBeforePromotion) count = addPromotions(count, from, oneStep, 0);
          else if (!capturesOnly) {
            moveBuffer[count++] = encodeMove(from, oneStep, 0, 0);
            if (rank === startRank && !board[oneStep + forward]) moveBuffer[count++] = encodeMove(from, oneStep + forward, 0, flagDoublePush);
          }
        }
        for (let side = -1; side <= 1; side += 2) {
          const to = oneStep + side;
          if (isOffBoard(to)) continue;
          const target = board[to];
          if (target && colorOf(target) === them) {
            if (rank === lastRankBeforePromotion) count = addPromotions(count, from, to, flagCapture);
            else moveBuffer[count++] = encodeMove(from, to, 0, flagCapture);
          } else if (to === enPassantSquare) moveBuffer[count++] = encodeMove(from, to, 0, flagCapture | flagEnPassant);
        }
      } else if (type === knight || type === king) {
        const steps = type === knight ? knightJumps : allDirections;
        for (let i = 0; i < 8; i++) {
          const to = from + steps[i];
          if (isOffBoard(to)) continue;
          const target = board[to];
          if (!target) { if (!capturesOnly) moveBuffer[count++] = encodeMove(from, to, 0, 0); }
          else if (colorOf(target) === them) moveBuffer[count++] = encodeMove(from, to, 0, flagCapture);
        }
      } else {
        const directions = type === bishop ? diagonals : type === rook ? straightLines : allDirections;
        for (let i = 0; i < directions.length; i++) {
          const direction = directions[i];
          for (let to = from + direction; !isOffBoard(to); to += direction) {
            const target = board[to];
            if (!target) { if (!capturesOnly) moveBuffer[count++] = encodeMove(from, to, 0, 0); continue; }
            if (colorOf(target) === them) moveBuffer[count++] = encodeMove(from, to, 0, flagCapture);
            break;
          }
        }
      }
    }

    if (!capturesOnly) {
      if (us === white) {
        if ((castlingRights & castleWhiteKingside) && !board[f1] && !board[g1] && areSafe(e1, f1, g1, them)) moveBuffer[count++] = encodeMove(e1, g1, 0, flagCastle);
        if ((castlingRights & castleWhiteQueenside) && !board[d1] && !board[c1] && !board[b1] && areSafe(e1, d1, c1, them)) moveBuffer[count++] = encodeMove(e1, c1, 0, flagCastle);
      } else {
        if ((castlingRights & castleBlackKingside) && !board[f8] && !board[g8] && areSafe(e8, f8, g8, them)) moveBuffer[count++] = encodeMove(e8, g8, 0, flagCastle);
        if ((castlingRights & castleBlackQueenside) && !board[d8] && !board[c8] && !board[b8] && areSafe(e8, d8, c8, them)) moveBuffer[count++] = encodeMove(e8, c8, 0, flagCastle);
      }
    }
    return count - start;
  }

  function makeMove(move: number): void {
    const from = moveFrom(move), to = moveTo(move), promotion = movePromotion(move), flags = moveFlags(move);
    undoMoves[undoCount] = move;
    undoCastling[undoCount] = castlingRights;
    undoEnPassant[undoCount] = enPassantSquare;
    undoHalfmove[undoCount] = halfmoveClock;
    undoFullmove[undoCount] = fullmoveNumber;
    undoHashLow[undoCount] = hashLow;
    undoHashHigh[undoCount] = hashHigh;

    const piece = board[from];
    let captured = empty;
    if (flags & flagEnPassant) {
      const capturedSquare = to + (sideToMove === white ? down : up);
      captured = board[capturedSquare];
      board[capturedSquare] = empty;
      togglePieceHash(captured, capturedSquare);
    } else {
      captured = board[to];
      if (captured) togglePieceHash(captured, to);
    }
    undoCaptured[undoCount] = captured;
    undoCount++;

    togglePieceHash(piece, from);
    board[from] = empty;
    const placed = promotion ? promotion | sideToMove : piece;
    board[to] = placed;
    togglePieceHash(placed, to);

    if (flags & flagCastle) {
      const [rookFrom, rookTo] = castlingRookMove(to);
      const rookPiece = board[rookFrom];
      board[rookFrom] = empty;
      board[rookTo] = rookPiece;
      togglePieceHash(rookPiece, rookFrom);
      togglePieceHash(rookPiece, rookTo);
    }
    if (typeOf(piece) === king) kingSquare[colorIndex(sideToMove)] = to;

    toggleCastlingHash(castlingRights);
    castlingRights &= castlingMask[from] & castlingMask[to];
    toggleCastlingHash(castlingRights);

    if (enPassantSquare !== noSquare) toggleEnPassantHash(enPassantSquare);
    enPassantSquare = noSquare;
    if (flags & flagDoublePush) {
      enPassantSquare = (from + to) >> 1;
      toggleEnPassantHash(enPassantSquare);
    }

    halfmoveClock = typeOf(piece) === pawn || captured ? 0 : halfmoveClock + 1;
    if (sideToMove === black) fullmoveNumber++;
    sideToMove = opponentOf(sideToMove);
    toggleSideHash();
    positionHistory[historyLength++] = hashLow;
  }

  function unmakeMove(): void {
    undoCount--;
    historyLength--;
    const move = undoMoves[undoCount];
    const from = moveFrom(move), to = moveTo(move), promotion = movePromotion(move), flags = moveFlags(move);
    sideToMove = opponentOf(sideToMove);

    const piece = board[to];
    board[from] = promotion ? pawn | sideToMove : piece;
    if (flags & flagEnPassant) {
      board[to] = empty;
      board[to + (sideToMove === white ? down : up)] = undoCaptured[undoCount];
    } else {
      board[to] = undoCaptured[undoCount];
    }
    if (flags & flagCastle) {
      const [rookFrom, rookTo] = castlingRookMove(to);
      board[rookFrom] = board[rookTo];
      board[rookTo] = empty;
    }
    if (typeOf(board[from]) === king) kingSquare[colorIndex(sideToMove)] = from;

    castlingRights = undoCastling[undoCount];
    enPassantSquare = undoEnPassant[undoCount];
    halfmoveClock = undoHalfmove[undoCount];
    fullmoveNumber = undoFullmove[undoCount];
    hashLow = undoHashLow[undoCount];
    hashHigh = undoHashHigh[undoCount];
  }

  function makeNullMove(): void {
    undoMoves[undoCount] = 0;
    undoEnPassant[undoCount] = enPassantSquare;
    undoHashLow[undoCount] = hashLow;
    undoHashHigh[undoCount] = hashHigh;
    undoHalfmove[undoCount] = halfmoveClock;
    undoCount++;
    if (enPassantSquare !== noSquare) { toggleEnPassantHash(enPassantSquare); enPassantSquare = noSquare; }
    sideToMove = opponentOf(sideToMove);
    toggleSideHash();
    halfmoveClock++;
    positionHistory[historyLength++] = hashLow;
  }
  function unmakeNullMove(): void {
    undoCount--;
    historyLength--;
    sideToMove = opponentOf(sideToMove);
    enPassantSquare = undoEnPassant[undoCount];
    hashLow = undoHashLow[undoCount];
    hashHigh = undoHashHigh[undoCount];
    halfmoveClock = undoHalfmove[undoCount];
  }

  function legalMoves(): number[] {
    const count = generateMoves(legalMovesStart, false);
    const legal: number[] = [];
    for (let i = 0; i < count; i++) {
      const move = moveBuffer[legalMovesStart + i];
      makeMove(move);
      if (!leftKingInCheck()) legal.push(move);
      unmakeMove();
    }
    return legal;
  }

  const whitePawnsOnFile = new Int8Array(8), blackPawnsOnFile = new Int8Array(8);
  const lowestWhitePawnRank = new Int8Array(8), highestBlackPawnRank = new Int8Array(8);
  const highestWhitePawnRank = new Int8Array(8), lowestBlackPawnRank = new Int8Array(8);

  function evaluate(): number {
    whitePawnsOnFile.fill(0); blackPawnsOnFile.fill(0);
    lowestWhitePawnRank.fill(8); lowestBlackPawnRank.fill(8);
    highestWhitePawnRank.fill(-1); highestBlackPawnRank.fill(-1);
    for (let square = 0; square < boardSize; square++) {
      if (isOffBoard(square)) { square += 7; continue; }
      const piece = board[square];
      if (typeOf(piece) !== pawn) continue;
      const file = fileOf(square), rank = rankOf(square);
      if (colorOf(piece) === black) {
        blackPawnsOnFile[file]++;
        if (rank > highestBlackPawnRank[file]) highestBlackPawnRank[file] = rank;
        if (rank < lowestBlackPawnRank[file]) lowestBlackPawnRank[file] = rank;
      } else {
        whitePawnsOnFile[file]++;
        if (rank < lowestWhitePawnRank[file]) lowestWhitePawnRank[file] = rank;
        if (rank > highestWhitePawnRank[file]) highestWhitePawnRank[file] = rank;
      }
    }

    let whiteMiddlegame = 0, whiteEndgame = 0, blackMiddlegame = 0, blackEndgame = 0;
    let phase = 0, whiteBishops = 0, blackBishops = 0;
    for (let square = 0; square < boardSize; square++) {
      if (isOffBoard(square)) { square += 7; continue; }
      const piece = board[square];
      if (!piece) continue;
      const type = typeOf(piece), file = fileOf(square), rank = rankOf(square), color = colorOf(piece);
      const isBlack = color === black;
      const tableIndex = isBlack ? rank * 8 + file : (7 - rank) * 8 + file;
      const advance = isBlack ? 7 - rank : rank;
      let middlegame = 0, endgame = 0;

      switch (type) {
        case pawn: {
          middlegame = 100 + pawnTable[tableIndex];
          endgame = 120 + pawnAdvanceEndgame[advance] + (pawnTable[tableIndex] >> 1);
          const ownPawns = isBlack ? blackPawnsOnFile : whitePawnsOnFile;
          if (ownPawns[file] > 1) { middlegame -= 12; endgame -= 20; }
          const noNeighbours = (file === 0 || ownPawns[file - 1] === 0) && (file === 7 || ownPawns[file + 1] === 0);
          if (noNeighbours) { middlegame -= 12; endgame -= 15; } 
          let passed = true;
          for (let f = file - 1; f <= file + 1; f++) {
            if (f < 0 || f > 7) continue;
            if (isBlack ? lowestWhitePawnRank[f] < rank : highestBlackPawnRank[f] > rank) { passed = false; break; }
          }
          if (passed) {
            middlegame += passedPawnMiddlegame[advance];
            endgame += passedPawnEndgame[advance];
            const ahead = square + (isBlack ? down : up);
            if (!isOffBoard(ahead) && board[ahead]) endgame -= passedPawnEndgame[advance] >> 2; // blocked
          }
          break;
        }
        case knight:
          middlegame = 320 + knightTable[tableIndex];
          endgame = 300 + knightTable[tableIndex];
          phase += 1;
          break;
        case bishop:
          middlegame = 330 + bishopTable[tableIndex];
          endgame = 320 + bishopTable[tableIndex];
          phase += 1;
          if (isBlack) blackBishops++; else whiteBishops++;
          break;
        case rook: {
          middlegame = 500 + rookTable[tableIndex];
          endgame = 540;
          phase += 2;
          const ownPawns = isBlack ? blackPawnsOnFile : whitePawnsOnFile;
          const enemyPawns = isBlack ? whitePawnsOnFile : blackPawnsOnFile;
          if (ownPawns[file] === 0) {
            if (enemyPawns[file] === 0) { middlegame += 22; endgame += 10; } 
            else { middlegame += 10; endgame += 5; } 
          }
          if (advance === 6) { middlegame += 10; endgame += 18; } 
          break;
        }
        case queen:
          middlegame = 950 + queenTable[tableIndex];
          endgame = 980 + (queenTable[tableIndex] >> 1);
          phase += 4;
          break;
        case king: {
          middlegame = kingMiddlegameTable[tableIndex];
          endgame = kingEndgameTable[tableIndex];
          if (advance === 0 && (file <= 2 || file >= 5)) {
            const forward = isBlack ? down : up;
            let shield = 0;
            for (let f = file - 1; f <= file + 1; f++) {
              if (f < 0 || f > 7) continue;
              const oneAhead = square + forward + (f - file), twoAhead = square + 2 * forward + (f - file);
              if (board[oneAhead] === (pawn | color)) shield += 12;
              else if (!isOffBoard(twoAhead) && board[twoAhead] === (pawn | color)) shield += 6;
              else shield -= 8;
            }
            middlegame += shield;
          }
          break;
        }
      }
      if (isBlack) { blackMiddlegame += middlegame; blackEndgame += endgame; }
      else { whiteMiddlegame += middlegame; whiteEndgame += endgame; }
    }
    if (whiteBishops >= 2) { whiteMiddlegame += 30; whiteEndgame += 50; } 
    if (blackBishops >= 2) { blackMiddlegame += 30; blackEndgame += 50; }

    if (phase > maxPhase) phase = maxPhase;
    let score = ((whiteMiddlegame - blackMiddlegame) * phase + (whiteEndgame - blackEndgame) * (maxPhase - phase)) / maxPhase;
    score = score | 0;
    if (sideToMove === black) score = -score;
    return score + 10;
  }

  function hasPiecesOtherThanPawns(color: number): boolean {
    for (let square = 0; square < boardSize; square++) {
      if (isOffBoard(square)) { square += 7; continue; }
      const piece = board[square];
      if (piece && colorOf(piece) === color) {
        const type = typeOf(piece);
        if (type !== pawn && type !== king) return true;
      }
    }
    return false;
  }

  function isRepetition(): boolean {
    const oldest = Math.max(0, historyLength - 1 - halfmoveClock);
    for (let i = historyLength - 5; i >= oldest; i -= 2) if (positionHistory[i] === hashLow) return true;
    return false;
  }

  const tableBits = 19;
  const tableSize = 1 << tableBits;
  const tableIndexMask = tableSize - 1;
  let tableKey = new Int32Array(0), tableCheck = new Int32Array(0), tableMove = new Int32Array(0);
  let tableScore = new Int32Array(0), tableDepth = new Int8Array(0), tableBound = new Int8Array(0);
  function allocateTable(): void {
    if (tableKey.length) return;
    tableKey = new Int32Array(tableSize); tableCheck = new Int32Array(tableSize); tableMove = new Int32Array(tableSize);
    tableScore = new Int32Array(tableSize); tableDepth = new Int8Array(tableSize); tableBound = new Int8Array(tableSize);
  }

  const boundExact = 1, boundLower = 2, boundUpper = 3;
  const killerMoves = new Int32Array(maxPly * 2);
  const historyScores = new Int32Array(16 * boardSize);

  let nodes = 0, stopTime = 0, stopped = false, rootBestMove = 0, rootBestScore = 0;
  const now = () => Date.now();

  function scoreMoves(start: number, count: number, tableBestMove: number, ply: number): void {
    for (let i = 0; i < count; i++) {
      const move = moveBuffer[start + i], to = moveTo(move), flags = moveFlags(move), promotion = movePromotion(move);
      let score: number;
      if (move === tableBestMove) score = 2000000;
      else if (flags & flagCapture) {
        const victim = flags & flagEnPassant ? pawn : typeOf(board[to]);
        score = 1000000 + pieceValues[victim] * 10 - typeOf(board[moveFrom(move)]) + (promotion ? pieceValues[promotion] : 0);
      } else if (promotion) score = 900000 + pieceValues[promotion];
      else if (move === killerMoves[ply * 2]) score = 800000;
      else if (move === killerMoves[ply * 2 + 1]) score = 790000;
      else score = historyScores[board[moveFrom(move)] * boardSize + to];
      moveScores[start + i] = score;
    }
  }
  function pickNextMove(start: number, i: number, count: number): number {
    let bestIndex = i, bestScore = moveScores[start + i];
    for (let j = i + 1; j < count; j++) if (moveScores[start + j] > bestScore) { bestScore = moveScores[start + j]; bestIndex = j; }
    if (bestIndex !== i) {
      const move = moveBuffer[start + i]; moveBuffer[start + i] = moveBuffer[start + bestIndex]; moveBuffer[start + bestIndex] = move;
      const score = moveScores[start + i]; moveScores[start + i] = moveScores[start + bestIndex]; moveScores[start + bestIndex] = score;
    }
    return moveBuffer[start + i];
  }
  
  function outOfTime(): boolean {
    if ((++nodes & 2047) === 0 && now() > stopTime) stopped = true;
    return stopped;
  }

  function quiescenceSearch(alpha: number, beta: number, ply: number): number {
    if (outOfTime()) return 0;
    const standPat = evaluate();
    if (ply >= maxPly - 1) return standPat;
    if (standPat >= beta) return standPat;
    if (standPat > alpha) alpha = standPat;
    const start = ply * movesPerPly, count = generateMoves(start, true);
    scoreMoves(start, count, 0, ply);
    for (let i = 0; i < count; i++) {
      const move = pickNextMove(start, i, count), flags = moveFlags(move);
      if (!movePromotion(move)) {
        const victim = flags & flagEnPassant ? pawn : typeOf(board[moveTo(move)]);
        if (standPat + pieceValues[victim] + 200 < alpha) continue;
      }
      makeMove(move);
      if (leftKingInCheck()) { unmakeMove(); continue; }
      const score = -quiescenceSearch(-beta, -alpha, ply + 1);
      unmakeMove();
      if (stopped) return 0;
      if (score > alpha) { if (score >= beta) return score; alpha = score; }
    }
    return alpha;
  }

  function search(depth: number, alpha: number, beta: number, ply: number, allowNullMove: boolean): number {
    if (outOfTime()) return 0;
    if (ply > 0) {
      if (halfmoveClock >= 100 || isRepetition()) return 0;
      if (alpha < -mateScore + ply) alpha = -mateScore + ply;
      if (beta > mateScore - ply - 1) beta = mateScore - ply - 1;
      if (alpha >= beta) return alpha;
    }
    const inCheckNow = inCheck();
    if (inCheckNow) depth++; 
    if (depth <= 0) return quiescenceSearch(alpha, beta, ply);
    if (ply >= maxPly - 2) return evaluate();
    const isPvNode = beta - alpha > 1; 

    let tableBestMove = 0;
    const tableIndex = hashLow & tableIndexMask;
    if (tableKey[tableIndex] === hashLow && tableCheck[tableIndex] === hashHigh) {
      tableBestMove = tableMove[tableIndex];
      if (ply > 0 && tableDepth[tableIndex] >= depth) {
        let stored = tableScore[tableIndex];
        if (stored > mateScore - 1000) stored -= ply; else if (stored < -mateScore + 1000) stored += ply;
        const bound = tableBound[tableIndex];
        if (bound === boundExact && !isPvNode) return stored;
        if (bound === boundLower && stored >= beta) return stored;
        if (bound === boundUpper && stored <= alpha) return stored;
      }
    }

    let staticEval = 0;
    if (!inCheckNow && !isPvNode) {
      staticEval = evaluate();
      if (depth <= 3 && staticEval - 110 * depth >= beta && Math.abs(beta) < mateScore - 1000) return staticEval;
      if (allowNullMove && depth >= 3 && staticEval >= beta && hasPiecesOtherThanPawns(sideToMove)) {
        makeNullMove();
        const reduction = depth > 6 ? 3 : 2;
        const score = -search(depth - 1 - reduction, -beta, -beta + 1, ply + 1, false);
        unmakeNullMove();
        if (stopped) return 0;
        if (score >= beta) return score > mateScore - 1000 ? beta : score;
      }
    }
    
    const canPruneQuietMoves = !inCheckNow && !isPvNode && depth <= 2 && staticEval + (depth === 1 ? 220 : 420) <= alpha;

    const start = ply * movesPerPly, count = generateMoves(start, false);
    scoreMoves(start, count, tableBestMove, ply);
    let bestScore = -infinityScore, bestMove = 0, legalCount = 0;
    const originalAlpha = alpha;

    for (let i = 0; i < count; i++) {
      const move = pickNextMove(start, i, count);
      const isQuiet = !(moveFlags(move) & flagCapture) && !movePromotion(move);
      const mover = board[moveFrom(move)];
      makeMove(move);
      if (leftKingInCheck()) { unmakeMove(); continue; }
      legalCount++;
      const givesCheck = inCheck();
      if (canPruneQuietMoves && isQuiet && !givesCheck && legalCount > 1) { unmakeMove(); continue; }

      let score: number;
      if (legalCount === 1) {
        score = -search(depth - 1, -beta, -alpha, ply + 1, true); 
      } else {
        let reduction = 0;
        if (depth >= 3 && isQuiet && !inCheckNow && !givesCheck && legalCount > 3) {
          reduction = 1;
          if (legalCount > 8) reduction++;
          if (depth > 7) reduction++;
          if (isPvNode) reduction--;
          if (reduction > depth - 2) reduction = depth - 2;
          if (reduction < 0) reduction = 0;
        }
        
        score = -search(depth - 1 - reduction, -alpha - 1, -alpha, ply + 1, true);
        if (!stopped && score > alpha && reduction > 0) score = -search(depth - 1, -alpha - 1, -alpha, ply + 1, true);
        if (!stopped && score > alpha && score < beta) score = -search(depth - 1, -beta, -alpha, ply + 1, true);
      }
      unmakeMove();
      if (stopped) return 0;

      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
        if (ply === 0) { rootBestMove = move; rootBestScore = score; }
        if (score > alpha) {
          alpha = score;
          if (score >= beta) {
            if (isQuiet) {
              if (killerMoves[ply * 2] !== move) { killerMoves[ply * 2 + 1] = killerMoves[ply * 2]; killerMoves[ply * 2] = move; }
              const historyIndex = mover * boardSize + moveTo(move);
              historyScores[historyIndex] += depth * depth;
              if (historyScores[historyIndex] > 700000) for (let k = 0; k < historyScores.length; k++) historyScores[k] >>= 1;
            }
            break;
          }
        }
      }
    }
    if (!legalCount) return inCheckNow ? -mateScore + ply : 0; 

    let stored = bestScore;
    if (stored > mateScore - 1000) stored += ply; else if (stored < -mateScore + 1000) stored -= ply;
    if (tableDepth[tableIndex] <= depth || tableKey[tableIndex] !== hashLow) {
      tableKey[tableIndex] = hashLow;
      tableCheck[tableIndex] = hashHigh;
      tableMove[tableIndex] = bestMove;
      tableScore[tableIndex] = stored;
      tableDepth[tableIndex] = depth;
      tableBound[tableIndex] = bestScore >= beta ? boundLower : bestScore > originalAlpha ? boundExact : boundUpper;
    }
    return bestScore;
  }

  function principalVariation(firstMove: number, maxLength: number): number[] {
    const line: number[] = [];
    let move = firstMove, made = 0;
    while (move && line.length < maxLength) {
      if (legalMoves().indexOf(move) === -1) break;
      line.push(move);
      makeMove(move);
      made++;
      const index = hashLow & tableIndexMask;
      move = tableKey[index] === hashLow && tableCheck[index] === hashHigh ? tableMove[index] : 0;
      if (isRepetition()) break;
    }
    while (made--) unmakeMove();
    return line;
  }

  function think(options: SearchOptions, onInfo?: (info: SearchInfo) => void): SearchResult | null {
    allocateTable();
    const startTime = now();
    const timeLimit = options.time || 0, maxDepth = options.depth || 60;
    stopTime = timeLimit ? startTime + timeLimit : startTime + 120000;
    stopped = false;
    nodes = 0;
    killerMoves.fill(0);
    for (let k = 0; k < historyScores.length; k++) historyScores[k] >>= 2;
    const legal = legalMoves();
    if (!legal.length) return null;

    if (options.noise) {
      const scored: { move: number; score: number }[] = [];
      for (const move of legal) {
        makeMove(move);
        const score = -search(Math.max(0, maxDepth - 1), -infinityScore, infinityScore, 1, false);
        unmakeMove();
        scored.push({ move, score: score + (Math.random() * 2 - 1) * options.noise });
      }
      scored.sort((a, b) => b.score - a.score);
      let chosen = scored[0].move;
      if (options.random && Math.random() < options.random) chosen = legal[(Math.random() * legal.length) | 0];
      return { move: chosen, score: scored[0].score | 0, depth: maxDepth, nodes, time: now() - startTime, pv: [chosen] };
    }
    if (legal.length === 1) return { move: legal[0], score: 0, depth: 1, nodes: 0, time: 0, pv: [legal[0]] };

    let bestMove = legal[0], bestScore = 0, completedDepth = 0, line = [bestMove];
    for (let depth = 1; depth <= maxDepth; depth++) {
      rootBestMove = 0;
      let score: number;
      if (depth >= 5) {
        const low = bestScore - 40, high = bestScore + 40;
        score = search(depth, low, high, 0, false);
        if (!stopped && (score <= low || score >= high)) { rootBestMove = 0; score = search(depth, -infinityScore, infinityScore, 0, false); }
      } else {
        score = search(depth, -infinityScore, infinityScore, 0, false);
      }
      if (stopped) {
        if (rootBestMove && depth > 1 && rootBestScore > bestScore - 60) bestMove = rootBestMove;
        break;
      }
      if (rootBestMove) { bestMove = rootBestMove; bestScore = score; completedDepth = depth; line = principalVariation(bestMove, 12); }
      if (onInfo) onInfo({ depth, score: bestScore, nodes, time: now() - startTime, pv: line });
      if (Math.abs(bestScore) > mateScore - 200 && depth >= mateScore - Math.abs(bestScore)) break; 
      if (timeLimit && now() - startTime > timeLimit * 0.5) break; 
    }
    return { move: bestMove, score: bestScore, depth: completedDepth, nodes, time: now() - startTime, pv: line };
  }

  function squareName(square: number): string { return fileLetters[fileOf(square)] + (rankOf(square) + 1); }
  function toUci(move: number): string {
    const promotion = movePromotion(move);
    return squareName(moveFrom(move)) + squareName(moveTo(move)) + (promotion ? promotionLetters[promotion] : '');
  }
  function fromUci(uci: string): number {
    for (const move of legalMoves()) if (toUci(move) === uci) return move;
    return 0;
  }

  function san(move: number): string {
    const from = moveFrom(move), to = moveTo(move), promotion = movePromotion(move), flags = moveFlags(move);
    const type = typeOf(board[from]);
    let text = '';
    if (flags & flagCastle) {
      text = fileOf(to) === 6 ? 'O-O' : 'O-O-O';
    } else if (type === pawn) {
      if (flags & flagCapture) text = fileLetters[fileOf(from)] + 'x';
      text += squareName(to);
      if (promotion) text += '=' + pieceLetters[promotion];
    } else {
      text = pieceLetters[type];
      const rivals = legalMoves().filter((other) => other !== move && moveTo(other) === to && typeOf(board[moveFrom(other)]) === type);
      if (rivals.length) {
        const sameFile = rivals.some((other) => fileOf(moveFrom(other)) === fileOf(from));
        const sameRank = rivals.some((other) => rankOf(moveFrom(other)) === rankOf(from));
        if (!sameFile) text += fileLetters[fileOf(from)];
        else if (!sameRank) text += rankOf(from) + 1;
        else text += squareName(from);
      }
      if (flags & flagCapture) text += 'x';
      text += squareName(to);
    }
    makeMove(move);
    if (inCheck()) text += legalMoves().length ? '+' : '#';
    unmakeMove();
    return text;
  }

  function insufficientMaterial(): boolean {
    let minorPieces = 0, majorOrPawn = false;
    const bishopSquareColors: number[] = [];
    for (let square = 0; square < boardSize; square++) {
      if (isOffBoard(square)) { square += 7; continue; }
      const type = typeOf(board[square]);
      if (!type || type === king) continue;
      if (type === knight) minorPieces++;
      else if (type === bishop) { minorPieces++; bishopSquareColors.push((rankOf(square) + fileOf(square)) & 1); }
      else majorOrPawn = true;
    }
    if (majorOrPawn) return false;
    if (minorPieces <= 1) return true;
    return minorPieces === bishopSquareColors.length && bishopSquareColors.every((c) => c === bishopSquareColors[0]);
  }

  function repetitionCount(): number {
    let count = 0;
    for (let i = historyLength - 1; i >= 0; i -= 2) if (positionHistory[i] === hashLow) count++;
    return count;
  }

  function status(): GameStatusCode {
    const legal = legalMoves();
    if (!legal.length) return inCheck() ? 'checkmate' : 'stalemate';
    if (halfmoveClock >= 100) return 'fifty';
    if (insufficientMaterial()) return 'material';
    if (repetitionCount() >= 3) return 'repetition';
    return '';
  }

  function perft(depth: number): number {
    if (depth === 0) return 1;
    const start = (20 - depth) * movesPerPly, count = generateMoves(start, false);
    let total = 0;
    for (let i = 0; i < count; i++) {
      const move = moveBuffer[start + i];
      makeMove(move);
      if (!leftKingInCheck()) total += perft(depth - 1);
      unmakeMove();
    }
    return total;
  }

  loadFen(startPosition);
  return {
    startPosition: startPosition,
    loadFen, legalMoves, inCheck, san, toUci, fromUci, status, think, perft, evaluate,
    make: makeMove,
    unmake: unmakeMove,
    board,
    get turn(): Color { return sideToMove === white ? 'w' : 'b'; },
    get half(): number { return halfmoveClock; },
    get ply(): number { return historyLength - 1; },
    decode(move: number): DecodedMove { return { from: moveFrom(move), to: moveTo(move), promo: movePromotion(move), flags: moveFlags(move) }; },
    flags: { capture: flagCapture, enPassant: flagEnPassant, castle: flagCastle, doublePush: flagDoublePush },
  };
}
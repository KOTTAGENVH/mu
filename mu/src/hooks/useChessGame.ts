import { useCallback, useMemo, useRef, useState } from "react";
import {
  createEngine,
  type DecodedMove,
  type Engine,
  type GameStatusCode,
} from "../engines/chess/engine";
import type { BoardPiece, Color, GameResult } from "../lib/games/chess/types";
import { pieceCode, pieceTypeLetters } from "../lib/games/chess/pieces";
import { uciSquares } from "../lib/games/chess/squares";

export interface PositionView {
  board: Int8Array;
  pieces: BoardPiece[];
  turn: Color;
  checkSquare: number;
  lastMove: [number, number] | null;
  ply: number;
}

export interface GameSnapshot {
  moves: string[];
  sans: string[];
  result: GameResult | null;
  view: number | null;
  position: PositionView;
  legal: number[];
  liveTurn: Color;
}

export interface PlayOutcome {
  san: string;
  capture: boolean;
  castle: boolean;
  check: boolean;
  result: GameResult | null;
}

interface Model {
  moves: string[];
  sans: string[];
  result: GameResult | null;
  view: number | null;
  livePieces: BoardPiece[];
}

const statusResults: Record<
  Exclude<GameStatusCode, "">,
  (turn: Color) => GameResult
> = {
  checkmate: (turn) => ({
    kind: "checkmate",
    winner: turn === "w" ? "b" : "w",
  }),
  stalemate: () => ({ kind: "stalemate", winner: null }),
  fifty: () => ({ kind: "fifty", winner: null }),
  material: () => ({ kind: "material", winner: null }),
  repetition: () => ({ kind: "repetition", winner: null }),
};

function replay(
  e: Engine,
  moves: readonly string[],
): { moves: string[]; sans: string[] } {
  e.loadFen(e.startPosition);
  const ok: string[] = [],
    sans: string[] = [];
  for (const uci of moves) {
    const m = e.fromUci(uci);
    if (!m) break;
    sans.push(e.san(m));
    e.make(m);
    ok.push(uci);
  }
  return { moves: ok, sans };
}

function piecesFromBoard(
  board: Int8Array,
  nextId: { current: number },
): BoardPiece[] {
  const out: BoardPiece[] = [];
  for (let sq = 0; sq < 128; sq++) {
    if (sq & 0x88) {
      sq += 7;
      continue;
    }
    const code = pieceCode(board[sq]);
    if (code) out.push({ id: nextId.current++, code, sq });
  }
  return out;
}

function advancePieces(
  prev: BoardPiece[],
  d: DecodedMove,
  mover: Color,
  flags: Engine["flags"],
): BoardPiece[] {
  const capSq =
    d.flags & flags.enPassant ? d.to + (mover === "w" ? -16 : 16) : d.to;
  const rook =
    d.flags & flags.castle
      ? (
          { 6: [7, 5], 2: [0, 3], 118: [119, 117], 114: [112, 115] } as Record<
            number,
            [number, number]
          >
        )[d.to]
      : undefined;
  const next: BoardPiece[] = [];
  for (const p of prev) {
    if (p.sq === capSq && p.sq !== d.from) continue;
    if (p.sq === d.from)
      next.push({
        ...p,
        sq: d.to,
        code: d.promo
          ? ((mover + pieceTypeLetters[d.promo]) as BoardPiece["code"])
          : p.code,
      });
    else if (rook && p.sq === rook[0]) next.push({ ...p, sq: rook[1] });
    else next.push(p);
  }
  return next;
}

function kingSquare(board: Int8Array, color: Color): number {
  const k = color === "w" ? 6 : 14;
  for (let sq = 0; sq < 128; sq++) {
    if (sq & 0x88) {
      sq += 7;
      continue;
    }
    if (board[sq] === k) return sq;
  }
  return -1;
}

export function useChessGame(
  initialMoves: readonly string[],
  initialResult: GameResult | null,
) {
  const [live] = useState(createEngine);
  const [viewer] = useState(createEngine);
  const [scratch] = useState(createEngine);
  const nextId = useRef(1);
  const modelRef = useRef<Model | null>(null);

  const snapshot = useCallback((): GameSnapshot => {
    const model = modelRef.current!;
    const viewing = model.view !== null && model.view < model.moves.length;
    let engine = live,
      pieces = model.livePieces,
      ply = model.moves.length;
    if (viewing) {
      ply = model.view!;
      replay(viewer, model.moves.slice(0, ply));
      engine = viewer;
      pieces = piecesFromBoard(viewer.board, nextId);
    }
    const board = new Int8Array(engine.board);
    const turn = engine.turn;
    const last = ply > 0 ? uciSquares(model.moves[ply - 1]) : null;
    return {
      moves: model.moves,
      sans: model.sans,
      result: model.result,
      view: viewing ? ply : null,
      position: {
        board,
        pieces,
        turn,
        checkSquare: engine.inCheck() ? kingSquare(board, turn) : -1,
        lastMove: last,
        ply,
      },
      legal: !viewing && !model.result ? live.legalMoves() : [],
      liveTurn: live.turn,
    };
  }, [live, viewer]);

  const [state, setState] = useState<GameSnapshot>(() => {
    const r = replay(live, initialMoves);
    const status = live.status();
    modelRef.current = {
      moves: r.moves,
      sans: r.sans,
      view: null,
      result:
        initialResult ?? (status ? statusResults[status](live.turn) : null),
      livePieces: piecesFromBoard(live.board, nextId),
    };
    return snapshot();
  });

  const publish = useCallback(() => setState(snapshot()), [snapshot]);

  const play = useCallback(
    (m: number): PlayOutcome | null => {
      const model = modelRef.current!;
      if (model.result || model.view !== null) return null;
      if (live.legalMoves().indexOf(m) === -1) return null;
      const d = live.decode(m),
        mover = live.turn,
        san = live.san(m);
      const capture = !!(d.flags & live.flags.capture);
      model.livePieces = advancePieces(model.livePieces, d, mover, live.flags);
      live.make(m);
      model.moves = [...model.moves, live.toUci(m)];
      model.sans = [...model.sans, san];
      const status = live.status();
      model.result = status ? statusResults[status](live.turn) : null;
      publish();
      return {
        san,
        capture,
        castle: !!(d.flags & live.flags.castle),
        check: live.inCheck(),
        result: model.result,
      };
    },
    [live, publish],
  );

  const restart = useCallback(
    (moves: readonly string[] = [], result: GameResult | null = null) => {
      const r = replay(live, moves);
      const status = live.status();
      modelRef.current = {
        moves: r.moves,
        sans: r.sans,
        view: null,
        result: result ?? (status ? statusResults[status](live.turn) : null),
        livePieces: piecesFromBoard(live.board, nextId),
      };
      publish();
    },
    [live, publish],
  );

  const undo = useCallback(
    (count: number) => {
      const model = modelRef.current!;
      restart(
        model.moves.slice(0, Math.max(0, model.moves.length - count)),
        null,
      );
    },
    [restart],
  );

  const finish = useCallback(
    (result: GameResult) => {
      const model = modelRef.current!;
      if (model.result) return;
      model.result = result;
      model.view = null;
      publish();
    },
    [publish],
  );

  const goTo = useCallback(
    (ply: number | null) => {
      const model = modelRef.current!;
      const target =
        ply === null ? null : Math.max(0, Math.min(model.moves.length, ply));
      const next =
        target === null || target === model.moves.length ? null : target;
      if (next === model.view) return;
      if (next === null && model.view !== null)
        model.livePieces = piecesFromBoard(live.board, nextId);
      model.view = next;
      publish();
    },
    [live, publish],
  );

  const moveFromUci = useCallback((uci: string) => live.fromUci(uci), [live]);
  const sanOf = useCallback(
    (uci: string) => {
      const m = live.fromUci(uci);
      return m ? live.san(m) : uci;
    },
    [live],
  );
  const decode = useCallback((m: number) => live.decode(m), [live]);

  const lineToSan = useCallback(
    (pv: readonly string[], max = 8): string => {
      const model = modelRef.current!;
      replay(scratch, model.moves);
      const out: string[] = [];
      let num = Math.floor(model.moves.length / 2) + 1,
        white = scratch.turn === "w";
      for (const uci of pv.slice(0, max)) {
        const m = scratch.fromUci(uci);
        if (!m) break;
        const s = scratch.san(m);
        out.push(
          white ? `${num}. ${s}` : out.length === 0 ? `${num}\u2026 ${s}` : s,
        );
        if (!white) num++;
        white = !white;
        scratch.make(m);
      }
      return out.join(" ");
    },
    [scratch],
  );

  return useMemo(
    () => ({
      state,
      play,
      undo,
      restart,
      finish,
      goTo,
      moveFromUci,
      sanOf,
      decode,
      lineToSan,
    }),
    [
      state,
      play,
      undo,
      restart,
      finish,
      goTo,
      moveFromUci,
      sanOf,
      decode,
      lineToSan,
    ],
  );
}

export type ChessGameApi = ReturnType<typeof useChessGame>;

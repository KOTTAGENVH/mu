import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import type { DecodedMove } from "@/engines/chess/engine";
import type { BoardPiece, Color, PieceType } from "../lib/games/chess/types";
import { colorOf, pieceTypeLetters } from "../lib/games/chess/pieces";
import { squareAt, viewPosition } from "../lib/games/chess/squares";

export const pieceTransform = (col: number, row: number): string =>
  `translate(${col * 100}%, ${row * 100}%)`;

export interface PromotionChoice {
  to: number;
  color: Color;
  options: Partial<Record<PieceType, number>>;
}

interface Options {
  boardRef: { readonly current: HTMLDivElement | null };
  pieces: BoardPiece[];
  bottom: Color;
  legal: number[];
  movable: Color | null;
  decode: (m: number) => DecodedMove;
  getPieceElement: (id: number) => HTMLElement | undefined;
  draggingClass: string;
  onMove: (m: number) => void;
  onBlocked?: () => void;
  onInteract?: () => void;
}

const dragThreshold = 5;

export function useBoardInteraction(o: Options) {
  const {
    boardRef,
    pieces,
    bottom,
    legal,
    movable,
    decode,
    getPieceElement,
    draggingClass,
    onMove,
    onBlocked,
    onInteract,
  } = o;
  const [selected, setSelected] = useState(-1);
  const [hover, setHover] = useState(-1);
  const [cursor, setCursor] = useState(-1);
  const [keyboardMode, setKeyboardMode] = useState(false);
  const [promotion, setPromotion] = useState<PromotionChoice | null>(null);
  const drag = useRef<{
    sq: number;
    el?: HTMLElement;
    x0: number;
    y0: number;
    active: boolean;
    wasSelected: boolean;
    id: number;
  } | null>(null);

  const pieceAt = useMemo(() => {
    const map = new Map<number, BoardPiece>();
    for (const p of pieces) map.set(p.sq, p);
    return map;
  }, [pieces]);

  const movesFrom = useMemo(() => {
    const map = new Map<number, number[]>();
    for (const m of legal) {
      const f = decode(m).from;
      const list = map.get(f);
      if (list) list.push(m);
      else map.set(f, [m]);
    }
    return map;
  }, [legal, decode]);

  const targets = useMemo(() => {
    const map = new Map<number, boolean>();
    for (const m of movesFrom.get(selected) ?? []) {
      const d = decode(m);
      map.set(d.to, map.get(d.to) || !!(d.flags & 1));
    }
    return map;
  }, [movesFrom, selected, decode]);

  useEffect(() => {
    setSelected(-1);
    setHover(-1);
    setPromotion(null);
  }, [legal]);

  const isOwn = useCallback(
    (sq: number) => {
      const p = pieceAt.get(sq);
      return !!p && movable !== null && colorOf(p.code) === movable;
    },
    [pieceAt, movable],
  );

  const tryMove = useCallback(
    (from: number, to: number): boolean => {
      const cands = (movesFrom.get(from) ?? []).filter(
        (m) => decode(m).to === to,
      );
      if (!cands.length) return false;
      if (cands.length > 1) {
        const options: PromotionChoice["options"] = {};
        for (const m of cands)
          options[pieceTypeLetters[decode(m).promo] as PieceType] = m;
        setPromotion({ to, color: movable ?? "w", options });
        return true;
      }
      setSelected(-1);
      onMove(cands[0]);
      return true;
    },
    [movesFrom, decode, movable, onMove],
  );

  const choosePromotion = useCallback(
    (m: number | null) => {
      setPromotion(null);
      setSelected(-1);
      if (m !== null) onMove(m);
    },
    [onMove],
  );

  const squareFromPoint = useCallback(
    (x: number, y: number): number => {
      const el = boardRef.current;
      if (!el) return -1;
      const r = el.getBoundingClientRect();
      const col = Math.floor(((x - r.left) / r.width) * 8),
        row = Math.floor(((y - r.top) / r.height) * 8);
      if (col < 0 || col > 7 || row < 0 || row > 7) return -1;
      return squareAt(col, row, bottom);
    },
    [boardRef, bottom],
  );

  const restorePiece = useCallback(
    (sq: number, el?: HTMLElement) => {
      if (!el) return;
      el.classList.remove(draggingClass);
      const v = viewPosition(sq, bottom);
      el.style.transform = pieceTransform(v.col, v.row);
    },
    [bottom, draggingClass],
  );

  const onPointerDown = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      onInteract?.();
      setKeyboardMode(false);
      if (promotion) return;
      const sq = squareFromPoint(e.clientX, e.clientY);
      if (sq < 0) return;
      if (selected >= 0 && !isOwn(sq) && targets.has(sq)) {
        tryMove(selected, sq);
        return;
      }
      if (isOwn(sq) && legal.length) {
        const piece = pieceAt.get(sq)!;
        drag.current = {
          sq,
          el: getPieceElement(piece.id),
          x0: e.clientX,
          y0: e.clientY,
          active: false,
          wasSelected: selected === sq,
          id: e.pointerId,
        };
        setSelected(sq);
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          //  console.error("mouse pointer issue");
        }
        e.preventDefault();
        return;
      }
      const p = pieceAt.get(sq);
      if (p && movable === null) onBlocked?.();
      setSelected(-1);
    },
    [
      onInteract,
      promotion,
      squareFromPoint,
      selected,
      isOwn,
      targets,
      tryMove,
      legal.length,
      pieceAt,
      getPieceElement,
      movable,
      onBlocked,
    ],
  );

  const onPointerMove = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      const d = drag.current;
      if (!d || e.pointerId !== d.id) return;
      if (!d.active) {
        if (Math.hypot(e.clientX - d.x0, e.clientY - d.y0) < dragThreshold)
          return;
        d.active = true;
        d.el?.classList.add(draggingClass);
      }
      const board = boardRef.current;
      if (d.el && board) {
        const r = board.getBoundingClientRect(),
          s = r.width / 8;
        d.el.style.transform = `translate(${e.clientX - r.left - s / 2}px, ${e.clientY - r.top - s / 2}px)`;
      }
      const sq = squareFromPoint(e.clientX, e.clientY);
      setHover(targets.has(sq) ? sq : -1);
    },
    [boardRef, draggingClass, squareFromPoint, targets],
  );

  const finishDrag = useCallback(
    (e: PointerEvent<HTMLDivElement>, cancelled: boolean) => {
      const d = drag.current;
      if (!d || e.pointerId !== d.id) return;
      drag.current = null;
      setHover(-1);
      if (d.active) {
        const to = cancelled ? -1 : squareFromPoint(e.clientX, e.clientY);
        d.el?.classList.remove(draggingClass);
        if (to >= 0 && to !== d.sq && targets.has(to)) {
          if (!tryMove(d.sq, to)) restorePiece(d.sq, d.el);
          else if (
            (movesFrom.get(d.sq) ?? []).filter((m) => decode(m).to === to)
              .length > 1
          ) {
            const v = viewPosition(to, bottom);
            if (d.el) d.el.style.transform = pieceTransform(v.col, v.row);
          }
          return;
        }
        restorePiece(d.sq, d.el);
      } else if (d.wasSelected) {
        setSelected(-1);
      }
    },
    [
      squareFromPoint,
      draggingClass,
      targets,
      tryMove,
      restorePiece,
      movesFrom,
      decode,
      bottom,
    ],
  );

  const onPointerUp = useCallback(
    (e: PointerEvent<HTMLDivElement>) => finishDrag(e, false),
    [finishDrag],
  );
  const onPointerCancel = useCallback(
    (e: PointerEvent<HTMLDivElement>) => finishDrag(e, true),
    [finishDrag],
  );

  const cancelPromotion = useCallback(() => {
    if (!promotion) return;
    const from = selected;
    setPromotion(null);
    setSelected(-1);
    const p = pieceAt.get(from);
    if (p) restorePiece(from, getPieceElement(p.id));
  }, [promotion, selected, pieceAt, restorePiece, getPieceElement]);

  const onKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      const keys: Record<string, [number, number]> = {
        ArrowUp: [0, -1],
        ArrowDown: [0, 1],
        ArrowLeft: [-1, 0],
        ArrowRight: [1, 0],
      };
      if (promotion) {
        if (e.key === "Escape") {
          e.preventDefault();
          cancelPromotion();
        }
        return;
      }
      if (keys[e.key]) {
        e.preventDefault();
        onInteract?.();
        setKeyboardMode(true);
        const start =
          cursor >= 0
            ? cursor
            : selected >= 0
              ? selected
              : squareAt(4, 6, bottom);
        const v = viewPosition(start, bottom),
          [dx, dy] = keys[e.key];
        setCursor(
          squareAt(
            Math.max(0, Math.min(7, v.col + dx)),
            Math.max(0, Math.min(7, v.row + dy)),
            bottom,
          ),
        );
        return;
      }
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onInteract?.();
        setKeyboardMode(true);
        const sq = cursor >= 0 ? cursor : squareAt(4, 6, bottom);
        if (cursor < 0) {
          setCursor(sq);
          return;
        }
        if (selected >= 0 && targets.has(sq)) {
          tryMove(selected, sq);
          return;
        }
        if (isOwn(sq) && legal.length) {
          setSelected(selected === sq ? -1 : sq);
          return;
        }
        if (pieceAt.get(sq) && movable === null) onBlocked?.();
        setSelected(-1);
        return;
      }
      if (e.key === "Escape") {
        setSelected(-1);
      }
    },
    [
      promotion,
      cancelPromotion,
      onInteract,
      cursor,
      selected,
      bottom,
      targets,
      tryMove,
      isOwn,
      legal.length,
      pieceAt,
      movable,
      onBlocked,
    ],
  );

  const onBlur = useCallback(() => setKeyboardMode(false), []);

  return {
    selected,
    targets,
    hover,
    cursor: keyboardMode ? cursor : -1,
    promotion,
    choosePromotion,
    cancelPromotion,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel,
      onKeyDown,
      onBlur,
    },
  };
}

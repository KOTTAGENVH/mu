import { memo, useMemo, useState } from "react";
import styles from "../../../../css/chessGame.module.css";
import type { PieceType } from "@/lib/games/chess/types";
import {
  reachableSquares,
  type DiagramPosition,
} from "../../../../lib/games/chess/diagram";
import { PieceIcon } from "../pieceIcon";
import { RuleDiagram } from "./ruleDiagram";

interface PieceLesson {
  type: PieceType;
  name: string;
  value: string;
  from: string;
  position: DiagramPosition;
  moves: string;
  note: string;
}

const lessons: readonly PieceLesson[] = [
  {
    type: "K",
    name: "King",
    value: "Priceless",
    from: "d4",
    position: { d4: "wK", e5: "bP" },
    moves: "One square in any direction.",
    note: "The king can never move onto a square where it would be attacked. Keeping it safe is the whole game.",
  },
  {
    type: "Q",
    name: "Queen",
    value: "9 points",
    from: "d4",
    position: { d4: "wQ", d6: "wP", g7: "bP" },
    moves:
      "Any number of squares in a straight line: across, up, down or diagonally.",
    note: "The most powerful piece. Like every piece except the knight, it is stopped by anything in its path.",
  },
  {
    type: "R",
    name: "Rook",
    value: "5 points",
    from: "d4",
    position: { d4: "wR", g4: "wP", d7: "bN" },
    moves: "Any number of squares across or up and down.",
    note: "Rooks are strongest on open lines with no pawns in the way.",
  },
  {
    type: "B",
    name: "Bishop",
    value: "3 points",
    from: "d4",
    position: { d4: "wB", b2: "wP", f6: "bP" },
    moves: "Any number of squares diagonally.",
    note: "A bishop stays on the colour it starts on for the whole game.",
  },
  {
    type: "N",
    name: "Knight",
    value: "3 points",
    from: "d4",
    position: { d4: "wN", c4: "wP", d5: "wP", e4: "wP", e6: "bB" },
    moves: "In an L: two squares one way, then one square to the side.",
    note: "The only piece that jumps over others. Here it leaps straight over its own pawns.",
  },
  {
    type: "P",
    name: "Pawn",
    value: "1 point",
    from: "e2",
    position: { e2: "wP", d3: "bN", f3: "bP" },
    moves: "One square forward. On its very first move it may go two.",
    note: "Pawns capture differently from how they move: one square diagonally forward. They never move backward.",
  },
];

export const PieceExplorer = memo(function PieceExplorer() {
  const [index, setIndex] = useState(0);
  const lesson = lessons[index];
  const reach = useMemo(
    () => reachableSquares(lesson.position, lesson.from),
    [lesson],
  );
  return (
    <div className={styles.explorer}>
      <div
        className={styles.explorerTabs}
        role="tablist"
        aria-label="Choose a piece"
      >
        {lessons.map((l, i) => (
          <button
            key={l.type}
            type="button"
            role="tab"
            aria-selected={i === index}
            aria-controls="piece-lesson"
            className={styles.explorerTab}
            onClick={() => setIndex(i)}
          >
            <PieceIcon code={`w${l.type}`} />
            <span>{l.name}</span>
          </button>
        ))}
      </div>
      <div id="piece-lesson" role="tabpanel" className={styles.explorerPanel}>
        <RuleDiagram
          position={lesson.position}
          highlights={[lesson.from]}
          dots={reach.moves}
          rings={reach.captures}
          label={`${lesson.name} on ${lesson.from}. It can move to ${reach.moves.join(", ") || "no empty squares"}${reach.captures.length ? ` and capture on ${reach.captures.join(", ")}` : ""}.`}
        />
        <div className={styles.explorerText}>
          <div className={styles.explorerHead}>
            <b>{lesson.name}</b>
            <span className={styles.valueBadge}>{lesson.value}</span>
          </div>
          <p>
            <strong>Moves:</strong> {lesson.moves}
          </p>
          <p>{lesson.note}</p>
          <p className={styles.legend}>
            <span className={styles.legendDot} /> empty square it can reach{" "}
            <span className={styles.legendRing} /> enemy piece it can capture
          </p>
        </div>
      </div>
    </div>
  );
});

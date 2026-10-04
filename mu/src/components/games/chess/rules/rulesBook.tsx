import {
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import styles from "../../../../css/chessGame.module.css";
import { positionFromFen } from "@/lib/games/chess/diagram";
import { PieceExplorer } from "./pieceExplorer";
import { RuleDiagram } from "./ruleDiagram";

const startingPosition = positionFromFen(
  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR",
);

interface Section {
  id: string;
  title: string;
  short: string;
  body: ReactNode;
}

const sections: readonly Section[] = [
  {
    id: "quick",
    title: "Quick start",
    short: "Basics",
    body: (
      <ol className={styles.steps}>
        <li>
          <b>White moves first,</b> then the players take turns, one move each.
        </li>
        <li>
          <b>Each piece moves in its own way.</b> Only the knight can jump over
          other pieces.
        </li>
        <li>
          <b>Capture</b> by moving onto a square held by an opponent&rsquo;s
          piece. It leaves the board.
        </li>
        <li>
          <b>Win by checkmate:</b> attack the enemy king so that it has no way
          to escape.
        </li>
        <li>
          <b>Never leave your own king under attack.</b> A move that does is not
          allowed.
        </li>
      </ol>
    ),
  },
  {
    id: "setup",
    title: "The board and setup",
    short: "Setup",
    body: (
      <>
        <p>
          The board has 64 squares in 8 rows. Columns are called <b>files</b> (a
          to h) and rows are <b>ranks</b> (1 to 8), so every square has a name
          like e4.
        </p>
        <RuleDiagram
          position={startingPosition}
          label="The starting position"
          caption="The starting position. White is at the bottom."
        />
        <ul className={styles.ruleList}>
          <li>
            Turn the board so each player has a{" "}
            <b>light square in the right-hand corner</b>.
          </li>
          <li>Rooks go in the corners, then knights, then bishops.</li>
          <li>
            The <b>queen goes on her own colour</b>: the white queen on a light
            square, the black queen on a dark one. The king takes the last
            square.
          </li>
          <li>Pawns fill the row in front.</li>
        </ul>
      </>
    ),
  },
  {
    id: "pieces",
    title: "How the pieces move",
    short: "Pieces",
    body: (
      <>
        <p>
          Tap a piece to see every square it can reach. Point values are a rough
          guide to how useful each piece is when deciding on trades.
        </p>
        <PieceExplorer />
      </>
    ),
  },
  {
    id: "special",
    title: "Special moves",
    short: "Special",
    body: (
      <>
        <h4 className={styles.ruleHead}>Castling</h4>
        <p>
          Once per game you may move your king <b>two squares toward a rook</b>,
          and that rook jumps to the square the king passed over. It tucks the
          king away and brings a rook into play in one move.
        </p>
        <RuleDiagram
          position={{
            e1: "wK",
            h1: "wR",
            a1: "wR",
            a2: "wP",
            b2: "wP",
            c2: "wP",
            f2: "wP",
            g2: "wP",
            h2: "wP",
          }}
          arrows={["e1g1", "h1f1"]}
          label="Castling on the king's side: the king moves from e1 to g1 and the rook from h1 to f1"
          caption="Castling on the king's side. It works the same way toward the other rook."
        />
        <p>Castling is only allowed when:</p>
        <ul className={styles.ruleList}>
          <li>neither the king nor that rook has moved yet,</li>
          <li>every square between them is empty, and</li>
          <li>
            the king is not in check, and doesn&rsquo;t pass through or land on
            a square that is attacked.
          </li>
        </ul>
        <h4 className={styles.ruleHead}>En passant</h4>
        <p>
          If a pawn moves two squares and lands right beside an enemy pawn, that
          enemy pawn may capture it <b>as if it had moved only one square</b>.
          This is allowed only on the very next move.
        </p>
        <RuleDiagram
          position={{ e5: "wP", d5: "bP" }}
          fadedArrows={["d7d5"]}
          arrows={["e5d6"]}
          rings={["d5"]}
          label="Black's pawn has just moved from d7 to d5. White's pawn on e5 captures it en passant by moving to d6"
          caption="Black just played d7 to d5. White captures en passant: the pawn goes to d6 and the black pawn is removed."
        />
        <h4 className={styles.ruleHead}>Promotion</h4>
        <p>
          A pawn that reaches the far side of the board{" "}
          <b>must turn into a queen, rook, bishop or knight</b>. Almost everyone
          picks a queen, so you can have more than one.
        </p>
        <RuleDiagram
          position={{ b7: "wP", g8: "bK", g1: "wK" }}
          arrows={["b7b8"]}
          label="White's pawn moves from b7 to b8 and promotes"
          caption="The pawn reaches b8 and becomes a new piece of your choice."
        />
      </>
    ),
  },
  {
    id: "check",
    title: "Check, checkmate and stalemate",
    short: "Check",
    body: (
      <>
        <h4 className={styles.ruleHead}>Check</h4>
        <p>
          A king that is under attack is <b>in check</b>. You must get out of
          check straight away, in one of three ways:
        </p>
        <ul className={styles.ruleList}>
          <li>
            <b>Move</b> the king to a safe square,
          </li>
          <li>
            <b>block</b> the attack by putting a piece in the way, or
          </li>
          <li>
            <b>capture</b> the attacking piece.
          </li>
        </ul>
        <RuleDiagram
          position={{ e8: "bK", d7: "bP", f7: "bP", e1: "wR", g1: "wK" }}
          check="e8"
          arrows={["e1e7"]}
          label="White's rook on e1 gives check to the black king on e8"
          caption="The rook attacks the king along the e-file: check."
        />
        <h4 className={styles.ruleHead}>Checkmate</h4>
        <p>
          If the king is in check and there is <b>no legal way out</b>, it is
          checkmate and the game is over. The side that gave checkmate wins.
        </p>
        <RuleDiagram
          position={{
            g8: "bK",
            f7: "bP",
            g7: "bP",
            h7: "bP",
            d8: "wR",
            g1: "wK",
            f2: "wP",
            g2: "wP",
            h2: "wP",
          }}
          fadedArrows={["d1d8"]}
          check="g8"
          label="White's rook moves to d8 and checkmates the black king on g8, which is trapped by its own pawns"
          caption="A back-rank mate: the king is trapped behind its own pawns."
        />
        <h4 className={styles.ruleHead}>Stalemate</h4>
        <p>
          If the player to move is <b>not in check but has no legal move</b>,
          the game is a draw. When you&rsquo;re winning, watch out for this.
        </p>
        <RuleDiagram
          position={{ a8: "bK", b6: "wQ", c6: "wK" }}
          highlights={["a8"]}
          label="Black to move: the king on a8 is not in check but every square it could go to is attacked"
          caption="Black to move. The king isn't attacked, but every move would walk into check: stalemate, a draw."
        />
      </>
    ),
  },
  {
    id: "endings",
    title: "How a game ends",
    short: "Endings",
    body: (
      <>
        <h4 className={styles.ruleHead}>Ways to win</h4>
        <ul className={styles.ruleList}>
          <li>
            <b>Checkmate</b> the opponent&rsquo;s king.
          </li>
          <li>
            Your opponent <b>resigns</b> (gives up).
          </li>
        </ul>
        <h4 className={styles.ruleHead}>Ways to draw</h4>
        <ul className={styles.ruleList}>
          <li>
            <b>Stalemate:</b> the player to move has no legal move and
            isn&rsquo;t in check.
          </li>
          <li>
            <b>Agreement:</b> both players agree to a draw.
          </li>
          <li>
            <b>Repetition:</b> the same position occurs three times.
          </li>
          <li>
            <b>Fifty-move rule:</b> fifty moves by each player with no capture
            and no pawn move.
          </li>
          <li>
            <b>Not enough material:</b> neither side can possibly checkmate, for
            example king against king.
          </li>
        </ul>
        <p className={styles.muted}>
          This app detects every one of these automatically.
        </p>
      </>
    ),
  },
  {
    id: "tips",
    title: "Tips for beginners",
    short: "Tips",
    body: (
      <ul className={styles.ruleList}>
        <li>
          <b>Fight for the centre.</b> Pieces on e4, d4, e5 and d5 control the
          most squares.
        </li>
        <li>
          <b>Develop your knights and bishops early,</b> and avoid moving the
          same piece over and over in the opening.
        </li>
        <li>
          <b>Castle early</b> to keep your king safe.
        </li>
        <li>
          <b>Don&rsquo;t bring the queen out too soon;</b> it gets chased around
          while your opponent develops.
        </li>
        <li>
          <b>Before every move, ask what your opponent is threatening.</b> Most
          games between beginners are decided by a piece left unprotected.
        </li>
        <li>
          <b>Count the points</b> before trading. Swapping a bishop (3) for a
          rook (5) is a good deal.
        </li>
      </ul>
    ),
  },
  {
    id: "app",
    title: "Using this app",
    short: "App",
    body: (
      <>
        <ul className={styles.ruleList}>
          <li>
            <b>Move</b> by tapping a piece and then a square, or by dragging it.
            Dots show where it can go; rings show captures.
          </li>
          <li>
            <b>Hint</b> draws an arrow for a good move. <b>Undo</b> takes back
            the last move (against the computer it also takes back the reply).
          </li>
          <li>
            <b>Flip</b> turns the board around. Tap any move in the list, or use
            the arrows, to review the game.
          </li>
          <li>
            <b>Two players:</b> choose &ldquo;Two players&rdquo; in New game.
            Turn on &ldquo;Turn the board each move&rdquo; when passing one
            phone or tablet back and forth. Either player can offer a draw or
            resign.
          </li>
          <li>
            <b>Keyboard:</b> click the board, then use the arrow keys and Enter
            to select and move. Use &larr; and &rarr; elsewhere to step through
            moves.
          </li>
        </ul>
      </>
    ),
  },
];

export const RulesBook = memo(function RulesBook() {
  const [active, setActive] = useState(sections[0].id);
  const rootRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const lockUntil = useRef(0);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof IntersectionObserver === "undefined") return;
    const scroller = root.closest<HTMLElement>("[data-scroll]");
    const navHeight = navRef.current?.offsetHeight ?? 48;
    const observer = new IntersectionObserver(
      (entries) => {
        if (Date.now() < lockUntil.current) return;
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id.replace("rules-", ""));
      },
      { root: scroller, rootMargin: `-${navHeight + 8}px 0px -55% 0px` },
    );
    root.querySelectorAll("section").forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  const jump = useCallback((id: string) => {
    setActive(id);
    lockUntil.current = Date.now() + 900;
    rootRef.current
      ?.querySelector(`#rules-${id}`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <div ref={rootRef} className={styles.rules}>
      <nav
        ref={navRef}
        className={styles.rulesNav}
        aria-label="Rule book sections"
      >
        {sections.map((s) => (
          <button
            key={s.id}
            type="button"
            className={styles.rulesChip}
            aria-current={active === s.id ? "true" : undefined}
            onClick={() => jump(s.id)}
          >
            {s.short}
          </button>
        ))}
      </nav>
      {sections.map((s) => (
        <section
          key={s.id}
          id={`rules-${s.id}`}
          className={styles.rulesSection}
          aria-labelledby={`rules-${s.id}-h`}
        >
          <h3 id={`rules-${s.id}-h`}>{s.title}</h3>
          {s.body}
        </section>
      ))}
    </div>
  );
});

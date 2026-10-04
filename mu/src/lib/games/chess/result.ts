import type { Color, GameMode, GameResult } from "./types";
import { colorName } from "./pieces";

const drawText: Record<string, [string, string]> = {
  stalemate: [
    "Stalemate",
    "No legal moves and no check, so the game is drawn.",
  ],
  fifty: ["Draw", "Fifty moves without a capture or pawn move."],
  material: ["Draw", "Neither side has enough material to checkmate."],
  repetition: ["Draw", "The same position occurred three times."],
  agreed: ["Draw agreed", "Both players agreed to a draw."],
};

export function describeResult(
  r: GameResult,
  mode: GameMode,
  human: Color,
  engineName: string,
): { title: string; detail: string; outcome: "win" | "loss" | "draw" } {
  if (!r.winner) {
    const [title, detail] = drawText[r.kind] ?? ["Draw", "The game is drawn."];
    return { title, detail, outcome: "draw" };
  }
  const winner = colorName(r.winner),
    loser = colorName(r.winner === "w" ? "b" : "w");
  if (mode === "computer") {
    const win = r.winner === human;
    if (r.kind === "resign")
      return {
        title: "You resigned",
        detail: `${engineName} wins by resignation.`,
        outcome: "loss",
      };
    return win
      ? {
          title: "Checkmate. You win",
          detail: "You delivered checkmate. Well played.",
          outcome: "win",
        }
      : {
          title: `Checkmate. ${engineName} wins`,
          detail: `${engineName} delivered checkmate.`,
          outcome: "loss",
        };
  }
  if (r.kind === "resign")
    return {
      title: `${loser} resigned`,
      detail: `${winner} wins by resignation.`,
      outcome: "win",
    };
  return {
    title: `Checkmate. ${winner} wins`,
    detail: `${loser}\u2019s king has no escape.`,
    outcome: "win",
  };
}

import { mateScore, mateThreshold } from "../../../engines/chess/constants";

export function formatEval(scoreWhite: number): string {
  if (Math.abs(scoreWhite) > mateThreshold) {
    const n = Math.ceil((mateScore - Math.abs(scoreWhite)) / 2);
    return (scoreWhite > 0 ? "" : "-") + "M" + n;
  }
  const v = scoreWhite / 100;
  return (v > 0 ? "+" : "") + v.toFixed(1);
}

export function evalPercent(scoreWhite: number): number {
  if (Math.abs(scoreWhite) > mateThreshold) return scoreWhite > 0 ? 100 : 0;
  return 50 + 50 * Math.tanh(scoreWhite / 450);
}

export function formatCount(n: number): string {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return Math.round(n / 1e3) + "k";
  return String(n);
}

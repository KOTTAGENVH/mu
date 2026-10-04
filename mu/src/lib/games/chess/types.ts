export type Color = "w" | "b";
export type PieceType = "P" | "N" | "B" | "R" | "Q" | "K";
export type PieceCode = `${Color}${PieceType}`;

export interface BoardPiece {
  id: number;
  code: PieceCode;
  sq: number;
}

export type GameMode = "computer" | "local";
export type BoardTheme = "slate" | "walnut" | "emerald" | "graphite";

export interface GameConfig {
  mode: GameMode;
  humanColor: Color;
  level: number;
}

export type ResultKind =
  | "checkmate"
  | "stalemate"
  | "fifty"
  | "material"
  | "repetition"
  | "resign"
  | "agreed";

export interface GameResult {
  kind: ResultKind;
  winner: Color | null;
}

export interface Settings {
  theme: BoardTheme;
  sound: boolean;
  showLegalMoves: boolean;
  coordinates: boolean;
  autoRotate: boolean;
  showEvaluation: boolean;
}

export interface EngineReport {
  depth: number;
  scoreWhite: number;
  nodes: number;
  time: number;
  pv: string[];
  book?: boolean;
}

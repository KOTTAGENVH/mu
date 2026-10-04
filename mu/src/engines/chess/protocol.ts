import { createEngine, type Engine, type SearchOptions } from "./engine";

export interface SearchRequest {
  type: "search";
  id: number;
  moves: string[];
  options: SearchOptions;
}

export interface SearchReply {
  move: string | null;
  depth: number;
  score: number;
  nodes: number;
  time: number;
  pv: string[];
}

export type WorkerMessage =
  | ({ type: "info"; id: number } & Omit<SearchReply, "move">)
  | ({ type: "result"; id: number } & SearchReply);

export function runSearch(
  engine: Engine,
  moves: readonly string[],
  options: SearchOptions,
  onInfo?: (info: Omit<SearchReply, "move">) => void,
): SearchReply {
  engine.loadFen(engine.startPosition);
  for (const uci of moves) {
    const m = engine.fromUci(uci);
    if (!m) break;
    engine.make(m);
  }
  const result = engine.think(
    options,
    onInfo
      ? (i) =>
          onInfo({
            depth: i.depth,
            score: i.score,
            nodes: i.nodes,
            time: i.time,
            pv: i.pv.map(engine.toUci),
          })
      : undefined,
  );
  if (!result)
    return { move: null, depth: 0, score: 0, nodes: 0, time: 0, pv: [] };
  return {
    move: engine.toUci(result.move),
    depth: result.depth,
    score: result.score,
    nodes: result.nodes,
    time: result.time,
    pv: result.pv.map(engine.toUci),
  };
}

export { createEngine };

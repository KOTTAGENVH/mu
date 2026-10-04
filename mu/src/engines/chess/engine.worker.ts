import {
  createEngine,
  runSearch,
  type SearchRequest,
  type WorkerMessage,
} from "./protocol";

const scope = self as unknown as {
  postMessage(message: WorkerMessage): void;
  onmessage: ((event: MessageEvent<SearchRequest>) => void) | null;
};

const engine = createEngine();

scope.onmessage = (event) => {
  const req = event.data;
  if (!req || req.type !== "search") return;
  const reply = runSearch(engine, req.moves, req.options, (info) =>
    scope.postMessage({ type: "info", id: req.id, ...info }),
  );
  scope.postMessage({ type: "result", id: req.id, ...reply });
};

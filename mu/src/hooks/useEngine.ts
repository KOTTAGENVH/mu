import { useCallback, useEffect, useRef } from "react";
import { fallback_max_time } from "@/engines/chess/levels";
import {
  createEngine,
  runSearch,
  type SearchReply,
  type WorkerMessage,
} from "@/engines/chess/protocol";
import type { Engine, SearchOptions } from "@/engines/chess/engine";

export type WorkerFactory = () => Worker;

export const defaultWorkerFactory: WorkerFactory = () =>
  new Worker(new URL("../engines/chess/engine.worker.ts", import.meta.url));

export interface SearchTask {
  promise: Promise<SearchReply | null>;
  cancel(): void;
}

interface Pending {
  id: number;
  moves: string[];
  options: SearchOptions;
  onInfo?: (info: Omit<SearchReply, "move">) => void;
  resolve: (r: SearchReply | null) => void;
  timer?: ReturnType<typeof setTimeout>;
}

export function useEngine(createWorker: WorkerFactory = defaultWorkerFactory) {
  const workerRef = useRef<Worker | null>(null);
  const modeRef = useRef<"worker" | "main">("worker");
  const pendingRef = useRef<Pending | null>(null);
  const seqRef = useRef(0);
  const syncEngineRef = useRef<Engine | null>(null);
  const factoryRef = useRef(createWorker);

  const runOnMainThread = useCallback((p: Pending) => {
    p.timer = setTimeout(() => {
      if (pendingRef.current?.id !== p.id) return;
      syncEngineRef.current ??= createEngine();
      const options = { ...p.options };
      if (options.time)
        options.time = Math.min(options.time, fallback_max_time);
      const reply = runSearch(syncEngineRef.current, p.moves, options);
      pendingRef.current = null;
      p.resolve(reply);
    }, 60);
  }, []);

  const fallBack = useCallback(() => {
    modeRef.current = "main";
    workerRef.current?.terminate();
    workerRef.current = null;
    const p = pendingRef.current;
    if (p) {
      clearTimeout(p.timer);
      runOnMainThread(p);
    }
  }, [runOnMainThread]);

  const startWorker = useCallback(() => {
    if (
      modeRef.current !== "worker" ||
      workerRef.current ||
      typeof Worker === "undefined"
    ) {
      if (typeof Worker === "undefined") modeRef.current = "main";
      return;
    }
    try {
      const w = factoryRef.current();
      w.onmessage = (e: MessageEvent<WorkerMessage>) => {
        const msg = e.data,
          p = pendingRef.current;
        if (!p || msg.id !== p.id) return;
        if (msg.type === "info") {
          p.onInfo?.(msg);
          return;
        }
        clearTimeout(p.timer);
        pendingRef.current = null;
        p.resolve({
          move: msg.move,
          depth: msg.depth,
          score: msg.score,
          nodes: msg.nodes,
          time: msg.time,
          pv: msg.pv,
        });
      };
      w.onerror = () => fallBack();
      workerRef.current = w;
    } catch {
      modeRef.current = "main";
    }
  }, [fallBack]);

  useEffect(() => {
    startWorker();
    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
      const p = pendingRef.current;
      if (p) {
        clearTimeout(p.timer);
        pendingRef.current = null;
        p.resolve(null);
      }
    };
  }, [startWorker]);

  const cancel = useCallback(() => {
    const p = pendingRef.current;
    if (!p) return;
    clearTimeout(p.timer);
    pendingRef.current = null;
    p.resolve(null);
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
      startWorker();
    }
  }, [startWorker]);

  const search = useCallback(
    (
      moves: string[],
      options: SearchOptions,
      onInfo?: Pending["onInfo"],
    ): SearchTask => {
      cancel();
      const id = ++seqRef.current;
      let resolve!: (r: SearchReply | null) => void;
      const promise = new Promise<SearchReply | null>((r) => {
        resolve = r;
      });
      const p: Pending = { id, moves, options, onInfo, resolve };
      pendingRef.current = p;
      startWorker();
      if (modeRef.current === "worker" && workerRef.current) {
        workerRef.current.postMessage({ type: "search", id, moves, options });
        p.timer = setTimeout(
          () => {
            if (pendingRef.current?.id === id) fallBack();
          },
          (options.time ?? 2000) + 7000,
        );
      } else {
        runOnMainThread(p);
      }
      return {
        promise,
        cancel: () => {
          if (pendingRef.current?.id === id) cancel();
        },
      };
    },
    [cancel, fallBack, runOnMainThread, startWorker],
  );

  return { search, cancel };
}

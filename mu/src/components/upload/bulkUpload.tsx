"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { uploadSong } from "@/app/api/client/services/audio/api";
import {
  buildFailureCsv,
  isAudioFile,
  parseManifestFile,
  PauseGate,
  reconcile,
  runPool,
  type Category,
  type ManifestRow,
  type PlanItem,
  type PlanStatus,
} from "./csvManifest";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronDown,
  faFileCsv,
  faFolderOpen,
  faUpload,
} from "@fortawesome/free-solid-svg-icons";
import { useAppleWebkit } from "@/hooks/useAppleWebkit";
import { panelSurface } from "@/lib/surfaceDropdown";

const concurrency = 5;
const visible_limit = 200;

type Phase = "idle" | "parsing" | "review" | "running" | "paused" | "finished";
type Filter = "all" | "ready" | "problems" | "failed";

interface Props {
  categories: Category[];
  onClose: () => void;
}

export class NonRetryableError extends Error {}

const status_label: Record<PlanStatus, string> = {
  ready: "Ready",
  "missing-file": "No file found",
  "ambiguous-file": "Several files match",
  "unknown-category": "Category not recognised",
  "invalid-artist": "Artist name not allowed",
  "duplicate-row": "Duplicate row",
};

const btn =
  "inline-flex items-center justify-center px-4 py-2.5 rounded-2xl border-none cursor-pointer bg-gray-100 text-black hover:bg-gray-200 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors";

const BulkCsvUpload: React.FC<Props> = ({ categories, onClose }) => {
  const csvInputRef = useRef<HTMLInputElement | null>(null);
  const folderInputRef = useRef<HTMLInputElement | null>(null);

  const itemsRef = useRef<PlanItem[]>([]);
  const gateRef = useRef(new PauseGate());
  const abortRef = useRef<AbortController | null>(null);
  const dirtyRef = useRef(false);
  const runningRef = useRef(false);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);

  const [phase, setPhase] = useState<Phase>("idle");
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [tick, setTick] = useState(0);
  const [csvName, setCsvName] = useState("");
  const [folderName, setFolderName] = useState("");
  const [audioFiles, setAudioFiles] = useState<File[]>([]);
  const [rowCount, setRowCount] = useState(0);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [orphanCount, setOrphanCount] = useState(0);
  const [defaultCategoryId, setDefaultCategoryId] = useState("");
  const [sanitizeArtists, setSanitizeArtists] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [fatal, setFatal] = useState("");
  const [parsedRows, setParsedRows] = useState<ManifestRow[]>([]);
  const isAppleWebkit = useAppleWebkit();

  useEffect(() => {
    const el = folderInputRef.current;
    if (!el) return;
    el.setAttribute("webkitdirectory", "");
    el.setAttribute("directory", "");
    el.setAttribute("mozdirectory", "");
  }, []);

  useEffect(() => {
    if (phase !== "running" && phase !== "paused") return;
    const id = window.setInterval(() => {
      if (dirtyRef.current) {
        dirtyRef.current = false;
        setTick((n) => n + 1);
      }
    }, 250);
    return () => window.clearInterval(id);
  }, [phase]);

  useEffect(() => {
    if (phase !== "running" && phase !== "paused") return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [phase]);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  useEffect(() => {
    if (!isCategoryOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryDropdownRef.current?.contains(event.target as Node)) return;
      setIsCategoryOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isCategoryOpen]);

  const handleCsv = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setPhase("parsing");
    setCsvName(file.name);
    setFatal("");
    setParsedRows([]);
    itemsRef.current = [];

    try {
      const result = await parseManifestFile(file, {
        onProgress: (rows) => setRowCount(rows),
      });
      setParsedRows(result.rows);
      setRowCount(result.rows.length);
      setWarnings(result.warnings);
      if (result.rows.length === 0) {
        setFatal("No usable rows found — check the column headers.");
        setPhase("idle");
        return;
      }
      setPhase("review");
    } catch (err) {
      setFatal(
        `Could not read ${file.name}: ${err instanceof Error ? err.message : "unknown error"}`,
      );
      setPhase("idle");
    }
  };

  const handleFolder = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (picked.length === 0) return;
    const audio = picked.filter(isAudioFile);
    if (audio.length === 0) {
      setFatal("No audio files found in that folder.");
      return;
    }
    setFatal("");
    setAudioFiles(audio);
    const first = picked[0]?.webkitRelativePath?.split("/")[0];
    setFolderName(first || `${picked.length} file(s)`);
  };

  const plan = useMemo(() => {
    if (parsedRows.length === 0 || audioFiles.length === 0) return null;
    return reconcile(parsedRows, audioFiles, categories, {
      defaultCategoryId: defaultCategoryId || undefined,
      sanitizeArtists,
    });
  }, [parsedRows, audioFiles, categories, defaultCategoryId, sanitizeArtists]);

  useEffect(() => {
    if (!plan) return;
    itemsRef.current = plan.items;
    setOrphanCount(plan.orphanFiles.length);
    setTick((n) => n + 1);
  }, [plan]);

  const counts = plan?.counts;
  const readyItems = useMemo(
    () => itemsRef.current.filter((i) => i.status === "ready"),
    [tick],
  );

  const progress = useMemo(() => {
    let done = 0;
    let failed = 0;
    for (const item of itemsRef.current) {
      if (item.upload === "done") done++;
      else if (item.upload === "failed") failed++;
    }
    return { done, failed, total: readyItems.length };
  }, [tick, readyItems.length]);

  const selectedCategoryName = useMemo(() => {
    const selected = categories.find((c) => c.id === defaultCategoryId);
    return selected ? selected.name : "None";
  }, [defaultCategoryId, categories]);

  const start = useCallback(async () => {
    const queue = itemsRef.current.filter(
      (i) => i.status === "ready" && i.upload !== "done",
    );
    if (queue.length === 0) return;

    const controller = new AbortController();
    abortRef.current = controller;
    gateRef.current = new PauseGate();
    setFatal("");
    setPhase("running");

    for (const item of queue) {
      item.upload = "queued";
      item.error = undefined;
    }

    try {
      await runPool(
        queue,
        async (item, signal) => {
          if (!item.file || !item.categoryId) {
            throw new NonRetryableError("Row is missing a file or category");
          }
          item.attempts++;
          await uploadSong(
            item.file,
            item.title,
            item.artist,
            item.categoryId,
            signal,
          );
        },
        {
          concurrency: concurrency,
          signal: controller.signal,
          gate: gateRef.current,
          onStart: (item) => {
            item.upload = "uploading";
            dirtyRef.current = true;
          },
          onSuccess: (item) => {
            item.upload = "done";
            item.file = undefined;
            dirtyRef.current = true;
          },
          onFailure: (item, err, willRetry) => {
            item.error = err instanceof Error ? err.message : String(err);
            if (!willRetry) item.upload = "failed";
            dirtyRef.current = true;
          },
          onFatal: (err) => {
            setFatal(
              `Upload stopped — your session is no longer valid. Sign in again, then re-run the remaining rows. (${
                err instanceof Error ? err.message : "auth error"
              })`,
            );
          },
        },
      );
    } catch (err) {
      console.error("[bulk-upload] pool failed:", err);
      setFatal(
        `Upload stopped unexpectedly: ${
          err instanceof Error ? err.message : "unknown error"
        }`,
      );
    } finally {
      runningRef.current = false;
      abortRef.current = null;
      setPhase("finished");
      setTick((n) => n + 1);
    }
  }, []);

  const pause = () => {
    gateRef.current.pause();
    setPhase("paused");
  };

  const resume = () => {
    gateRef.current.resume();
    setPhase("running");
  };

  const cancel = () => {
    abortRef.current?.abort();
    gateRef.current.resume();
    for (const item of itemsRef.current) {
      if (item.upload === "queued" || item.upload === "uploading") {
        item.upload = "skipped";
      }
    }
    setPhase("finished");
    setTick((n) => n + 1);
  };

  const downloadFailures = () => {
    const csv = buildFailureCsv(itemsRef.current);
    const blob = new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "unfinished_rows.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const resolveAmbiguity = (item: PlanItem, file: File) => {
    item.file = file;
    item.candidates = undefined;
    item.status =
      item.categoryId || defaultCategoryId ? "ready" : "unknown-category";
    if (!item.categoryId) item.categoryId = defaultCategoryId || undefined;
    setTick((n) => n + 1);
  };

  const visible = useMemo(() => {
    const all = itemsRef.current;
    const matches = (i: PlanItem) => {
      if (filter === "all") return true;
      if (filter === "ready") return i.status === "ready";
      if (filter === "failed") return i.upload === "failed";
      return i.status !== "ready";
    };
    const out: PlanItem[] = [];
    for (const item of all) {
      if (matches(item)) out.push(item);
      if (out.length >= visible_limit) break;
    }
    return out;
  }, [filter, tick]);

  const busy = phase === "running" || phase === "paused";
  const pct = progress.total
    ? Math.round(((progress.done + progress.failed) / progress.total) * 100)
    : 0;

  return (
    <div className="w-full md:w-[680px] rounded-[2rem] bg-white/5 dark:bg-black/10 backdrop-blur-2xl border border-white/20 dark:border-white/10 p-6 flex flex-col gap-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="m-0 text-lg font-bold text-black dark:text-white">
            Upload from a CSV list
          </h2>
          <p className="mt-1 mb-0 text-sm text-slate-600 dark:text-slate-400">
            Pick your metadata CSV, then the folder holding the audio. Files
            upload {concurrency} at a time.
          </p>
        </div>
      </div>
      <div className="flex flex-row items-center gap-3">
        <button
          type="button"
          className={`${btn} group relative w-12 h-12 !px-0 flex-shrink-0`}
          disabled={busy || phase === "parsing"}
          onClick={() => csvInputRef.current?.click()}
          aria-label={csvName ? `CSV: ${csvName}` : "Choose CSV"}
        >
          <FontAwesomeIcon
            icon={faFileCsv}
            className={`w-4 h-4 ${csvName ? "text-blue-600 dark:text-blue-400" : ""}`}
          />
          <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50 hidden group-hover:block max-w-[280px] truncate rounded-xl px-3 py-1.5 text-xs bg-gray-900 text-white dark:bg-gray-100 dark:text-black shadow-lg">
            {csvName || "1. Choose CSV"}
          </span>
        </button>

        <button
          type="button"
          className={`${btn} group relative w-12 h-12 !px-0 flex-shrink-0`}
          disabled={busy || !csvName}
          onClick={() => folderInputRef.current?.click()}
          aria-label={
            folderName ? `Folder: ${folderName}` : "Choose audio folder"
          }
        >
          <FontAwesomeIcon
            icon={faFolderOpen}
            className={`w-4 h-4 ${folderName ? "text-blue-600 dark:text-blue-400" : ""}`}
          />
          <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50 hidden group-hover:block max-w-[280px] truncate rounded-xl px-3 py-1.5 text-xs bg-gray-900 text-white dark:bg-gray-100 dark:text-black shadow-lg">
            {folderName || "2. Choose audio folder"}
          </span>
        </button>

        <div className="min-w-0 flex-1 text-xs text-slate-500 dark:text-slate-400">
          <p className="m-0 truncate">{csvName || "No CSV selected"}</p>
          <p className="m-0 truncate">
            {folderName
              ? `${folderName} · ${audioFiles.length.toLocaleString()} audio files`
              : "No folder selected"}
          </p>
        </div>
      </div>

      <input
        ref={csvInputRef}
        type="file"
        accept=".csv,text/csv"
        onChange={handleCsv}
        className="hidden"
        title="CSV manifest"
      />
      <input
        ref={folderInputRef}
        type="file"
        multiple
        onChange={handleFolder}
        className="hidden"
        title="Audio folder"
      />

      {phase === "parsing" && (
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Reading manifest… {rowCount.toLocaleString()} rows so far.
        </p>
      )}

      {fatal && (
        <div className="rounded-2xl px-4 py-3 bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200 text-sm">
          {fatal}
        </div>
      )}

      {warnings.length > 0 && (
        <ul className="m-0 pl-5 text-xs text-amber-700 dark:text-amber-300 max-h-24 overflow-y-auto">
          {warnings.slice(0, 20).map((w, i) => (
            <li key={i}>{w}</li>
          ))}
          {warnings.length > 20 && <li>…and {warnings.length - 20} more.</li>}
        </ul>
      )}
      {parsedRows.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <span className="text-sm text-slate-700 dark:text-slate-300 whitespace-nowrap">
            Fallback category
          </span>
          <div className="relative" ref={categoryDropdownRef}>
            <button
              type="button"
              disabled={busy}
              onClick={() => setIsCategoryOpen((open) => !open)}
              aria-haspopup="listbox"
              aria-expanded={isCategoryOpen}
              className="w-auto min-w-[140px] px-4 py-2 flex items-center justify-between gap-3 rounded-xl border-none bg-gray-100 text-black hover:bg-gray-200 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700 backdrop-blur-md outline-none cursor-pointer focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="truncate">{selectedCategoryName}</span>
              <FontAwesomeIcon
                icon={faChevronDown}
                className={`w-3 h-3 flex-shrink-0 transition-transform ${
                  isCategoryOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {isCategoryOpen && (
              <div
                role="listbox"
                className={`absolute z-50 mt-2 p-4 rounded-2xl flex flex-col gap-2 right-0 sm:right-auto
    sm:left-0 w-[min(16rem,calc(100vw-3rem))] md:w-96 max-h-60 overflow-y-auto
    ${panelSurface(isAppleWebkit, "shadow-lg")}
    [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full
    [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-thumb]:bg-gray-600`}
              >
                <button
                  type="button"
                  role="option"
                  aria-selected={defaultCategoryId === ""}
                  onClick={() => {
                    setDefaultCategoryId("");
                    setIsCategoryOpen(false);
                  }}
                  className={`px-4 py-2 rounded-xl border-none cursor-pointer text-left ${
                    defaultCategoryId === ""
                      ? "bg-blue-100 text-blue-700 font-medium dark:bg-blue-900/50 dark:text-blue-300"
                      : "text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  None
                </button>
                {categories.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    role="option"
                    aria-selected={defaultCategoryId === c.id}
                    onClick={() => {
                      setDefaultCategoryId(c.id);
                      setIsCategoryOpen(false);
                    }}
                    className={`px-4 py-2 rounded-xl border-none cursor-pointer text-left ${
                      defaultCategoryId === c.id
                        ? "bg-blue-100 text-blue-700 font-medium dark:bg-blue-900/50 dark:text-blue-300"
                        : "text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      {counts && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
          <Stat label="Ready" value={counts.ready} tone="good" />
          <Stat label="No file found" value={counts["missing-file"]} />
          <Stat label="Ambiguous" value={counts["ambiguous-file"]} />
          <Stat label="Duplicate rows" value={counts["duplicate-row"]} />
          <Stat label="Bad category" value={counts["unknown-category"]} />
          <Stat label="Files not in CSV" value={orphanCount} />
        </div>
      )}
      {(busy || phase === "finished") && progress.total > 0 && (
        <div className="flex flex-col gap-2">
          <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-200"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="m-0 text-xs font-mono text-slate-600 dark:text-slate-400">
            {progress.done} uploaded · {progress.failed} failed ·{" "}
            {progress.total - progress.done - progress.failed} left
          </p>
        </div>
      )}
      {counts && (
        <div className="flex flex-wrap gap-2">
          {!busy && (
            <button
              type="button"
              className={btn}
              disabled={counts.ready === 0}
              onClick={start}
            >
              {phase === "finished" ? (
                "Upload remaining"
              ) : (
                <>
                  <FontAwesomeIcon icon={faUpload} className="w-4 h-4 mr-2" />
                  {counts.ready.toLocaleString()} file
                  {counts.ready === 1 ? "" : "s"}
                </>
              )}
            </button>
          )}
          {phase === "running" && (
            <button type="button" className={btn} onClick={pause}>
              Pause
            </button>
          )}
          {phase === "paused" && (
            <button type="button" className={btn} onClick={resume}>
              Resume
            </button>
          )}
          {busy && (
            <button type="button" className={btn} onClick={cancel}>
              Stop
            </button>
          )}
          {phase === "finished" && (
            <button type="button" className={btn} onClick={downloadFailures}>
              Download unfinished rows
            </button>
          )}
        </div>
      )}
      {itemsRef.current.length > 0 && (
        <>
          <div className="flex gap-2 text-xs">
            {(["all", "ready", "problems", "failed"] as Filter[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-full border-none cursor-pointer ${
                  filter === f
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
                    : "bg-gray-100 text-black dark:bg-gray-800 dark:text-white"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="max-h-72 overflow-y-auto flex flex-col gap-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-400">
            {visible.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl px-4 py-3 bg-gray-100 dark:bg-gray-800"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="m-0 text-sm truncate text-slate-900 dark:text-white">
                    {item.title}
                  </p>
                  <span className="text-[11px] font-mono whitespace-nowrap text-slate-500 dark:text-slate-400">
                    {item.upload === "done"
                      ? "uploaded"
                      : item.upload === "uploading"
                        ? "uploading…"
                        : item.upload === "failed"
                          ? "failed"
                          : status_label[item.status]}
                  </span>
                </div>
                <p className="m-0 mt-1 text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {item.artist} · {item.category || "no category"} · line{" "}
                  {item.line}
                  {item.matchTier === "aggressive" && " · loose name match"}
                </p>
                {item.error && (
                  <p className="m-0 mt-1 text-[11px] text-red-600 dark:text-red-400 truncate">
                    {item.error}
                  </p>
                )}
                {item.candidates && (
                  <div className="mt-2 flex flex-col gap-1">
                    <p className="m-0 text-[11px] text-slate-500 dark:text-slate-400">
                      Pick the right file:
                    </p>
                    {item.candidates.map((f) => (
                      <button
                        key={f.webkitRelativePath || f.name}
                        type="button"
                        onClick={() => resolveAmbiguity(item, f)}
                        className="text-left text-[11px] px-3 py-1.5 rounded-xl bg-white/60 dark:bg-black/30 border-none cursor-pointer text-slate-800 dark:text-slate-200"
                      >
                        {f.webkitRelativePath || f.name} ·{" "}
                        {(f.size / 1048576).toFixed(2)} MB
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {visible.length === 0 && (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Nothing in this view.
              </p>
            )}
          </div>
          {itemsRef.current.length > visible.length && (
            <p className="m-0 text-[11px] text-slate-500 dark:text-slate-400">
              Showing {visible.length} of{" "}
              {itemsRef.current.length.toLocaleString()} rows.
            </p>
          )}
        </>
      )}
    </div>
  );
};

const Stat: React.FC<{ label: string; value: number; tone?: "good" }> = ({
  label,
  value,
  tone,
}) => (
  <div className="rounded-2xl px-3 py-2 bg-gray-100 dark:bg-gray-800">
    <p
      className={`m-0 font-mono text-base ${
        tone === "good"
          ? "text-green-700 dark:text-green-400"
          : value > 0
            ? "text-amber-700 dark:text-amber-400"
            : "text-slate-500 dark:text-slate-400"
      }`}
    >
      {value.toLocaleString()}
    </p>
    <p className="m-0 text-[11px] text-slate-500 dark:text-slate-400">
      {label}
    </p>
  </div>
);

export default BulkCsvUpload;

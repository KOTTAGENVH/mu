"use client";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAudioEq, EqBand } from "@/contextApi/audioEnhance";
import {
  Chart,
  RadarController,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
} from "chart.js";
import {
  databaseStatus,
  deleteLeastStreamedSongs,
  deleteSong,
  leastStreamedSongs,
  storageStatus,
} from "@/app/api/client/services/audio/api";
import {
  Cloud,
  Database,
  RotateCw,
  Search,
  Skull,
  SlidersHorizontal,
  Trash2,
  TrendingDown,
} from "lucide-react";
import { useMask } from "@/contextApi/mask";
import DeleteSongModal from "./deleteConfirmation";
import SessionInsightsCard from "./sessionInsightsCard";
import {
  Card,
  CardError,
  ListSkeleton,
  StorageCard,
} from "./statusDisplay/helper";

export interface Candidate {
  id: string;
  name: string;
  artist: string;
  playCount: number;
  skipCount: number;
}

export interface LeastListenedResponse {
  success: boolean;
  count: number;
  percentile: string;
  candidates: Candidate[];
}

export interface UsageState {
  loading: boolean;
  error: boolean;
  usedBytes: number;
  totalBytes: number;
  count: number;
}

Chart.register(
  RadarController,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
);

const percentile = 30;
const mb = 1024 ** 2;

const bands: { key: EqBand; label: string }[] = [
  { key: "100", label: "Bass" },
  { key: "300", label: "Low mid" },
  { key: "1000", label: "Mid" },
  { key: "4000", label: "High mid" },
  { key: "12000", label: "Treble" },
];

export const pill =
  "inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold";
const grey =
  "bg-slate-100 text-slate-700 dark:bg-white/[0.08] dark:text-slate-300";

const sliderClass = `w-full min-w-0 flex-1 h-1.5 cursor-pointer appearance-none rounded-full bg-slate-200 outline-none dark:bg-slate-700
  focus-visible:ring-2 focus-visible:ring-blue-500/40
  [&::-webkit-slider-thumb]:h-[18px] [&::-webkit-slider-thumb]:w-[18px] [&::-webkit-slider-thumb]:appearance-none
  [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-blue-500
  [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow [&::-webkit-slider-thumb]:transition-transform
  hover:[&::-webkit-slider-thumb]:scale-110
  [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full
  [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-blue-500 [&::-moz-range-thumb]:bg-white`;

const scrollbar = `[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full
  [&::-webkit-scrollbar-thumb]:bg-slate-300 dark:[&::-webkit-scrollbar-thumb]:bg-slate-600`;

const initialUsage: UsageState = {
  loading: true,
  error: false,
  usedBytes: 0,
  totalBytes: 0,
  count: 0,
};

export function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(
    units.length - 1,
    Math.floor(Math.log(bytes) / Math.log(1024)),
  );
  const v = bytes / 1024 ** i;
  return `${v >= 100 ? v.toFixed(0) : v.toFixed(v >= 10 ? 1 : 2)} ${units[i]}`;
}

export function usageTone(pct: number) {
  if (pct >= 90)
    return {
      label: "Almost full",
      cls: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
    };
  if (pct >= 70)
    return {
      label: "Filling up",
      cls: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
    };
  return {
    label: "Healthy",
    cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  };
}

function StatusDisplay() {
  const chartRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<Chart | null>(null);
  const [db, setDb] = useState<UsageState>(initialUsage);
  const [r2, setR2] = useState<UsageState>(initialUsage);
  const [leastListened, setLeastListened] =
    useState<LeastListenedResponse | null>(null);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    songId: string;
    songName: string;
    leastlistened: boolean;
  }>({ isOpen: false, songId: "", songName: "", leastlistened: false });

  const { maskStatus } = useMask();
  const { eqValues, setEqValue, pan, setPan } = useAudioEq();
  const loadDb = useCallback(async (silent = false) => {
    if (!silent) setDb((s) => ({ ...s, loading: true, error: false }));
    try {
      const res = await databaseStatus();
      if (!res?.success) throw new Error("Database status failed");
      setDb({
        loading: false,
        error: false,
        usedBytes: parseFloat(res.storage.usedMB) * mb,
        totalBytes: parseFloat(res.storage.totalMB) * mb,
        count: Number(res.storage.documentCount) || 0,
      });
    } catch {
      setDb((s) => ({ ...s, loading: false, error: true }));
    }
  }, []);

  const loadR2 = useCallback(async (silent = false) => {
    if (!silent) setR2((s) => ({ ...s, loading: true, error: false }));
    try {
      const res = await storageStatus();
      if (!res?.success) throw new Error("Storage status failed");
      setR2({
        loading: false,
        error: false,
        usedBytes: Number(res.storage.usedBytes) || 0,
        totalBytes: Number(res.storage.totalBytes) || 0,
        count: Number(res.storage.fileCount) || 0,
      });
    } catch {
      setR2((s) => ({ ...s, loading: false, error: true }));
    }
  }, []);

  const loadList = useCallback(async (silent = false) => {
    if (!silent) setListLoading(true);
    setListError(false);
    try {
      const data: LeastListenedResponse = await leastStreamedSongs(percentile);
      if (!data?.success) throw new Error("Least listened failed");
      setLeastListened(data);
    } catch {
      setListError(true);
    } finally {
      if (!silent) setListLoading(false);
    }
  }, []);

  const refreshAll = useCallback(
    (silent = false) => {
      loadDb(silent);
      loadR2(silent);
      loadList(silent);
    },
    [loadDb, loadR2, loadList],
  );

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  const anyLoading = db.loading || r2.loading || listLoading;

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        const data = await deleteSong(id);
        if (!data?.success)
          throw new Error(data?.message || "Failed to delete");
      } catch (error) {
        alert(
          error instanceof Error
            ? error.message
            : "An error occurred while deleting.",
        );
        throw error;
      }
      setLeastListened((prev) =>
        prev
          ? {
              ...prev,
              count: Math.max(0, prev.count - 1),
              candidates: prev.candidates.filter((c) => c.id !== id),
            }
          : prev,
      );
      refreshAll(true);
    },
    [refreshAll],
  );

  const runBulkDelete = useCallback(
    async (percentile: number) => {
      try {
        const data = await deleteLeastStreamedSongs(percentile);
        if (!data?.success)
          throw new Error(data?.message || "Failed to delete songs");
      } catch (error) {
        alert(
          error instanceof Error
            ? error.message
            : "An error occurred while deleting.",
        );
        throw error;
      }
      refreshAll(true);
    },
    [refreshAll],
  );

  const handleDeleteLeastListened = useCallback(
    () => runBulkDelete(percentile),
    [runBulkDelete],
  );
  const handleDeleteAll = useCallback(
    () => runBulkDelete(100),
    [runBulkDelete],
  );

  const closeModal = () =>
    setDeleteModal({
      isOpen: false,
      songId: "",
      songName: "",
      leastlistened: false,
    });

  const candidates = useMemo(() => {
    const list = leastListened?.candidates ?? [];
    const q = searchQuery.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (c) =>
        c.name.toLowerCase().includes(q) || c.artist?.toLowerCase().includes(q),
    );
  }, [leastListened, searchQuery]);

  useEffect(() => {
    if (!chartRef.current) return;
    const data = bands.map((b) => eqValues[b.key] || 0);

    if (chartInstanceRef.current) {
      chartInstanceRef.current.data.datasets[0].data = data;
      chartInstanceRef.current.update();
      return;
    }

    chartInstanceRef.current = new Chart(chartRef.current, {
      type: "radar",
      data: {
        labels: bands.map((b) => b.label),
        datasets: [
          {
            label: "EQ level (dB)",
            data,
            backgroundColor: "rgba(59, 130, 246, 0.2)",
            borderColor: "rgba(59, 130, 246, 1)",
            borderWidth: 2,
            pointBackgroundColor: "rgba(59, 130, 246, 1)",
            pointBorderColor: "#fff",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          r: {
            min: -15,
            max: 15,
            ticks: { stepSize: 5, display: false },
            grid: { color: "rgba(128, 128, 128, 0.2)" },
            angleLines: { color: "rgba(128, 128, 128, 0.2)" },
            pointLabels: { color: "#64748b", font: { size: 13 } },
          },
        },
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: (ctx) => ` ${ctx.raw} dB` } },
        },
      },
    });
  }, [eqValues]);

  useEffect(() => {
    return () => {
      chartInstanceRef.current?.destroy();
      chartInstanceRef.current = null;
    };
  }, []);

  const panLabel =
    pan === 0
      ? "Center"
      : pan < 0
        ? `L ${Math.round(Math.abs(pan) * 100)}%`
        : `R ${Math.round(pan * 100)}%`;

  const valueBadge = (active: boolean) =>
    active
      ? "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
      : "bg-slate-100 text-slate-600 dark:bg-white/[0.06] dark:text-slate-400";

  return (
    <>
      <div className="mx-auto mb-8 mt-6 w-full max-w-[1600px]">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Overview
          </h2>
          <button
            type="button"
            onClick={() => refreshAll()}
            disabled={anyLoading}
            className="inline-flex items-center gap-2 rounded-full border-none bg-transparent px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors cursor-pointer
              hover:bg-white/60 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60
              dark:text-slate-400 dark:hover:bg-white/[0.06] dark:hover:text-white"
          >
            <RotateCw
              className={`h-4 w-4 ${anyLoading ? "animate-spin motion-reduce:animate-none" : ""}`}
            />
            Refresh
          </button>
        </div>
        <div className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 items-start gap-4 sm:gap-6 xl:grid-cols-3">
            <div className="grid min-w-0 grid-cols-1 gap-4 sm:gap-6 xl:col-span-2">
              <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2">
                <StorageCard
                  title="Database"
                  icon={Database}
                  state={db}
                  ringClass="stroke-blue-500"
                  countLabel="Documents"
                  avgLabel="Avg per document"
                  onRetry={() => loadDb()}
                />
                <StorageCard
                  title="Cloud storage"
                  icon={Cloud}
                  state={r2}
                  ringClass="stroke-amber-500"
                  countLabel="Files"
                  avgLabel="Avg per file"
                  onRetry={() => loadR2()}
                />
              </div>
              <Card
                title="Sound"
                icon={SlidersHorizontal}
                meta={<span className={`${pill} ${grey}`}>±15 dB</span>}
              >
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:items-center">
                  <div className="relative mx-auto h-56 w-full min-w-0 max-w-sm sm:h-64">
                    <canvas
                      ref={chartRef}
                      role="img"
                      aria-label="Current equalizer shape"
                    />
                  </div>
                  <div className="space-y-4">
                    {bands.map((band) => {
                      const v = eqValues[band.key] ?? 0;
                      return (
                        <div
                          key={band.key}
                          className="flex items-center gap-2 sm:gap-3"
                        >
                          <label
                            htmlFor={`eq-${band.key}`}
                            className="w-16 shrink-0 text-sm font-medium text-slate-600 dark:text-slate-400"
                          >
                            {band.label}
                          </label>
                          <input
                            id={`eq-${band.key}`}
                            type="range"
                            min="-15"
                            max="15"
                            step="1"
                            value={v}
                            onChange={(e) =>
                              setEqValue(band.key, parseFloat(e.target.value))
                            }
                            className={sliderClass}
                          />
                          <span
                            className={`w-14 shrink-0 rounded-md px-1 py-1 text-center font-mono text-xs font-semibold tabular-nums sm:w-16 sm:px-2 ${valueBadge(v !== 0)}`}
                          >
                            {v > 0 ? `+${v}` : v} dB
                          </span>
                        </div>
                      );
                    })}
                    <div className="border-t border-slate-100 pt-4 dark:border-white/[0.07]">
                      <div className="mb-3 flex items-center justify-between">
                        <label
                          htmlFor="eq-pan"
                          className="text-sm font-semibold text-slate-600 dark:text-slate-400"
                        >
                          Left / right balance
                        </label>
                        <span
                          className={`rounded-md px-2 py-1 font-mono text-xs font-semibold ${valueBadge(pan !== 0)}`}
                        >
                          {panLabel}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3">
                        <span className="w-4 text-center text-sm font-bold text-slate-500 dark:text-slate-400">
                          L
                        </span>
                        <input
                          id="eq-pan"
                          type="range"
                          min="-1"
                          max="1"
                          step="0.1"
                          value={pan}
                          onChange={(e) => setPan(parseFloat(e.target.value))}
                          className={sliderClass}
                        />
                        <span className="w-4 text-center text-sm font-bold text-slate-500 dark:text-slate-400">
                          R
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
            <div className="min-w-0">
              <Card
                title="Least listened"
                icon={TrendingDown}
                meta={
                  leastListened && !listLoading && !listError ? (
                    <span className={`${pill} ${grey} tabular-nums`}>
                      {leastListened.count.toLocaleString()}{" "}
                      {leastListened.count === 1 ? "track" : "tracks"}
                    </span>
                  ) : null
                }
              >
                <p className="-mt-2 mb-3 text-xs text-slate-500 dark:text-slate-400">
                  Bottom {percentile}% of your library by plays. Review before
                  deleting.
                </p>

                {listLoading ? (
                  <ListSkeleton />
                ) : listError ? (
                  <CardError
                    message="Couldn't load least listened tracks."
                    onRetry={() => loadList()}
                  />
                ) : (
                  <>
                    <div className="relative mb-3">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search these tracks"
                        aria-label="Search least listened tracks"
                        className="w-full rounded-xl border-none bg-slate-100 py-2.5 pl-9 pr-3 text-base text-slate-900 placeholder-slate-500
                          focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:bg-white/[0.06] dark:text-white dark:placeholder-slate-400 sm:text-sm"
                      />
                    </div>
                    {candidates.length > 0 ? (
                      <ul
                        className={`max-h-72 xl:max-h-[26rem] space-y-2 overflow-y-auto overscroll-contain pr-1 ${scrollbar}`}
                      >
                        {candidates.map((c) => {
                          const shownName = maskStatus ? "xxxx" : c.name;
                          return (
                            <li
                              key={c.id}
                              className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5 dark:bg-white/[0.04]"
                            >
                              <div className="min-w-0 flex-1">
                                <p
                                  title={maskStatus ? undefined : c.name}
                                  className="truncate text-sm font-medium text-slate-900 dark:text-white"
                                >
                                  {shownName}
                                </p>
                                <p className="mt-0.5 font-mono text-xs">
                                  <span className="text-blue-600 dark:text-blue-400">
                                    {c.playCount}{" "}
                                    {c.playCount === 1 ? "play" : "plays"}
                                  </span>
                                  <span className="text-slate-400"> · </span>
                                  <span className="text-red-500 dark:text-red-400">
                                    {c.skipCount}{" "}
                                    {c.skipCount === 1 ? "skip" : "skips"}
                                  </span>
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  setDeleteModal({
                                    isOpen: true,
                                    songId: c.id,
                                    songName: shownName,
                                    leastlistened: false,
                                  })
                                }
                                title="Delete"
                                aria-label={`Delete ${shownName}`}
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-none bg-red-100 text-red-600 transition-colors cursor-pointer
                                  hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-800/50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                        {searchQuery
                          ? "No matching tracks."
                          : "Nothing here. Every track is getting played."}
                      </p>
                    )}
                    <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4 dark:border-white/[0.07]">
                      <button
                        type="button"
                        disabled={!leastListened?.count}
                        onClick={() =>
                          setDeleteModal({
                            isOpen: true,
                            songId: "",
                            songName: `the bottom ${percentile}% of your library`,
                            leastlistened: true,
                          })
                        }
                        className="inline-flex min-w-[10rem] flex-1 items-center justify-center gap-2 rounded-full border-none bg-red-100 px-4 py-2.5 text-sm font-semibold text-red-700 transition-colors cursor-pointer
                          hover:bg-red-200 disabled:cursor-not-allowed disabled:opacity-50
                          dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-800/50"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete bottom {percentile}%
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setDeleteModal({
                            isOpen: true,
                            songId: "",
                            songName: "ALL audio in your library",
                            leastlistened: false,
                          })
                        }
                        className="inline-flex min-w-[10rem] flex-1 items-center justify-center gap-2 rounded-full border border-red-300 bg-transparent px-4 py-2.5 text-sm font-semibold text-red-600 transition-colors cursor-pointer
                          hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/40"
                      >
                        <Skull className="h-4 w-4" />
                        Delete all audio
                      </button>
                    </div>
                  </>
                )}
              </Card>
            </div>
          </div>
          <SessionInsightsCard />
        </div>
      </div>
      {deleteModal.isOpen && (
        <DeleteSongModal
          id={deleteModal.songId}
          songName={deleteModal.songName}
          leastlistened={deleteModal.leastlistened}
          handleClose={closeModal}
          handleDelete={handleDelete}
          handleDeleteLeastListened={handleDeleteLeastListened}
          handleDeleteAll={handleDeleteAll}
        />
      )}
    </>
  );
}

export default StatusDisplay;

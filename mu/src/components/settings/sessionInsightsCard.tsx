"use client";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Chart,
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  ChartConfiguration,
} from "chart.js";
import {
  getAuthInsights,
  revokeSession,
} from "@/app/api/client/services/auth/api";
import { KeyRound, ShieldAlert, ShieldCheck, Trash2 } from "lucide-react";
import { MiniStat, tabClass } from "./statusDisplay/helper";

Chart.register(
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
);

interface SessionRow {
  sessionId: string;
  ip: string;
  createdAt: string;
}

interface GraphPoint {
  day: string;
  logins: number;
  failures: number;
}

interface Assessment {
  suspicious: boolean;
  recentFailures: number;
  failuresBeforeLastSuccess: number;
  knownIpCount: number;
}

const pill =
  "inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold";

function formatDay(day: string) {
  const d = new Date(`${day}T00:00:00`);
  return isNaN(d.getTime())
    ? day
    : d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

function formatWhen(iso: string) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "Unknown time";
  return d.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function SessionInsightsCard() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [view, setView] = useState<"graph" | "sessions">("graph");
  const [graph, setGraph] = useState<GraphPoint[]>([]);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(false);
    try {
      const data = await getAuthInsights();
      if (!data?.success) throw new Error("Insights failed");
      setGraph(data.graph ?? []);
      setSessions(data.sessions ?? []);
      setAssessment(data.assessment ?? null);
    } catch {
      setError(true);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const totals = useMemo(
    () =>
      graph.reduce(
        (acc, g) => ({
          logins: acc.logins + g.logins,
          failures: acc.failures + g.failures,
        }),
        { logins: 0, failures: 0 },
      ),
    [graph],
  );

  useEffect(() => {
    if (loading || view !== "graph" || !canvasRef.current || graph.length === 0)
      return;
    chartRef.current?.destroy();

    const config: ChartConfiguration<"bar"> = {
      type: "bar",
      data: {
        labels: graph.map((g) => formatDay(g.day)),
        datasets: [
          {
            label: "Sign-ins",
            data: graph.map((g) => g.logins),
            backgroundColor: "#3b82f6",
            borderRadius: 4,
          },
          {
            label: "Failed",
            data: graph.map((g) => g.failures),
            backgroundColor: "#ef4444",
            borderRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: "#94a3b8", maxRotation: 0, autoSkip: true },
          },
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1, precision: 0, color: "#94a3b8" },
            grid: { color: "rgba(128,128,128,0.15)" },
          },
        },
        plugins: { legend: { display: false } },
      },
    };

    chartRef.current = new Chart(canvasRef.current, config);

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [loading, view, graph]);

  const handleRevoke = async (sessionId: string) => {
    setRevokingId(sessionId);
    try {
      const res = await revokeSession(sessionId);
      if (!res?.success) throw new Error("Revoke failed");
      setSessions((prev) => prev.filter((s) => s.sessionId !== sessionId));
      setConfirmingId(null);
    } catch {
      alert("Couldn't revoke that session. Please try again.");
      load(true);
    } finally {
      setRevokingId(null);
    }
  };

  return (
    <section
      className="flex min-w-0 flex-col rounded-2xl bg-white p-4 ring-1 ring-slate-200
        dark:bg-[#0e1628] dark:ring-white/[0.07] sm:p-5"
    >
      <header className="mb-4 flex items-center gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
          <KeyRound className="h-4 w-4" aria-hidden="true" />
        </span>
        <h3 className="min-w-0 flex-1 truncate text-base font-semibold text-slate-900 dark:text-white">
          Sign in security
        </h3>
        {!loading && !error && graph.length > 0 && (
          <span
            className={`${pill} bg-slate-100 text-slate-700 dark:bg-white/[0.08] dark:text-slate-300`}
          >
            Last {graph.length} days
          </span>
        )}
      </header>
      {loading ? (
        <div
          aria-hidden="true"
          className="animate-pulse space-y-3 motion-reduce:animate-none"
        >
          <div className="h-10 rounded-xl bg-slate-100 dark:bg-white/[0.05]" />
          <div className="grid grid-cols-2 gap-2">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-16 rounded-xl bg-slate-100 dark:bg-white/[0.05]"
              />
            ))}
          </div>
          <div className="h-48 rounded-xl bg-slate-100 dark:bg-white/[0.05]" />
        </div>
      ) : error ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 py-6 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Couldn&apos;t load sign-in activity.
          </p>
          <button
            type="button"
            onClick={() => load()}
            className="rounded-full border-none bg-slate-100 px-4 py-2 text-sm font-medium text-slate-800 transition-colors cursor-pointer
              hover:bg-slate-200 dark:bg-white/[0.08] dark:text-white dark:hover:bg-white/[0.14]"
          >
            Try again
          </button>
        </div>
      ) : (
        <>
          {assessment && (
            <div
              role="status"
              className={`mb-3 flex items-start gap-2 rounded-xl px-3 py-2.5 text-sm ${
                assessment.suspicious
                  ? "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300"
                  : "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
              }`}
            >
              {assessment.suspicious ? (
                <ShieldAlert
                  className="mt-0.5 h-4 w-4 shrink-0"
                  aria-hidden="true"
                />
              ) : (
                <ShieldCheck
                  className="mt-0.5 h-4 w-4 shrink-0"
                  aria-hidden="true"
                />
              )}
              <span>
                {assessment.suspicious ? (
                  <>
                    <strong className="font-semibold">Review needed.</strong>{" "}
                    {assessment.recentFailures} failed sign-in
                    {assessment.recentFailures === 1 ? "" : "s"} recently
                    {assessment.failuresBeforeLastSuccess > 0 &&
                      `, ${assessment.failuresBeforeLastSuccess} right before your last successful sign-in`}
                    .
                  </>
                ) : (
                  "No unusual activity detected."
                )}
              </span>
            </div>
          )}
          <dl className="mb-4 grid grid-cols-2 gap-2">
            <MiniStat
              label="Sign ins"
              value={totals.logins}
              dot="bg-blue-500"
            />
            <MiniStat label="Failed" value={totals.failures} dot="bg-red-500" />
            <MiniStat label="Active sessions" value={sessions.length} />
            <MiniStat label="Known IPs" value={assessment?.knownIpCount ?? 0} />
          </dl>
          <div
            role="tablist"
            aria-label="Sign-in details"
            className="mb-3 inline-flex w-full gap-1 rounded-xl bg-slate-100 p-1 dark:bg-white/[0.05] sm:w-auto sm:self-start"
          >
            <button
              type="button"
              role="tab"
              aria-selected={view === "graph"}
              onClick={() => setView("graph")}
              className={`flex-1 sm:flex-none ${tabClass(view === "graph")}`}
            >
              Activity
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={view === "sessions"}
              onClick={() => setView("sessions")}
              className={`flex-1 sm:flex-none ${tabClass(view === "sessions")}`}
            >
              Sessions ({sessions.length})
            </button>
          </div>
          {view === "graph" ? (
            graph.length > 0 ? (
              <div className="relative h-48 w-full sm:h-56">
                <canvas
                  ref={canvasRef}
                  role="img"
                  aria-label="Sign-ins and failed attempts per day"
                />
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                No sign-in activity yet.
              </p>
            )
          ) : sessions.length > 0 ? (
            <ul
              className="max-h-72 space-y-2 overflow-y-auto overscroll-contain pr-1
                [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full
                [&::-webkit-scrollbar-thumb]:bg-slate-300 dark:[&::-webkit-scrollbar-thumb]:bg-slate-600"
            >
              {sessions.map((s) => {
                const confirming = confirmingId === s.sessionId;
                const revoking = revokingId === s.sessionId;
                return (
                  <li
                    key={s.sessionId}
                    className={`rounded-xl px-3 py-2.5 transition-colors ${
                      confirming
                        ? "bg-red-50 dark:bg-red-950/40"
                        : "bg-slate-50 dark:bg-white/[0.04]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-mono text-sm font-medium text-slate-900 dark:text-white">
                          {s.ip}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Signed in {formatWhen(s.createdAt)}
                        </p>
                      </div>
                      {!confirming && (
                        <button
                          type="button"
                          onClick={() => setConfirmingId(s.sessionId)}
                          title="Revoke session"
                          aria-label={`Revoke session from ${s.ip}`}
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-none bg-red-100 text-red-600 transition-colors cursor-pointer
                            hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-800/50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    {confirming && (
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <p className="min-w-0 flex-1 text-xs text-red-700 dark:text-red-300">
                          That device will be signed out.
                        </p>
                        <button
                          type="button"
                          onClick={() => setConfirmingId(null)}
                          disabled={revoking}
                          className="rounded-full border-none bg-transparent px-3 py-1.5 text-xs font-medium text-slate-600 cursor-pointer
                            hover:bg-white/70 disabled:opacity-50 dark:text-slate-300 dark:hover:bg-white/10"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRevoke(s.sessionId)}
                          disabled={revoking}
                          className="rounded-full border-none bg-red-500 px-3 py-1.5 text-xs font-semibold text-white cursor-pointer
                            hover:bg-red-600 disabled:opacity-60"
                        >
                          {revoking ? "Revoking…" : "Revoke"}
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
              No active sessions.
            </p>
          )}
        </>
      )}
    </section>
  );
}

export default SessionInsightsCard;

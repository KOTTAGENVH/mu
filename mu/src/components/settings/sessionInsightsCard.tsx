"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
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
import { ShieldAlert, ShieldCheck, ArrowLeft, LucideTrash } from "lucide-react";
import Loader from "@/components/loader";

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

function SessionInsightsCard() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"graph" | "sessions">("graph");
  const [graph, setGraph] = useState<GraphPoint[]>([]);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [assessment, setAssessment] = useState<Assessment | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAuthInsights();
      if (data.success) {
        setGraph(data.graph);
        setSessions(data.sessions);
        setAssessment(data.assessment);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (view !== "graph" || !canvasRef.current || graph.length === 0) return;
    if (chartRef.current) chartRef.current.destroy();

    const config: ChartConfiguration<"bar"> = {
      type: "bar",
      data: {
        labels: graph.map((g) => g.day.slice(5)),
        datasets: [
          {
            label: "Logins",
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
          x: { grid: { display: false }, ticks: { color: "gray" } },
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1, color: "gray" },
            grid: { color: "rgba(128,128,128,0.15)" },
          },
        },
        plugins: { legend: { display: true, labels: { color: "gray" } } },
      },
    };
    chartRef.current = new Chart(canvasRef.current, config);

    return () => {
      if (chartRef.current) chartRef.current.destroy();
    };
  }, [view, graph]);

  const handleRevoke = async (sessionId: string) => {
    if (!confirm("Revoke this session? That device will be logged out."))
      return;
    setSessions((prev) => prev.filter((s) => s.sessionId !== sessionId));
    try {
      const res = await revokeSession(sessionId);
      if (!res.success) load(); // resync on failure
    } catch {
      load();
    }
  };

  const fmt = (iso: string) =>
    new Date(iso).toLocaleString("en-IN", {
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

  return (
    <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-xl shadow-sm border-none flex flex-col items-center h-96 w-full max-w-sm">
      <div className="w-full h-full flex flex-col overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg md:text-xl text-black dark:text-white uppercase">
            {view === "graph" ? "Auth Activity" : "Sessions"}
          </h3>
          {view === "graph" ? (
            <button
              onClick={() => setView("sessions")}
              className="text-xs px-3 py-1.5 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-500/20 transition-colors border-none cursor-pointer"
            >
              Sessions ({sessions.length})
            </button>
          ) : (
            <button
              onClick={() => setView("graph")}
              className="text-xs flex items-center gap-1 px-3 py-1.5 rounded-full bg-gray-200 text-slate-700 dark:bg-gray-700 dark:text-slate-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors border-none cursor-pointer"
            >
              <ArrowLeft className="w-3 h-3" /> Graph
            </button>
          )}
        </div>

        {/* intrusion banner */}
        {assessment && (
          <div
            className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg mb-3 ${
              assessment.suspicious
                ? "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400"
                : "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
            }`}
          >
            {assessment.suspicious ? (
              <ShieldAlert className="w-4 h-4 shrink-0" />
            ) : (
              <ShieldCheck className="w-4 h-4 shrink-0" />
            )}
            <span>
              {assessment.suspicious
                ? `Review: ${assessment.recentFailures} recent failed attempt(s)`
                : "No unusual activity detected"}
            </span>
          </div>
        )}

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader />
          </div>
        ) : view === "graph" ? (
          <div className="w-full flex-1 relative">
            {graph.length > 0 ? (
              <canvas ref={canvasRef} />
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-slate-500 dark:text-slate-400">
                No auth activity yet
              </div>
            )}
          </div>
        ) : (
          <div className="w-full flex-1 overflow-y-auto pr-1 space-y-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-600 dark:[&::-webkit-scrollbar-thumb]:bg-gray-300">
            {sessions.length > 0 ? (
              sessions.map((s) => (
                <div
                  key={s.sessionId}
                  className="flex items-center justify-between p-3 rounded-2xl bg-black/10 dark:bg-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  <div className="min-w-0 flex-1 mr-3">
                    <p className="text-sm font-medium text-black dark:text-white truncate">
                      {s.ip}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {fmt(s.createdAt)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRevoke(s.sessionId)}
                    title="Revoke session"
                    className="p-2 rounded-full border-none cursor-pointer bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-800 transition-colors"
                  >
                    <LucideTrash className="w-4 h-4" />
                  </button>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-sm text-slate-500 dark:text-slate-400">
                No active sessions
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default SessionInsightsCard;

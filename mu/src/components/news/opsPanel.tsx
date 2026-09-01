"use client";
import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Check, Loader2, Play } from "lucide-react";
import { inter, roboto } from "@/app/fonts";
import {
  cronJobLabels,
  triggerCronJob,
  type CronJob,
} from "@/app/api/client/services/news/cron_job/api";

type JobState =
  | { status: "idle" }
  | { status: "running" }
  | { status: "done"; message: string; durationMs: number }
  | { status: "failed"; message: string };

const destructive: CronJob = "storageStatus";

const jobOrder = Object.keys(cronJobLabels) as CronJob[];

function OpsPanel() {
  const [states, setStates] = useState<Record<string, JobState>>({});
  const [confirming, setConfirming] = useState(false);

  const run = async (job: CronJob) => {
    setStates((prev) => ({ ...prev, [job]: { status: "running" } }));

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 120_000);

    try {
      const result = await triggerCronJob(job, controller.signal);
      const saved = result.data?.saved;
      const deleted = result.data?.deleted;
      const detail =
        typeof saved === "number"
          ? `${saved} saved`
          : typeof deleted === "number"
            ? `${deleted} deleted`
            : (result.data?.message ?? "Finished");

      setStates((prev) => ({
        ...prev,
        [job]: {
          status: "done",
          message: detail,
          durationMs: result.durationMs,
        },
      }));
    } catch (err) {
      setStates((prev) => ({
        ...prev,
        [job]: {
          status: "failed",
          message: err instanceof Error ? err.message : "Failed",
        },
      }));
    } finally {
      clearTimeout(timer);
    }
  };

  const anyRunning = Object.values(states).some((s) => s.status === "running");

  return (
    <section className="mt-6">
      <div className="flex items-baseline justify-between gap-4 flex-wrap">
        <h2
          className={`${inter.className} text-lg font-semibold text-black dark:text-white`}
        >
          Operations
        </h2>
        <p
          className={`${roboto.className} text-xs text-black/50 dark:text-white/50`}
        >
          {anyRunning
            ? "A job is running (: this can take a minute :)"
            : "Trigger a scrape to refresh the archive"}
        </p>
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {jobOrder
          .filter((job) => job !== destructive)
          .map((job) => {
            const state = states[job] ?? { status: "idle" };
            return (
              <button
                key={job}
                onClick={() => run(job)}
                disabled={state.status === "running"}
                className="group flex items-center gap-3 p-4 rounded-2xl text-left border-none cursor-pointer
                  bg-black/5 dark:bg-white/5 backdrop-blur-sm
                  hover:bg-black/10 dark:hover:bg-white/10 transition-colors duration-200
                  disabled:opacity-60 disabled:cursor-not-allowed
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
              >
                <span
                  className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center
                    ${
                      state.status === "done"
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                        : state.status === "failed"
                          ? "bg-red-500/15 text-red-600 dark:text-red-400"
                          : "bg-black/5 dark:bg-white/10 text-black/60 dark:text-white/60"
                    }`}
                >
                  {state.status === "running" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : state.status === "done" ? (
                    <Check className="w-4 h-4" />
                  ) : state.status === "failed" ? (
                    <AlertTriangle className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                </span>

                <span className="min-w-0">
                  <span
                    className={`${inter.className} block text-sm font-medium text-black dark:text-white truncate`}
                  >
                    {cronJobLabels[job]}
                  </span>
                  <span
                    className={`${roboto.className} block text-[11px] text-black/50 dark:text-white/50 truncate`}
                  >
                    {state.status === "done"
                      ? `${state.message} · ${(state.durationMs / 1000).toFixed(1)}s`
                      : state.status === "failed"
                        ? state.message
                        : state.status === "running"
                          ? "Running"
                          : "Not run yet"}
                  </span>
                </span>
              </button>
            );
          })}
      </div>
      <div className="mt-6 p-4 rounded-2xl bg-red-500/5 border border-red-500/20">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <h3
              className={`${inter.className} text-sm font-semibold text-black dark:text-white`}
            >
              {cronJobLabels[destructive]}
            </h3>
            <p
              className={`${roboto.className} mt-1 text-xs text-black/50 dark:text-white/50`}
            >
              Checks storage usage. Above 70% it permanently deletes the oldest
              unpinned stories.
            </p>

            <AnimatePresence mode="wait">
              {confirming ? (
                <motion.div
                  key="confirm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex gap-2 mt-3"
                >
                  <button
                    onClick={() => {
                      setConfirming(false);
                      run(destructive);
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-medium bg-red-500 text-white border-none cursor-pointer
                      hover:bg-red-600 transition-colors"
                  >
                    Yes, run cleanup
                  </button>
                  <button
                    onClick={() => setConfirming(false)}
                    className="px-4 py-2 rounded-xl text-xs bg-black/5 dark:bg-white/10 text-black dark:text-white
                      border-none cursor-pointer hover:bg-black/10 dark:hover:bg-white/20 transition-colors"
                  >
                    Cancel
                  </button>
                </motion.div>
              ) : (
                <motion.button
                  key="trigger"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setConfirming(true)}
                  disabled={states[destructive]?.status === "running"}
                  className="mt-3 px-4 py-2 rounded-xl text-xs font-medium border-none cursor-pointer
                    bg-black/5 dark:bg-white/10 text-black dark:text-white
                    hover:bg-black/10 dark:hover:bg-white/20 transition-colors
                    disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {states[destructive]?.status === "running"
                    ? "Running cleanup"
                    : "Run cleanup"}
                </motion.button>
              )}
            </AnimatePresence>

            {states[destructive]?.status === "done" && (
              <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-400">
                {(states[destructive] as { message: string }).message}
              </p>
            )}
            {states[destructive]?.status === "failed" && (
              <p className="mt-2 text-xs text-red-600 dark:text-red-400">
                {(states[destructive] as { message: string }).message}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default OpsPanel;

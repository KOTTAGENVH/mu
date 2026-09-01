"use client";
import React, { useCallback, useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Archive, Loader2, Search, X } from "lucide-react";
import { inter, roboto } from "@/app/fonts";
import {
  NewsSource,
  getCyberHistory,
  getHistory,
  getHistoryByDate,
  getHistoryBySource,
  getIrdHistory,
  newsSourceLabels,
  searchHistory,
  type HistoryItem,
} from "@/app/api/client/services/news/history/api";
import { toCards } from "@/lib/news/normalize";
import {
  NewsCard,
  type NewsCardData,
} from "./newsCard";
import { EmptyState } from "./emptyStateCard";
import { NewsCardSkeleton } from "./newsCardSkeleton";
import CalendarPicker, { todayKey } from "../calenarPicker";


type Mode = "all" | "source" | "ird" | "cyber" | "date" | "search";

const modes: Array<{ key: Mode; label: string }> = [
  { key: "all", label: "Everything" },
  { key: "source", label: "By source" },
  { key: "ird", label: "Tax" },
  { key: "cyber", label: "Cyber" },
  { key: "date", label: "By date" },
  { key: "search", label: "Search" },
];

function ArchiveDesk() {
  const [mode, setMode] = useState<Mode>("all");
  const [source, setSource] = useState<NewsSource>(NewsSource.Lankadeepa);
 const [date, setDate] = useState(todayKey());
  const [term, setTerm] = useState("");
  const [debounced, setDebounced] = useState("");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<NewsCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(term), 400);
    return () => clearTimeout(timer);
  }, [term]);

  const load = useCallback(
    async (targetPage: number) => {
      if (mode === "search" && debounced.trim() === "") {
        setItems([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const result =
          mode === "source"
            ? await getHistoryBySource(source, targetPage)
            : mode === "ird"
              ? await getIrdHistory(targetPage)
              : mode === "cyber"
                ? await getCyberHistory(targetPage)
                : mode === "date"
                  ? await getHistoryByDate(date, targetPage)
                  : mode === "search"
                    ? await searchHistory(debounced, 20)
                    : await getHistory(targetPage);

        const rows = (result.data ?? []) as HistoryItem[];
        const cards = toCards(rows);
        setItems((prev) => (targetPage > 1 ? [...prev, ...cards] : cards));
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Could not read the archive",
        );
        if (targetPage === 1) setItems([]);
      } finally {
        setLoading(false);
      }
    },
    [mode, source, date, debounced],
  );

  useEffect(() => {
    setPage(1);
  }, [mode, source, date, debounced]);

  useEffect(() => {
    load(page);
  }, [load, page]);

  const canPage = mode !== "search" && items.length > 0;

  return (
    <section className="mt-6">
      <div className="flex items-baseline justify-between gap-4 flex-wrap">
        <h2
          className={`${inter.className} text-lg font-semibold text-black dark:text-white`}
        >
          Archive
        </h2>
        <p
          className={`${roboto.className} text-xs text-black/50 dark:text-white/50`}
        >
          {loading && items.length === 0
            ? "Reading"
            : `${items.length} stored stories`}
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5 mt-4">
        {modes.map((option) => {
          const isActive = option.key === mode;
          return (
            <button
              key={option.key}
              onClick={() => setMode(option.key)}
              aria-pressed={isActive}
              className={`px-3 py-1.5 rounded-full text-xs border-none cursor-pointer transition-colors duration-150
                focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50
                ${
                  isActive
                    ? "bg-blue-500 text-white font-medium"
                    : "bg-black/5 dark:bg-white/10 text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/20"
                }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {mode === "source" && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {(Object.keys(newsSourceLabels) as unknown as NewsSource[]).map(
            (key) => {
              const value = Number(key) as NewsSource;
              const isActive = value === source;
              return (
                <button
                  key={value}
                  onClick={() => setSource(value)}
                  aria-pressed={isActive}
                  className={`px-3 py-1.5 rounded-xl text-xs border-none cursor-pointer transition-colors duration-150
                    ${
                      isActive
                        ? "bg-blue-100 text-blue-700 font-medium dark:bg-blue-900/50 dark:text-blue-300"
                        : "bg-black/5 dark:bg-white/5 text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/10"
                    }`}
                >
                  {newsSourceLabels[value]}
                </button>
              );
            },
          )}
        </div>
      )}

    {mode === "date" && (
  <div className="mt-3">
    <CalendarPicker
      value={date}
      onChange={setDate}
      max={todayKey()}
      label="Archive date"
    />
  </div>
)}

      {mode === "search" && (
        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
          <input
            type="text"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setTerm("");
            }}
            placeholder="Search stored headlines"
            aria-label="Search stored headlines"
            className="w-full pl-10 pr-10 py-3 text-base bg-black/10 dark:bg-white/10 backdrop-blur-sm border-none rounded-2xl
              text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400
              focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-200"
          />
          {term.length > 0 && (
            <button
              onClick={() => setTerm("")}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center
                border-none bg-transparent cursor-pointer text-gray-400 hover:text-red-500 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {error && (
        <div className="mt-4 px-4 py-3 rounded-2xl bg-red-500/10 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-3">
        <AnimatePresence mode="popLayout">
          {items.map((item, i) => (
            <NewsCard key={`${item.source}-${i}`} item={item} index={i} />
          ))}
        </AnimatePresence>

        {loading &&
          Array.from({ length: items.length > 0 ? 2 : 6 }).map((_, i) => (
            <NewsCardSkeleton key={`skeleton-${i}`} />
          ))}
      </div>

      {!loading && !error && items.length === 0 && (
        <EmptyState
          title={
            mode === "search" && debounced.trim() === ""
              ? "Type to search the archive"
              : "Nothing stored for this view"
          }
          hint="The archive fills up when the cron jobs run. Trigger one from Operations to backfill."
          icon={
            <Archive className="w-7 h-7 text-gray-400 dark:text-gray-500" />
          }
        />
      )}

      {canPage && (
        <div className="w-full flex justify-center mt-6">
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={loading}
            className="w-36 py-3 rounded-full bg-gray-800 dark:bg-gray-700 text-white hover:bg-gray-700 dark:hover:bg-gray-600
              flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed
              transition-all duration-200 active:scale-95 text-sm font-medium border-none cursor-pointer"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Load more"
            )}
          </button>
        </div>
      )}
    </section>
  );
}

export default ArchiveDesk;

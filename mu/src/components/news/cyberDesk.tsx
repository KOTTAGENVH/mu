"use client";
import React, { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search, ShieldCheck, X } from "lucide-react";
import { inter, roboto } from "@/app/fonts";
import {
  getCveDetails,
  getEuvd,
  getKev,
  getVulnFeed,
  getVulnStats,
  type EuvdType,
} from "@/app/api/client/services/news/latest_news/api";
import { VulnRow, severity_styles, type Cvss, type VulnItem } from "./vulnCard";
import VendorWatch from "./vendorWatch";
import { StatTile } from "@/helper/news/helperNews";
import { NewsCardSkeleton } from "./newsCardSkeleton";
import { EmptyState } from "./emptyStateCard";

interface VulnStats {
  generatedAt: string;
  total: number;
  knownExploited: number;
  ransomwareLinked: number;
  bySeverity: Record<string, number>;
  sources: string[];
}

type FeedKey = "merged" | "kev" | "latest" | "critical" | "exploited";

const feeds: Array<{ key: FeedKey; label: string }> = [
  { key: "merged", label: "Merged feed" },
  { key: "kev", label: "CISA KEV" },
  { key: "latest", label: "EUVD latest" },
  { key: "critical", label: "EUVD critical" },
  { key: "exploited", label: "EUVD exploited" },
];

function CyberDesk() {
  const [feed, setFeed] = useState<FeedKey>("merged");
  const [items, setItems] = useState<VulnItem[]>([]);
  const [stats, setStats] = useState<VulnStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cveQuery, setCveQuery] = useState("");
  const [lookup, setLookup] = useState<{
    cveId: string;
    cvss: Cvss | null;
    description: string | null;
    link: string;
  } | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [lookingUp, setLookingUp] = useState(false);

  const loadFeed = useCallback(async (key: FeedKey) => {
    setLoading(true);
    setError(null);
    try {
      const result =
        key === "merged"
          ? await getVulnFeed(40)
          : key === "kev"
            ? await getKev(50)
            : await getEuvd(key as EuvdType);
      setItems((result.data?.latestContent ?? []) as VulnItem[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load the feed");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFeed(feed);
  }, [feed, loadFeed]);

  useEffect(() => {
    getVulnStats()
      .then((result) => setStats(result.data?.latestContent as VulnStats))
      .catch(() => setStats(null));
  }, []);

  const runLookup = async () => {
    const id = cveQuery.trim().toUpperCase();
    if (!id) return;

    setLookingUp(true);
    setLookupError(null);
    setLookup(null);
    try {
      const result = await getCveDetails(id);
      setLookup(result.data?.latestContent as typeof lookup);
    } catch (err) {
      setLookupError(
        err instanceof Error ? err.message : "That CVE could not be found",
      );
    } finally {
      setLookingUp(false);
    }
  };

  return (
    <section className="mt-6">
      <h2
        className={`${inter.className} text-lg font-semibold text-black dark:text-white`}
      >
        Cyber desk
      </h2>
      <div className="flex flex-wrap gap-3 mt-4">
        {stats ? (
          <>
            <StatTile label="Tracked" value={stats.total} />
            <StatTile
              label="Known exploited"
              value={stats.knownExploited}
              tone="bg-red-500/10"
            />
            <StatTile
              label="Ransomware linked"
              value={stats.ransomwareLinked}
              tone="bg-purple-500/10"
            />
            <StatTile
              label="Critical"
              value={stats.bySeverity?.critical ?? 0}
              tone="bg-orange-500/10"
            />
            <StatTile label="High" value={stats.bySeverity?.high ?? 0} />
          </>
        ) : (
          Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex-1 min-w-[7rem] h-[5.5rem] rounded-2xl bg-black/5 dark:bg-white/5 animate-pulse"
            />
          ))
        )}
      </div>
      <div className="mt-5 flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[16rem]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
          <input
            type="text"
            value={cveQuery}
            onChange={(e) => setCveQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") runLookup();
              if (e.key === "Escape") {
                setCveQuery("");
                setLookup(null);
                setLookupError(null);
              }
            }}
            placeholder="Look up a CVE, e.g. CVE-2024-3400"
            aria-label="Look up a CVE"
            className="w-full pl-10 pr-4 py-3 text-base bg-black/10 dark:bg-white/10 backdrop-blur-sm border-none rounded-2xl
              text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400
              focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-200"
          />
        </div>
        <button
          onClick={runLookup}
          disabled={lookingUp || cveQuery.trim() === ""}
          className="px-6 py-3 rounded-2xl bg-blue-500 text-white text-sm font-medium border-none cursor-pointer
            hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors
            focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
        >
          {lookingUp ? "Looking up" : "Look up"}
        </button>
      </div>

      {lookupError && (
        <div className="mt-3 px-4 py-3 rounded-2xl bg-red-500/10 text-sm text-red-600 dark:text-red-400">
          {lookupError}
        </div>
      )}

      <AnimatePresence>
        {lookup && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="mt-3 p-4 rounded-2xl bg-black/5 dark:bg-white/5 flex gap-4"
          >
            <div
              className={`flex-shrink-0 w-14 h-14 rounded-xl flex flex-col items-center justify-center
                ${severity_styles[lookup.cvss?.severity ?? "none"]}`}
            >
              <span className="text-base font-bold tabular-nums leading-none">
                {lookup.cvss ? lookup.cvss.score.toFixed(1) : "—"}
              </span>
              <span className="text-[9px] uppercase tracking-wide mt-0.5">
                {lookup.cvss?.severity ?? "none"}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <a
                href={lookup.link}
                target="_blank"
                rel="noopener noreferrer"
                className={`${inter.className} text-sm font-semibold text-black dark:text-white no-underline hover:underline`}
              >
                {lookup.cveId}
              </a>
              <p
                className={`${roboto.className} mt-1 text-xs text-black/50 dark:text-white/50`}
              >
                {lookup.description ?? "NIST has no description on file yet."}
              </p>
              {lookup.cvss?.vector && (
                <p className="mt-1 text-[10px] font-mono text-black/40 dark:text-white/40 break-all">
                  {lookup.cvss.vector}
                </p>
              )}
            </div>
            <button
              onClick={() => setLookup(null)}
              aria-label="Clear lookup"
              className="flex-none w-8 h-8 inline-flex items-center justify-center rounded-full border-none cursor-pointer
                bg-black/5 dark:bg-white/10 text-black/60 dark:text-white/60 hover:bg-black/10 dark:hover:bg-white/20 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="flex flex-wrap gap-1.5 mt-6">
        {feeds.map((option) => {
          const isActive = option.key === feed;
          return (
            <button
              key={option.key}
              onClick={() => setFeed(option.key)}
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

      {error && (
        <div className="mt-4 px-4 py-3 rounded-2xl bg-red-500/10 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-3">
        {loading &&
          Array.from({ length: 6 }).map((_, i) => <NewsCardSkeleton key={i} />)}

        <AnimatePresence mode="popLayout">
          {!loading &&
            items.map((item, i) => (
              <VulnRow key={`${item.id}-${i}`} item={item} index={i} />
            ))}
        </AnimatePresence>
      </div>

      {!loading && !error && items.length === 0 && (
        <EmptyState
          title="No advisories in this feed"
          hint="Nothing has been published here recently. Try another feed above."
          icon={
            <ShieldCheck className="w-7 h-7 text-gray-400 dark:text-gray-500" />
          }
        />
      )}

      <VendorWatch />
    </section>
  );
}

export default CyberDesk;

"use client";
import React, { useCallback, useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import {
  getEuvd,
  getKev,
  getVulnFeed,
  type EuvdType,
} from "@/app/api/client/services/news/latest_news/api";
import { VulnRow, type VulnItem } from "./vulnCard";
import { NewsCardSkeleton } from "./newsCardSkeleton";
import { EmptyState } from "./emptyStateCard";

type FeedKey = "merged" | "kev" | "latest" | "critical" | "exploited";

const feeds: Array<{ key: FeedKey; label: string }> = [
  { key: "merged", label: "Merged feed" },
  { key: "kev", label: "CISA KEV" },
  { key: "latest", label: "EUVD latest" },
  { key: "critical", label: "EUVD critical" },
  { key: "exploited", label: "EUVD exploited" },
];

function VulnFeed() {
  const [feed, setFeed] = useState<FeedKey>("merged");
  const [items, setItems] = useState<VulnItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
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

        {!loading &&
          items.map((item, i) => (
            <div
              key={`${feed}-${item.id}-${i}`}
              className="rise"
              style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
            >
              <VulnRow item={item} index={i} />
            </div>
          ))}
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
    </div>
  );
}

export default VulnFeed;

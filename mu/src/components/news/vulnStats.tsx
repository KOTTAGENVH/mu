"use client";
import React, { useEffect, useState } from "react";
import { getVulnStats } from "@/app/api/client/services/news/latest_news/api";
import { StatTile } from "@/helper/news/helperNews";
import { roboto } from "@/app/fonts";
import SeverityChart from "./severityChart";

export interface VulnStatsData {
  generatedAt: string;
  total: number;
  knownExploited: number;
  ransomwareLinked: number;
  bySeverity: Record<string, number>;
  sources: string[];
}

function VulnStats() {
  const [stats, setStats] = useState<VulnStatsData | null>(null);

  useEffect(() => {
    let cancelled = false;
    getVulnStats()
      .then((result) => {
        if (!cancelled) setStats(result.data?.latestContent as VulnStatsData);
      })
      .catch(() => {
        if (!cancelled) setStats(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!stats) {
    return (
      <div className="flex flex-wrap gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex-1 min-w-[7rem] h-[5.5rem] rounded-2xl bg-black/5 dark:bg-white/5 animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3">
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
      </div>

      <div className="mt-4 p-4 rounded-2xl bg-black/5 dark:bg-white/5">
        <p
          className={`${roboto.className} text-xs text-black/50 dark:text-white/50 mb-2`}
        >
          By severity
        </p>
        <SeverityChart bySeverity={stats.bySeverity} />
      </div>
    </div>
  );
}

export default VulnStats;

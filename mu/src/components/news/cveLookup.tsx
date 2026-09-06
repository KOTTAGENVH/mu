"use client";
import React, { useState } from "react";
import { Search, X } from "lucide-react";
import { inter, roboto } from "@/app/fonts";
import { getCveDetails } from "@/app/api/client/services/news/latest_news/api";
import { severity_styles, type Cvss } from "./vulnCard";

interface CveDetails {
  cveId: string;
  cvss: Cvss | null;
  description: string | null;
  link: string;
}

function CveLookup() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<CveDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [looking, setLooking] = useState(false);

  const runLookup = async () => {
    const id = query.trim().toUpperCase();
    if (!id) return;

    setLooking(true);
    setError(null);
    setResult(null);
    try {
      const response = await getCveDetails(id);
      setResult(response.data?.latestContent as CveDetails);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "That CVE could not be found",
      );
    } finally {
      setLooking(false);
    }
  };

  const clear = () => {
    setQuery("");
    setResult(null);
    setError(null);
  };

  return (
    <div>
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[16rem]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") runLookup();
              if (e.key === "Escape") clear();
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
          disabled={looking || query.trim() === ""}
          className="px-6 py-3 rounded-2xl bg-blue-500 text-white text-sm font-medium border-none cursor-pointer
            hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors
            focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
        >
          {looking ? "Looking up" : "Look up"}
        </button>
      </div>

      {error && (
        <div className="mt-3 px-4 py-3 rounded-2xl bg-red-500/10 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {result && (
        <>
          <div
            key={result.cveId}
            className="rise mt-3 p-4 rounded-2xl bg-black/5 dark:bg-white/5 flex gap-4"
          >
            <div
              className={`flex-shrink-0 w-14 h-14 rounded-xl flex flex-col items-center justify-center
              ${severity_styles[result.cvss?.severity ?? "none"]}`}
            >
              <span className="text-base font-bold tabular-nums leading-none">
                {result.cvss ? result.cvss.score.toFixed(1) : "—"}
              </span>
              <span className="text-[9px] uppercase tracking-wide mt-0.5">
                {result.cvss?.severity ?? "none"}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <a
                href={result.link}
                target="_blank"
                rel="noopener noreferrer"
                className={`${inter.className} text-sm font-semibold text-black dark:text-white no-underline hover:underline`}
              >
                {result.cveId}
              </a>
              <p
                className={`${roboto.className} mt-1 text-xs text-black/50 dark:text-white/50`}
              >
                {result.description ?? "NIST has no description on file yet."}
              </p>
              {result.cvss?.vector && (
                <p className="mt-1 text-[10px] font-mono text-black/40 dark:text-white/40 break-all">
                  {result.cvss.vector}
                </p>
              )}
            </div>
            <button
              onClick={() => setResult(null)}
              aria-label="Clear lookup"
              className="flex-none w-8 h-8 inline-flex items-center justify-center rounded-full border-none cursor-pointer
              bg-black/5 dark:bg-white/10 text-black/60 dark:text-white/60 hover:bg-black/10 dark:hover:bg-white/20 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default CveLookup;

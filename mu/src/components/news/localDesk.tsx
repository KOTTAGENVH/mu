"use client";
import React, { useCallback, useEffect, useState } from "react";
import { FileText, Loader2 } from "lucide-react";
import { inter, roboto } from "@/app/fonts";
import {
  getAdaDerana,
  getBBCSinhala,
  getIrdContent,
  getIrdNews,
  getLankadeepa,
  getNewsFirstTamil,
  getNewswire,
} from "@/app/api/client/services/news/latest_news/api";
import { flattenGroups, toCards } from "@/lib/news/normalize";
import { NewsCard, type NewsCardData } from "./newsCard";
import { NewsCardSkeleton } from "./newsCardSkeleton";
import { EmptyState } from "./emptyStateCard";

type SourceKey =
  | "lankadeepa"
  | "bbcsinhala"
  | "newsfirsttamil"
  | "newswire"
  | "adaderana"
  | "ird-news"
  | "ird-content";

interface SourceDef {
  key: SourceKey;
  label: string;
  language: string;
  paged: boolean;
  load: (page: number) => Promise<NewsCardData[]>;
}

const sources: SourceDef[] = [
  {
    key: "lankadeepa",
    label: "Lankadeepa",
    language: "සිංහල",
    paged: true,
    load: async (page) =>
      toCards((await getLankadeepa(page)).data?.latestContent, "Lankadeepa"),
  },
  {
    key: "bbcsinhala",
    label: "BBC Sinhala",
    language: "සිංහල",
    paged: true,
    load: async (page) =>
      toCards((await getBBCSinhala(page)).data?.latestContent, "BBC සිංහල"),
  },
  {
    key: "newsfirsttamil",
    label: "News 1st",
    language: "தமிழ்",
    paged: false,
    load: async () =>
      flattenGroups(
        (await getNewsFirstTamil()).data?.latestContent,
        ["breaking_latest", "breaking", "latest", "archive"],
        "News 1st",
      ),
  },
  {
    key: "newswire",
    label: "Newswire",
    language: "English",
    paged: false,
    load: async () =>
      flattenGroups(
        (await getNewswire()).data?.latestContent,
        ["lead_story", "latest", "trending", "moreNews"],
        "Newswire",
      ),
  },
  {
    key: "adaderana",
    label: "Ada Derana",
    language: "English",
    paged: false,
    load: async () =>
      flattenGroups(
        (await getAdaDerana()).data?.latestContent,
        ["all"],
        "Ada Derana",
      ),
  },
  {
    key: "ird-news",
    label: "IRD notices",
    language: "Tax",
    paged: true,
    load: async (page) =>
      toCards((await getIrdNews(page)).data?.latestContent, "Inland Revenue"),
  },
  {
    key: "ird-content",
    label: "IRD publications",
    language: "Tax",
    paged: true,
    load: async (page) =>
      toCards(
        (await getIrdContent(page)).data?.latestContent,
        "Inland Revenue",
      ),
  },
];

function LocalDesk() {
  const [active, setActive] = useState<SourceDef>(sources[0]);
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<NewsCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (source: SourceDef, targetPage: number) => {
    setLoading(true);
    setError(null);
    try {
      const cards = await source.load(targetPage);
      setItems((prev) => (targetPage > 1 ? [...prev, ...cards] : cards));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load this feed");
      if (targetPage === 1) setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(active, page);
  }, [active, page, load]);

  const choose = (source: SourceDef) => {
    if (source.key === active.key) return;
    setItems([]);
    setPage(1);
    setActive(source);
  };

  return (
    <section className="mt-6">
      <div className="flex items-baseline justify-between gap-4 flex-wrap">
        <h2
          className={`${inter.className} text-lg font-semibold text-black dark:text-white`}
        >
          Sri Lanka desk
        </h2>
        <p
          className={`${roboto.className} text-xs text-black/50 dark:text-white/50`}
        >
          {loading && items.length === 0
            ? "Fetching"
            : `${items.length} stories · ${active.language}`}
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5 mt-4">
        {sources.map((source) => {
          const isActive = source.key === active.key;
          return (
            <button
              key={source.key}
              onClick={() => choose(source)}
              aria-pressed={isActive}
              className={`px-3 py-1.5 rounded-full text-xs border-none cursor-pointer transition-colors duration-150
                focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50
                ${
                  isActive
                    ? "bg-blue-500 text-white font-medium"
                    : "bg-black/5 dark:bg-white/10 text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/20"
                }`}
            >
              {source.label}
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
        {items.map((item, i) => (
          <div
            key={`${active.key}-${item.source}-${i}`}
            className="rise"
            style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
          >
            <NewsCard item={item} index={i} />
          </div>
        ))}
        {loading &&
          Array.from({ length: items.length > 0 ? 2 : 6 }).map((_, i) => (
            <NewsCardSkeleton key={`skeleton-${i}`} />
          ))}
      </div>

      {!loading && !error && items.length === 0 && (
        <EmptyState
          title={`${active.label} has nothing right now`}
          hint="The scraper returned an empty page. Try another source or run the cron job from Operations."
          icon={
            <FileText className="w-7 h-7 text-gray-400 dark:text-gray-500" />
          }
        />
      )}

      {active.paged && items.length > 0 && (
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

export default LocalDesk;

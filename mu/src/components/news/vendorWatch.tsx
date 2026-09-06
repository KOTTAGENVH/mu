"use client";
import React, { useCallback, useEffect, useState } from "react";
import { Search, ShieldCheck, X } from "lucide-react";
import { inter, roboto } from "@/app/fonts";
import { searchEuvd } from "@/app/api/client/services/news/latest_news/api";
import { vendors, vendor_groups, type VendorEntry } from "@/lib/news/vendor";
import {
  isValidVendorQuery,
  normaliseVendorQuery,
  vendor_query_max_length,
  vendor_query_max_words,
} from "@/lib/news/vendorQuery";
import { VulnRow, type VulnItem } from "./vulnCard";
import { NewsCardSkeleton } from "./newsCardSkeleton";
import { EmptyState } from "./emptyStateCard";

type Target = { label: string; query: string };

const fromEntry = (v: VendorEntry): Target => ({
  label: v.label,
  query: v.query,
});

function VendorWatch() {
  const [target, setTarget] = useState<Target>(fromEntry(vendors[0]));
  const [draft, setDraft] = useState("");
  const [draftError, setDraftError] = useState<string | null>(null);
  const [items, setItems] = useState<VulnItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (query: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await searchEuvd({ vendor: query, size: 20 });
      setItems((result.data?.latestContent ?? []) as VulnItem[]);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load advisories",
      );
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(target.query);
  }, [target, load]);

  const runSearch = () => {
    const query = normaliseVendorQuery(draft);
    if (query === "") return;

    if (!isValidVendorQuery(query)) {
      setDraftError(
        `Use up to ${vendor_query_max_words} words and ${vendor_query_max_length} characters: letters, numbers and . - _ & + / only.`,
      );
      return;
    }

    setDraftError(null);
    setTarget({ label: query, query });
  };

  const clearSearch = () => {
    setDraft("");
    setDraftError(null);
    setTarget(fromEntry(vendors[0]));
  };

  const exploitedCount = items.filter((i) => i.knownExploited).length;

  return (
    <section className="mt-10">
      <div className="flex items-baseline justify-between gap-4 flex-wrap">
        <h2
          className={`${inter.className} text-lg font-semibold text-black dark:text-white`}
        >
          Vendor watch
        </h2>
        <p
          className={`${roboto.className} text-xs text-black/50 dark:text-white/50`}
        >
          {loading
            ? "Checking advisories"
            : `${items.length} advisories · ${exploitedCount} exploited`}
        </p>
      </div>

      <div className="mt-4 flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[16rem]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
          <input
            type="text"
            value={draft}
            maxLength={vendor_query_max_length}
            onChange={(e) => {
              setDraft(e.target.value);
              if (draftError) setDraftError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") runSearch();
              if (e.key === "Escape") clearSearch();
            }}
            placeholder="Search a vendor, e.g. Fortinet"
            aria-label="Search advisories by vendor"
            aria-invalid={draftError !== null}
            className="w-full pl-10 pr-10 py-3 text-base bg-black/10 dark:bg-white/10 backdrop-blur-sm border-none rounded-2xl
              text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400
              focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-200"
          />
          {draft !== "" && (
            <button
              onClick={clearSearch}
              aria-label="Clear vendor search"
              className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 inline-flex items-center justify-center
                rounded-full border-none cursor-pointer bg-transparent text-black/50 dark:text-white/50
                hover:bg-black/10 dark:hover:bg-white/20 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <button
          onClick={runSearch}
          disabled={normaliseVendorQuery(draft) === ""}
          className="px-6 py-3 rounded-2xl bg-blue-500 text-white text-sm font-medium border-none cursor-pointer
            hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors
            focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
        >
          Search
        </button>
      </div>

      {draftError && (
        <p
          role="alert"
          className={`${roboto.className} mt-2 px-1 text-xs text-red-600 dark:text-red-400`}
        >
          {draftError}
        </p>
      )}

      <div className="mt-4 space-y-3">
        {vendor_groups.map((group) => (
          <div key={group}>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5 px-1">
              {group}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {vendors
                .filter((v) => v.group === group)
                .map((vendor) => {
                  const isActive = target.query === vendor.query;
                  return (
                    <button
                      key={vendor.query}
                      onClick={() => {
                        setDraft("");
                        setDraftError(null);
                        setTarget(fromEntry(vendor));
                      }}
                      aria-pressed={isActive}
                      className={`px-3 py-1.5 rounded-full text-xs border-none cursor-pointer transition-colors duration-150
                        focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50
                        ${
                          isActive
                            ? "bg-blue-500 text-white font-medium"
                            : "bg-black/5 dark:bg-white/10 text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/20"
                        }`}
                    >
                      {vendor.label}
                    </button>
                  );
                })}
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className="mt-4 px-4 py-3 rounded-2xl bg-red-500/10 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-3">
        {loading &&
          Array.from({ length: 4 }).map((_, i) => <NewsCardSkeleton key={i} />)}

        {!loading &&
          items.map((item, i) => (
            <div
              key={`${target.query}-${item.id}-${i}`}
              className="rise"
              style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
            >
              <VulnRow item={item} index={i} />
            </div>
          ))}
      </div>

      {!loading && !error && items.length === 0 && (
        <EmptyState
          title={`Nothing logged for ${target.label}`}
          hint="The EU database has no advisories under this vendor name. Try another spelling or pick a vendor from the list."
          icon={
            <ShieldCheck className="w-7 h-7 text-gray-400 dark:text-gray-500" />
          }
        />
      )}
    </section>
  );
}

export default VendorWatch;

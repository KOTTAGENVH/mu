"use client";
import React, { useCallback, useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { ShieldCheck } from "lucide-react";
import { inter, roboto } from "@/app/fonts";
import { searchEuvd } from "@/app/api/client/services/news/latest_news/api";
import {
  vendors,
  vendor_groups,
  type VendorEntry,
} from "@/lib/news/vendor";
import { VulnRow, type VulnItem } from "./vulnCard";
import { NewsCardSkeleton } from "./newsCardSkeleton";
import { EmptyState } from "./emptyStateCard";

function VendorWatch() {
  const [active, setActive] = useState<VendorEntry>(vendors[0]);
  const [items, setItems] = useState<VulnItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (vendor: VendorEntry) => {
    setLoading(true);
    setError(null);
    try {
      const result = await searchEuvd({ vendor: vendor.query, size: 20 });
      setItems((result.data?.latestContent ?? []) as VulnItem[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load advisories");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(active);
  }, [active, load]);

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
                  const isActive = active.query === vendor.query;
                  return (
                    <button
                      key={vendor.query}
                      onClick={() => setActive(vendor)}
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

        <AnimatePresence mode="popLayout">
          {!loading &&
            items.map((item, i) => (
              <VulnRow key={`${item.id}-${i}`} item={item} index={i} />
            ))}
        </AnimatePresence>
      </div>

      {!loading && !error && items.length === 0 && (
        <EmptyState
          title={`Nothing logged for ${active.label}`}
          hint="The EU database has no advisories under this vendor name. Pick another vendor from the list."
          icon={
            <ShieldCheck className="w-7 h-7 text-gray-400 dark:text-gray-500" />
          }
        />
      )}
    </section>
  );
}

export default VendorWatch;
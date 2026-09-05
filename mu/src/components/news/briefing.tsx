"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ExternalLink, Globe2 } from "lucide-react";
import { inter, roboto } from "@/app/fonts";
import { getWikiEvents } from "@/app/api/client/services/news/latest_news/api";
import { EmptyState } from "./emptyStateCard";
import { getRecentDates } from "@/helper/news/helperNews";
import CalendarPicker, { todayKey } from "../calenarPicker";

interface WikiEvent {
  text: string;
  references: string[];
}

interface WikiSection {
  category: string;
  events: WikiEvent[];
}

interface WikiPayload {
  date: string | null;
  source: string | null;
  license: string;
  sections: WikiSection[];
}

const today = () => new Date().toISOString().slice(0, 10);

const recentDates = getRecentDates(30);

function Briefing() {
  const [date, setDate] = useState(today());
  const [payload, setPayload] = useState<WikiPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async (target: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getWikiEvents(target);
      setPayload(result.data?.latestContent as WikiPayload);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load the briefing",
      );
      setPayload(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(date);
  }, [date, load]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!isDropdownOpen) return;
      const target = event.target as Node;
      if (dropdownRef.current && dropdownRef.current.contains(target)) {
        return;
      }
      setIsDropdownOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  const sections = payload?.sections ?? [];
  const eventCount = sections.reduce((sum, s) => sum + s.events.length, 0);

  return (
    <section className="mt-6">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div className="min-w-0 flex-1">
          <h2
            className={`${inter.className} text-lg font-semibold text-black dark:text-white`}
          >
            Daily briefing
          </h2>
          <p
            className={`${roboto.className} mt-1 text-[13px] sm:text-xs text-black/60 dark:text-white/60`}
          >
            {loading
              ? "Reading the wire"
              : `${eventCount} events across ${sections.length} desks · Wikipedia, CC BY-SA 4.0`}
          </p>
        </div>

        <CalendarPicker
          value={date}
          onChange={setDate}
          min={recentDates[recentDates.length - 1]}
          max={todayKey()}
          align="right"
          label="Briefing date"
        />
      </div>

      {error && (
        <div className="mt-4 px-4 py-3 rounded-2xl bg-red-500/10 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {loading && (
        <div className="mt-5 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="p-4 sm:p-5 rounded-2xl bg-black/5 dark:bg-white/5 space-y-3"
            >
              <div className="h-4 w-40 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
              <div className="h-3 w-full rounded bg-black/5 dark:bg-white/5 animate-pulse" />
              <div className="h-3 w-5/6 rounded bg-black/5 dark:bg-white/5 animate-pulse" />
            </div>
          ))}
        </div>
      )}

      {!loading && sections.length > 0 && (
        <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-3 items-start">
          {sections.map((section, sectionIndex) => (
            <motion.article
              key={section.category}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.25,
                delay: Math.min(sectionIndex * 0.05, 0.3),
              }}
              className="p-5 rounded-2xl bg-black/5 dark:bg-white/5 backdrop-blur-sm"
            >
              <h3
                className={`${inter.className} text-[15px] sm:text-sm font-semibold text-black dark:text-white`}
              >
                {section.category}
              </h3>
              <ul className="mt-3 space-y-2.5 list-none p-0 m-0">
                {section.events.map((event, i) => (
                  <li
                    key={i}
                    className={`${roboto.className} flex gap-2.5 text-sm sm:text-xs text-black/75 dark:text-white/75 leading-relaxed break-words`}
                  >
                    <span
                      className="mt-1.5 w-1 h-1 rounded-full bg-blue-500 flex-shrink-0"
                      aria-hidden="true"
                    />
                    <span className="min-w-0">
                      {event.text}
                      {event.references[0] && (
                        <a
                          href={event.references[0]}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center ml-1 w-6 h-6 -my-2 align-middle text-blue-500 hover:text-blue-600 no-underline"
                          aria-label="Open source"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </motion.article>
          ))}
        </div>
      )}

      {!loading && !error && sections.length === 0 && (
        <EmptyState
          title="Nothing filed for this date"
          hint="Wikipedia's current events portal has no entries yet. Try an earlier day."
          icon={<Globe2 className="w-7 h-7 text-gray-400 dark:text-gray-500" />}
        />
      )}
    </section>
  );
}

export default Briefing;

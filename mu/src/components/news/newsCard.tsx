"use client";
import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Check, Copy, ExternalLink, Newspaper } from "lucide-react";
import { inter, roboto } from "@/app/fonts";
import { asPlainText, timeAgo } from "@/helper/news/helperNews";

export interface NewsCardData {
  title: string;
  description?: string | null;
  source?: string | null;
  image?: string | null;
  publishedISO?: string | null;
  publisher?: string | null;
}

export function NewsCard({
  item,
  index = 0,
}: {
  item: NewsCardData;
  index?: number;
}) {
  const stamp = timeAgo(item.publishedISO);
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const copy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(asPlainText(item));
      setCopied(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(false), 1600);
    } catch {
      console.warn("Please note the clipboard copy failed :)");
    }
  };

  return (
    <motion.div
      rel="noopener noreferrer"
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.04, 0.3) }}
      className="group flex min-w-0 gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-2xl bg-black/5 dark:bg-white/5 backdrop-blur-sm
        hover:bg-black/10 dark:hover:bg-white/10 transition-colors duration-200
        focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 no-underline"
    >
      <div className="flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
        <Newspaper className="w-5 h-5 text-gray-400 dark:text-gray-500" />
      </div>

      <div className="min-w-0 flex-1">
        <h3
          className={`${inter.className} text-sm font-semibold text-black dark:text-white leading-snug line-clamp-3 sm:line-clamp-2`}
        >
          {item.title}
        </h3>
        {item.description && (
          <p
           className={`${roboto.className} mt-1 text-[13px] sm:text-xs leading-relaxed text-black/65 dark:text-white/65 line-clamp-2`}
          >
            {item.description}
          </p>
        )}
        {item.source && (
          <p
            className={`${roboto.className} mt-1 text-xs text-black/50 dark:text-white/50 line-clamp-2`}
          >
            {item.source}
          </p>
        )}
        <div className="flex items-center gap-2 mt-2 text-[11px] text-black/50 dark:text-white/50">
          {item.publisher && <span>{item.publisher}</span>}
          {item.publisher && stamp && <span aria-hidden="true">·</span>}
          {stamp && <span className="tabular-nums">{stamp}</span>}
        </div>
      </div>

      <div className="relative z-10 flex flex-col items-center gap-1.5 flex-shrink-0">
        <button
          type="button"
          onClick={copy}
          aria-label={copied ? "Copied" : `Copy: ${item.title}`}
          title="Copy headline, summary and link"
          className={`w-9 h-9 sm:w-7 sm:h-7 inline-flex items-center justify-center rounded-lg border-none cursor-pointer
            transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50
            ${
              copied
                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                : "bg-black/5 dark:bg-white/10 text-black/40 dark:text-white/40 hover:bg-black/10 dark:hover:bg-white/20 hover:text-black/70 dark:hover:text-white/70"
            }`}
        >
          {copied ? (
            <Check className="w-3.5 h-3.5" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </button>

        <ExternalLink
          className="hidden sm:block w-3.5 h-3.5 text-black/20 dark:text-white/20 opacity-0 group-hover:opacity-100 transition-opacity"
          aria-hidden="true"
        />
      </div>
    </motion.div>
  );
}

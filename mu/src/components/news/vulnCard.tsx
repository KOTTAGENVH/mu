"use client";
import React, { useEffect, useRef, useState } from "react";
import { Check, Copy, ExternalLink, Flame } from "lucide-react";
import { inter, roboto } from "@/app/fonts";

export interface Cvss {
  score: number;
  severity: "critical" | "high" | "medium" | "low" | "none";
  version: string | null;
  vector: string | null;
}

export interface VulnItem {
  id: string;
  cveId: string | null;
  title?: string | null;
  description: string | null;
  vendor: string | null;
  product: string | null;
  cvss: Cvss | null;
  knownExploited: boolean;
  ransomwareUse?: boolean;
  publishedISO: string | null;
  kevDueDate?: string | null;
  link: string | null;
}

export const severity_styles: Record<string, string> = {
  critical: "bg-red-500/15 text-red-600 dark:text-red-400",
  high: "bg-orange-500/15 text-orange-600 dark:text-orange-400",
  medium: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  low: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  none: "bg-gray-500/15 text-gray-600 dark:text-gray-400",
};

function asPlainText(item: VulnItem): string {
  const lines = [item.cveId ?? item.id];
  if (item.cvss) {
    lines.push(`CVSS: ${item.cvss.score} (${item.cvss.severity})`);
    if (item.cvss.vector) lines.push(`Vector: ${item.cvss.vector}`);
  }
  if (item.vendor || item.product) {
    lines.push(
      `Affects: ${[item.vendor, item.product].filter(Boolean).join(" ")}`,
    );
  }
  if (item.knownExploited) lines.push("Status: known exploited in the wild");
  if (item.ransomwareUse) lines.push("Status: linked to ransomware campaigns");
  if (item.kevDueDate) lines.push(`Patch due: ${item.kevDueDate}`);
  const body = item.title ?? item.description;
  if (body) lines.push("", body);
  if (item.link) lines.push("", item.link);
  return lines.join("\n");
}

export function VulnRow({ item, index }: { item: VulnItem; index: number }) {
  const severity = item.cvss?.severity ?? "none";
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
      console.warn("Sorry an issue occured when copying ti clipboard. :)");
    }
  };

  return (
    <div
      className="group flex gap-4 p-4 rounded-2xl bg-black/5 dark:bg-white/5 backdrop-blur-sm
        hover:bg-black/10 dark:hover:bg-white/10 transition-colors duration-200
        focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 no-underline"
    >
      <div
        className={`flex-shrink-0 w-14 h-14 rounded-xl flex flex-col items-center justify-center ${severity_styles[severity]}`}
      >
        <span className="text-base font-bold tabular-nums leading-none">
          {item.cvss ? item.cvss.score.toFixed(1) : "—"}
        </span>
        <span className="text-[9px] uppercase tracking-wide mt-0.5">
          {severity}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <h3
            className={`${inter.className} text-sm font-semibold text-black dark:text-white`}
          >
            {item.cveId ?? item.id}
          </h3>
          {item.knownExploited && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-500/15 text-red-600 dark:text-red-400">
              <Flame className="w-3 h-3" />
              Exploited
            </span>
          )}
          {item.ransomwareUse && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-500/15 text-purple-600 dark:text-purple-400">
              Ransomware
            </span>
          )}
        </div>

        {(item.vendor || item.product) && (
          <p className="mt-0.5 text-[11px] text-black/40 dark:text-white/40">
            {[item.vendor, item.product].filter(Boolean).join(" · ")}
          </p>
        )}

        {(item.title || item.description) && (
          <p
            className={`${roboto.className} mt-1 text-xs text-black/50 dark:text-white/50 line-clamp-2`}
          >
            {item.title ?? item.description}
          </p>
        )}

        {item.kevDueDate && (
          <p className="mt-1 text-[10px] text-black/40 dark:text-white/40">
            Patch due {item.kevDueDate}
          </p>
        )}
      </div>
      <div className="relative z-10 flex flex-col items-center gap-1.5 flex-shrink-0">
        <button
          type="button"
          onClick={copy}
          aria-label={copied ? "Copied" : `Copy ${item.cveId ?? item.id}`}
          title="Copy CVE details"
          className={`w-7 h-7 inline-flex items-center justify-center rounded-lg border-none cursor-pointer
            transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50
            ${
              copied
                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                : "bg-black/5 dark:bg-white/10 text-black/40 dark:text-white/40 hover:bg-black/10 dark:hover:bg-white/20"
            }`}
        >
          {copied ? (
            <Check className="w-3.5 h-3.5" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </button>
        {item.link && (
          <a
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Open ${item.cveId ?? item.id} advisory`}
            className="w-7 h-7 inline-flex items-center justify-center rounded-lg no-underline
              text-black/20 dark:text-white/20 opacity-0 group-hover:opacity-100
              hover:text-black/60 dark:hover:text-white/60 hover:bg-black/5 dark:hover:bg-white/10
              focus:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50
              transition-all duration-150"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
    </div>
  );
}

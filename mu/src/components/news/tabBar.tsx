"use client";
import React from "react";

export interface TabItem<K extends string> {
  key: K;
  label: string;
  icon?: React.ReactNode;
}

export function TabBar<K extends string>({
  items,
  active,
  onSelect,
  ariaLabel,
  idPrefix,
}: {
  items: Array<TabItem<K>>;
  active: K;
  onSelect: (key: K) => void;
  ariaLabel: string;
  idPrefix?: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="relative inline-flex flex-wrap gap-1 p-1.5 rounded-2xl
        bg-white/20 dark:bg-white/[0.04]
        backdrop-blur-xl backdrop-saturate-150
        border border-white/40 dark:border-white/10
        shadow-[inset_0_1px_1px_rgba(255,255,255,0.6),inset_0_-1px_2px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.08)]
        dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.08),inset_0_-1px_2px_rgba(0,0,0,0.4),0_4px_16px_rgba(0,0,0,0.3)]"
    >
      {items.map((item) => {
        const isActive = active === item.key;
        return (
          <button
            key={item.key}
            role="tab"
            id={idPrefix ? `${idPrefix}-tab-${item.key}` : undefined}
            aria-selected={isActive}
            aria-controls={
              idPrefix ? `${idPrefix}-panel-${item.key}` : undefined
            }
            onClick={() => onSelect(item.key)}
            className={`relative inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm
              border-none cursor-pointer transition-all duration-200
              focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50
              ${
                isActive
                  ? `text-black dark:text-white font-medium
                     bg-gradient-to-b from-white/70 to-white/30
                     dark:from-white/[0.18] dark:to-white/[0.06]
                     border border-white/60 dark:border-white/20
                     shadow-[0_1px_0_rgba(255,255,255,0.9)_inset,0_2px_8px_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.08)]
                     dark:shadow-[0_1px_0_rgba(255,255,255,0.12)_inset,0_2px_10px_rgba(0,0,0,0.5)]
                     -translate-y-px`
                  : `text-black/60 dark:text-white/60
                     hover:text-black dark:hover:text-white
                     hover:bg-white/25 dark:hover:bg-white/[0.07]`
              }`}
          >
            {item.icon}
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

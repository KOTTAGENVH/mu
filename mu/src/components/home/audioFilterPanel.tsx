"use client";
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import type {
  SongFilters,
  SongSortField,
  SortOrder,
} from "@/app/api/client/services/audio/api";
import { Pill, RangeInputs, Section } from "./filter/helpers";

export type FavouriteFilter = "all" | "favourites" | "others";
export type PlayedFilter = "any" | "today" | "7d" | "30d" | "never" | "custom";
export type SortKey =
  | "newest"
  | "mostPlayed"
  | "leastPlayed"
  | "mostSkipped"
  | "leastSkipped"
  | "recentlyPlayed"
  | "notRecentlyPlayed";

interface FilterPanelProps {
  open: boolean;
  onClose: () => void;
  applied: FilterState;
  onApply: (next: FilterState) => void;
  categories: Category[];
  surfaceClass: string;
  anchorRef: React.RefObject<HTMLElement | null>;
  align?: "left" | "right";
}

export interface Category {
  id: string;
  name: string;
}

export interface FilterState {
  category: Category | null;
  favourite: FavouriteFilter;
  played: PlayedFilter;
  customFrom: string;
  customTo: string;
  minPlays: string;
  maxPlays: string;
  minSkips: string;
  maxSkips: string;
  sort: SortKey;
}

export interface FilterChip {
  key: string;
  label: string;
  clear: (f: FilterState) => FilterState;
}
export const default_filters: FilterState = {
  category: null,
  favourite: "all",
  played: "any",
  customFrom: "",
  customTo: "",
  minPlays: "",
  maxPlays: "",
  minSkips: "",
  maxSkips: "",
  sort: "newest",
};

const sort_options: {
  key: SortKey;
  label: string;
  sortBy: SongSortField;
  sortOrder: SortOrder;
}[] = [
  { key: "newest", label: "Newest", sortBy: "newest", sortOrder: "desc" },
  {
    key: "mostPlayed",
    label: "Most played",
    sortBy: "playCount",
    sortOrder: "desc",
  },
  {
    key: "leastPlayed",
    label: "Least played",
    sortBy: "playCount",
    sortOrder: "asc",
  },
  {
    key: "mostSkipped",
    label: "Most skipped",
    sortBy: "skipCount",
    sortOrder: "desc",
  },
  {
    key: "leastSkipped",
    label: "Least skipped",
    sortBy: "skipCount",
    sortOrder: "asc",
  },
  {
    key: "recentlyPlayed",
    label: "Recently played",
    sortBy: "lastPlayedAt",
    sortOrder: "desc",
  },
  {
    key: "notRecentlyPlayed",
    label: "Not played recently",
    sortBy: "lastPlayedAt",
    sortOrder: "asc",
  },
];

const played_options: { key: PlayedFilter; label: string }[] = [
  { key: "any", label: "Any time" },
  { key: "today", label: "Today" },
  { key: "7d", label: "Last 7 days" },
  { key: "30d", label: "Last 30 days" },
  { key: "never", label: "Never played" },
  { key: "custom", label: "Custom range" },
];

const favourite_options: { key: FavouriteFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "favourites", label: "Favourites" },
  { key: "others", label: "Not favourited" },
];

const day_ms = 24 * 60 * 60 * 1000;

function localDateString(d = new Date()) {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function formatShortDate(yyyyMmDd: string) {
  return new Date(`${yyyyMmDd}T00:00:00`).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
}

const toNum = (s: string) => (s.trim() === "" ? undefined : Number(s));

export function toApiFilters(f: FilterState): SongFilters {
  const out: SongFilters = {};

  if (f.favourite === "favourites") out.favourite = true;
  if (f.favourite === "others") out.favourite = false;

  const now = new Date();
  switch (f.played) {
    case "today": {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      out.playedFrom = start.toISOString();
      break;
    }
    case "7d":
      out.playedFrom = new Date(now.getTime() - 7 * day_ms).toISOString();
      break;
    case "30d":
      out.playedFrom = new Date(now.getTime() - 30 * day_ms).toISOString();
      break;
    case "never":
      out.neverPlayed = true;
      break;
    case "custom":
      if (f.customFrom)
        out.playedFrom = new Date(`${f.customFrom}T00:00:00`).toISOString();
      if (f.customTo)
        out.playedTo = new Date(`${f.customTo}T23:59:59.999`).toISOString();
      break;
  }

  out.minPlayCount = toNum(f.minPlays);
  out.maxPlayCount = toNum(f.maxPlays);
  out.minSkipCount = toNum(f.minSkips);
  out.maxSkipCount = toNum(f.maxSkips);

  const sort = sort_options.find((s) => s.key === f.sort);
  if (sort && sort.key !== "newest") {
    out.sortBy = sort.sortBy;
    out.sortOrder = sort.sortOrder;
  }

  return out;
}

export function getFilterErrors(f: FilterState) {
  const errors: { plays?: string; skips?: string; dates?: string } = {};
  const tooHigh = (min: string, max: string) =>
    min !== "" && max !== "" && Number(min) > Number(max);

  if (tooHigh(f.minPlays, f.maxPlays))
    errors.plays = "Minimum can't be higher than maximum.";
  if (tooHigh(f.minSkips, f.maxSkips))
    errors.skips = "Minimum can't be higher than maximum.";
  if (
    f.played === "custom" &&
    f.customFrom &&
    f.customTo &&
    f.customFrom > f.customTo
  )
    errors.dates = "Start date is after the end date.";

  return errors;
}

function rangeLabel(min: string, max: string, unit: string) {
  if (min && max)
    return min === max ? `${min} ${unit}` : `${min}–${max} ${unit}`;
  if (min) return `${min}+ ${unit}`;
  if (max) return `Up to ${max} ${unit}`;
  return null;
}

function playedLabel(f: FilterState) {
  switch (f.played) {
    case "today":
      return "Played today";
    case "7d":
      return "Played in last 7 days";
    case "30d":
      return "Played in last 30 days";
    case "never":
      return "Never played";
    case "custom":
      if (f.customFrom && f.customTo)
        return `Played ${formatShortDate(f.customFrom)} – ${formatShortDate(f.customTo)}`;
      if (f.customFrom) return `Played since ${formatShortDate(f.customFrom)}`;
      if (f.customTo) return `Played until ${formatShortDate(f.customTo)}`;
      return null;
    default:
      return null;
  }
}

export function getFilterChips(f: FilterState): FilterChip[] {
  const chips: FilterChip[] = [];

  if (f.category)
    chips.push({
      key: "category",
      label: f.category.name,
      clear: (s) => ({ ...s, category: null }),
    });

  if (f.favourite !== "all")
    chips.push({
      key: "favourite",
      label: f.favourite === "favourites" ? "Favourites" : "Not favourited",
      clear: (s) => ({ ...s, favourite: "all" }),
    });

  const played = playedLabel(f);
  if (played)
    chips.push({
      key: "played",
      label: played,
      clear: (s) => ({ ...s, played: "any", customFrom: "", customTo: "" }),
    });

  const plays = rangeLabel(f.minPlays, f.maxPlays, "plays");
  if (plays)
    chips.push({
      key: "plays",
      label: plays,
      clear: (s) => ({ ...s, minPlays: "", maxPlays: "" }),
    });

  const skips = rangeLabel(f.minSkips, f.maxSkips, "skips");
  if (skips)
    chips.push({
      key: "skips",
      label: skips,
      clear: (s) => ({ ...s, minSkips: "", maxSkips: "" }),
    });

  if (f.sort !== "newest") {
    const label = sort_options.find((o) => o.key === f.sort)?.label ?? "";
    chips.push({
      key: "sort",
      label: `Sorted by ${label.toLowerCase()}`,
      clear: (s) => ({ ...s, sort: "newest" }),
    });
  }

  return chips;
}

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(min-width: 640px)").matches,
  );
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 640px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return isDesktop;
}

function useMountTransition(open: boolean, duration = 250) {
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      let inner = 0;
      const outer = requestAnimationFrame(() => {
        inner = requestAnimationFrame(() => setVisible(true));
      });
      return () => {
        cancelAnimationFrame(outer);
        cancelAnimationFrame(inner);
      };
    }
    setVisible(false);
    const t = setTimeout(() => setMounted(false), duration);
    return () => clearTimeout(t);
  }, [open, duration]);

  return { mounted, visible };
}

export const inputClass = `w-full rounded-xl border-none bg-gray-100 px-3 py-2.5 text-base text-black placeholder-gray-500
  dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 sm:text-sm
  focus:outline-none focus:ring-2 focus:ring-blue-500/60
  [color-scheme:light] dark:[color-scheme:dark]`;

export default function FilterPanel({
  open,
  onClose,
  applied,
  onApply,
  categories,
  surfaceClass,
  anchorRef,
  align = "left",
}: FilterPanelProps) {
  const [draft, setDraft] = useState<FilterState>(applied);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const isDesktop = useIsDesktop();
  const { mounted, visible } = useMountTransition(open);

  useEffect(() => {
    if (open) setDraft(applied);
  }, [open, applied]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open || !isDesktop) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (panelRef.current?.contains(t) || anchorRef.current?.contains(t))
        return;
      onClose();
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open, isDesktop, onClose, anchorRef]);

  useEffect(() => {
    if (!open || isDesktop) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open, isDesktop]);

  useEffect(() => {
    if (visible) panelRef.current?.focus({ preventScroll: true });
  }, [visible]);

  if (!mounted) return null;

  const set = <K extends keyof FilterState>(key: K, value: FilterState[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const errors = getFilterErrors(draft);
  const hasErrors = Object.keys(errors).length > 0;
  const isDefault = JSON.stringify(draft) === JSON.stringify(default_filters);
  const today = localDateString();

  const header = (
    <div className="flex items-center justify-between px-5 pb-3 pt-4 sm:pt-5">
      <h2 className="text-base font-semibold text-gray-900 dark:text-white">
        Filters
      </h2>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close filters"
        className="-mr-2 flex h-10 w-10 items-center justify-center rounded-full border-none text-gray-500 transition-colors
          hover:bg-gray-100 hover:text-black dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );

  const body = (
    <div
      className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-5
        [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full
        [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-thumb]:bg-gray-600"
    >
      <div className="grid gap-6 lg:grid-cols-2 lg:gap-x-8">
        <Section title="Sort by" className="lg:col-span-2">
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
            {sort_options.map((o) => (
              <Pill
                key={o.key}
                active={draft.sort === o.key}
                onClick={() => set("sort", o.key)}
              >
                {o.label}
              </Pill>
            ))}
          </div>
        </Section>

        <Section title="Category">
          <div className="-m-0.5 flex max-h-44 flex-wrap gap-2 overflow-y-auto p-0.5">
            <Pill
              active={!draft.category}
              onClick={() => set("category", null)}
            >
              All music
            </Pill>
            {categories.map((cat) => (
              <Pill
                key={cat.id}
                active={draft.category?.id === cat.id}
                onClick={() => set("category", cat)}
              >
                {cat.name}
              </Pill>
            ))}
          </div>
        </Section>

        <Section title="Favourites">
          <div
            role="group"
            aria-label="Favourites"
            className="grid grid-cols-3 gap-1 rounded-xl bg-gray-100 p-1 dark:bg-gray-800"
          >
            {favourite_options.map((o) => {
              const active = draft.favourite === o.key;
              return (
                <button
                  key={o.key}
                  type="button"
                  aria-pressed={active}
                  onClick={() => set("favourite", o.key)}
                  className={`rounded-lg border-none px-1.5 py-2 text-[13px] font-medium leading-tight transition-colors cursor-pointer sm:text-sm
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
                    ${
                      active
                        ? "bg-white text-black shadow-sm dark:bg-gray-600 dark:text-white"
                        : "bg-transparent text-gray-600 hover:text-black dark:text-gray-400 dark:hover:text-white"
                    }`}
                >
                  {o.label}
                </button>
              );
            })}
          </div>
        </Section>

        <Section
          title="Last played"
          error={errors.dates}
          className="lg:col-span-2"
        >
          <div className="flex flex-wrap gap-2">
            {played_options.map((o) => (
              <Pill
                key={o.key}
                active={draft.played === o.key}
                onClick={() => set("played", o.key)}
              >
                {o.label}
              </Pill>
            ))}
          </div>

          {draft.played === "custom" && (
            <div className="mt-3 grid grid-cols-1 gap-2 min-[380px]:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-xs text-gray-500 dark:text-gray-400">
                  From
                </span>
                <input
                  type="date"
                  value={draft.customFrom}
                  max={draft.customTo || today}
                  onChange={(e) => set("customFrom", e.target.value)}
                  className={inputClass}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs text-gray-500 dark:text-gray-400">
                  To
                </span>
                <input
                  type="date"
                  value={draft.customTo}
                  min={draft.customFrom || undefined}
                  max={today}
                  onChange={(e) => set("customTo", e.target.value)}
                  className={inputClass}
                />
              </label>
            </div>
          )}
        </Section>

        <Section title="Plays" error={errors.plays}>
          <RangeInputs
            label="plays"
            min={draft.minPlays}
            max={draft.maxPlays}
            onMin={(v) => set("minPlays", v)}
            onMax={(v) => set("maxPlays", v)}
          />
        </Section>

        <Section title="Skips" error={errors.skips}>
          <RangeInputs
            label="skips"
            min={draft.minSkips}
            max={draft.maxSkips}
            onMin={(v) => set("minSkips", v)}
            onMax={(v) => set("maxSkips", v)}
          />
        </Section>
      </div>
    </div>
  );

  const footer = (
    <div
      className="flex items-center gap-2 border-t border-gray-200 px-5 pt-3 dark:border-gray-800
        pb-[calc(env(safe-area-inset-bottom)+0.75rem)] sm:pb-4"
    >
      <button
        type="button"
        onClick={() => setDraft(default_filters)}
        disabled={isDefault}
        className="rounded-full border-none bg-transparent px-4 py-3 text-sm font-medium text-gray-600 transition-colors cursor-pointer
          hover:bg-gray-100 hover:text-black disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent
          dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        Reset
      </button>
      <button
        type="button"
        onClick={() => onApply(draft)}
        disabled={hasErrors}
        className="ml-auto flex-1 rounded-full border-none bg-blue-500 px-5 py-3 text-sm font-semibold text-white transition-all cursor-pointer
          hover:bg-blue-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
      >
        Apply filters
      </button>
    </div>
  );

  if (isDesktop) {
    return (
      <div
        ref={panelRef}
        role="dialog"
        aria-label="Filters"
        tabIndex={-1}
        className={`absolute top-full z-40 mt-2 flex w-[28rem] max-h-[min(75vh,44rem)] flex-col rounded-2xl outline-none lg:w-[42rem]
          ${align === "right" ? "right-0 origin-top-right" : "left-0 origin-top-left"}
          transition duration-200 ease-out motion-reduce:transition-none
          ${visible ? "translate-y-0 scale-100 opacity-100" : "pointer-events-none -translate-y-1 scale-95 opacity-0"}
          ${surfaceClass}`}
      >
        {header}
        {body}
        {footer}
      </div>
    );
  }

  return createPortal(
    <div className="fixed inset-0 z-[70]">
      <div
        aria-hidden="true"
        onClick={onClose}
        className={`absolute inset-0 bg-black/50 transition-opacity duration-300 motion-reduce:transition-none ${
          visible ? "opacity-100" : "opacity-0"
        }`}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Filters"
        tabIndex={-1}
        className={`absolute inset-x-0 bottom-0 flex max-h-[88dvh] flex-col rounded-t-3xl outline-none
          transition-transform duration-300 ease-out motion-reduce:transition-none
          ${visible ? "translate-y-0" : "translate-y-full"}
          ${surfaceClass}`}
      >
        <div
          aria-hidden="true"
          className="mx-auto mt-2.5 h-1.5 w-10 shrink-0 rounded-full bg-gray-300 dark:bg-gray-600"
        />
        {header}
        {body}
        {footer}
      </div>
    </div>,
    document.body,
  );
}

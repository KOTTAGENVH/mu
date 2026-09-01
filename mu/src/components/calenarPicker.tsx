"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { roboto } from "@/app/fonts";
import { useAppleWebkit } from "@/hooks/useAppleWebkit";
import { panelSurface } from "@/lib/surfaceDropdown";

const weekdays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const pad = (n: number) => String(n).padStart(2, "0");

export const toKey = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const todayKey = () => toKey(new Date());

const fromKey = (key: string) => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};

const monthStart = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const addMonths = (d: Date, n: number) =>
  new Date(d.getFullYear(), d.getMonth() + n, 1);
const daysInMonth = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();

interface CalendarPickerProps {
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  align?: "left" | "right";
  label?: string;
}

export function CalendarPicker({
  value,
  onChange,
  min,
  max,
  align = "left",
  label = "Pick a date",
}: CalendarPickerProps) {
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(() => monthStart(fromKey(value)));
  const wrapRef = useRef<HTMLDivElement>(null);
  const isAppleWebkit = useAppleWebkit();

  useEffect(() => {
    setCursor(monthStart(fromKey(value)));
  }, [value]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (wrapRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const cells = useMemo(() => {
    const lead = cursor.getDay();
    const total = daysInMonth(cursor);
    const out: Array<string | null> = Array.from({ length: lead }, () => null);
    for (let day = 1; day <= total; day++) {
      out.push(
        `${cursor.getFullYear()}-${pad(cursor.getMonth() + 1)}-${pad(day)}`,
      );
    }
    return out;
  }, [cursor]);

  const outOfRange = (key: string) =>
    (min !== undefined && key < min) || (max !== undefined && key > max);

  const canGoPrev =
    min === undefined ||
    toKey(addMonths(cursor, -1)) >= toKey(monthStart(fromKey(min)));
  const canGoNext =
    max === undefined ||
    toKey(addMonths(cursor, 1)) <= toKey(monthStart(fromKey(max)));

  const today = todayKey();

  return (
    <div className="relative inline-block" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={label}
        aria-expanded={open}
        className={`${roboto.className} w-auto min-w-[150px] px-4 py-2.5 flex items-center gap-2 rounded-2xl border-none
          bg-black/10 dark:bg-white/10 backdrop-blur-sm text-black dark:text-white
          hover:bg-black/15 dark:hover:bg-white/15 cursor-pointer outline-none
          focus-visible:ring-2 focus-visible:ring-blue-500/50 transition-all duration-200`}
      >
        <CalendarDays className="w-4 h-4 text-gray-500 dark:text-gray-400 pointer-events-none" />
        <span className="text-sm">{value === today ? "Today" : value}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className={`absolute z-50 mt-2 p-3 w-72 rounded-2xl
              ${align === "right" ? "right-0" : "left-0"}
              ${panelSurface(isAppleWebkit)}`}
          >
            <div className="flex items-center justify-between mb-2 px-1">
              <button
                type="button"
                disabled={!canGoPrev}
                onClick={() => setCursor((c) => addMonths(c, -1))}
                aria-label="Previous month"
                className="w-8 h-8 inline-flex items-center justify-center rounded-xl border-none bg-transparent cursor-pointer
                  text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800
                  disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                {months[cursor.getMonth()]} {cursor.getFullYear()}
              </p>
              <button
                type="button"
                disabled={!canGoNext}
                onClick={() => setCursor((c) => addMonths(c, 1))}
                aria-label="Next month"
                className="w-8 h-8 inline-flex items-center justify-center rounded-xl border-none bg-transparent cursor-pointer
                  text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800
                  disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-1">
              {weekdays.map((d) => (
                <span
                  key={d}
                  className="h-6 flex items-center justify-center text-[10px] font-medium text-gray-400 dark:text-gray-500"
                >
                  {d}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {cells.map((key, i) => {
                if (!key) return <span key={`pad-${i}`} className="h-9" />;
                const isSelected = key === value;
                const isToday = key === today;
                const disabled = outOfRange(key);
                return (
                  <button
                    key={key}
                    type="button"
                    disabled={disabled}
                    onClick={() => {
                      onChange(key);
                      setOpen(false);
                    }}
                    aria-pressed={isSelected}
                    className={`h-9 rounded-xl text-sm border-none cursor-pointer transition-colors duration-150
                      disabled:opacity-25 disabled:cursor-not-allowed
                      ${
                        isSelected
                          ? "bg-blue-100 text-blue-700 font-medium dark:bg-blue-900/50 dark:text-blue-300"
                          : "bg-transparent text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                      }
                      ${isToday && !isSelected ? "ring-1 ring-inset ring-blue-500/40" : ""}`}
                  >
                    {Number(key.slice(8))}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => {
                onChange(today);
                setOpen(false);
              }}
              disabled={outOfRange(today)}
              className="mt-2 w-full px-3 py-2 rounded-xl text-sm text-center border-none cursor-pointer
                text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800
                disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Today
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default CalendarPicker;

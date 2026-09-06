"use client";
import React, { useEffect, useState } from "react";
import {
  Archive,
  Globe2,
  Newspaper,
  ShieldAlert,
  SlidersHorizontal,
  Sunrise,
} from "lucide-react";
import { inter, roboto } from "@/app/fonts";
import WorldMap from "./worldmap";
import CountryPanel from "./countryPanel";
import LocalDesk from "./localDesk";
import CyberDesk from "./cyberDesk";
import Briefing from "./briefing";
import ArchiveDesk from "./archiveDesk";
import OpsPanel from "./opsPanel";

type View = "world" | "local" | "cyber" | "briefing" | "archive" | "ops";

const views: Array<{ key: View; label: string; icon: React.ReactNode }> = [
  { key: "world", label: "World", icon: <Globe2 className="w-4 h-4" /> },
  { key: "local", label: "Sri Lanka", icon: <Newspaper className="w-4 h-4" /> },
  { key: "cyber", label: "Cyber", icon: <ShieldAlert className="w-4 h-4" /> },
  { key: "briefing", label: "Briefing", icon: <Sunrise className="w-4 h-4" /> },
  { key: "archive", label: "Archive", icon: <Archive className="w-4 h-4" /> },
  {
    key: "ops",
    label: "Operations",
    icon: <SlidersHorizontal className="w-4 h-4" />,
  },
];

function NewsHub() {
  const [view, setView] = useState<View>("world");
  const [country, setCountry] = useState<string | null>(null);

  function greetingFor(hour: number): string {
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  }

  const [greeting, setGreeting] = useState("Hello");

  useEffect(() => {
    setGreeting(greetingFor(new Date().getHours()));
  }, []);

  return (
    <div className="justify-center items-center w-auto h-auto mt-20 mx-4 px-3 lg:mx-16 lg:px-6">
      <div>
        <h1
          className={`${inter.className} text-2xl font-semibold text-black dark:text-white`}
        >
          {greeting}
          {process.env.NEXT_PUBLIC_USERNAME
            ? `, ${process.env.NEXT_PUBLIC_USERNAME}`
            : ""}
        </h1>
        <p
          className={`${roboto.className} mt-1 text-sm text-black/50 dark:text-white/50`}
        >
          Pick a country to read its desk, or move between the local wire, cyber
          advisories and the archive.
        </p>
      </div>
      <div
        role="tablist"
        aria-label="News view"
        className="relative inline-flex flex-wrap gap-1 p-1.5 mt-4 rounded-2xl
    bg-white/20 dark:bg-white/[0.04]
    backdrop-blur-xl backdrop-saturate-150
    border border-white/40 dark:border-white/10
    shadow-[inset_0_1px_1px_rgba(255,255,255,0.6),inset_0_-1px_2px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.08)]
    dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.08),inset_0_-1px_2px_rgba(0,0,0,0.4),0_4px_16px_rgba(0,0,0,0.3)]"
      >
        {views.map((item) => {
          const active = view === item.key;
          return (
            <button
              key={item.key}
              role="tab"
              aria-selected={active}
              onClick={() => setView(item.key)}
              className={`relative inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm
          border-none cursor-pointer transition-all duration-200
          focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50
          ${
            active
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
      <div key={view} className="rise">
        {view === "world" && (
          <div className="mt-6">
            <WorldMap selectedCountry={country} onSelect={setCountry} />
            <CountryPanel country={country} onClose={() => setCountry(null)} />
          </div>
        )}
        {view === "local" && <LocalDesk />}
        {view === "cyber" && <CyberDesk />}
        {view === "briefing" && <Briefing />}
        {view === "archive" && <ArchiveDesk />}
        {view === "ops" && <OpsPanel />}
      </div>

      <div className="h-32 w-full shrink-0" aria-hidden="true" />
    </div>
  );
}

export default NewsHub;

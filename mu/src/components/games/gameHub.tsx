"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGamepad } from "@fortawesome/free-solid-svg-icons";
import { inter, roboto } from "@/app/fonts";
import { useAppleWebkit } from "@/hooks/useAppleWebkit";
import { panelSurface } from "@/lib/surfaceDropdown";
import GameCard from "../../components/games/gamesCard"
import { games, gameCategories, type Game } from "../../lib/games/game";

type PlayerFilter = "any" | "solo" | "multi";

interface Filters {
  category: string | null;
  players: PlayerFilter;
}

const defaultFilters: Filters = { category: null, players: "any" };

const playerOptions: Array<{ key: PlayerFilter; label: string }> = [
  { key: "any", label: "Any" },
  { key: "solo", label: "Single player" },
  { key: "multi", label: "Multiplayer" },
];

function matches(game: Game, query: string, filters: Filters) {
  if (filters.category && !game.categories.includes(filters.category))
    return false;
  if (filters.players === "solo" && game.minPlayers > 1) return false;
  if (filters.players === "multi" && game.maxPlayers < 2) return false;

  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return true;
  const haystack = [game.name, game.tagline, game.description, ...game.categories]
    .join(" ")
    .toLowerCase();
  return terms.every((t) => haystack.includes(t));
}

const optionClass = (active: boolean) =>
  `rounded-xl border-none px-3.5 py-2 text-sm font-semibold cursor-pointer transition-colors
   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60
   ${
     active
       ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
       : "bg-black/5 text-black hover:bg-black/10 dark:bg-white/[0.06] dark:text-white dark:hover:bg-white/10"
   }`;

function GameHub() {
  const [search, setSearch] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [panelOpen, setPanelOpen] = useState(false);
  const filterButtonRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const isAppleWebkit = useAppleWebkit();

  useEffect(() => {
    if (!panelOpen) return;
    const onPointer = (e: PointerEvent) => {
      const target = e.target as Node;
      if (
        panelRef.current?.contains(target) ||
        filterButtonRef.current?.contains(target)
      )
        return;
      setPanelOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setPanelOpen(false);
        filterButtonRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [panelOpen]);

  const chips = useMemo(() => {
    const list: Array<{ key: string; label: string; clear: () => void }> = [];
    if (filters.category)
      list.push({
        key: "category",
        label: filters.category,
        clear: () => setFilters((f) => ({ ...f, category: null })),
      });
    if (filters.players !== "any")
      list.push({
        key: "players",
        label:
          playerOptions.find((o) => o.key === filters.players)?.label ?? "",
        clear: () => setFilters((f) => ({ ...f, players: "any" })),
      });
    return list;
  }, [filters]);

  const results = useMemo(
    () => games.filter((g) => matches(g, search, filters)),
    [search, filters],
  );

  const clearEverything = () => {
    setSearch("");
    setFilters(defaultFilters);
  };

  return (
    <div className="justify-center items-center w-auto h-auto mt-20 mx-4 px-3 lg:mx-16 lg:px-6">
      <div>
        <h1
          className={`${inter.className} text-2xl font-semibold text-black dark:text-white`}
        >
          Games
        </h1>
        <p
          className={`${roboto.className} mt-1 text-sm text-black/50 dark:text-white/50`}
        >
          Pick a game to start playing.
        </p>
      </div>

      <div className="relative mt-4 flex items-center gap-2 w-full">
        <button
          ref={filterButtonRef}
          type="button"
          onClick={() => setPanelOpen((v) => !v)}
          aria-haspopup="dialog"
          aria-expanded={panelOpen}
          aria-label={
            chips.length ? `Filters, ${chips.length} active` : "Filters"
          }
          title="Filters"
          className={`relative flex-none inline-flex h-12 w-12 items-center justify-center rounded-2xl border-none cursor-pointer transition-colors
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60
            ${
              panelOpen || chips.length > 0
                ? "bg-blue-500 text-white hover:bg-blue-600"
                : "bg-black/10 text-black hover:bg-black/15 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
            }`}
        >
          <SlidersHorizontal className="h-4 w-4 stroke-[2.5]" />
          {chips.length > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-white px-1 text-[11px] font-bold text-blue-600 shadow">
              {chips.length}
            </span>
          )}
        </button>

        <div className="relative flex-1">
          <Search
            className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-200 pointer-events-none
              ${isSearchFocused ? "text-blue-500" : "text-gray-400 dark:text-gray-500"}`}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setSearch("");
            }}
            aria-label="Search games"
            className="text-base w-full pl-10 pr-10 py-3 bg-black/10 dark:bg-white/10 backdrop-blur-sm border-none rounded-2xl
              text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400
              focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-200"
            placeholder="Search games"
          />
          {search.length > 0 && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors duration-200 w-5 h-5 flex items-center justify-center border-none bg-transparent cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {panelOpen && (
          <div
            ref={panelRef}
            role="dialog"
            aria-label="Game filters"
            className={`rise absolute left-0 top-full z-40 mt-2 w-[min(24rem,calc(100vw-2rem))] rounded-2xl p-5 shadow-2xl ${panelSurface(isAppleWebkit)}`}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-black dark:text-white">
                Filters
              </h2>
              <button
                type="button"
                onClick={() => setPanelOpen(false)}
                aria-label="Close filters"
                className="flex h-8 w-8 items-center justify-center rounded-full border-none bg-transparent cursor-pointer text-gray-500 hover:bg-black/5 hover:text-black dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <h3 className="mt-4 text-sm font-semibold text-black dark:text-white">
              Category
            </h3>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                aria-pressed={filters.category === null}
                onClick={() => setFilters((f) => ({ ...f, category: null }))}
                className={optionClass(filters.category === null)}
              >
                All games
              </button>
              {gameCategories.map((category) => (
                <button
                  key={category}
                  type="button"
                  aria-pressed={filters.category === category}
                  onClick={() => setFilters((f) => ({ ...f, category }))}
                  className={optionClass(filters.category === category)}
                >
                  {category}
                </button>
              ))}
            </div>

            <h3 className="mt-5 text-sm font-semibold text-black dark:text-white">
              Players
            </h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {playerOptions.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  aria-pressed={filters.players === option.key}
                  onClick={() =>
                    setFilters((f) => ({ ...f, players: option.key }))
                  }
                  className={optionClass(filters.players === option.key)}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-black/5 pt-4 dark:border-white/10">
              <button
                type="button"
                onClick={() => setFilters(defaultFilters)}
                disabled={chips.length === 0}
                className="border-none bg-transparent px-2 py-1.5 text-sm font-medium text-gray-500 cursor-pointer hover:text-black dark:text-gray-400 dark:hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setPanelOpen(false)}
                className="rounded-full border-none bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white cursor-pointer transition-colors hover:bg-blue-600
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60"
              >
                Show {results.length} {results.length === 1 ? "game" : "games"}
              </button>
            </div>
          </div>
        )}
      </div>

      {chips.length > 0 && (
        <div
          className="rise -mx-3 mt-3 flex items-center gap-2 overflow-x-auto px-3 pb-1
            [scrollbar-width:none] [&::-webkit-scrollbar]:hidden
            sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0"
        >
          {chips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={chip.clear}
              aria-label={`Remove filter: ${chip.label}`}
              className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border-none px-3 py-1.5 text-xs font-medium cursor-pointer
                bg-blue-100 text-blue-700 transition-colors hover:bg-blue-200
                dark:bg-blue-900/50 dark:text-blue-300 dark:hover:bg-blue-900"
            >
              {chip.label}
              <X className="h-3 w-3" />
            </button>
          ))}
          {chips.length > 1 && (
            <button
              type="button"
              onClick={() => setFilters(defaultFilters)}
              className="shrink-0 whitespace-nowrap rounded-full border-none bg-transparent px-2 py-1.5 text-xs font-medium text-gray-500 cursor-pointer
                hover:text-black hover:underline dark:text-gray-400 dark:hover:text-white"
            >
              Clear all
            </button>
          )}
        </div>
      )}

      {results.length === 0 ? (
        <div className="rise min-h-[40vh] flex flex-col items-center justify-center text-center py-10 gap-3">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-1">
            <FontAwesomeIcon
              icon={faGamepad}
              className="w-7 h-7 text-gray-400 dark:text-gray-500"
            />
          </div>
          <p className="text-black dark:text-white text-lg font-medium">
            No games found
          </p>
          <span className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
            {chips.length > 0
              ? "No games match these filters. Remove one above or clear them all."
              : "Try a different game name."}
          </span>
          <button
            type="button"
            onClick={clearEverything}
            className="mt-2 px-4 py-2 rounded-xl text-sm bg-gray-100 dark:bg-gray-800 text-black dark:text-white
              hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors border-none cursor-pointer"
          >
            Clear search and filters
          </button>
        </div>
      ) : (
        <div className="w-full grid grid-cols-1 sm:grid-cols-[repeat(auto-fill,minmax(20rem,1fr))] gap-6 content-start overflow-x-hidden bg-transparent mt-6 p-4 rounded-2xl">
          {results.map((game, index) => (
            <div
              key={game.id}
              className="rise h-full w-full"
              style={{ animationDelay: `${Math.min(index * 40, 300)}ms` }}
            >
              <GameCard game={game} />
            </div>
          ))}
        </div>
      )}

      <div className="h-32 w-full shrink-0" aria-hidden="true" />
    </div>
  );
}

export default GameHub;
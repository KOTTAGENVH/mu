"use client";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ArrowUpRight, Layers } from "lucide-react";
import type { Game } from "../../lib/games/game";

function playersLabel(min: number, max: number) {
  if (min === max) return `${min} ${min === 1 ? "player" : "players"}`;
  return `${min}–${max} players`;
}

export default function GameCard({ game }: { game: Game }) {
  return (
    <Link
      href={game.href}
      aria-label={`Play ${game.name}`}
      className="group block h-full rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
    >
      <div
        className="
          relative flex h-full w-full flex-col rounded-2xl p-4 sm:p-5
          bg-white dark:bg-[#0e1628]
          ring-1 ring-slate-200 dark:ring-white/[0.07] shadow-sm
          transition-all duration-200
          group-hover:shadow-md group-hover:ring-slate-300 dark:group-hover:ring-white/[0.14]
        "
      >
        <span
          className="
            absolute left-0 top-[38px] sm:top-[44px] -translate-y-1/2
            h-0 w-[3px] opacity-0 rounded-r-full bg-blue-500 dark:bg-blue-400
            transition-all duration-200
            group-hover:h-7 group-hover:opacity-100
          "
        />

        <div className="flex items-start gap-3 sm:gap-4">
          <div
            aria-hidden="true"
            className="
              flex-shrink-0 h-11 w-11 sm:h-12 sm:w-12
              flex items-center justify-center rounded-xl
              bg-blue-50 text-blue-500 dark:bg-[#1a2745] dark:text-blue-400
              transition-colors duration-200
              group-hover:bg-blue-100 dark:group-hover:bg-[#20305a]
            "
          >
            <FontAwesomeIcon
              icon={game.icon}
              className="w-4 h-4 sm:w-[18px] sm:h-[18px]"
            />
          </div>

          <div className="min-w-0 flex-1 pt-0.5">
            <h3
              title={game.name}
              className="
                line-clamp-2 min-h-[2.75em] break-words text-[15px] sm:text-base font-bold leading-snug
                text-slate-900 dark:text-white transition-colors duration-200
                group-hover:text-blue-700 dark:group-hover:text-blue-300
              "
            >
              {game.name}
            </h3>
            <p
              title={game.tagline}
              className="mt-1 truncate text-sm text-blue-600 dark:text-blue-400"
            >
              {game.tagline}
            </p>
          </div>

          <ArrowUpRight
            aria-hidden="true"
            className="
              mr-0.5 mt-0.5 h-5 w-5 flex-shrink-0
              text-slate-400 dark:text-slate-500
              transition-[color,transform] duration-200
              group-hover:text-blue-500 dark:group-hover:text-blue-400
            "
          />
        </div>

        <p className="mt-4 sm:mt-5 line-clamp-2 min-h-[2.5rem] text-sm leading-5 text-slate-600 dark:text-slate-400">
          {game.description}
        </p>

        <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 font-mono text-xs">
          <span className="text-blue-600 dark:text-blue-400">
            {playersLabel(game.minPlayers, game.maxPlayers)}
          </span>
          <span className="text-slate-500 dark:text-slate-400">
            {game.duration}
          </span>
        </p>

        <div className="mt-auto pt-4">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-slate-100 pt-3.5 dark:border-white/[0.07]">
            {game.categories.map((category) => (
              <span
                key={category}
                className="inline-flex min-w-0 max-w-full items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-white/[0.06] dark:text-slate-200"
              >
                <Layers className="h-3 w-3 flex-shrink-0" aria-hidden="true" />
                <span className="truncate">{category}</span>
              </span>
            ))}
            <span className="ml-auto flex-shrink-0 font-mono text-xs text-slate-400 dark:text-slate-500">
              #{game.id}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

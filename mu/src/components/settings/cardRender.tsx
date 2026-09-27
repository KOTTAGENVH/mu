"use client";
import React, { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faLayerGroup,
  faHeart,
  faMagnifyingGlass,
  faShieldHalved,
  faMusic,
  faMask,
  faRotateLeft,
  faArrowsLeftRight,
  faHistory,
  faWaveSquare,
  faFile,
  faChevronRight,
  faCheck,
  type IconDefinition,
  faBan,
  faChartSimple,
  faHurricane,
  faCode,
} from "@fortawesome/free-solid-svg-icons";
import { useVisualizer, VisualizerMode } from "@/contextApi/audioVizualizer";
import { useSearch } from "@/contextApi/sematicSearch";
import { useMask } from "@/contextApi/mask";
import { useAudioEq } from "@/contextApi/audioEnhance";
import { Spinner, Switch } from "./statusDisplay/helper";

interface RenderProps {
  onSettingSelect: (id: number) => void;
  busyId?: number | null;
}

interface SettingItem {
  id: number;
  title: string;
  description: string;
  icon: IconDefinition;
  kind: Kind;
  on?: boolean;
  value?: string;
}

type Kind = "page" | "toggle" | "action" | "danger";

const visualizerMeta: Partial<
  Record<VisualizerMode, { label: string; icon: IconDefinition }>
> = {
  [VisualizerMode.Off]: { label: "Off", icon: faBan },
  [VisualizerMode.Bars]: { label: "Bars", icon: faChartSimple },
  [VisualizerMode.Spiral]: { label: "Spiral", icon: faHurricane },
  [VisualizerMode.Matrix]: { label: "Matrix", icon: faCode },
};

function SettingCardRender({ onSettingSelect, busyId = null }: RenderProps) {
  const { sematicSearch } = useSearch();
  const { maskStatus } = useMask();
  const { useCompressor } = useAudioEq();
  const { mode: visualizerMode } = useVisualizer();
  const visualizer = visualizerMeta[visualizerMode] ?? {
    label: "On",
    icon: faWaveSquare,
  };
  const visualizerOff = visualizerMode === VisualizerMode.Off;
  const [doneId, setDoneId] = useState<number | null>(null);
  const doneTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (doneTimer.current) clearTimeout(doneTimer.current);
    },
    [],
  );

  const groups: { title: string; items: SettingItem[] }[] = [
    {
      title: "Library",
      items: [
        {
          id: 5,
          title: "Manage audio",
          description: "Edit, filter and delete your tracks",
          icon: faMusic,
          kind: "page",
        },
        {
          id: 1,
          title: "Categories",
          description: "Create, rename and remove categories",
          icon: faLayerGroup,
          kind: "page",
        },
        {
          id: 2,
          title: "Wish lists",
          description: "Songs you want to add later",
          icon: faHeart,
          kind: "page",
        },
        {
          id: 10,
          title: "Activity log",
          description: "Every upload, edit and delete",
          icon: faHistory,
          kind: "page",
        },
        {
          id: 11,
          title: "Download data",
          description: "Export your library as a PDF report",
          icon: faFile,
          kind: "action",
        },
      ],
    },
    {
      title: "Listening",
      items: [
        {
          id: 3,
          title: "Semantic search",
          description: "Smarter, typo-tolerant search by song or artist",
          icon: faMagnifyingGlass,
          kind: "toggle",
          on: sematicSearch,
        },
        {
          id: 8,
          title: "Volume leveler",
          description: "Evens out loud and quiet tracks",
          icon: faArrowsLeftRight,
          kind: "toggle",
          on: useCompressor,
        },
        {
          id: 9,
          title: "Visualizer",
          description: "Tap to switch to the next style",
          icon: visualizer.icon,
          kind: "action",
          value: visualizer.label,
        },
        {
          id: 7,
          title: "Reset equalizer",
          description: "Set every EQ band back to 0 dB",
          icon: faRotateLeft,
          kind: "action",
        },
      ],
    },
    {
      title: "Privacy & security",
      items: [
        {
          id: 6,
          title: "Mask songs",
          description: "Hide song names and artists on screen",
          icon: faMask,
          kind: "toggle",
          on: maskStatus,
        },
        {
          id: 4,
          title: "Change authenticator",
          description: "Unlink your sign-in app and set up a new one",
          icon: faShieldHalved,
          kind: "danger",
        },
      ],
    },
  ];

  const handleClick = (item: SettingItem) => {
    onSettingSelect(item.id);
    if (item.kind === "action" && item.id !== 11 && item.id !== 9) {
      setDoneId(item.id);
      if (doneTimer.current) clearTimeout(doneTimer.current);
      doneTimer.current = setTimeout(() => setDoneId(null), 1500);
    }
  };

  const trailing = (item: SettingItem) => {
    if (busyId === item.id)
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400">
          <Spinner />
          Working
        </span>
      );
    if (doneId === item.id)
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
          <FontAwesomeIcon icon={faCheck} className="h-3 w-3" />
          Done
        </span>
      );
    if (item.kind === "toggle") return <Switch on={Boolean(item.on)} />;
    if (item.kind === "page" || item.kind === "danger")
      return (
        <FontAwesomeIcon
          icon={faChevronRight}
          className={`h-3 w-3 transition-transform duration-150 group-hover:translate-x-0.5 ${
            item.kind === "danger"
              ? "text-rose-400"
              : "text-slate-400 dark:text-slate-500"
          }`}
        />
      );
    if (item.value)
      return (
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            item.id === 9 && visualizerOff
              ? "bg-slate-100 text-slate-600 dark:bg-white/[0.08] dark:text-slate-400"
              : "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300"
          }`}
        >
          {item.value}
        </span>
      );
    return null;
  };

  return (
    <div className="mx-auto mb-8 mt-8 w-full max-w-[1600px] space-y-8">
      {groups.map((group) => (
        <section key={group.title} aria-labelledby={`settings-${group.title}`}>
          <h2
            id={`settings-${group.title}`}
            className="mb-3 px-1 text-sm font-semibold text-slate-600 dark:text-slate-400"
          >
            {group.title}
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {group.items.map((item) => {
              const danger = item.kind === "danger";
              const isToggle = item.kind === "toggle";
              const busy = busyId === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleClick(item)}
                  disabled={busy}
                  role={isToggle ? "switch" : undefined}
                  aria-checked={isToggle ? Boolean(item.on) : undefined}
                  aria-busy={busy || undefined}
                  className={`group flex w-full min-w-0 items-center gap-3 rounded-2xl border-none bg-white p-4 text-left ring-1 cursor-pointer
                    dark:bg-[#0e1628] hover:shadow-md disabled:cursor-wait disabled:opacity-70
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
                    ${
                      danger
                        ? "ring-rose-200 hover:ring-rose-300 dark:ring-rose-500/20 dark:hover:ring-rose-500/40"
                        : "ring-slate-200 hover:ring-slate-300 dark:ring-white/[0.07] dark:hover:ring-white/[0.14]"
                    }`}
                >
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl
                      ${
                        danger
                          ? "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400"
                          : isToggle && item.on
                            ? "bg-blue-500 text-white"
                            : "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
                      }`}
                  >
                    <FontAwesomeIcon icon={item.icon} className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className={`block text-sm font-semibold ${
                        danger
                          ? "text-rose-700 dark:text-rose-300"
                          : "text-slate-900 dark:text-white"
                      }`}
                    >
                      {item.title}
                    </span>
                    <span className="mt-0.5 block text-xs leading-snug text-slate-500 dark:text-slate-400">
                      {item.description}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center">
                    {trailing(item)}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

export default SettingCardRender;

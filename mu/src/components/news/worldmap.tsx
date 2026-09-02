"use client";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  Minus,
  Plus,
  RotateCcw,
  Search,
  TriangleAlert,
  X,
} from "lucide-react";
import { inter, roboto } from "@/app/fonts";
import {
  displayName,
  local_country,
  regionForCode,
  regionForCountry,
  region_colors,
  region_labels,
  tiny_countries,
  type Region,
} from "../../lib/news/geography";

interface WorldMapProps {
  selectedCountry: string | null;
  onSelect: (country: string | null) => void;
  geoUrl?: string;
}

interface Box {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

interface Parsed {
  d: string;
  main: Box;
}

const width = 1000;
const lat_top = 84;
const lat_bottom = -56;
const height = (width * (lat_top - lat_bottom)) / 360;
const unmapped_fill = "#9ca3af";
const min_zoom = 1;
const max_zoom = 8;
const drag_threshold = 4;
const label_min_zoom = 1;
const label_min_width = 26;
const label_font = 11;
const label_pad = 3;
const max_results = 8;
const marker_size = 4;

function markerShape(name: string, lon: number, lat: number): Shape {
  const [x, y] = project(lon, lat);
  const r = marker_size / 2;
  return {
    name,
    key: foldForSearch(name),
    d: `M${x} ${y - r}L${x + r} ${y}L${x} ${y + r}L${x - r} ${y}Z`,
    region: regionForCountry(name),
    cx: x,
    cy: y,
    width: marker_size,
    isMarker: true,
  };
}

function project(lon: number, lat: number): [number, number] {
  const clamped = Math.max(lat_bottom, Math.min(lat_top, lat));
  const x = ((lon + 180) / 360) * width;
  const y = ((lat_top - clamped) / (lat_top - lat_bottom)) * height;
  return [x, y];
}

const empty_box = (): Box => ({
  minX: Infinity,
  minY: Infinity,
  maxX: -Infinity,
  maxY: -Infinity,
});

function ringToPath(ring: number[][], box: Box): string {
  let d = "";
  for (let i = 0; i < ring.length; i++) {
    const [x, y] = project(ring[i][0], ring[i][1]);
    if (x < box.minX) box.minX = x;
    if (x > box.maxX) box.maxX = x;
    if (y < box.minY) box.minY = y;
    if (y > box.maxY) box.maxY = y;
    d += `${i === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
  }
  return `${d}Z`;
}

function geometryToPath(geometry: {
  type: string;
  coordinates: unknown;
}): Parsed {
  const rings: number[][][] =
    geometry.type === "Polygon"
      ? (geometry.coordinates as number[][][])
      : geometry.type === "MultiPolygon"
        ? (geometry.coordinates as number[][][][]).flat()
        : [];

  let d = "";
  let main = empty_box();
  let bestArea = -1;

  for (const ring of rings) {
    const box = empty_box();
    d += ringToPath(ring, box);
    if (!Number.isFinite(box.minX)) continue;

    const area = (box.maxX - box.minX) * (box.maxY - box.minY);
    if (area > bestArea) {
      bestArea = area;
      main = box;
    }
  }

  return { d, main };
}

interface FeatureProps {
  NAME?: string;
  ADMIN?: string;
  NAME_LONG?: string;
  ISO_A3?: string;
  ISO_A3_EH?: string;
  ADM0_A3?: string;
}

function isoCode(props: FeatureProps | undefined): string | null {
  for (const code of [props?.ISO_A3, props?.ISO_A3_EH, props?.ADM0_A3]) {
    if (code && code !== "-99") return code;
  }
  return null;
}

function foldForSearch(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

interface Shape {
  name: string;
  key: string;
  d: string;
  region: Region | null;
  cx: number;
  cy: number;
  width: number;
  isMarker?: boolean;
}

interface Transform {
  k: number;
  x: number;
  y: number;
}

interface DragState {
  active: boolean;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
  moved: number;
  name: string | null;
}

interface PinchState {
  startDist: number;
  startMid: { x: number; y: number };
  origin: Transform;
}

const initial_transform: Transform = { k: 1, x: 0, y: 0 };
const initial_drag: DragState = {
  active: false,
  startX: 0,
  startY: 0,
  originX: 0,
  originY: 0,
  moved: 0,
  name: null,
};

function clampTransform(next: Transform): Transform {
  const k = Math.max(min_zoom, Math.min(max_zoom, next.k));
  return {
    k,
    x: Math.max(width - width * k, Math.min(0, next.x)),
    y: Math.max(height - height * k, Math.min(0, next.y)),
  };
}

function zoomAround(
  prev: Transform,
  nextK: number,
  px: number,
  py: number,
): Transform {
  const k = Math.max(min_zoom, Math.min(max_zoom, nextK));
  if (k === prev.k) return prev;
  return clampTransform({
    k,
    x: px - ((px - prev.x) / prev.k) * k,
    y: py - ((py - prev.y) / prev.k) * k,
  });
}

const distance = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  Math.hypot(a.x - b.x, a.y - b.y);

function WorldMap({
  selectedCountry,
  onSelect,
  geoUrl = "/world_countries.json",
}: WorldMapProps) {
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [pointer, setPointer] = useState<{ x: number; y: number } | null>(null);
  const [transform, setTransform] = useState<Transform>(initial_transform);
  const [zoomHint, setZoomHint] = useState(false);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(0);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const drag = useRef<DragState>({ ...initial_drag });
  const hintTimer = useRef<number | null>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<PinchState | null>(null);

  const toViewBox = useCallback((clientX: number, clientY: number) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: ((clientX - rect.left) / rect.width) * width,
      y: ((clientY - rect.top) / rect.height) * height,
    };
  }, []);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);

    fetch(geoUrl)
      .then((res) => {
        if (!res.ok) throw new Error(`Map data returned ${res.status}`);
        return res.json();
      })
      .then((json) => {
        if (!alive) return;
        const features = (json?.features ?? []) as Array<{
          properties: FeatureProps;
          geometry: { type: string; coordinates: unknown };
        }>;

        const next: Shape[] = features
          .filter((f) => f.properties?.NAME !== "Antarctica")
          .map((f) => {
            const raw =
              f.properties?.NAME ??
              f.properties?.ADMIN ??
              f.properties?.NAME_LONG ??
              "";
            const name = displayName(raw);
            const region =
              regionForCode(isoCode(f.properties)) ?? regionForCountry(name);

            const { d, main } = geometryToPath(f.geometry);
            const finite = Number.isFinite(main.minX);

            return {
              name,
              key: foldForSearch(name),
              d,
              region,
              cx: finite ? (main.minX + main.maxX) / 2 : 0,
              cy: finite ? (main.minY + main.maxY) / 2 : 0,
              width: finite ? main.maxX - main.minX : 0,
            };
          })
          .filter((s) => s.name && s.d);

        if (process.env.NODE_ENV !== "production") {
          const missing = next
            .filter((s) => !s.region)
            .map((s) => s.name)
            .sort();
          if (missing.length) {
            console.warn(
              `[worldmap] ${missing.length} countries have no region:`,
              missing,
            );
          }
        }

        const have = new Set(next.map((s) => s.name));
        const markers = Object.entries(tiny_countries)
          .filter(([name]) => !have.has(name))
          .map(([name, [lon, lat]]) => markerShape(name, lon, lat));

        setShapes([...next, ...markers]);
      })
      .catch((err: unknown) => {
        if (!alive) return;
        setError(
          err instanceof Error ? err.message : "Could not load the world map",
        );
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [geoUrl]);

  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;

    const onWheel = (event: WheelEvent) => {
      if (!event.ctrlKey && !event.metaKey) {
        setZoomHint(true);
        if (hintTimer.current) window.clearTimeout(hintTimer.current);
        hintTimer.current = window.setTimeout(() => setZoomHint(false), 1400);
        return;
      }

      event.preventDefault();
      setZoomHint(false);

      const { x: px, y: py } = toViewBox(event.clientX, event.clientY);
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 100 : 1;
      const factor = Math.exp((-event.deltaY * unit) / 300);

      setTransform((prev) => zoomAround(prev, prev.k * factor, px, py));
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheel);
      if (hintTimer.current) window.clearTimeout(hintTimer.current);
    };
  }, [loading, error, toViewBox]);

  const endDrag = useCallback(() => {
    drag.current.active = false;
    drag.current.name = null;
  }, []);

  const onPointerDown = useCallback(
    (event: React.PointerEvent<SVGSVGElement>) => {
      pointers.current.set(event.pointerId, {
        x: event.clientX,
        y: event.clientY,
      });
      event.currentTarget.setPointerCapture(event.pointerId);

      if (pointers.current.size === 2) {
        const [a, b] = [...pointers.current.values()];
        pinch.current = {
          startDist: Math.max(distance(a, b), 1),
          startMid: toViewBox((a.x + b.x) / 2, (a.y + b.y) / 2),
          origin: transform,
        };
        endDrag();
        return;
      }
      if (pointers.current.size > 2) return;

      const hit = (event.target as Element).closest?.("path[data-name]");
      drag.current = {
        active: true,
        startX: event.clientX,
        startY: event.clientY,
        originX: transform.x,
        originY: transform.y,
        moved: 0,
        name: hit?.getAttribute("data-name") ?? null,
      };
    },
    [endDrag, toViewBox, transform],
  );

  const onPointerMove = useCallback(
    (event: React.PointerEvent<SVGSVGElement>) => {
      if (pointers.current.has(event.pointerId)) {
        pointers.current.set(event.pointerId, {
          x: event.clientX,
          y: event.clientY,
        });
      }

      const rect = wrapRef.current?.getBoundingClientRect();
      if (rect) {
        setPointer({
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
        });
      }

      const gesture = pinch.current;
      if (gesture && pointers.current.size >= 2) {
        const [a, b] = [...pointers.current.values()];
        const k = Math.max(
          min_zoom,
          Math.min(
            max_zoom,
            gesture.origin.k * (distance(a, b) / gesture.startDist),
          ),
        );
        const mid = toViewBox((a.x + b.x) / 2, (a.y + b.y) / 2);
        const anchorX =
          (gesture.startMid.x - gesture.origin.x) / gesture.origin.k;
        const anchorY =
          (gesture.startMid.y - gesture.origin.y) / gesture.origin.k;

        setTransform(
          clampTransform({ k, x: mid.x - anchorX * k, y: mid.y - anchorY * k }),
        );
        return;
      }

      const state = drag.current;
      if (!state.active) return;

      const dx = event.clientX - state.startX;
      const dy = event.clientY - state.startY;
      state.moved = Math.max(state.moved, Math.abs(dx) + Math.abs(dy));

      const svgRect = svgRef.current?.getBoundingClientRect();
      const scaleX = svgRect ? width / svgRect.width : 1;
      const scaleY = svgRect ? height / svgRect.height : 1;

      setTransform((prev) =>
        clampTransform({
          k: prev.k,
          x: state.originX + dx * scaleX,
          y: state.originY + dy * scaleY,
        }),
      );
    },
    [toViewBox],
  );

  const releasePointer = useCallback(
    (event: React.PointerEvent<SVGSVGElement>) => {
      pointers.current.delete(event.pointerId);
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    },
    [],
  );

  const onPointerUp = useCallback(
    (event: React.PointerEvent<SVGSVGElement>) => {
      const wasPinching = pinch.current !== null;
      releasePointer(event);

      if (pointers.current.size >= 2) return;

      if (wasPinching) {
        pinch.current = null;
        const remaining = [...pointers.current.values()][0];
        if (remaining) {
          drag.current = {
            active: true,
            startX: remaining.x,
            startY: remaining.y,
            originX: transform.x,
            originY: transform.y,
            moved: drag_threshold + 1,
            name: null,
          };
        } else {
          endDrag();
        }
        return;
      }

      const state = drag.current;
      state.active = false;

      const name = state.name;
      state.name = null;

      if (state.moved > drag_threshold || !name) return;
      onSelect(name === selectedCountry ? null : name);
    },
    [
      endDrag,
      onSelect,
      releasePointer,
      selectedCountry,
      transform.x,
      transform.y,
    ],
  );

  const onPointerCancel = useCallback(
    (event: React.PointerEvent<SVGSVGElement>) => {
      releasePointer(event);
      if (pointers.current.size < 2) pinch.current = null;
      if (pointers.current.size === 0) endDrag();
    },
    [endDrag, releasePointer],
  );

  const zoomBy = useCallback((factor: number) => {
    setTransform((prev) =>
      zoomAround(prev, prev.k * factor, width / 2, height / 2),
    );
  }, []);

  const focusShape = useCallback((shape: Shape) => {
    const target = shape.width > 0 ? (width * 0.5) / shape.width : 4;
    const k = Math.max(min_zoom, Math.min(max_zoom, target));
    setTransform(
      clampTransform({
        k,
        x: width / 2 - shape.cx * k,
        y: height / 2 - shape.cy * k,
      }),
    );
  }, []);

  const results = useMemo(() => {
    const needle = foldForSearch(query);
    if (needle.length < 1) return [];

    const starts: Shape[] = [];
    const contains: Shape[] = [];

    for (const shape of shapes) {
      if (shape.key.startsWith(needle)) starts.push(shape);
      else if (shape.key.includes(needle)) contains.push(shape);
      if (starts.length >= max_results) break;
    }
    return [...starts, ...contains].slice(0, max_results);
  }, [shapes, query]);

  useEffect(() => {
    setCursor(0);
  }, [query]);

  const commit = useCallback(
    (shape: Shape) => {
      focusShape(shape);
      onSelect(shape.name);
      setQuery("");
      setOpen(false);
      inputRef.current?.blur();
    },
    [focusShape, onSelect],
  );

  const onSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      setQuery("");
      setOpen(false);
      inputRef.current?.blur();
      return;
    }
    if (!results.length) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setCursor((c) => (c + 1) % results.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setCursor((c) => (c - 1 + results.length) % results.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      commit(results[cursor] ?? results[0]);
    }
  };

  const labelled = useMemo(() => {
    if (transform.k < label_min_zoom) return [];

    const { k, x: tx, y: ty } = transform;

    const candidates = shapes
      .filter((s) => s.width > 0 && s.width * k >= label_min_width)
      .map((s) => ({ shape: s, sx: tx + s.cx * k, sy: ty + s.cy * k }))
      .filter(
        ({ sx, sy }) =>
          sx > -40 && sx < width + 40 && sy > -20 && sy < height + 20,
      )
      .sort((a, b) => b.shape.width - a.shape.width);

    const placed: Array<{ shape: Shape; sx: number; sy: number }> = [];
    const boxes: Box[] = [];

    for (const c of candidates) {
      const w = c.shape.name.length * label_font * 0.55 + label_pad * 2;
      const h = label_font + label_pad * 2;
      const box: Box = {
        minX: c.sx - w / 2,
        maxX: c.sx + w / 2,
        minY: c.sy - h / 2,
        maxY: c.sy + h / 2,
      };

      const clashes = boxes.some(
        (b) =>
          !(
            box.maxX < b.minX ||
            box.minX > b.maxX ||
            box.maxY < b.minY ||
            box.minY > b.maxY
          ),
      );
      if (clashes) continue;

      boxes.push(box);
      placed.push(c);
    }

    return placed;
  }, [shapes, transform]);

  const legend = useMemo(
    () => Object.entries(region_labels) as Array<[Region, string]>,
    [],
  );

  const activeLabel = hovered ?? selectedCountry;

  return (
    <div className="w-full">
      <div
        ref={wrapRef}
        className="relative w-full overflow-hidden overscroll-contain rounded-2xl
          bg-black/5 dark:bg-white/5 backdrop-blur-sm"
      >
        {!loading && !error && (
          <div className="absolute top-3 left-3 z-40 w-[min(320px,calc(100%-5rem))]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/40 dark:text-white/40 pointer-events-none" />
              <input
                ref={inputRef}
                type="text"
                role="combobox"
                aria-expanded={open && results.length > 0}
                aria-controls="country-search-results"
                aria-autocomplete="list"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setOpen(true);
                }}
                onFocus={() => setOpen(true)}
                onBlur={() => window.setTimeout(() => setOpen(false), 120)}
                onKeyDown={onSearchKeyDown}
                placeholder="Search for a country"
                aria-label="Search for a country"
                className="w-full pl-10 pr-10 py-2 text-sm rounded-full border-none
                  bg-white/85 dark:bg-slate-900/80 backdrop-blur-md shadow-sm
                  text-black dark:text-white placeholder-black/40 dark:placeholder-white/40
                  focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-200"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    inputRef.current?.focus();
                  }}
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 inline-flex items-center justify-center
                    rounded-full border-none cursor-pointer bg-transparent
                    text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {open && query.trim() !== "" && (
              <ul
                id="country-search-results"
                role="listbox"
                className="mt-1.5 py-1 max-h-64 overflow-auto
                  rounded-2xl bg-white dark:bg-slate-900 shadow-xl
                  border border-black/5 dark:border-white/10 list-none m-0"
              >
                {results.length === 0 && (
                  <li
                    className={`${roboto.className} px-4 py-2.5 text-sm text-black/40 dark:text-white/40`}
                  >
                    No country matches that
                  </li>
                )}
                {results.map((shape, i) => (
                  <li
                    key={shape.name}
                    role="option"
                    aria-selected={i === cursor}
                  >
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        commit(shape);
                      }}
                      onMouseEnter={() => setCursor(i)}
                      className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-left border-none cursor-pointer
                        bg-transparent transition-colors
                        ${i === cursor ? "bg-black/5 dark:bg-white/10" : ""}`}
                    >
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{
                          backgroundColor: shape.region
                            ? region_colors[shape.region]
                            : unmapped_fill,
                        }}
                      />
                      <span
                        className={`${inter.className} text-sm text-black dark:text-white truncate`}
                      >
                        {shape.name}
                      </span>
                      <span
                        className={`${roboto.className} ml-auto text-[11px] text-black/40 dark:text-white/40 flex-shrink-0`}
                      >
                        {shape.region ? region_labels[shape.region] : "No desk"}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        <div className="absolute top-3 right-3 z-20 flex flex-col gap-1">
          {[
            {
              icon: <Plus className="w-4 h-4" />,
              label: "Zoom in",
              run: () => zoomBy(1.4),
            },
            {
              icon: <Minus className="w-4 h-4" />,
              label: "Zoom out",
              run: () => zoomBy(1 / 1.4),
            },
            {
              icon: <RotateCcw className="w-4 h-4" />,
              label: "Reset view",
              run: () => setTransform(initial_transform),
            },
          ].map((control) => (
            <button
              key={control.label}
              type="button"
              onClick={control.run}
              aria-label={control.label}
              className="w-8 h-8 inline-flex items-center justify-center rounded-full border-none cursor-pointer
                bg-white/70 dark:bg-white/10 text-black/60 dark:text-white/70
                hover:bg-white dark:hover:bg-white/20 transition-colors
                focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
            >
              {control.icon}
            </button>
          ))}
        </div>
        <AnimatePresence>
          {zoomHint && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center"
            >
              <span
                className={`${inter.className} px-3.5 py-2 rounded-full text-xs font-medium
                  bg-black/70 text-white backdrop-blur-sm shadow-lg`}
              >
                Ctrl + scroll to zoom, or drag to pan
              </span>
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {activeLabel && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.15 }}
              className="absolute bottom-3 right-3 z-20 px-3 py-1.5 rounded-full
                bg-white/80 dark:bg-black/60 backdrop-blur-sm"
            >
              <span
                className={`${inter.className} text-xs font-medium text-black dark:text-white`}
              >
                {activeLabel}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
        {hovered && pointer && (
          <div
            className="pointer-events-none absolute z-30 -translate-x-1/2 -translate-y-full
              px-2 py-1 rounded-md bg-black/80 dark:bg-white/90 shadow-sm"
            style={{ left: pointer.x, top: pointer.y - 10 }}
          >
            <span
              className={`${roboto.className} text-[11px] text-white dark:text-black whitespace-nowrap`}
            >
              {hovered}
            </span>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center gap-2 h-[340px] lg:h-[460px] text-black/50 dark:text-white/50">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className={`${roboto.className} text-sm`}>
              Drawing the map…
            </span>
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center justify-center gap-2 h-[340px] lg:h-[460px] px-6 text-center">
            <TriangleAlert className="w-6 h-6 text-red-500" />
            <p
              className={`${roboto.className} text-sm text-red-600 dark:text-red-400`}
            >
              {error}
            </p>
            <p
              className={`${roboto.className} text-xs text-black/40 dark:text-white/40`}
            >
              Expected the GeoJSON at <code>{geoUrl}</code>
            </p>
          </div>
        )}

        {!loading && !error && (
          <svg
            ref={svgRef}
            viewBox={`0 0 ${width} ${height}`}
            role="img"
            aria-label="World map. Select a country to open its news desk. Pinch or Ctrl + scroll to zoom."
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerCancel}
            onPointerLeave={() => {
              setHovered(null);
              setPointer(null);
              if (pointers.current.size === 0) endDrag();
            }}
            className="w-full h-auto touch-none select-none cursor-grab active:cursor-grabbing"
          >
            <g
              transform={`translate(${transform.x} ${transform.y}) scale(${transform.k})`}
            >
              {shapes.map((shape) => {
                const isSelected = shape.name === selectedCountry;
                const isHovered = shape.name === hovered;
                const isHome = shape.name === local_country;
                const base =
                  (shape.region && region_colors[shape.region]) ||
                  unmapped_fill;

                return (
                  <path
                    key={shape.name}
                    data-name={shape.name}
                    d={shape.d}
                    fill={base}
                    fillOpacity={isSelected ? 1 : isHovered ? 0.8 : 0.42}
                    stroke={
                      isSelected
                        ? "#2563eb"
                        : isHome
                          ? "#111827"
                          : "rgba(255,255,255,0.5)"
                    }
                    strokeWidth={isSelected ? 1.6 : isHome ? 1.1 : 0.5}
                    strokeDasharray={isHome && !isSelected ? "3 2" : undefined}
                    vectorEffect="non-scaling-stroke"
                    tabIndex={0}
                    role="button"
                    aria-pressed={isSelected}
                    aria-label={shape.name}
                    onMouseEnter={() => setHovered(shape.name)}
                    onFocus={() => setHovered(shape.name)}
                    onBlur={() => setHovered(null)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        onSelect(
                          shape.name === selectedCountry ? null : shape.name,
                        );
                      }
                    }}
                    className="cursor-pointer outline-none transition-[fill-opacity] duration-150
                      focus-visible:stroke-blue-500"
                  />
                );
              })}
            </g>
            <g pointerEvents="none">
              {labelled.map(({ shape, sx, sy }) => (
                <text
                  key={`label-${shape.name}`}
                  x={sx}
                  y={sy}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={label_font}
                  fontWeight={600}
                  strokeWidth={3}
                  strokeLinejoin="round"
                  paintOrder="stroke"
                  className="fill-slate-900 stroke-white/80
                    dark:fill-white dark:stroke-slate-950/85"
                  style={{ fontFamily: "var(--font-inter, sans-serif)" }}
                >
                  {shape.name}
                </text>
              ))}
            </g>
          </svg>
        )}
        {!loading && !error && (
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 px-4 pb-4 pt-1">
            {legend.map(([key, label]) => (
              <span key={key} className="inline-flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: region_colors[key] }}
                />
                <span
                  className={`${roboto.className} text-[11px] text-black/50 dark:text-white/50`}
                >
                  {label}
                </span>
              </span>
            ))}
            <span className="inline-flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: unmapped_fill }}
              />
              <span
                className={`${roboto.className} text-[11px] text-black/50 dark:text-white/50`}
              >
                No desk
              </span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default WorldMap;

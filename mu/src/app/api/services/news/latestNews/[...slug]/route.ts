// src/app/api/latest-news/[...slug]/route.ts
import { NextResponse } from "next/server";
import { validateCookie } from "@/app/api/services/cookieValidator/validateCookie";
import { isAllowed } from "@/helper/origin_helper";
import { getBaseUrl } from "@/lib/news/baseUrl";
import { isKnownDestination } from "@/lib/news/destination";
import { sanitiseJson } from "@/lib/news/sanitizer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const upstream_timeout_ms = 20_000;
const max_response_bytes = 5 * 1024 * 1024;

type Validator = (value: string) => boolean;

const intBetween =
  (min: number, max: number): Validator =>
  (v) => {
    if (!/^\d{1,6}$/.test(v)) return false;
    const n = Number(v);
    return Number.isInteger(n) && n >= min && n <= max;
  };

const isPage = intBetween(1, 1000);
const isSection = intBetween(1, 1000);
const isLimit = intBetween(1, 200);
const isSize = intBetween(1, 100);

const isEuvdType: Validator = (v) =>
  v === "latest" || v === "critical" || v === "exploited";

const isRegion: Validator = (v) =>
  ["all", "africa", "americas", "asia", "europe", "middle-east"].includes(v);

const isCveId: Validator = (v) => /^CVE-\d{4}-\d{4,}$/i.test(v);

const isIsoDate: Validator = (v) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const d = new Date(`${v}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
};

//Wiki voyage destinations
const isDestination: Validator = isKnownDestination;

// free text search fields
const isText: Validator = (v) => v.length > 0 && v.length <= 200;

const isScore: Validator = (v) => {
  if (!/^\d{1,2}(\.\d{1,2})?$/.test(v)) return false;
  const n = Number(v);
  return n >= 0 && n <= 10;
};

type RouteSpec = {
  path: string;
  params?: Record<string, Validator>;
  rewrite?: Record<string, (value: string) => string>;
  query?: Record<string, Validator>;
};

const routes: RouteSpec[] = [
  { path: "lankadepa/v1/:page", params: { page: isPage } },
  {
    path: "lankadepa/v1/:page/:section",
    params: { page: isPage, section: isSection },
  },

  /* --- Sinhala --- */
  { path: "bbcsinhala/v1/:page", params: { page: isPage } },
  { path: "adaderana/v1" },

  /* --- LK tamil --- */
  { path: "newsfirsttamil/v1" },

  /* --- LK English --- */
  { path: "newswire/v1" },

  /* --- Inland Revenue Department --- */
  { path: "ird/news/v1" },
  { path: "ird/news/v1/:page", params: { page: isPage } },
  { path: "ird/content/v1" },
  { path: "ird/content/v1/:page", params: { page: isPage } },

  /* --- Cyber --- */
  { path: "cyber/vulns/v1", query: { limit: isLimit } },
  { path: "cyber/stats/v1" },
  { path: "cyber/kev/v1", query: { limit: isLimit } },
  { path: "cyber/euvd/v1/:type", params: { type: isEuvdType } },
  {
    path: "cyber/euvd/search/v1",
    query: {
      size: isSize,
      text: isText,
      vendor: isText,
      product: isText,
      fromScore: isScore,
      fromDate: isIsoDate,
    },
  },
  { path: "cyber/nvd/v1/:id", params: { id: isCveId } },

  /* --- Wikimedia --- */
  { path: "wiki/events/v1" },
  { path: "wiki/events/v1/:date", params: { date: isIsoDate } },
  {
    path: "wiki/guide/v1/:destination",
    params: { destination: isDestination },
  },

  /* --- UN News --- */
  { path: "un/v1" },
  { path: "un/v1/:region", params: { region: isRegion } },
];

type Matched = { segments: string[]; spec: RouteSpec };

function matchRoute(slug: string[]): Matched | null {
  for (const spec of routes) {
    const template = spec.path.split("/");
    if (template.length !== slug.length) continue;

    const segments = [...slug];
    let ok = true;

    for (let i = 0; i < template.length; i++) {
      const part = template[i];
      const value = slug[i];

      if (part.startsWith(":")) {
        const name = part.slice(1);
        const check = spec.params?.[name];
        if (!check || !check(value)) {
          ok = false;
          break;
        }
        const rewrite = spec.rewrite?.[name];
        if (rewrite) segments[i] = rewrite(value);
      } else if (part !== value) {
        ok = false;
        break;
      }
    }

    if (ok) return { segments, spec };
  }
  return null;
}

function buildUpstreamUrl(matched: Matched, incoming: URL): string {
  const path = matched.segments.map(encodeURIComponent).join("/");
  const url = new URL(`${getBaseUrl()}/latest-news/${path}`);

  const allowed = matched.spec.query ?? {};
  for (const [key, check] of Object.entries(allowed)) {
    const raw = incoming.searchParams.get(key);
    if (raw === null) continue;
    const value = raw.trim();
    if (value === "" || !check(value)) continue;
    url.searchParams.set(key, value);
  }

  return url.toString();
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug?: string[] }> },
) {
  try {
    if (!isAllowed(req)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const validationResult = await validateCookie(req);
    if (!validationResult.valid) {
      console.log("Validation failed: ", validationResult.error);
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      console.error("[latest-news] API_KEY is not set");
      return NextResponse.json(
        { success: false, message: "Server misconfigured" },
        { status: 500 },
      );
    }

    const { slug = [] } = await params;

    if (slug.length === 0 || slug.length > 4) {
      return NextResponse.json(
        { success: false, message: "Unknown endpoint" },
        { status: 404 },
      );
    }

    const matched = matchRoute(slug);

    if (!matched) {
      return NextResponse.json(
        { success: false, message: "Unknown endpoint or invalid parameters" },
        { status: 400 },
      );
    }

    const upstream = buildUpstreamUrl(matched, new URL(req.url));

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), upstream_timeout_ms);

    let res: Response;
    try {
      res = await fetch(upstream, {
        method: "GET",
        signal: controller.signal,
        cache: "no-store",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: "application/json",
        },
      });
    } finally {
      clearTimeout(timer);
    }

    const text = await res.text();

    if (text.length > max_response_bytes) {
      console.error(
        `[latest-news] oversized upstream response: ${text.length} bytes`,
      );
      return NextResponse.json(
        { success: false, message: "Bad response from news service" },
        { status: 502 },
      );
    }

    let data: unknown;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      console.error(
        `[latest-news] non-JSON from upstream (${res.status}):`,
        text.slice(0, 300),
      );
      return NextResponse.json(
        { success: false, message: "Bad response from news service" },
        { status: 502 },
      );
    }

    if (!res.ok) {
      const status =
        res.status === 401 || res.status === 403 ? 502 : res.status;
      const message =
        (data as { message?: string } | null)?.message ??
        "Error fetching latest news";
      return NextResponse.json({ success: false, message }, { status });
    }

    if (
      data !== null &&
      typeof data === "object" &&
      Object.hasOwn(data, "error")
    ) {
      console.warn(
        "[latest-news] upstream reported:",
        (data as { error?: unknown }).error,
      );
      return NextResponse.json(
        { success: false, message: "Error fetching latest news" },
        { status: 502 },
      );
    }

    return NextResponse.json(
      { success: true, data: sanitiseJson(data) },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
          "X-Content-Type-Options": "nosniff",
          "Content-Security-Policy": "default-src 'none'; sandbox",
          "Referrer-Policy": "no-referrer",
        },
      },
    );
  } catch (error: unknown) {
    const aborted = error instanceof Error && error.name === "AbortError";
    console.error("[latest-news] proxy failed:", error);
    return NextResponse.json(
      {
        success: false,
        message: aborted
          ? "News service timed out. Please try again."
          : "Failed to fetch latest news. Please try again.",
      },
      { status: aborted ? 504 : 500 },
    );
  }
}

const methodNotAllowed = () =>
  NextResponse.json(
    { success: false, message: "Method not allowed" },
    { status: 405, headers: { Allow: "GET" } },
  );

export const POST = methodNotAllowed;
export const PUT = methodNotAllowed;
export const PATCH = methodNotAllowed;
export const DELETE = methodNotAllowed;

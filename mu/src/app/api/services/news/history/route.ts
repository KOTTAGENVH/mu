import { NextResponse } from "next/server";
import { validateCookie } from "@/app/api/services/cookieValidator/validateCookie";
import { isAllowed } from "@/helper/origin_helper";
import { getBaseUrl } from "@/lib/news/baseUrl";
import { sanitiseJson } from "@/lib/news/sanitizer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const upstream_timeout_ms = 20_000;
const max_response_bytes = 5 * 1024 * 1024;
const max_request_bytes = 4_096;

type Validator = (value: unknown) => boolean;

const intBetween =
  (min: number, max: number): Validator =>
  (v) =>
    typeof v === "number" && Number.isInteger(v) && v >= min && v <= max;

const isPage = intBetween(1, 1000);
const isLimit = intBetween(1, 50);

const valid_sources = new Set([0, 2, 3, 4, 5, 6, 7, 8]);
const isSource: Validator = (v) =>
  typeof v === "number" && valid_sources.has(v);

const isSearchText: Validator = (v) =>
  typeof v === "string" && v.trim().length > 0 && v.length <= 200;

const isIsoDate: Validator = (v) => {
  if (typeof v !== "string") return false;
  if (!/^\d{4}-\d{2}-\d{2}([T ].*)?$/.test(v)) return false;
  return !Number.isNaN(new Date(v).getTime());
};

const history_fields = `
  id
  title
  description
  source
  url
  imageUrl
  category
  publishedAt
  fetchedAt
`;

type OperationSpec = {
  document: string;
  variables?: Record<string, Validator>;
  required?: string[];
};

const operations: Record<string, OperationSpec> = {
  history: {
    document: `
      query History($page: Int!) {
        history(page: $page) { ${history_fields} }
      }
    `,
    variables: { page: isPage },
  },

  historyBySource: {
    document: `
      query HistoryBySource($source: Int!, $page: Int!) {
        historyBySource(source: $source, page: $page) { ${history_fields} }
      }
    `,
    variables: { source: isSource, page: isPage },
    required: ["source"],
  },

  irdNews: {
    document: `
      query IrdNews($page: Int!) {
        irdNews(page: $page) { ${history_fields} }
      }
    `,
    variables: { page: isPage },
  },

  cyberNews: {
    document: `
      query CyberNews($page: Int!) {
        cyberNews(page: $page) { ${history_fields} }
      }
    `,
    variables: { page: isPage },
  },

  newsByDate: {
    document: `
      query NewsByDate($date: DateTime!, $page: Int!) {
        newsByDate(date: $date, page: $page) { ${history_fields} }
      }
    `,
    variables: { date: isIsoDate, page: isPage },
    required: ["date"],
  },

  atlasSearch: {
    document: `
      query AtlasSearch($text: String!, $limit: Int!) {
        atlasSearch(text: $text, limit: $limit) { ${history_fields} }
      }
    `,
    variables: { text: isSearchText, limit: isLimit },
    required: ["text"],
  },
};

const variable_defaults: Record<string, unknown> = {
  page: 1,
  limit: 10,
};

const response_headers = {
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
  "Content-Security-Policy": "default-src 'none'; sandbox",
  "Referrer-Policy": "no-referrer",
};

export async function POST(req: Request) {
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
      console.error("[history] API_KEY is not set");
      return NextResponse.json(
        { success: false, message: "Server misconfigured" },
        { status: 500 },
      );
    }

    const rawBody = await req.text();
    if (rawBody.length > max_request_bytes) {
      return NextResponse.json(
        { success: false, message: "Request too large" },
        { status: 413 },
      );
    }

    let body: { operation?: unknown; variables?: unknown };
    try {
      body = JSON.parse(rawBody || "{}");
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid JSON body" },
        { status: 400 },
      );
    }

    const operationName = body.operation;
    if (
      typeof operationName !== "string" ||
      !Object.hasOwn(operations, operationName)
    ) {
      return NextResponse.json(
        { success: false, message: "Unknown operation" },
        { status: 400 },
      );
    }

    const spec = operations[operationName];
    const incoming =
      body.variables !== null &&
      typeof body.variables === "object" &&
      !Array.isArray(body.variables)
        ? (body.variables as Record<string, unknown>)
        : {};

    const variables: Record<string, unknown> = {};
    for (const [name, check] of Object.entries(spec.variables ?? {})) {
      const supplied = Object.hasOwn(incoming, name)
        ? incoming[name]
        : variable_defaults[name];

      if (supplied === undefined) {
        if (spec.required?.includes(name)) {
          return NextResponse.json(
            { success: false, message: `Missing variable: ${name}` },
            { status: 400 },
          );
        }
        continue;
      }

      if (!check(supplied)) {
        return NextResponse.json(
          { success: false, message: `Invalid variable: ${name}` },
          { status: 400 },
        );
      }
      variables[name] = supplied;
    }

    for (const name of spec.required ?? []) {
      if (!Object.hasOwn(variables, name)) {
        return NextResponse.json(
          { success: false, message: `Missing variable: ${name}` },
          { status: 400 },
        );
      }
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), upstream_timeout_ms);

    let res: Response;
    try {
      res = await fetch(`${getBaseUrl()}/graphql`, {
        method: "POST",
        signal: controller.signal,
        cache: "no-store",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          query: spec.document,
          variables,
        }),
      });
    } finally {
      clearTimeout(timer);
    }

    const text = await res.text();

    if (text.length > max_response_bytes) {
      console.error(`[history] oversized response: ${text.length} bytes`);
      return NextResponse.json(
        { success: false, message: "Bad response from history service" },
        { status: 502 },
      );
    }

    let payload: { data?: unknown; errors?: unknown };
    try {
      payload = JSON.parse(text || "null");
    } catch {
      console.error(
        `[history] non-JSON from upstream (${res.status}):`,
        text.slice(0, 300),
      );
      return NextResponse.json(
        { success: false, message: "Bad response from history service" },
        { status: 502 },
      );
    }

    if (Array.isArray(payload?.errors) && payload.errors.length > 0) {
      const first = payload.errors[0] as {
        message?: string;
        extensions?: { code?: string };
      };
      const code = first?.extensions?.code;

      console.error(`[history] ${operationName} errors:`, payload.errors);

      const isClientFault =
        code === "BAD_REQUEST" ||
        code === "BAD_USER_INPUT" ||
        code === "GRAPHQL_VALIDATION_FAILED";

      return NextResponse.json(
        {
          success: false,
          message: isClientFault
            ? (first.message ?? "Invalid request")
            : "Error fetching history",
        },
        { status: isClientFault ? 400 : 502 },
      );
    }

    if (!res.ok) {
      const status =
        res.status === 401 || res.status === 403 ? 502 : res.status;
      return NextResponse.json(
        { success: false, message: "Error fetching history" },
        { status },
      );
    }

    const result =
      payload?.data && typeof payload.data === "object"
        ? (payload.data as Record<string, unknown>)[operationName]
        : null;

    return NextResponse.json(
      { success: true, data: sanitiseJson(result) },
      { status: 200, headers: response_headers },
    );
  } catch (error: unknown) {
    const aborted = error instanceof Error && error.name === "AbortError";
    console.error("[history] proxy failed:", error);
    return NextResponse.json(
      {
        success: false,
        message: aborted
          ? "History service timed out. Please try again."
          : "Failed to fetch history. Please try again.",
      },
      { status: aborted ? 504 : 500 },
    );
  }
}

const methodNotAllowed = () =>
  NextResponse.json(
    { success: false, message: "Method not allowed" },
    { status: 405, headers: { Allow: "POST" } },
  );

export const GET = methodNotAllowed;
export const PUT = methodNotAllowed;
export const PATCH = methodNotAllowed;
export const DELETE = methodNotAllowed;

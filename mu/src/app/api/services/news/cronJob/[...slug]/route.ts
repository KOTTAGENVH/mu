import { NextResponse } from "next/server";
import { validateCookie } from "@/app/api/services/cookieValidator/validateCookie";
import { isAllowed } from "@/helper/origin_helper";
import { getBaseUrl } from "@/lib/news/baseUrl";
import { sanitiseJson } from "@/lib/news/sanitizer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const upstream_timeout_ms = 110_000;
const max_response_bytes = 1 * 1024 * 1024;

const jobs = new Set([
  /* --- Inland Revenue Department --- */
  "ird/content",
  "ird/news",

  /* --- Cyber --- */
  "cyber",
  "cyber/kev",
  "cyber/euvd/latest",
  "cyber/euvd/critical",
  "cyber/euvd/exploited",

  /* --- Sri Lankan news --- */
  "lankadeepa",
  "bbcsinhala",
  "newswire",
  "adaderana",
  "newsfirsttamil",

  /* --- International --- */
  "un",

  /* --- Maintenance --- */
  "storageStatus",
]);

const response_headers = {
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
  "Content-Security-Policy": "default-src 'none'; sandbox",
  "Referrer-Policy": "no-referrer",
};

export async function POST(
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
      console.error("[cronjob] API_KEY is not set");
      return NextResponse.json(
        { success: false, message: "Server misconfigured" },
        { status: 500 },
      );
    }

    const { slug = [] } = await params;
    const requestedJob = slug.join("/");

    if (!jobs.has(requestedJob)) {
      return NextResponse.json(
        { success: false, message: "Unknown job" },
        { status: 404 },
      );
    }

    const upstream = `${getBaseUrl()}/cronjob/v1/${requestedJob}`;
    const startedAt = Date.now();
    console.log(`[cronjob] triggering ${requestedJob}`);

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
      console.error(`[cronjob] oversized response: ${text.length} bytes`);
      return NextResponse.json(
        { success: false, message: "Bad response from cron service" },
        { status: 502 },
      );
    }

    let data: unknown;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      console.error(
        `[cronjob] non-JSON from upstream (${res.status}):`,
        text.slice(0, 300),
      );
      return NextResponse.json(
        { success: false, message: "Bad response from cron service" },
        { status: 502 },
      );
    }

    const durationMs = Date.now() - startedAt;

    if (!res.ok) {
      const status =
        res.status === 401 || res.status === 403 ? 502 : res.status;
      const message =
        (data as { message?: string } | null)?.message ?? "Cron job failed";
      console.error(`[cronjob] ${requestedJob} failed in ${durationMs}ms: ${message}`);
      return NextResponse.json({ success: false, message }, { status });
    }

    console.log(`[cronjob] ${requestedJob} completed in ${durationMs}ms`);

    return NextResponse.json(
      { success: true, durationMs, data: sanitiseJson(data) },
      { status: 200, headers: response_headers },
    );
  } catch (error: unknown) {
    const aborted = error instanceof Error && error.name === "AbortError";
    console.error("[cronjob] proxy failed:", error);
    return NextResponse.json(
      {
        success: false,
        message: aborted
          ? "Cron job timed out. It may still be running on the server."
          : "Failed to trigger cron job. Please try again.",
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

const allowedHosts = new Set(["mu.nowenkottage.com", "localhost:3000"]);
//"localhost:3000"

export function normalizeOrigin(raw: string | null) {
  if (!raw) return null;
  try { return new URL(raw).origin; } catch { return null; }
}
export function getRequestUrl(req: Request) {
  const xfProto = req.headers.get("x-forwarded-proto");
  const xfHost  = req.headers.get("x-forwarded-host");
  if (xfProto && xfHost) return new URL(`${xfProto}://${xfHost}`);
  return new URL(req.url);
}
export function getOriginFromReferer(req: Request) {
  const ref = req.headers.get("referer");
  if (!ref) return null;
  try { return new URL(ref).origin; } catch { return null; }
}
export function isAllowed(req: Request) {
  const url = getRequestUrl(req);
  const origin = normalizeOrigin(req.headers.get("origin")) ?? getOriginFromReferer(req);

  if (!origin) {
    return allowedHosts.has(url.host) || allowedHosts.has(url.hostname);
  }
  const o = new URL(origin);
  return allowedHosts.has(o.host) || allowedHosts.has(o.hostname);
}
export function corsHeaders(req: Request) {
  const h = new Headers({ Vary: "Origin" });
  const origin = normalizeOrigin(req.headers.get("origin"));
  if (origin) {
    const o = new URL(origin);
    if (allowedHosts.has(o.host) || allowedHosts.has(o.hostname)) {
      h.set("Access-Control-Allow-Origin", origin);
      h.set("Access-Control-Allow-Credentials", "true");
      h.set("Access-Control-Allow-Headers", "Content-Type,x-csrf-token");
      h.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    }
  }
  return h;
}

export function isSameOriginBrowserGet(req: Request) {
  if (req.method !== "GET") return false;
  const sfs = (req.headers.get("sec-fetch-site") || "").toLowerCase();
  return sfs === "same-origin" || sfs === "same-site";
}




export function safeRedirect(target: string | null, fallback = "/home") {
  if (!target) return fallback;
  const cleaned = target.replace(/[\u0000-\u001F\u007F]/g, "").trim();

  try {
    const base = "https://placeholder.invalid";
    const url = new URL(cleaned, base);
    if (url.origin !== base) return fallback;
    return url.pathname + url.search + url.hash;
  } catch {
    return fallback;
  }
}
function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is not set. Please initialize the base url secrets.`);
  }
  return value;
}

let cached: string | null = null;

export function getBaseUrl(): string {
  if (cached) return cached;

  const raw = requireEnv("LATEST_NEWS_API_URL");

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error(`LATEST_NEWS_API_URL is not a valid URL: ${raw}`);
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error(`LATEST_NEWS_API_URL must be http or https, got ${url.protocol}`);
  }

  if (process.env.NODE_ENV === "production" && url.protocol !== "https:") {
    throw new Error("LATEST_NEWS_API_URL must be https in production");
  }

  cached = `${url.origin}${url.pathname.replace(/\/+$/, "")}`;
  return cached;
}
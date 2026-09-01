const latest_news_base = "/api/services/news/latestNews";

export type EuvdType = "latest" | "critical" | "exploited";

export type UnRegion =
  | "all"
  | "africa"
  | "americas"
  | "asia"
  | "europe"
  | "middle-east";

export interface EuvdSearchParams {
  text?: string;
  vendor?: string;
  product?: string;
  fromScore?: number;
  fromDate?: string; // YYYY-MM-DD
  size?: number;
}

export interface Attribution {
  source: string;
  sourceUrl: string | null;
  retrievalMethod: string;
  retrievedAt: string | null;
  license: string;
  notice: string;
  legal: string | null;
}

export interface LatestNewsResult<T = unknown> {
  success: boolean;
  data: {
    latestContent: T;
    attribution?: Attribution | Attribution[] | null;
  };
}

async function getLatestNews<T>(
  path: string,
  fallbackMessage: string,
): Promise<LatestNewsResult<T>> {
  const response = await fetch(`${latest_news_base}/${path}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (response.ok) {
    return await response.json();
  }

  let message = fallbackMessage;
  try {
    const errorData = await response.json();
    if (errorData?.message) message = errorData.message;
  } catch {}
  throw new Error(message);
}

//get Lankadeepa news (Sinhala)
export async function getLankadeepa(page: number, section?: number) {
  const path =
    section === undefined
      ? `lankadepa/v1/${page}`
      : `lankadepa/v1/${page}/${section}`;
  return getLatestNews(path, "Failed to fetch Lankadeepa news");
}

//get BBC Sinhala news
export async function getBBCSinhala(page: number) {
  return getLatestNews(
    `bbcsinhala/v1/${page}`,
    "Failed to fetch BBC Sinhala news",
  );
}

//get Ada Derana news (English)
export async function getAdaDerana() {
  return getLatestNews("adaderana/v1", "Failed to fetch Ada Derana news");
}

//get News 1st news (Tamil)
export async function getNewsFirstTamil() {
  return getLatestNews(
    "newsfirsttamil/v1",
    "Failed to fetch News 1st Tamil news",
  );
}

//get Newswire news (English)
export async function getNewswire() {
  return getLatestNews("newswire/v1", "Failed to fetch Newswire news");
}

//get IRD news and notices
export async function getIrdNews(page = 1) {
  return getLatestNews(`ird/news/v1/${page}`, "Failed to fetch IRD notices");
}

//get IRD latest content listing
export async function getIrdContent(page = 1) {
  return getLatestNews(`ird/content/v1/${page}`, "Failed to fetch IRD content");
}

//get merged CISA KEV + ENISA EUVD vulnerability feed
export async function getVulnFeed(limit = 40) {
  return getLatestNews(
    `cyber/vulns/v1?limit=${limit}`,
    "Failed to fetch vulnerability feed",
  );
}

//get vulnerability dashboard counters
export async function getVulnStats() {
  return getLatestNews("cyber/stats/v1", "Failed to fetch vulnerability stats");
}

//get CISA known exploited vulnerabilities
export async function getKev(limit = 50) {
  return getLatestNews(
    `cyber/kev/v1?limit=${limit}`,
    "Failed to fetch KEV catalog",
  );
}

//get ENISA EUVD vulnerabilities by type
export async function getEuvd(type: EuvdType) {
  return getLatestNews(`cyber/euvd/v1/${type}`, "Failed to fetch EUVD data");
}

//search ENISA EUVD
export async function searchEuvd(params: EuvdSearchParams) {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    query.set(key, String(value));
  }

  const queryString = query.toString();
  const path = queryString
    ? `cyber/euvd/search/v1?${queryString}`
    : "cyber/euvd/search/v1";

  return getLatestNews(path, "Failed to search EUVD");
}

//get a single CVE from NVD
export async function getCveDetails(cveId: string) {
  return getLatestNews(
    `cyber/nvd/v1/${encodeURIComponent(cveId)}`,
    "Failed to fetch CVE details",
  );
}

//get Wikipedia current events, optionally for a given YYYY-MM-DD
export async function getWikiEvents(date?: string) {
  const path = date ? `wiki/events/v1/${date}` : "wiki/events/v1";
  return getLatestNews(path, "Failed to fetch current events");
}

//get a Wikivoyage destination guide
export async function getDestinationGuide(destination: string) {
  return getLatestNews(
    `wiki/guide/v1/${encodeURIComponent(destination)}`,
    "Failed to fetch destination guide",
  );
}

//get UN news, optionally filtered by region
export async function getUnNews(region: UnRegion = "all") {
  return getLatestNews(`un/v1/${region}`, "Failed to fetch UN news");
}

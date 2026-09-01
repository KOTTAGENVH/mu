// src/app/services/historyApi.tsx

const history_base = "/api/services/news/history";

export enum NewsSource {
  Lankadeepa = 0,
  BBCSinhala = 2,
  Newswire = 3,
  AdaDerana = 4,
  NewsFirstTamil = 5,
  Ird = 6,
  Cyber = 7,
  UnNews = 8,
}

export const newsSourceLabels: Record<NewsSource, string> = {
  [NewsSource.Lankadeepa]: "Lankadeepa",
  [NewsSource.BBCSinhala]: "BBC Sinhala",
  [NewsSource.Newswire]: "Newswire",
  [NewsSource.AdaDerana]: "Ada Derana",
  [NewsSource.NewsFirstTamil]: "News 1st Tamil",
  [NewsSource.Ird]: "Inland Revenue",
  [NewsSource.Cyber]: "Cybersecurity",
  [NewsSource.UnNews]: "UN News",
};

export interface HistoryItem {
  id: string;
  title: string;
  description: string | null;
  source: string;
  url: string | null;
  imageUrl: string | null;
  category: string | null;
  publishedAt: string | null;
  fetchedAt: string | null;
}

export interface HistoryResult {
  success: boolean;
  data: HistoryItem[];
}

type HistoryOperation =
  | "history"
  | "historyBySource"
  | "irdNews"
  | "cyberNews"
  | "newsByDate"
  | "atlasSearch";

async function callHistory(
  operation: HistoryOperation,
  variables: Record<string, unknown>,
  fallbackMessage: string,
  signal?: AbortSignal,
): Promise<HistoryResult> {
  const response = await fetch(history_base, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ operation, variables }),
    signal,
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

//get all stored news, newest first
export async function getHistory(page = 1, signal?: AbortSignal) {
  return callHistory(
    "history",
    { page },
    "Failed to fetch news history",
    signal,
  );
}

//get stored news filtered by source
export async function getHistoryBySource(
  source: NewsSource,
  page = 1,
  signal?: AbortSignal,
) {
  return callHistory(
    "historyBySource",
    { source, page },
    "Failed to fetch news by source",
    signal,
  );
}

//get stored IRD news and notices
export async function getIrdHistory(page = 1, signal?: AbortSignal) {
  return callHistory("irdNews", { page }, "Failed to fetch IRD news", signal);
}

//get cyber history
export async function getCyberHistory(page = 1, signal?: AbortSignal) {
  return callHistory(
    "cyberNews",
    { page },
    "Failed to fetch cyber news",
    signal,
  );
}

export async function getHistoryByDate(
  date: Date | string,
  page = 1,
  signal?: AbortSignal,
) {
  const value =
    date instanceof Date ? date.toISOString().slice(0, 10) : date.trim();

  return callHistory(
    "newsByDate",
    { date: value, page },
    "Failed to fetch news for that date",
    signal,
  );
}

export async function searchHistory(
  text: string,
  limit = 10,
  signal?: AbortSignal,
) {
  return callHistory(
    "atlasSearch",
    { text: text.trim(), limit },
    "Failed to search news",
    signal,
  );
}

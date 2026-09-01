import type { NewsCardData } from "@/components/news/newsCard";

type Loose = Record<string, unknown>;

const first = (item: Loose, keys: string[]): string | null => {
  for (const key of keys) {
    const value = item[key];
    if (typeof value === "string" && value.trim() !== "") return value;
  }
  return null;
};

export function toCard(raw: unknown, publisher?: string): NewsCardData | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Loose;

  const title = first(item, ["title", "name"]);
  if (!title) return null;

  return {
    title,
    source: first(item, ["source", "url", "link"]),
    image: first(item, ["image", "imageUrl", "thumbnail"]),
    description: first(item, ["description", "category", "text"]),
    publishedISO: first(item, [
      "publishedISO",
      "dateISO",
      "datetime",
      "publishedAt",
      "date",
      "time",
    ]),
    publisher: publisher ?? first(item, ["publisher", "source_name"]),
  };
}

export function toCards(raw: unknown, publisher?: string): NewsCardData[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => toCard(item, publisher))
    .filter((item): item is NewsCardData => item !== null);
}

export function flattenGroups(
  raw: unknown,
  groups: string[],
  publisher?: string,
): NewsCardData[] {
  if (!raw || typeof raw !== "object") return [];
  const payload = raw as Loose;

  const seen = new Set<string>();
  const out: NewsCardData[] = [];

  for (const group of groups) {
    for (const card of toCards(payload[group], publisher)) {
      const key = card.source ?? card.title;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(card);
    }
  }
  return out;
}
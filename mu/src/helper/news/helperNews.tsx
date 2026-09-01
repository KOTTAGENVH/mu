import { roboto } from "@/app/fonts";
import { NewsCardData } from "@/components/news/newsCard";

export const getRecentDates = (days = 30) => {
  const dates = [];
  const currentDate = new Date();
  for (let i = 0; i < days; i++) {
    const d = new Date(currentDate);
    d.setDate(currentDate.getDate() - i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
};

export function StatTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: number | string;
  tone?: string;
}) {
  return (
    <div
      className={`flex-1 min-w-[7rem] p-4 rounded-2xl ${tone ?? "bg-black/5 dark:bg-white/5"}`}
    >
      <p className="text-2xl font-bold tabular-nums text-black dark:text-white leading-none">
        {value}
      </p>
      <p
        className={`${roboto.className} mt-1.5 text-[11px] text-black/50 dark:text-white/50`}
      >
        {label}
      </p>
    </div>
  );
}

export function timeAgo(iso?: string | null): string {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";

  const minutes = Math.round((Date.now() - then) / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(then).toLocaleDateString();
}

export function asPlainText(item: NewsCardData): string {
  const lines = [item.title];
  if (item.publisher) lines.push(`Source: ${item.publisher}`);
  if (item.publishedISO) lines.push(`Published: ${item.publishedISO}`);
  if (item.description) lines.push("", item.description);
  if (item.source) lines.push("", item.source);
  return lines.join("\n");
}

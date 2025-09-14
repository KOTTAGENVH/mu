// app/api/hls/route.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { Track } from "./store";
import { putM3U8, makeId } from "./store";

export async function POST(req: NextRequest) {
  const { tracks, targetDuration } = (await req.json()) as { tracks: Track[]; targetDuration?: number };
  if (!Array.isArray(tracks) || tracks.length === 0) {
    return NextResponse.json({ error: "No tracks" }, { status: 400 });
  }
  const maxDur = Math.max(...tracks.map(t => Math.max(0.1, Number(t.duration || 0))));
  const TARGET = Math.max(1, Math.ceil(targetDuration ?? maxDur));

  const lines: string[] = [
    "#EXTM3U",
    "#EXT-X-VERSION:3",
    "#EXT-X-PLAYLIST-TYPE:VOD",
    `#EXT-X-TARGETDURATION:${TARGET}`,
    "#EXT-X-MEDIA-SEQUENCE:0",
  ];
  for (const t of tracks) {
    if (t.discontinuity) lines.push("#EXT-X-DISCONTINUITY");
    const dur = Math.max(0.1, Number(t.duration || 0.1));
    lines.push(`#EXTINF:${dur.toFixed(3)},${(t.title ?? "").replace(/\r?\n/g, " ")}`);
    lines.push(t.url);
  }
  lines.push("#EXT-X-ENDLIST");

  const id = makeId();
  putM3U8(id, lines.join("\n"));
  return NextResponse.json({ id });
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  // Deprecated: kept for backwards compatibility with old /api/hls?id=...
  // Prefer using /api/hls/[id].m3u8
  const { getM3U8 } = await import("./store");
  const body = getM3U8(id);
  if (!body) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.apple.mpegurl; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

// app/api/hls/new/route.ts
import { NextRequest, NextResponse } from "next/server";
import { makeId, putM3U8, Track } from "./store";
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
  const body = lines.join("\n");
  const id = makeId();
  putM3U8(id, body);
  return NextResponse.json({ id });
}

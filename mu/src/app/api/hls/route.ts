// app/api/hls/route.ts
import { NextRequest, NextResponse } from "next/server";

// Types sent from client
type Track = {
  url: string;          // public Firebase file URL (with token if needed)
  title?: string;       // optional
  duration: number;     // seconds (float ok)
  discontinuity?: boolean; // optional marker between categories, etc.
};

export async function POST(req: NextRequest) {
  try {
    const { tracks, targetDuration } = (await req.json()) as {
      tracks: Track[];
      targetDuration?: number; // optional; compute a safe one if missing
    };

    if (!Array.isArray(tracks) || tracks.length === 0) {
      return NextResponse.json({ error: "No tracks" }, { status: 400 });
    }

    // HLS requires TARGETDURATION to be the CEIL of the longest segment duration
    const maxDur = Math.max(...tracks.map(t => Math.max(0.1, Number(t.duration || 0))));
    const TARGET = Math.max(1, Math.ceil(targetDuration ?? maxDur));

    const lines: string[] = [];
    lines.push("#EXTM3U");
    lines.push("#EXT-X-VERSION:3");
    lines.push("#EXT-X-PLAYLIST-TYPE:VOD");
    lines.push(`#EXT-X-TARGETDURATION:${TARGET}`);
    lines.push("#EXT-X-MEDIA-SEQUENCE:0");

    tracks.forEach((t, i) => {
      const dur = Math.max(0.1, Number(t.duration || 0.1)); // must be > 0
      if (t.discontinuity) lines.push("#EXT-X-DISCONTINUITY");
      lines.push(`#EXTINF:${dur.toFixed(3)},${(t.title ?? "").replace(/\r?\n/g, " ")}`);
      lines.push(t.url);
    });

    lines.push("#EXT-X-ENDLIST");

    const body = lines.join("\n");

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.apple.mpegurl; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}

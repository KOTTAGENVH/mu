// app/api/hls/[id].m3u8/route.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getM3U8 } from "../store";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const body = getM3U8(params.id);
  if (!body) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.apple.mpegurl; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

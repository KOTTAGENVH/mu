// Legacy misnamed route folder kept to avoid build errors; always 404
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ error: "Route moved" }, { status: 404 });
}

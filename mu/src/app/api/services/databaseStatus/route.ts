import { NextResponse } from "next/server";
import dbConnect from "@/config/dbConnect";
import mongoose from "mongoose";
import { validateCookie } from "../cookieValidator/validateCookie";
import { isAllowed } from "@/app/helper/origin_helper";

export async function GET(req: Request) {
  await dbConnect();

  try {
    if (!isAllowed(req)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    // Validate the cookie
    const validationResult = await validateCookie(req);
    if (!validationResult.valid) {
      console.log("Validation failed: ", validationResult.error);
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const db = mongoose.connection.db;

    if (!db) {
      return NextResponse.json(
        { success: false, message: "Database connection not ready" },
        { status: 500 },
      );
    }

    const stats = await db.stats();
    const TOTAL_LIMIT_MB = 512;
    const TOTAL_LIMIT_BYTES = TOTAL_LIMIT_MB * 1024 * 1024;
    const usedBytes = stats.storageSize;
    const availableBytes = TOTAL_LIMIT_BYTES - usedBytes;

    return NextResponse.json({
      success: true,
      storage: {
        totalBytes: TOTAL_LIMIT_BYTES,
        usedBytes: usedBytes,
        availableBytes: availableBytes > 0 ? availableBytes : 0,
        totalMB: TOTAL_LIMIT_MB,
        usedMB: (usedBytes / (1024 * 1024)).toFixed(2),
        availableMB: (availableBytes / (1024 * 1024)).toFixed(2),
        documentCount: stats.objects,
      },
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 500 },
      );
    }
    return NextResponse.json(
      { success: false, message: "Unknown error" },
      { status: 500 },
    );
  }
}

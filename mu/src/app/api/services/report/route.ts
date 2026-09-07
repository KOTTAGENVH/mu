import { NextResponse } from "next/server";
import { validateCookie } from "@/app/api/services/cookieValidator/validateCookie";
import { isAllowed } from "@/helper/origin_helper";
import dbConnect from "@/config/dbConnect";
import Upload from "@/models/upload";
import Category from "@/models/category";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const max_documents = 5000;

type LeanUpload = {
  id?: string;
  name?: string;
  artist?: string;
  category?: { name?: string } | null;
  fileUrl: string;
  favourite?: boolean;
  lastPlayedAt?: Date | string | null;
  playCount?: number;
  skipCount?: number;
};

export type UploadExportRow = {
  id: string;
  name: string;
  artist: string;
  category: string;
  fileUrl: string;
  favourite: boolean;
  lastPlayedAt: string | null;
  playCount: number;
  skipCount: number;
};

function toRow(doc: LeanUpload): UploadExportRow {
  return {
    id: doc.id ?? "",
    name: doc.name ?? "Untitled",
    artist: doc.artist ?? "Unknown",
    category: doc.category?.name ?? "Uncategorised",
    fileUrl: doc.fileUrl ?? "unknown",
    favourite: Boolean(doc.favourite),
    lastPlayedAt: doc.lastPlayedAt
      ? new Date(doc.lastPlayedAt).toISOString()
      : null,
    playCount: doc.playCount ?? 0,
    skipCount: doc.skipCount ?? 0,
  };
}

export async function GET(req: Request) {
  try {
    if (!isAllowed(req)) {
      return NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 },
      );
    }

    const validationResult = await validateCookie(req);
    if (!validationResult.valid) {
      console.log("Validation failed: ", validationResult.error);
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    await dbConnect();

    const total = await Upload.countDocuments({});

    const docs = await Upload.find({})
      .select(
        "id name artist category fileUrl favourite lastPlayedAt playCount skipCount -_id",
      )
      .populate({ path: "category", select: "name -_id", model: Category })
      .sort({ artist: 1, name: 1 })
      .limit(max_documents)
      .lean<LeanUpload[]>();

    const uploads = docs.map(toRow);

    const summary = {
      total,
      exported: uploads.length,
      truncated: total > uploads.length,
      favourites: uploads.filter((u) => u.favourite).length,
      categories: new Set(uploads.map((u) => u.category)).size,
      totalPlays: uploads.reduce((sum, u) => sum + u.playCount, 0),
      totalSkips: uploads.reduce((sum, u) => sum + u.skipCount, 0),
    };

    return NextResponse.json(
      {
        success: true,
        data: {
          generatedAt: new Date().toISOString(),
          summary,
          uploads,
        },
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
          "X-Content-Type-Options": "nosniff",
          "Referrer-Policy": "no-referrer",
        },
      },
    );
  } catch (error: unknown) {
    console.error("[uploads/export] failed:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to export audio library. Please try again.",
      },
      { status: 500 },
    );
  }
}

const methodNotAllowed = () =>
  NextResponse.json(
    { success: false, message: "Method not allowed" },
    { status: 405, headers: { Allow: "GET" } },
  );

export const POST = methodNotAllowed;
export const PUT = methodNotAllowed;
export const PATCH = methodNotAllowed;
export const DELETE = methodNotAllowed;

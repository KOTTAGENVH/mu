import { NextResponse } from "next/server";
import dbConnect from "@/config/dbConnect";
import Upload from "@/models/upload";
import { DeleteObjectsCommand } from "@aws-sdk/client-s3";
import { s3Client } from "@/app/lib/r2";
import { validateCookie } from "../cookieValidator/validateCookie";
import { isAllowed } from "@/app/helper/origin_helper";

const getBottomPercentileQuery = async (percentage: number) => {
  const totalDocs = await Upload.countDocuments();
  const limit = Math.ceil(totalDocs * (percentage / 100));

  return await Upload.find({})
    .sort({ playCount: 1, skipCount: -1 })
    .limit(limit);
};

export async function POST(req: Request) {
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
        { success: false, message: validationResult.error },
        { status: 401 },
      );
    }

    const { percentile } = await req.json();

    if (!percentile || percentile <= 0 || percentile > 100) {
      return NextResponse.json(
        {
          success: false,
          message: "Please provide a valid percentile (1-100)",
        },
        { status: 400 },
      );
    }

    const candidates = await getBottomPercentileQuery(percentile);

    const safeCandidates = candidates.map((track) => ({
      id: track.id,
      name: track.name,
      artist: track.artist,
      playCount: track.playCount,
      skipCount: track.skipCount,
    }));

    return NextResponse.json({
      success: true,
      count: safeCandidates.length,
      percentile: `${percentile}%`,
      candidates: safeCandidates,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, message: "Error calculating percentile" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: Request) {
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
        { success: false, message: validationResult.error },
        { status: 401 },
      );
    }

    const { percentile } = await req.json();

    if (!percentile || percentile <= 0 || percentile > 100) {
      return NextResponse.json(
        {
          success: false,
          message: "Please provide a valid percentile (1-100)",
        },
        { status: 400 },
      );
    }

    const candidates = await getBottomPercentileQuery(percentile);

    if (candidates.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No tracks found to delete.",
      });
    }

    const r2DeleteObjects = candidates.map((track) => ({
      Key: track.fileUrl,
    }));

    if (r2DeleteObjects.length > 0) {
      const deleteCommand = new DeleteObjectsCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Delete: {
          Objects: r2DeleteObjects,
          Quiet: true,
        },
      });
      await s3Client.send(deleteCommand);
    }

    const idsToDelete = candidates.map((track) => track._id);
    await Upload.deleteMany({ id: { $in: idsToDelete } });

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${candidates.length} tracks (Bottom ${percentile}%)`,
      deletedCount: candidates.length,
    });
  } catch (error: unknown) {
    console.error("Bulk Delete Error:", error);
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 500 },
      );
    }
    return NextResponse.json(
      { success: false, message: "Unknown error occurred" },
      { status: 500 },
    );
  }
}

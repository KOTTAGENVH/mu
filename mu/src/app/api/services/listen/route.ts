import { NextResponse } from "next/server";
import dbConnect from "@/config/dbConnect";
import Upload from "@/models/upload";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client } from "@/app/lib/r2";
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
        { success: false, message: validationResult.error },
        { status: 401 },
      );
    }
    const { searchParams } = new URL(req.url);
    const previousArtist = searchParams.get("previousArtist");

    const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);

    const candidates = await Upload.aggregate([
      {
        $match: {
          $or: [
            { lastPlayedAt: null },
            { lastPlayedAt: { $lt: fourHoursAgo } },
          ],
        },
      },
      { $sample: { size: 20 } },
    ]);

    if (!candidates.length) {
      return NextResponse.json(
        { error: "No available music" },
        { status: 404 },
      );
    }

    let bestCandidate = candidates[0];
    let highestScore = -Infinity;

    candidates.forEach((track) => {
      let score = Math.random() * 10;

      if (track.favourite) score += 20;
      score += track.playCount * 0.5;
      score -= track.skipCount * 2;

      if (previousArtist && track.artist === previousArtist) {
        score -= 50;
      }

      if (score > highestScore) {
        highestScore = score;
        bestCandidate = track;
      }
    });

    await Upload.updateOne(
      { _id: bestCandidate._id },
      {
        $set: { lastPlayedAt: new Date() },
        $inc: { playCount: 1 },
      },
    );

    const getCommand = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: bestCandidate.objectKey,
    });

    const signedUrl = await getSignedUrl(s3Client, getCommand, {
      expiresIn: 3600,
    });
    bestCandidate.fileUrl = signedUrl;
    delete bestCandidate._id;

    return NextResponse.json(bestCandidate);
  } catch (error: unknown) {
    console.error("Error in GET /listen:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch music" },
      { status: 500 },
    );
  }
}

import { NextResponse } from "next/server";
import dbConnect from "@/config/dbConnect";
import Upload from "@/models/upload";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client } from "@/app/lib/r2";
import { validateCookie } from "../cookieValidator/validateCookie";
import { isAllowed } from "@/app/helper/origin_helper";
import { UpdateQuery } from "mongoose";
import { Types } from "mongoose";

interface TrackData {
  _id?: Types.ObjectId;
  id: string;
  name: string;
  artist: string;
  category: Types.ObjectId;
  fileUrl: string;
  favourite: boolean;
  lastPlayedAt?: Date | null;
  playCount: number;
  skipCount: number;
}

interface ScoredTrackData extends TrackData {
  score?: number;
}

function weightedRandomPick(candidates: ScoredTrackData[]) {
  const minScore = Math.min(...candidates.map((c) => c.score || 0));
  const weights = candidates.map((c) => (c.score || 0) - minScore + 1);
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let random = Math.random() * totalWeight;
  for (let i = 0; i < candidates.length; i++) {
    random -= weights[i];
    if (random <= 0) return candidates[i];
  }
  return candidates[candidates.length - 1];
}

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

    //get 50 random candidates that are not recently played
    let candidates = (await Upload.aggregate([
      {
        $match: {
          $or: [
            { lastPlayedAt: { $exists: false } },
            { lastPlayedAt: null },
            { lastPlayedAt: { $lt: fourHoursAgo } },
          ],
        },
      },
      { $sort: { lastPlayedAt: 1 } },
      { $limit: 1000 },
      { $sample: { size: 50 } },
    ])) as TrackData[];

    //if tracks<50 get random 50 tracks which were played last
    //Would recommend to index lastPlayedAt at mongo db
    if (!candidates || candidates.length < 50) {
      candidates = (await Upload.aggregate([
        { $sort: { lastPlayedAt: 1 } },
        { $limit: 1000 },
        { $sample: { size: 50 } },
      ])) as TrackData[];
    }

    //Score each candidate to determine queue order
    const scoredCandidates = candidates.map((track) => {
      let score = Math.random() * 10;

      // Play Bonus: +0.5 per play (Capped at +10 points)
      const playBonus = Math.min((track.playCount || 0) * 0.5, 10);
      score += playBonus;

      // Skip Penalty: -2.0 per skip (Capped at -10 points)
      const skipPenalty = Math.min((track.skipCount || 0) * 2, 10);
      score -= skipPenalty;

      // Favorite Bonus: +5 points
      if (track.favourite) score += 5;

      // Variety Penalty: -20 points if it's the same artist as the last track
      if (
        previousArtist &&
        track.artist.replace(/\s+/g, "").toLowerCase() ===
          previousArtist.replace(/\s+/g, "").toLowerCase()
      ) {
        score -= 20;
      }

      return { ...track, score };
    });

    //Sort highest score first
    const orderedQueue: ScoredTrackData[] = [];
    let remaining = [...scoredCandidates];
    while (remaining.length > 0) {
      const pick = weightedRandomPick(remaining);
      orderedQueue.push(pick);
      remaining = remaining.filter(
        (t) => t._id?.toString() !== pick._id?.toString(),
      );
    }

    const queue = await Promise.all(
      orderedQueue.map(async (track) => {
        const getCommand = new GetObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME,
          Key: track.fileUrl,
        });
        const signedUrl = await getSignedUrl(s3Client, getCommand, {
          expiresIn: 3600,
        });

        track.fileUrl = signedUrl;

        delete track._id;
        delete track.score;

        return track;
      }),
    );

    return NextResponse.json({
      success: true,
      uploads: queue,
    });
  } catch (error: unknown) {
    console.error("Error in GET /listen:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch music" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: Request) {
  await dbConnect();

  try {
    if (!isAllowed(req)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    // Validate Cookie
    const validationResult = await validateCookie(req);
    if (!validationResult.valid) {
      console.log("Validation failed: ", validationResult.error);
      return NextResponse.json(
        { success: false, message: validationResult.error },
        { status: 401 },
      );
    }

    const body = await req.json();
    const { trackId, action } = body;

    if (!trackId || !action) {
      return NextResponse.json(
        { success: false, message: "Missing trackId or action" },
        { status: 400 },
      );
    }

    //1-skip
    //2-play
    let updateQuery: UpdateQuery<typeof Upload> = {};
    if (action === "skip") {
      updateQuery = { $inc: { skipCount: 1 } };
    } else if (action === "play") {
      updateQuery = {
        $inc: { playCount: 1 },
        $set: { lastPlayedAt: new Date() },
      };
    } else {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid action. Must be 'skip' or 'play'.",
        },
        { status: 400 },
      );
    }

    const updatedTrack = await Upload.findOneAndUpdate(
      { id: trackId },
      updateQuery,
      {
        new: true,
      },
    );

    if (!updatedTrack) {
      return NextResponse.json(
        { success: false, message: "Track not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: `Track ${action} count updated successfully`,
    });
  } catch (error: unknown) {
    console.error("Error in PATCH route:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update track statistics" },
      { status: 500 },
    );
  }
}

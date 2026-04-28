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
import Category from "@/models/category";

interface TrackData {
  _id?: Types.ObjectId;
  id: string;
  name: string;
  artist: string;
  category: { id: string; name: string };
  fileUrl: string;
  favourite: boolean;
  lastPlayedAt?: Date | null;
  playCount: number;
  skipCount: number;
}

interface ScoredTrackData extends TrackData {
  score?: number;
}

function weightedRandomPick(
  candidates: ScoredTrackData[],
  prefixWeights: number[],
  totalWeight: number,
): ScoredTrackData {
  const random = Math.random() * totalWeight;
  let lo = 0,
    hi = prefixWeights.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (prefixWeights[mid] < random) lo = mid + 1;
    else hi = mid;
  }
  return candidates[lo];
}

function buildPrefixWeights(candidates: ScoredTrackData[]): {
  prefixWeights: number[];
  totalWeight: number;
} {
  const minScore = Math.min(...candidates.map((c) => c.score ?? 0));
  const prefixWeights: number[] = [];
  let running = 0;
  for (const c of candidates) {
    running += (c.score ?? 0) - minScore + 1;
    prefixWeights.push(running);
  }
  return { prefixWeights, totalWeight: running };
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
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(req.url);
    const previousArtist = searchParams.get("previousArtist");
    const categoryid = searchParams.get("categoryid");

    const limit = Math.min(
      parseInt(searchParams.get("limit") || "20", 10) || 20,
      50,
    );

    const searchCategory = categoryid || "All";

    const fetchCandidates = async (categoryToSearch: string) => {
      const pipeline: any[] = [];

      if (categoryToSearch !== "All") {
        const categoryDoc = await Category.findOne({ id: categoryToSearch });
        if (categoryDoc) {
          pipeline.push({
            $match: {
              category: categoryDoc._id,
            },
          });
        }
      }

      pipeline.push(
        {
          $addFields: {
            sortKey: { $ifNull: ["$lastPlayedAt", new Date(0)] },
          },
        },
        { $sort: { sortKey: 1 } },
        { $limit: limit },
      );

      return (await Upload.aggregate(pipeline)) as TrackData[];
    };

    let candidates = await fetchCandidates(searchCategory);

    let usedFallback = false;
    if ((!candidates || candidates.length === 0) && searchCategory !== "All") {
      candidates = await fetchCandidates("All");
      usedFallback = true;
    }

    if (!candidates || candidates.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Sorry, no audio is being uploaded in the entire library!",
          uploads: [],
        },
        { status: 404 },
      );
    }

    const now = Date.now();

    //Score each candidate to determine queue order
    const scoredCandidates = candidates.map((track) => {
      let score = Math.random() * 10;

      //Allows to compete with favourites score which may go 20+
      if (!track.playCount || track.playCount === 0) {
        score += 15;
      }

      // Play Bonus: +0.5 per play (Capped at +10 points)
      const playBonus = Math.min((track.playCount || 0) * 0.5, 10);
      score += playBonus;

      //If track never played falls back to raw count or else
      //assign a percentage ratio
      if (track.playCount && track.playCount > 0) {
        const skipRate = (track.skipCount || 0) / track.playCount;
        score -= skipRate * 10;
      } else {
        const rawSkipPenalty = Math.min((track.skipCount || 0) * 2, 10);
        score -= rawSkipPenalty;
      }

      // Favorite Bonus: +5 points
      if (track.favourite) score += 5;

      //time decay bonus: rewards tracks not played recently
      if (track.lastPlayedAt) {
        const hoursSince =
          (now - new Date(track.lastPlayedAt).getTime()) / 3_600_000;
        score += Math.min(hoursSince * 0.1, 10);
      }

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
      const { prefixWeights, totalWeight } = buildPrefixWeights(remaining);
      const pick = weightedRandomPick(remaining, prefixWeights, totalWeight);
      orderedQueue.push(pick);
      remaining = remaining.filter(
        (t) => t._id?.toString() !== pick._id?.toString(),
      );
    }

    await Upload.populate(orderedQueue, {
      path: "category",
      select: "-_id -__v",
    });

    const queue = await Promise.all(
      orderedQueue.map(async (track) => {
        const getCommand = new GetObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME,
          Key: track.fileUrl,
        });
        const signedUrl = await getSignedUrl(s3Client, getCommand, {
          expiresIn: 3600,
        });

        const { _id, score, ...cleanTrack } = track as ScoredTrackData & {
          _id: Types.ObjectId;
          score: number;
        };

        return { ...cleanTrack, fileUrl: signedUrl };
      }),
    );

    return NextResponse.json({
      success: true,
      usedFallback: usedFallback,
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
        { success: false, message: "Unauthorized" },
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

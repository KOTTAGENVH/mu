import { NextResponse } from "next/server";
import dbConnect from "@/config/dbConnect";
import Upload from "@/models/upload";
import { validateCookie } from "@/app/api/services/cookieValidator/validateCookie";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "@/app/lib/r2";
import { stegMP3Checker, stegWavChecker } from "@/app/helper/stegnographyCheck";
import { generateId } from "@/app/helper/uniqueIdGenerator";
import { isAllowed } from "@/app/helper/origin_helper";
import Category from "@/models/category";
import Activity, { ActionType, ActivityType } from "@/models/activity";

// Handle the POST request for audio
export async function POST(req: Request) {
  await dbConnect();
  try {
    if (!isAllowed(req)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const formData = await req.formData();

    const category = formData.get("category") as string;
    let artist = formData.get("artist") as string;
    let name = formData.get("name") as string;
    const file = formData.get("file") as File | null;

    // Validate the cookie
    const validationResult = await validateCookie(req);
    if (!validationResult.valid) {
      console.log("Validation failed: ", validationResult.error);
      return NextResponse.json(
        { success: false, message: validationResult.error },
        { status: 401 },
      );
    }

    // Check for required fields
    if (!name || !category || !file || !artist) {
      return NextResponse.json(
        {
          success: false,
          message: "Name, category, artist, and file are required",
        },
        { status: 400 },
      );
    }

    const categoryDoc = await Category.findOne({ id: category });

    if (!categoryDoc) {
      return NextResponse.json(
        { success: false, message: `Category '${category}' not found.` },
        { status: 400 },
      );
    }
    // Remove inverted commas from the name
    name = name.replace(/[^a-zA-Z]/g, "");

    // Remove inverted commas from the artist
    artist = artist.replace(/[^a-zA-Z]/g, "");

    // Check if name already exists
    const uploadExists = await Upload.findOne({ name });

    if (uploadExists) {
      return NextResponse.json(
        { success: false, message: "Song with this name already exists" },
        { status: 400 },
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let finalSafeBuffer: Buffer;

    if (buffer.toString("utf8", 0, 4) === "RIFF") {
      const result = stegWavChecker(buffer);
      if (!result.safe || !result.sanitizedBuffer) {
        return NextResponse.json(
          { success: false, message: result.reason },
          { status: 400 },
        );
      }
      finalSafeBuffer = result.sanitizedBuffer;
    } else if (
      buffer.toString("utf8", 0, 3) === "ID3" ||
      (buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0)
    ) {
      const result = stegMP3Checker(buffer);
      if (!result.safe || !result.sanitizedBuffer) {
        return NextResponse.json(
          { success: false, message: result.reason },
          { status: 400 },
        );
      }
      finalSafeBuffer = result.sanitizedBuffer;
    } else {
      return NextResponse.json(
        {
          success: false,
          message: "Security Error: Only valid MP3 or WAV files are allowed.",
        },
        { status: 400 },
      );
    }

    const objectKey = `audio/${name}-${Date.now()}`;

    const uploadCommand = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: objectKey,
      Body: finalSafeBuffer,
      ContentType: file.type,
    });

    await s3Client.send(uploadCommand);

    let uniqueId = "";
    let idLength = 6;
    let isUnique = false;

    while (!isUnique) {
      uniqueId = generateId(idLength);

      const existingAudio = await Upload.findOne({ id: uniqueId });

      if (!existingAudio) {
        isUnique = true;
      } else {
        idLength++;
      }
    }

    // Create a new upload
    const upload = await Upload.create({
      id: uniqueId,
      name,
      artist,
      category: categoryDoc._id,
      fileUrl: objectKey,
      favourite: false,
    });

    // Check if upload was created
    if (!upload) {
      return NextResponse.json(
        { success: false, message: "Upload not created" },
        { status: 500 },
      );
    }

    // Add Activty
    let uniqueActivtyId = "";
    let activityIdLength = 6;
    let isActivtyUnique = false;

    while (!isActivtyUnique) {
      uniqueActivtyId = generateId(activityIdLength);

      const existingActivityID = await Activity.findOne({
        id: uniqueActivtyId,
      });

      if (!existingActivityID) {
        isActivtyUnique = true;
      } else {
        activityIdLength++;
      }
    }

    const IST_TIMEZONE = "Asia/Kolkata";
    const now = new Date();

    const activity = await Activity.create({
      id: uniqueActivtyId,
      taskname: `You have successfully uploaded ${name} to MU.`,
      type: ActivityType.AUDIO,
      action: ActionType.ADD,
      date: now.toLocaleDateString("en-IN", { timeZone: IST_TIMEZONE }),
      time: now.toLocaleTimeString("en-IN", {
        timeZone: IST_TIMEZONE,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      }),
      timezone: "IST",
    });

    if (!activity) {
      return NextResponse.json(
        {
          success: false,
          message: "Sorry, an error occurred while recording the upload activity.",
        },
        { status: 500 },
      );
    }

    // Respond with success
    return NextResponse.json({ success: true, data: upload }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 500 },
      );
    } else {
      return NextResponse.json(
        { success: false, message: "An unknown error occurred" },
        { status: 500 },
      );
    }
  }
}

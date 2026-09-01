import { NextResponse } from "next/server";
import dbConnect from "@/config/dbConnect";
import Upload from "@/models/upload";
import { validateCookie } from "@/app/api/services/cookieValidator/validateCookie";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "@/lib/r2";
import { stegMP3Checker, stegWavChecker } from "@/helper/stegnographyCheck";
import { generateId } from "@/helper/uniqueIdGenerator";
import { isAllowed } from "@/helper/origin_helper";
import Category from "@/models/category";
import Activity, { ActionType, ActivityType } from "@/models/activity";
import { validateText } from "@/helper/validator";

const max_upload_bytes = 500 * 1024 * 1024;

function slugify(value: string): string {
  return (
    value
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80)
      .toLowerCase() || "audio"
  );
}

// Handle the POST request for audio
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
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const declaredLength = Number(req.headers.get("content-length") ?? 0);
    if (!Number.isFinite(declaredLength) || declaredLength > max_upload_bytes) {
      return NextResponse.json(
        { success: false, message: "File too large" },
        { status: 413 },
      );
    }

    const formData = await req.formData();

    const category = formData.get("category");
    if (
      typeof category !== "string" ||
      !/^[A-Za-z0-9_-]{1,64}$/.test(category)
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid category" },
        { status: 400 },
      );
    }
    const nameCheck = validateText(formData.get("name"), "Name", 200);
    if (!nameCheck.ok) {
      return NextResponse.json(
        { success: false, message: nameCheck.message },
        { status: 400 },
      );
    }
    const artistCheck = validateText(formData.get("artist"), "Artist", 120);
    if (!artistCheck.ok) {
      return NextResponse.json(
        { success: false, message: artistCheck.message },
        { status: 400 },
      );
    }
    const name = nameCheck.value;
    const artist = artistCheck.value;
    const file = formData.get("file");

    // Check for File
    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, message: "File is required" },
        { status: 400 },
      );
    }

    if (file.size === 0) {
      return NextResponse.json(
        { success: false, message: "File is empty" },
        { status: 400 },
      );
    }

    if (file.size > max_upload_bytes) {
      return NextResponse.json(
        { success: false, message: "File too large" },
        { status: 413 },
      );
    }

    const categoryDoc = await Category.findOne({ id: category });

    if (!categoryDoc) {
      return NextResponse.json(
        { success: false, message: `Category '${category}' not found.` },
        { status: 400 },
      );
    }

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
    let contentType: string;

    if (buffer.toString("utf8", 0, 4) === "RIFF") {
      const result = stegWavChecker(buffer);
      if (!result.safe || !result.sanitizedBuffer) {
        return NextResponse.json(
          { success: false, message: result.reason },
          { status: 400 },
        );
      }
      finalSafeBuffer = result.sanitizedBuffer;
      contentType = "audio/wav";
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
      contentType = "audio/mp3";
    } else {
      return NextResponse.json(
        {
          success: false,
          message: "Security Error: Only valid MP3 or WAV files are allowed.",
        },
        { status: 400 },
      );
    }

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

    const objectKey = `audio/${slugify(name)}-${uniqueId}`;

    const uploadCommand = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: objectKey,
      Body: finalSafeBuffer,
      ContentType: contentType,
      ContentDisposition: "attachment",
    });

    await s3Client.send(uploadCommand);

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

    const ist_timezone = "Asia/Kolkata";
    const now = new Date();

    const activity = await Activity.create({
      id: uniqueActivtyId,
      taskname: `You have successfully uploaded ${name} to MU.`,
      type: ActivityType.AUDIO,
      action: ActionType.ADD,
      date: now.toLocaleDateString("en-IN", { timeZone: ist_timezone }),
      time: now.toLocaleTimeString("en-IN", {
        timeZone: ist_timezone,
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
          message:
            "Sorry, an error occurred while recording the upload activity.",
        },
        { status: 500 },
      );
    }

    // Respond with success
    return NextResponse.json({ success: true, data: upload }, { status: 201 });
  } catch (error: unknown) {
    console.error("[audio-upload] failed:", error);
    return NextResponse.json(
      { success: false, message: "Upload failed. Please try again." },
      { status: 500 },
    );
  }
}

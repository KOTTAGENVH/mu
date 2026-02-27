import { NextResponse } from "next/server";
import dbConnect from "@/config/dbConnect";
import Upload from "@/models/upload";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client } from "@/app/lib/r2";
import { validateCookie } from "../../cookieValidator/validateCookie";
import { isAllowed } from "@/app/helper/origin_helper";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
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
    const { id } = await params;
    const track = await Upload.findOne({ id: id })
      .select("-_id")
      .populate("category")
      .lean();

    if (!track) {
      return NextResponse.json(
        { success: false, message: "Track not found" },
        { status: 404 },
      );
    }

    const getCommand = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: (track as any).fileUrl,
    });

    const signedUrl = await getSignedUrl(s3Client, getCommand, {
      expiresIn: 3600,
    });

    (track as any).fileUrl = signedUrl;

    return NextResponse.json({ success: true, track: track });
  } catch (error: unknown) {
    console.error("Error generating URL:", error);
    return NextResponse.json(
      { success: false, message: "Failed to generate stream" },
      { status: 500 },
    );
  }
}

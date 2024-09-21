import { NextResponse } from "next/server";
import dbConnect from "@/config/dbConnect";
import Upload from "@/models/upload";
import { validateCookie } from "@/app/api/services/cookieValidator/validateCookie";

// Handle the GET request for audio
export async function GET(req: Request) {
  await dbConnect();

  try {
    // Validate the cookie
    const validationResult = await validateCookie(req);
    if (!validationResult.valid) {
      console.log("Validation failed: ", validationResult.error);
      return NextResponse.json(
        { success: false, message: validationResult.error },
        { status: 401 }
      );
    }

    // Get all uploads
    const uploads = await Upload.find({});
    if (!uploads) {
      return NextResponse.json(
        { success: false, message: "No uploads found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, uploads });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 500 }
      );
    } else {
      return NextResponse.json(
        { success: false, message: "An unknown error occurred" },
        { status: 500 }
      );
    }
  }
}

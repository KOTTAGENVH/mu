import { NextResponse } from "next/server";
import dbConnect from "@/config/dbConnect";
import Upload from "@/models/upload";
import { customEmail } from "@/config/customEmail";
import { validateCookie } from "@/app/api/services/cookieValidator/validateCookie";

// Handle the POST request for audio
export async function POST(req: Request) {
  await dbConnect();

  try {
    const body = await req.json(); // Parse request body
    const { name, category, fileUrl, favourite } = body;

    // Validate the cookie
    const validationResult = await validateCookie(req);
    if (!validationResult.valid) {
      console.log("Validation failed: ", validationResult.error);
      return NextResponse.json(
        { success: false, message: validationResult.error },
        { status: 401 }
      );
    }

    // Check for required fields
    if (!name || !category || !fileUrl) {
      return NextResponse.json(
        { success: false, message: "All fields are required" },
        { status: 400 }
      );
    }

    // Check if name already exists
    const uploadExists = await Upload.findOne({ name });
    if (uploadExists) {
      return NextResponse.json(
        { success: false, message: "Name already exists" },
        { status: 400 }
      );
    }

    // Create a new upload
    const upload = await Upload.create({
      name,
      category,
      fileUrl,
      favourite,
    });

    // Check if upload was created
    if (!upload) {
      return NextResponse.json(
        { success: false, message: "Upload not created" },
        { status: 500 }
      );
    } else {
      // Send email
      await customEmail(
        "nowenportfolio@gmail.com",
        "Welcome to MU",
        `You have successfully uploaded ${name} to MU.`
      );
    }
    // Respond with success
    return NextResponse.json({ success: true, data: upload }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 500 }
      );
    } else {
      return NextResponse.json(
        { success: false, message: 'An unknown error occurred' },
        { status: 500 }
      );
    }
  }
}

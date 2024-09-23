import { validateCookie } from "@/app/api/services/cookieValidator/validateCookie";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    // Validate the cookie
    const validationResult = await validateCookie(req);
    if (!validationResult.valid) {
      console.log("Validation failed: ", validationResult.error);
      return NextResponse.json(
        { success: false, message: validationResult.error },
        { status: 401 }
      );
    } else {
      return NextResponse.json(
        { success: true, message: "Valid token" },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Invalid or expired token" },
      { status: 500 }
    );
  }
}

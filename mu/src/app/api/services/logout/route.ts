import { NextResponse } from "next/server";
import { serialize } from "cookie";
import { validateCookie } from "../cookieValidator/validateCookie";

export async function GET(req: Request) {
  try {
    const cookieName = process.env.COOKIE_NAME;

    if (!cookieName) {
      console.error("COOKIE_NAME environment variable is not set.");
      return NextResponse.json(
        { success: false, message: "Server configuration error" },
        { status: 500 },
      );
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

    // Set the cookie with an expired date to remove it
    const expiredCookie = serialize(cookieName, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      expires: new Date(0),
      path: "/",
    });

    return NextResponse.json(
      { success: true, message: "Logged out successfully" },
      {
        headers: { "Set-Cookie": expiredCookie },
      },
    );
  } catch (error) {
    console.error("Error during logout: ", error);
    return NextResponse.json(
      { success: false, message: "An error occurred during logout" },
      { status: 500 },
    );
  }
}

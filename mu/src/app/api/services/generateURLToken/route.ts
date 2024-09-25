import { customEmail } from "@/config/customEmail";
import { NextResponse } from "next/server";
import { sign } from "jsonwebtoken";

// Only 1 day validity
const MAX_AGE = 60 * 60 * 24; // 24 hours in seconds

//Generate a link to the user for login
export async function POST() {
  try {
    const secret = process.env.NEXT_PUBLIC_JWT_SECRET || "";
    if (!secret) {
      throw new Error("JWT_SECRET environment variable is not set.");
    }
    const email = process.env.NEXT_PUBLIC_EMAIL || "";
    const subject = process.env.NEXT_PUBLIC_SUBJECT || "";
    if (!email) {
      throw new Error("EMAIL environment variable is not set.");
    }
    if (!subject) {
      throw new Error("SUBJECT environment variable is not set.");
    }

    const token = sign({ 
      email, 
      subject
    }, secret, { expiresIn: MAX_AGE });

    const cookieName = process.env.NEXT_PUBLIC_COOKIE_NAME || "";
    if (!cookieName) {
      throw new Error("COOKIE_NAME environment variable is not set.");
    }

    // Prepare and send email with link for the user to login
    const loginLink = `${process.env.NEXT_PUBLIC_URL}?token=${token}`;

    // Send the token to the user via email
    await customEmail(
      email,
      "Token for MU",
      `Please click on the link to login: ${loginLink}`
    );

    // Return the token in the response
    return NextResponse.json({ success: true, token });
  } catch (error: unknown) {
    if (error instanceof Error) {
      // Return the error response as a plain object
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 500 }
      );
    }
  }

  // Fallback in case something unexpected happens
  return NextResponse.json(
    { success: false, message: "An unexpected error occurred" },
    { status: 500 }
  );
}

import { customEmail } from "@/config/customEmail";
import { NextResponse } from "next/server";
import { JwtPayload, verify } from "jsonwebtoken";

//Validate Cookie from passed token
export async function POST(req: Request) {
  try {
    const secret = process.env.NEXT_PUBLIC_JWT_SECRET || "";
    const email = process.env.NEXT_PUBLIC_EMAIL || "";
    const subject = process.env.NEXT_PUBLIC_SUBJECT || "";
    const { token } = await req.json();
    if (!secret) {
      throw new Error("JWT_SECRET environment variable is not set.");
    }
    if (!email) {
      throw new Error("EMAIL environment variable is not set.");
    }
    if (!subject) {
      throw new Error("SUBJECT environment variable is not set.");
    }

    if (!token) {
      throw new Error("No token provided");
    }

    const decoded = verify(token, secret) as JwtPayload;

    //Check if the Token is expired
    if (decoded.iat && Date.now() >= decoded.iat * 1000 + 24 * 60 * 60 * 1000) {
      return NextResponse.json(
        { success: false, message: "Token expired" },
        { status: 400 }
      );
    } else if (!decoded.exp) {
      return NextResponse.json(
        { success: false, message: "Token does not contain exp" },
        { status: 400 }
      );
    } else if (Date.now() >= decoded.exp * 1000) {
      return NextResponse.json(
        { success: false, message: "Token expired" },
        { status: 400 }
      );
    }

    // Verify email and subject
    if (decoded.email && decoded.subject) {
      if (decoded.email !== email || decoded.subject !== subject) {
        return NextResponse.json(
          { success: false, message: "Token email or subject does not match" },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { success: false, message: "Token does not contain email or subject" },
        { status: 400 }
      );
    }

    const tokenValidatedAt = new Date().toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });

    await customEmail(
      email,
      "Token Validated MU",
      `Token validated at ${tokenValidatedAt}`
    );
    return NextResponse.json({ success: true, decoded });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 500 }
      );
    }
  }

  return NextResponse.json(
    { success: false, message: "An unexpected error occurred" },
    { status: 500 }
  );
}

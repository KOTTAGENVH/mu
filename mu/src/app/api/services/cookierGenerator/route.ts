import { serialize } from "cookie";
import { sign } from "jsonwebtoken";
import { NextResponse } from "next/server";

//Generate a jwt token
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const genratedToken = body.genratedToken;

    //Only 2 days validity
    const MAX_AGE = 60 * 60 * 24 * 2;

    //Token
    const secret = process.env.NEXT_PUBLIC_JWT_SECRET || "";
    const cookieName = process.env.NEXT_PUBLIC_COOKIE_NAME || "";

    if (!secret) {
      throw new Error("JWT_SECRET environment variable is not set.");
    }

    const token = sign(
      {
        genratedToken,
      },
      secret,
      {
        expiresIn: MAX_AGE,
      }
    );

    if (!cookieName) {
      throw new Error("COOKIE_NAME environment variable is not set.");
    }

    // Set cookie
    const serialized = serialize(cookieName, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: MAX_AGE,
      path: "/",
    });

    if (!serialized) {
      throw new Error("Cookie serialization failed.");
    }
    
    return NextResponse.json(
        { success: true, data: genratedToken },
        {
          status: 201,
          headers: { "Set-Cookie": serialized },
        }
      );
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 500 }
      );
    }
  }
}

import { customEmail } from "@/config/customEmail";
import { NextResponse } from "next/server";
import { JwtPayload, verify } from "jsonwebtoken";
import { CookieGenerator } from "../cookierGenerator/generateCookie";
import { isAllowed } from "@/app/helper/origin_helper";

//Validate Cookie from passed token
export async function POST(req: Request) {
  try {
    if (!isAllowed(req)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const secret = process.env.JWT_SECRET || "";
    const email = process.env.EMAIL || "";
    const brand = process.env.BRAND || "";
    const { token, ip } = await req.json();

    if (!secret) {
      throw new Error("JWT_SECRET environment variable is not set.");
    }
    if (!email) {
      throw new Error("EMAIL environment variable is not set.");
    }
    if (!brand) {
      throw new Error("BRAND environment variable is not set.");
    }

    if (!token) {
      throw new Error("No token provided");
    }

    const decoded = verify(token, secret) as JwtPayload;

    //Check if the Token is expired
    if (decoded.iat && Date.now() >= decoded.iat * 1000 + 24 * 60 * 60 * 1000) {
      return NextResponse.json(
        { success: false, message: "Token expired" },
        { status: 400 },
      );
    } else if (!decoded.exp) {
      return NextResponse.json(
        { success: false, message: "Token does not contain exp" },
        { status: 400 },
      );
    } else if (Date.now() >= decoded.exp * 1000) {
      return NextResponse.json(
        { success: false, message: "Token expired" },
        { status: 400 },
      );
    }

    // Verify email and brand
    if (decoded.email && decoded.brand) {
      if (decoded.email !== email || decoded.brand !== brand) {
        return NextResponse.json(
          { success: false, message: "Token email or brand does not match" },
          { status: 400 },
        );
      }
    } else {
      return NextResponse.json(
        { success: false, message: "Token does not contain email or brand" },
        { status: 400 },
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
      `Token validated at ${tokenValidatedAt}`,
      ip,
    );

    const cookie = await CookieGenerator(decoded.genratedToken);

    return NextResponse.json(
      { success: true },
      {
        status: 201,
        headers: { "Set-Cookie": cookie },
      },
    );
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 500 },
      );
    }
  }

  return NextResponse.json(
    { success: false, message: "An unexpected error occurred" },
    { status: 500 },
  );
}

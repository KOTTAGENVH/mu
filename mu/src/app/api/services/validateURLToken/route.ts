import { customEmail } from "@/config/customEmail";
import { NextResponse } from "next/server";
import { JwtPayload, TokenExpiredError, verify } from "jsonwebtoken";
import { CookieGenerator } from "../cookierGenerator/generateCookie";
import { isAllowed } from "@/app/helper/origin_helper";
import { checkRateLimit } from "@/app/helper/rateLimiter";
import { getClientIp } from "../../../helper/ipChecker";

//Validate Cookie from passed token
export async function POST(req: Request) {
  try {
    if (!isAllowed(req)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { message: "Invalid JSON payload" },
        { status: 400 },
      );
    }

    const secret = process.env.JWT_SECRET || "";
    const email = process.env.EMAIL || "";
    const brand = process.env.BRAND || "";
    const { token } = body;

    if (!secret || !email || !brand) {
      throw new Error(
        "Server configuration error: Missing environment variables.",
      );
    }

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { message: "Invalid token format" },
        { status: 400 },
      );
    }

    const { ip } = await getClientIp(req);

    const globalOk = await checkRateLimit(
      "totp-global",
      "totp-auth",
      10,
      15 * 60 * 1000,
    );
    
    const ipOk = await checkRateLimit(ip, `totp-ip`, 5, 15 * 60 * 1000);

    if (!globalOk || !ipOk) {
      return NextResponse.json(
        {
          success: false,
          message: "Too many login attempts. Please try again in 15 minutes.",
        },
        { status: 429 },
      );
    }

    let decoded: JwtPayload;

    try {
      decoded = verify(token, secret) as JwtPayload;
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        return NextResponse.json(
          {
            success: false,
            message: "Token expired. Please request a new login link.",
          },
          { status: 400 },
        );
      }
      return NextResponse.json(
        { success: false, message: "Invalid or malformed login link." },
        { status: 400 },
      );
    }

    // Verify email and brand
    if (decoded.email !== email || decoded.brand !== brand) {
      return NextResponse.json(
        {
          success: false,
          message: "Token validation failed. Identity mismatch.",
        },
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
      console.error("[Auth Route Error]:", error.message);
    }
    return NextResponse.json(
      {
        success: false,
        message: "An unexpected internal server error occurred.",
      },
      { status: 500 },
    );
  }
}

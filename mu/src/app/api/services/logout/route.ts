import { NextResponse } from "next/server";
import { serialize, parse } from "cookie";
import { validateCookie } from "../cookieValidator/validateCookie";
import { isAllowed } from "@/helper/origin_helper";
import Session from "@/models/session";
import dbConnect from "@/config/dbConnect";
import { verify, JwtPayload } from "jsonwebtoken";
import { AuthEvent } from "@/models/authLog";
import { logAuthEvent } from "@/helper/authLogHelp";

export async function GET(req: Request) {
  try {
    if (!isAllowed(req)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const cookieName = process.env.COOKIE_NAME;
    const secret = process.env.JWT_SECRET;

    if (!cookieName || !secret) {
      console.error("COOKIE_NAME or JWT_SECRET not set.");
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
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const url = new URL(req.url);
    const logoutAll = url.searchParams.get("all") === "true";

    try {
      await dbConnect();

      if (logoutAll) {
        const email = process.env.EMAIL || "";
        if (email) await Session.deleteMany({ email });
        await logAuthEvent(AuthEvent.LOGOUT_ALL);
      } else {
        const cookieHeader = req.headers.get("cookie") || "";
        const token = parse(cookieHeader)[cookieName];
        if (token) {
          const decoded = verify(token, secret) as JwtPayload;
          if (decoded.sessionId) {
            await Session.deleteOne({ sessionId: decoded.sessionId });
          }
        }
        await logAuthEvent(AuthEvent.LOGOUT);
      }
    } catch (dbError) {
      console.error("Failed to delete session(s):", dbError);
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

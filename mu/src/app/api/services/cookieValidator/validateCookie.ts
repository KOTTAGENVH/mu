import { verify, JwtPayload } from "jsonwebtoken";
import { parse } from "cookie";
import dbConnect from "@/config/dbConnect";
import Session from "@/models/session";

interface CookieValidationResult {
  valid: boolean;
  error?: string;
  decoded?: string | JwtPayload;
}

export async function validateCookie(
  req: Request,
): Promise<CookieValidationResult> {
  try {
    const cookieName = process.env.COOKIE_NAME;
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      return {
        valid: false,
        error: "JWT SECRET is not set in environment variables",
      };
    }

    if (!cookieName) {
      return {
        valid: false,
        error: "COOKIE_NAME is not set in environment variables",
      };
    }

    const cookieHeader = req.headers.get("cookie");
    if (!cookieHeader) {
      return { valid: false, error: "No cookies present" };
    }

    const cookies = parse(cookieHeader);
    const token = cookies[cookieName];
    if (!token) {
      return { valid: false, error: "No token found" };
    }

    const decoded = verify(token, secret) as JwtPayload;

    if (!decoded.sessionId) {
      return { valid: false, error: "Malformed session token" };
    }

    await dbConnect();
    const session = await Session.findOne({ sessionId: decoded.sessionId });
    if (!session) {
      return { valid: false, error: "Session revoked or expired" };
    }

    return { valid: true, decoded };
  } catch (error) {
    console.error(error);
    return { valid: false, error: "Invalid or expired token" };
  }
}

import { verify, JwtPayload } from "jsonwebtoken";
import { parse } from "cookie";
import dbConnect from "@/config/dbConnect";
import Session from "@/models/session";
import { decrypt } from "@/config/decryption";
import { getClientIp } from "@/helper/ipChecker";

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
    const touch_interval_ms = 5 * 60 * 1000;

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
    const encryptedToken = cookies[cookieName];
    if (!encryptedToken) {
      return { valid: false, error: "No token found" };
    }

    let token: string;
    try {
      token = decrypt(encryptedToken);
    } catch {
      return { valid: false, error: "Cookie decryption failed" };
    }

    const decoded = verify(token, secret, {
      algorithms: ["HS256"],
    }) as JwtPayload;

    if (!decoded.sessionId) {
      return { valid: false, error: "Malformed session token" };
    }

    await dbConnect();
    const session = await Session.findOne({ sessionId: decoded.sessionId });
    if (!session) {
      return { valid: false, error: "Session revoked or expired" };
    }

    try {
      const { ip } = await getClientIp(req);
      const now = new Date();
      const lastSeen = session.lastSeenAt
        ? new Date(session.lastSeenAt).getTime()
        : 0;
      const ipChanged = Boolean(ip) && session.ip !== ip;

      if (ipChanged) {
        await Session.updateOne(
          { _id: session._id },
          {
            $set: { ip, lastSeenAt: now },
            $push: { ipHistory: { $each: [{ ip, seenAt: now }], $slice: -10 } },
          },
        );
      } else if (now.getTime() - lastSeen > touch_interval_ms) {
        await Session.updateOne(
          { _id: session._id },
          { $set: { lastSeenAt: now } },
        );
      }
    } catch (updateError) {
      console.error("Failed to update session activity:", updateError);
    }

    return { valid: true, decoded };
  } catch (error) {
    console.error(error);
    return { valid: false, error: "Invalid or expired token" };
  }
}

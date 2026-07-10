import dbConnect from "@/config/dbConnect";
import Session from "@/models/session";
import { serialize } from "cookie";
import { sign } from "jsonwebtoken";
import crypto from "crypto";

//Generate a jwt token
export async function CookieGenerator(email: string, ip?: string) {
  try {
    //Only 31 days validity
    const max_age = 60 * 60 * 24 * 31;

    //Token
    const secret = process.env.JWT_SECRET || "";
    const cookieName = process.env.COOKIE_NAME || "";

    if (!secret) {
      throw new Error("JWT_SECRET environment variable is not set.");
    }

    if (!cookieName) {
      throw new Error("COOKIE_NAME environment variable is not set.");
    }

    const sessionId = crypto.randomBytes(32).toString("hex");

    await dbConnect();
    await Session.create({ sessionId, email, ip });

    const token = sign({ sessionId }, secret, { expiresIn: max_age });

    const serialized = serialize(cookieName, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: max_age,
      path: "/",
    });

    return serialized;
  } catch (error: unknown) {
    console.error(
      "Error generating cookie:",
      error instanceof Error ? error.message : error,
    );
    throw new Error("Failed to generate cookie");
  }
}

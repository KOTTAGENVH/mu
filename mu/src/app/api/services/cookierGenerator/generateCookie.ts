import { serialize } from "cookie";
import { sign } from "jsonwebtoken";

//Generate a jwt token
export async function CookieGenerator(genratedToken: string) {
  try {
    //Only 31 days validity
    const MAX_AGE = 60 * 60 * 24 * 31;

    //Token
    const secret = process.env.JWT_SECRET || "";
    const cookieName = process.env.COOKIE_NAME || "";

    if (!secret) {
      throw new Error("JWT_SECRET environment variable is not set.");
    }

    if (!cookieName) {
      throw new Error("COOKIE_NAME environment variable is not set.");
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
    
    return serialized;
  } catch (error: unknown) {
    console.error("Error generating cookie:", error instanceof Error ? error.message : error);
    throw new Error("Failed to generate cookie");
  }
}

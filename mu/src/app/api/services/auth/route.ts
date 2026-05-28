import { customEmail } from "@/config/customEmail";
import { NextResponse } from "next/server";
import { sign } from "jsonwebtoken";
import crypto from "crypto";
import User from "@/models/user";
import { encrypt } from "@/config/encryption";
import { decrypt } from "@/config/decryption";
import dbConnect from "@/config/dbConnect";
import { validateCookie } from "../cookieValidator/validateCookie";
import { isAllowed } from "@/app/helper/origin_helper";
import { checkRateLimit } from "@/app/helper/rateLimiter";
import { getClientIp } from "@/app/helper/ipChecker";

// 14min validity
const max_age = 60 * 14;

//Handle token verification and sending login URL email
export async function POST(req: Request) {
  await dbConnect();
  try {
    if (!isAllowed(req)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { ip } = await getClientIp(req);

    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { message: "Invalid JSON payload" },
        { status: 400 },
      );
    }

    const { token } = body;

    const isSixDigitData = /^\d{6}$/.test(token);

    if (!token || typeof token !== "string" || !isSixDigitData) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid token format. Expected a 6-digit code.",
        },
        { status: 400 },
      );
    }

    const isAllowedToProceed = await checkRateLimit(
      ip,
      "totp-auth",
      5,
      15 * 60 * 1000,
    );

    if (!isAllowedToProceed) {
      return NextResponse.json(
        {
          success: false,
          message: "Too many login attempts. Please try again in 15 minutes.",
        },
        { status: 429 },
      );
    }

    const email = process.env.EMAIL || "";
    if (!email) {
      throw new Error("EMAIL environment variable is not set.");
    }

    const user = await User.findOne({ email });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 },
      );
    }

    const plainSecret = decrypt(user.token);
    const isValid = verifyToken(token, plainSecret);
    if (!isValid) {
      return NextResponse.json(
        { success: false, message: "Invalid Token" },
        { status: 401 },
      );
    }

    if (!user.verified) {
      user.verified = true;
      await user.save();
    }

    await sendLoginUrlEmail(ip);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("error message: ", error.message);
      return NextResponse.json(
        {
          success: false,
          message: "Sorry an error occurred while verifying the token.",
        },
        { status: 500 },
      );
    }
  }
  return NextResponse.json(
    { success: false, message: "An unexpected error occurred" },
    { status: 500 },
  );
}

//Generate secret for 2FA setup
export async function GET(req: Request) {
  await dbConnect();
  try {
    if (!isAllowed(req)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const userCount = await User.countDocuments();
    const userVerified = await User.findOne({ verified: true });
    const validationResult = await validateCookie(req);
    if (validationResult.valid) {
      return NextResponse.json({ success: true, message: "authenticated" });
    } else if (userCount === 0 || !userVerified) {
      const secret = generateSecret();
      const email = process.env.EMAIL || "";
      if (!email) {
        throw new Error("EMAIL environment variable is not set.");
      }
      const issuer = "MUByNowenKottage";
      const label = `${issuer}:${email}`;
      const otpauthUrl = `otpauth://totp/${label}?secret=${secret}&issuer=${issuer}`;
      const encryptedSecret = encrypt(secret);

      await User.deleteMany({});

      await User.create({
        email: email,
        token: encryptedSecret,
        backupCodes: [],
        verified: false,
      });

      return NextResponse.json({ secret, otpauthUrl });
    } else {
      return NextResponse.json({ success: true });
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("error message: ", error.message);
      return NextResponse.json(
        {
          success: false,
          message: "Sorry an error occurred while generating the secret.",
        },
        { status: 500 },
      );
    }
  }
}

//Delete all users
export async function DELETE(req: Request) {
  await dbConnect();
  try {
    if (!isAllowed(req)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    const validationResult = await validateCookie(req);
    if (validationResult.valid) {
      await User.deleteMany({});

      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ success: false, message: "Unauthorized" });
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("error message: ", error.message);
      return NextResponse.json(
        {
          success: false,
          message: "Sorry an error occurred while deleting all users.",
        },
        { status: 500 },
      );
    }
  }
}

function toBase32(buffer: number[] | Uint8Array) {
  // 2^5 = 32
  const base32Chars = process.env.BASE_32 || "";
  let bits = 0;
  let value = 0;
  let output = "";

  if (!base32Chars) {
    throw new Error("BASE_32 environment variable is not set.");
  }

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;
    while (bits >= 5) {
      output += base32Chars[(value >>> (bits - 5)) & 31]; //Extract the top 5 bits and convert to Base32 character
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += base32Chars[(value << (5 - bits)) & 31];
  }
  return output;
}

function fromBase32(base32: string) {
  const base32Chars = process.env.BASE_32 || "";
  let bits = 0;
  let value = 0;
  const buffer = [];
  const cleanInput = base32.toUpperCase().replace(/=+$/, "");

  if (!base32Chars) {
    throw new Error("BASE_32 environment variable is not set.");
  }

  for (let i = 0; i < cleanInput.length; i++) {
    const val = base32Chars.indexOf(cleanInput[i]);
    if (val === -1) throw new Error("Invalid Base32 character");

    value = (value << 5) | val;
    bits += 5;
    while (bits >= 8) {
      buffer.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(buffer);
}

function generateSecret(length = 20) {
  const randomBuffer = crypto.randomBytes(length);
  return toBase32(new Uint8Array(randomBuffer));
}

//  function generateToken(secret: string) {
//   const key = fromBase32(secret);
//   const epoch = Math.floor(Date.now() / 1000.0);
//   const timeStep = 30;
//   const counter = Math.floor(epoch / timeStep);
//   const counterBuffer = Buffer.alloc(8);
//   counterBuffer.writeUInt32BE(counter, 4);

//   const hmac = crypto.createHmac("sha1", key);
//   hmac.update(counterBuffer);
//   const digest = hmac.digest();

//   const offset = digest[digest.length - 1] & 0xf;

//   const binary =
//     ((digest[offset] & 0x7f) << 24) |
//     ((digest[offset + 1] & 0xff) << 16) |
//     ((digest[offset + 2] & 0xff) << 8) |
//     (digest[offset + 3] & 0xff);

//   const otp = binary % 1000000;

//   return otp.toString().padStart(6, "0");
// }

function verifyToken(token: string, secret: string, window = 1) {
  const key = fromBase32(secret);
  const epoch = Math.floor(Date.now() / 1000.0);
  const timeStep = 30;
  const currentCounter = Math.floor(epoch / timeStep);

  //drift window to allow for some time difference between client and server
  for (let i = -window; i <= window; i++) {
    const counter = currentCounter + i;
    const counterBuffer = Buffer.alloc(8);
    counterBuffer.writeUInt32BE(Math.floor(counter / 0x100000000), 0);
    counterBuffer.writeUInt32BE(counter >>> 0, 4);

    const hmac = crypto.createHmac("sha1", key);
    hmac.update(counterBuffer);
    const digest = hmac.digest();

    const offset = digest[digest.length - 1] & 0xf;

    const binary =
      ((digest[offset] & 0x7f) << 24) |
      ((digest[offset + 1] & 0xff) << 16) |
      ((digest[offset + 2] & 0xff) << 8) |
      (digest[offset + 3] & 0xff);

    const otp = binary % 1000000;
    const generatedToken = otp.toString().padStart(6, "0");

    //To prevent timing attack when comparing between digits
    const isValid = crypto.timingSafeEqual(
      Buffer.from(token),
      Buffer.from(generatedToken),
    );

    if (isValid) return true;
  }

  return false;
}

async function sendLoginUrlEmail(ip: string) {
  try {
    const secret = process.env.JWT_SECRET || "";
    const email = process.env.EMAIL || "";
    const email2 = process.env.EMAIL2 || "";
    const brand = process.env.BRAND || "";

    if (!secret) {
      throw new Error("JWT_SECRET environment variable is not set.");
    }
    if (!email) {
      throw new Error("EMAIL environment variable is not set.");
    }
    if (!brand) {
      throw new Error("BRAND environment variable is not set.");
    }

    const token = sign(
      {
        email,
        brand,
      },
      secret,
      { expiresIn: max_age },
    );

    const cookieName = process.env.COOKIE_NAME || "";
    if (!cookieName) {
      throw new Error("COOKIE_NAME environment variable is not set.");
    }

    // Prepare and send email with link for the user to login
    const loginLink = `${process.env.NEXT_PUBLIC_URL}?token=${token}`;

    // Send the token to the user via email
    await customEmail(
      [email, email2],
      "Token for MU",
      `Please click on the link to login: ${loginLink}`,
      ip,
    );
    return;
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(`Failed to send login URL email: ${error.message}`);
    }
  }
}

import crypto from "crypto";

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "";
const IV_LENGTH = 16; //16 bytes

export function encrypt(text: string): string {
  if (!ENCRYPTION_KEY) {
    throw new Error("ENCRYPTION_KEY is missing");
  }

  if (ENCRYPTION_KEY.length !== 64) {
    throw new Error("Invalid ENCRYPTION_KEY length. It must be 32 bytes.");
  }

  const iv = crypto.randomBytes(IV_LENGTH); //Initialization vector(similar to salt)

  const keyBuffer = Buffer.from(ENCRYPTION_KEY, "hex");
  const cipher = crypto.createCipheriv("aes-256-cbc", keyBuffer, iv);

  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);

  return iv.toString("hex") + ":" + encrypted.toString("hex");
}



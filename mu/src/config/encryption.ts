import crypto from "crypto";

const encryprion_key = process.env.ENCRYPTION_KEY || "";
const iv_length = 16; //16 bytes

export function encrypt(text: string): string {
  if (!encryprion_key) {
    throw new Error("ENCRYPTION_KEY is missing");
  }

  if (encryprion_key.length !== 64) {
    throw new Error("Invalid ENCRYPTION_KEY length. It must be 32 bytes.");
  }

  const iv = crypto.randomBytes(iv_length); //Initialization vector(similar to salt)

  const keyBuffer = Buffer.from(encryprion_key, "hex");
  const cipher = crypto.createCipheriv("aes-256-cbc", keyBuffer, iv);

  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);

  return iv.toString("hex") + ":" + encrypted.toString("hex");
}



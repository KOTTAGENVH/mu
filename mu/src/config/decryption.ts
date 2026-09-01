import crypto from "crypto";

const encryprion_key = process.env.ENCRYPTION_KEY || "";

export function decrypt(text: string): string {
  if (!encryprion_key) throw new Error("ENCRYPTION_KEY is missing");

  const textParts = text.split(":");
  const iv = Buffer.from(textParts.shift()!, "hex"); //Initialization vector removed from the encrypted text and converted to a buffer
  const encryptedText = Buffer.from(textParts.join(":"), "hex");
  const keyBuffer = Buffer.from(encryprion_key, "hex");

  const decipher = crypto.createDecipheriv("aes-256-cbc", keyBuffer, iv);

  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted.toString();
}
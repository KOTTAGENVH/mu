import crypto from "crypto";

function getMasterKey(): Buffer {
  const hex = process.env.LIST_MASTER_KEY || "";
  if (!/^[0-9a-fA-F]{64}$/.test(hex)) {
    throw new Error("LIST_MASTER_KEY must be 64 hex characters (32 bytes).");
  }
  return Buffer.from(hex, "hex");
}

const keyCache = new Map<string, Buffer>();

export function subKey(purpose: string): Buffer {
  const cached = keyCache.get(purpose);
  if (cached) return cached;
  const key = Buffer.from(
    crypto.hkdfSync("sha256", getMasterKey(), Buffer.alloc(0), purpose, 32),
  );
  keyCache.set(purpose, key);
  return key;
}

export function normalizeName(name: string): string {
  return name.trim().normalize("NFC");
}

export function nameIndex(name: string): string {
  return crypto
    .createHmac("sha256", subKey("list-name-index"))
    .update(normalizeName(name).toLowerCase())
    .digest("hex");
}

function chacha20(nonce: Buffer, data: Buffer): Buffer {
  const iv = Buffer.concat([Buffer.from([1, 0, 0, 0]), nonce]);
  const cipher = crypto.createCipheriv("chacha20", subKey("list-name-enc"), iv);
  return Buffer.concat([cipher.update(data), cipher.final()]);
}

function macOf(listId: string, nonce: Buffer, ct: Buffer): Buffer {
  const id = Buffer.from(listId, "utf8");
  const len = Buffer.alloc(4);
  len.writeUInt32BE(id.length);
  return crypto
    .createHmac("sha256", subKey("list-name-mac"))
    .update(len)
    .update(id)
    .update(nonce)
    .update(ct)
    .digest();
}

export function encryptName(name: string, listId: string): string {
  const nonce = crypto.randomBytes(12);
  const ct = chacha20(nonce, Buffer.from(normalizeName(name), "utf8"));
  const tag = macOf(listId, nonce, ct);
  return [
    "v2",
    nonce.toString("base64"),
    ct.toString("base64"),
    tag.toString("base64"),
  ].join(":");
}

export function decryptName(payload: string, listId: string): string {
  const [version, nonceB64, ctB64, tagB64] = payload.split(":");
  if (version !== "v2" || !nonceB64 || ctB64 === undefined || !tagB64) {
    throw new Error("Unsupported ciphertext format");
  }
  const nonce = Buffer.from(nonceB64, "base64");
  const ct = Buffer.from(ctB64, "base64");
  const tag = Buffer.from(tagB64, "base64");

  const expected = macOf(listId, nonce, ct);
  if (
    tag.length !== expected.length ||
    !crypto.timingSafeEqual(tag, expected)
  ) {
    throw new Error("List name failed integrity check");
  }
  return chacha20(nonce, ct).toString("utf8");
}

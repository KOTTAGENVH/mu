import crypto from "crypto";

export const generateId = (length: number) => {
      return crypto
        .randomBytes(length)
        .toString("base64url") 
        .replace(/[^a-zA-Z0-9]/g, "") 
        .slice(0, length);
    };
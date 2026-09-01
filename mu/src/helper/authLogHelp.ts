import AuthLog, { AuthEvent } from "@/models/authLog";
import dbConnect from "@/config/dbConnect";

export async function logAuthEvent(event: AuthEvent, ip?: string) {
  try {
    await dbConnect();
    await AuthLog.create({ event, ip });
  } catch (err) {
    console.error("Auth log failed:", err);
  }
}

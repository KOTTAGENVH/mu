import { isAllowed } from "@/app/helper/origin_helper";
import { NextRequest, NextResponse } from "next/server";

// Helper: normalize and detect IP type
function parseIp(ip: string | null) {
  if (!ip) return { ip: "unknown", type: "unknown" };

  // Handle IPv6 loopback
  if (ip === "::1") return { ip: "127.0.0.1", type: "IPv4 (mapped from ::1)" };

  // Handle IPv4-mapped IPv6 (::ffff:192.168.0.1)
  if (ip.startsWith("::ffff:")) {
    return { ip: ip.substring(7), type: "IPv4 (mapped IPv6)" };
  }

  // IPv4 check
  const ipv4Pattern =
    /^(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)$/;
  if (ipv4Pattern.test(ip)) return { ip, type: "IPv4" };

  // If not IPv4 then assume IPv6
  return { ip, type: "IPv6" };
}

//Get the IP address of the client by takung into account possible proxies
export async function getClientIp(req: Request) {
  const xff = req.headers.get("x-forwarded-for"); // Check for X-Forwarded-For header
  const rawIp =
    (xff && xff.split(",")[0].trim()) || // Get the first IP in the list
    req.headers.get("x-real-ip") || // Check for X-Real-IP header
    "unknown"; // Fallback if no IP found

  return parseIp(rawIp);
}

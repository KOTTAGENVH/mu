import { NextResponse } from "next/server";
import { validateCookie } from "../cookieValidator/validateCookie";
import { isAllowed } from "@/app/helper/origin_helper";
import dbConnect from "@/config/dbConnect";
import Session from "@/models/session";
import AuthLog, { AuthEvent } from "@/models/authLog";


function assessIntrusion(
  logs: { event: string; ip?: string; createdAt: Date }[],
) {
  const now = Date.now();
  const window = 15 * 60 * 1000; // 15 min

  const recentFailures = logs.filter(
    (l) =>
      l.event === AuthEvent.FAILED_LOGIN &&
      now - new Date(l.createdAt).getTime() < window,
  ).length;

 
  const knownIps = new Set(
    logs.filter((l) => l.event === AuthEvent.LOGIN && l.ip).map((l) => l.ip),
  );


  const lastSuccess = logs.find((l) => l.event === AuthEvent.LOGIN);


const failuresBeforeLastSuccess = lastSuccess
    ? logs.filter(
        (l) =>
          l.event === AuthEvent.FAILED_LOGIN &&
          new Date(l.createdAt).getTime() < new Date(lastSuccess.createdAt).getTime() &&
          new Date(lastSuccess.createdAt).getTime() - new Date(l.createdAt).getTime() <= window
      ).length
    : 0;

  const suspicious =
    recentFailures >= 3 || failuresBeforeLastSuccess >= 2;

  return {
    suspicious,
    recentFailures,
    failuresBeforeLastSuccess,
    knownIpCount: knownIps.size,
  };
}

export async function GET(req: Request) {
  try {
    if (!isAllowed(req)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const validationResult = await validateCookie(req);
    if (!validationResult.valid) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    await dbConnect();

    const email = process.env.EMAIL || "";

    // last 30 days of auth events, newest first
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const logs = await AuthLog.find({ createdAt: { $gte: since } })
      .sort({ createdAt: -1 })
      .lean();

    // active sessions
    const sessions = await Session.find({ email })
      .sort({ createdAt: -1 })
      .lean();

    // daily counts of login vs failed_login
    const dailyMap: Record<string, { logins: number; failures: number }> = {};
    for (const l of logs) {
      const day = new Date(l.createdAt).toISOString().slice(0, 10);
      if (!dailyMap[day]) dailyMap[day] = { logins: 0, failures: 0 };
      if (l.event === AuthEvent.LOGIN) dailyMap[day].logins++;
      if (l.event === AuthEvent.FAILED_LOGIN) dailyMap[day].failures++;
    }
    const graph = Object.entries(dailyMap)
      .map(([day, v]) => ({ day, ...v }))
      .sort((a, b) => a.day.localeCompare(b.day));

    const assessment = assessIntrusion(
      logs.map((l) => ({
        event: l.event,
        ip: l.ip,
        createdAt: l.createdAt,
      })),
    );

    return NextResponse.json({
      success: true,
      graph,
      sessions: sessions.map((s) => ({
        sessionId: s.sessionId,
        ip: s.ip || "unknown",
        createdAt: s.createdAt,
      })),
      assessment,
    });
  } catch (error) {
    console.error("authInsights GET error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load auth insights" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: Request) {
  try {
    if (!isAllowed(req)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const validationResult = await validateCookie(req);
    if (!validationResult.valid) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid JSON" },
        { status: 400 },
      );
    }

    const { sessionId } = body;
    if (!sessionId || typeof sessionId !== "string") {
      return NextResponse.json(
        { success: false, message: "sessionId required" },
        { status: 400 },
      );
    }

    await dbConnect();
    await Session.deleteOne({ sessionId });

    return NextResponse.json({ success: true, message: "Session revoked" });
  } catch (error) {
    console.error("authInsights DELETE error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to revoke session" },
      { status: 500 },
    );
  }
}
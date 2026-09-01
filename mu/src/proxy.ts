import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(req: NextRequest) {
  const auth_cookie = process.env.COOKIE_NAME;
  if (!auth_cookie) throw new Error("COOKIE_NAME env var is not set");

  const token = req.cookies.get(auth_cookie)?.value;

  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!login|api|_next/static|_next/image|favicon.ico|manifest.webmanifest|robots.txt|mu.png|mu.jpg|$).*)",
  ],
};

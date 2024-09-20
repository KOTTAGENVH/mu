import { NextResponse } from 'next/server';
import { serialize } from 'cookie';

export async function GET() {
  const cookieName = process.env.NEXT_PUBLIC_COOKIE_NAME || 'Mu-Auth';

  // Set the cookie with an expired date to remove it
  const expiredCookie = serialize(cookieName, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    expires: new Date(0), 
    path: '/', 
  });

  return NextResponse.json(
    { success: true, message: 'Logged out successfully' },
    {
      headers: { 'Set-Cookie': expiredCookie },
    }
  );
}

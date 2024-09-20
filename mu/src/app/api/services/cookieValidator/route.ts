import { verify, JwtPayload } from 'jsonwebtoken';
import { parse } from 'cookie';
import { NextResponse } from 'next/server';

interface CookieValidationResult {
  valid: boolean;
  error?: string;
  decoded?: string | JwtPayload;
}

async function validateCookie(req: Request): Promise<CookieValidationResult> {
  try {
    const cookieName = process.env.NEXT_PUBLIC_COOKIE_NAME || 'Mu-Auth';
    const secret = process.env.NEXT_PUBLIC_JWT_SECRET;

    if (!secret) {
      return { valid: false, error: 'JWT SECRET is not set in environment variables' };
    }

    const cookieHeader = req.headers.get('cookie');
    if (!cookieHeader) {
      return { valid: false, error: 'No cookies present' };
    }

    const cookies = parse(cookieHeader);
    const token = cookies[cookieName];
    if (!token) {
      return { valid: false, error: 'No token found' };
    }

    const decoded = verify(token, secret) as JwtPayload;
    return { valid: true, decoded };
  } catch (error) {
    console.error(error);
    return { valid: false, error: 'Invalid or expired token' };
  }
}

// Define the API handler (in this case, it will respond to POST requests)
export async function POST(req: Request) {
  const validationResult = await validateCookie(req);

  if (!validationResult.valid) {
    return NextResponse.json(
      { success: false, error: validationResult.error },
      { status: 401 }  // Unauthorized
    );
  }

  return NextResponse.json(
    { success: true, decoded: validationResult.decoded }
  );
}

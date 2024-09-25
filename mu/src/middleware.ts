import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

export async function middleware(request: NextRequest) {
  console.log('Middleware is running');

  const cookieName = process.env.NEXT_PUBLIC_COOKIE_NAME || 'Mu-Auth';
  const cookie = request.cookies.get(cookieName);

  const email = process.env.NEXT_PUBLIC_EMAIL || '';
  const subject = process.env.NEXT_PUBLIC_SUBJECT || '';

  // Check if email and subject are set
  if (!email) {
    console.error('EMAIL environment variable is not set.');
    return NextResponse.redirect(new URL('/', request.url));
  }
  if (!subject) {
    console.error('SUBJECT environment variable is not set.');
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Check if the cookie is available
  if (!cookie || !cookie.value) {
    console.log('Cookie not found, redirecting...');
    return NextResponse.redirect(new URL('/', request.url));
  }

  const secret = new TextEncoder().encode(process.env.NEXT_PUBLIC_JWT_SECRET); // Encode secret for jose

  // Verify the token
  try {
  //decode the token
    const { payload } = await jwtVerify(cookie.value, secret, {
      algorithms: ['HS256'],
    });

    // Check if the token is expired
    const currentTime = Math.floor(Date.now() / 1000); 
    if (payload.exp && currentTime >= payload.exp) {
      console.log('Token expired, deleting cookies and redirecting...');

      const response = NextResponse.redirect(new URL('/', request.url));

      response.cookies.delete(cookieName);
      response.cookies.delete('tokenExpiration');

      response.headers.set('Location', `/?tokenExpired=true`);

      return response;
    }

    console.log('Token is valid, proceeding...');
    return NextResponse.next();
  } catch (error) {
    console.error('Token verification failed:', error);
    return NextResponse.redirect(new URL('/', request.url));
  }
}

export const config = {
  matcher: ['/home', '/upload'],
};

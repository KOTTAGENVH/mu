import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  console.log('Middleware is running');

  const cookieName = process.env.NEXT_PUBLIC_COOKIE_NAME || 'Mu-Auth';
  const cookieValue = request.cookies.get(cookieName);

  // Check if the cookie is available; if not, redirect to root `/`
  if (!cookieValue) {
    console.log('Cookie not found, redirecting...');
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Check if the token is expired
  const tokenExpiration = request.cookies.get('tokenExpiration'); 
  const currentTime = new Date().getTime();

  if (tokenExpiration && Number(tokenExpiration) < currentTime) {
    console.log('Token expired, deleting cookies and redirecting...');

    // Create a response to delete the cookies
    const response = NextResponse.redirect(new URL('/', request.url));

    // Delete the authentication cookie
    response.cookies.delete(cookieName);

    // Delete the tokenExpiration cookie
    response.cookies.delete('tokenExpiration');

    // Optionally, pass a query parameter to the root to inform the client that the token expired
    response.headers.set('Location', `/?tokenExpired=true`);

    return response;
  }

  console.log('Token is valid, proceeding...');
  return NextResponse.next();
}

// Only check the cookie for `/home` and `/upload`
export const config = {
  matcher: ['/home', '/upload'],
};

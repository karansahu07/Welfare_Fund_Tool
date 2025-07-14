import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET!;
const PUBLIC_PATHS = ['/api/auth/login', '/api/auth/logout'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (PUBLIC_PATHS.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  const token = request.cookies.get('token')?.value;

  if (!token) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized access' },
      { status: 401 }
    );
  }

  try {
    // Verify JWT using jose
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(JWT_SECRET)
    );

    // Optional: Log decoded token
    // console.log("Decoded JWT", payload);

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', String(payload.user_id));
    requestHeaders.set('x-user-email', String(payload.email));
    requestHeaders.set('x-user-role', String(payload.role));

    return NextResponse.next({
      request: {
        headers: requestHeaders,
        // auth : payload
      },
    });
  } catch (error) {
    console.error("JWT verification failed:", error);
    return NextResponse.json(
      { success: false, message: 'Unauthorized: Invalid token' },
      { status: 401 }
    );
  }
}

export const config = {
  matcher: ['/api/:path*'],
};

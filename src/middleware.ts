// src/middleware.ts
import { auth0 } from './lib/auth0';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  // Check if the requested path is a protected route
  const isProtectedRoute = isProtectedPath(request.nextUrl.pathname);

  if (isProtectedRoute) {
    try {
      // Get the session to check if user is authenticated
      const session = await auth0.getSession(request);

      // If no session exists, redirect to home page (which has login button)
      if (!session) {
        const homeUrl = new URL('/', request.url);
        return NextResponse.redirect(homeUrl);
      }
    } catch (error) {
      // If there's an error getting session, redirect to home page
      const homeUrl = new URL('/', request.url);
      return NextResponse.redirect(homeUrl);
    }
  }

  // For non-protected routes or authenticated users, continue normally
  return await auth0.middleware(request);
}

// Function to determine if a path should be protected
function isProtectedPath(pathname: string): boolean {
  // List of protected routes - all routes except public ones
  const protectedRoutes = [
    '/dashboard',
    '/conversations',
    '/tickets',
    '/bookings',
    '/customers',
    '/campaigns',
    '/analytics',
    '/playground',
    '/support-agent',
    '/settings',
    // Add any other protected routes here
  ];

  // Check if the current path starts with any protected route
  return protectedRoutes.some(route => pathname.startsWith(route));
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images (public images)
     * - audio (public audio)
     */
    '/((?!_next/static|_next/image|favicon.ico|images|audio).*)',
  ],
};
// src/middleware.ts
import { withAuth } from 'next-auth/middleware';

// Export the middleware with NextAuth protection
export default withAuth({
  pages: {
    signIn: '/auth/login',
  },
});

// Configure which routes the middleware should run for
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images (public images)
     * - audio (public audio)
     * - auth pages (login, register, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|images|audio|auth|api/auth).*)',
  ],
};
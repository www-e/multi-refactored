import { withAuth } from 'next-auth/middleware';

export default withAuth({
  pages: {
    signIn: '/auth/login',
  },
});

export const config = {
  // ✅ ADDED 'voice' to the exclusion list below
  // This tells middleware: "Do NOT protect paths starting with /voice"
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|images|audio|auth|api/auth|voice).*)',
  ],
};
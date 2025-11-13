// src/middleware.ts
import { auth0 } from './lib/auth0';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  return await auth0.middleware(request);
}

export const config = {
  matcher: [
    '/((?!api/auth|_next/static|_next/image|favicon.ico|images|audio).*)',
  ],
};
// src/lib/auth0.ts
import { Auth0Client } from '@auth0/nextjs-auth0/server';

// Create a new Auth0Client instance for v4 API
export const auth0 = new Auth0Client({
  secret: process.env.AUTH0_SECRET,
  domain: process.env.AUTH0_ISSUER_BASE_URL,
  clientId: process.env.AUTH0_CLIENT_ID,
  clientSecret: process.env.AUTH0_CLIENT_SECRET,
  appBaseUrl: process.env.AUTH0_BASE_URL,
  authorizationParameters: {
    audience: process.env.AUTH0_AUDIENCE,
    scope: 'openid profile email'
  },
  routes: {
    callback: '/auth/callback',
    login: '/auth/login',
    logout: '/auth/logout'
  },
  session: {
    rolling: true,
    absoluteDuration: 60 * 60 * 24 * 7 // 1 week
  }
});
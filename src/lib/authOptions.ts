import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

// The entire authOptions object is now in its own file.
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const backendUrl = process.env.BACKEND_URL;
        if (!backendUrl) {
          console.error("CRITICAL: BACKEND_URL is not set in NextAuth configuration.");
          return null;
        }

        try {
          // CRITICAL FIX: The backend's /auth/token endpoint expects a JSON body, not form data.
          const response = await fetch(`${backendUrl}/auth/token`, {
            method: "POST",
            headers: {
              // Set the correct Content-Type for a JSON payload.
              "Content-Type": "application/json",
            },
            // The body is now correctly formatted as a JSON string.
            // The keys 'email' and 'password' match the backend's TokenRequest Pydantic model.
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          if (!response.ok) {
            const errorBody = await response.json().catch(() => ({}));
            console.error(`Backend authentication via /auth/token failed: ${response.status}`, errorBody);
            return null; // This triggers the NextAuth login error flow.
          }

          const tokenData = await response.json();

          const userResponse = await fetch(`${backendUrl}/auth/me`, {
            headers: {
              'Authorization': `Bearer ${tokenData.access_token}`,
            },
          });

          if (userResponse.ok) {
            const user = await userResponse.json();
            return {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
              accessToken: tokenData.access_token,
              refreshToken: tokenData.refresh_token
            };
          }
        } catch (error) {
            console.error("Error in authorize function:", error);
            return null;
        }

        return null;
      }
    })
  ],
  pages: {
    signIn: '/auth/login',
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
        token.accessTokenExpires = Date.now() + 14.5 * 60 * 1000; // 14.5 minutes in ms (to refresh before expiry)
      }

      // If token is expired, try to refresh it
      if (Date.now() >= (token.accessTokenExpires as number)) {
        return await refreshAccessToken(token);
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.accessToken = token.accessToken as string;
      }
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
};

// Function to refresh access token
async function refreshAccessToken(token: any) {
  try {
    const backendUrl = process.env.BACKEND_URL;
    if (!backendUrl) {
      console.error("CRITICAL: BACKEND_URL is not set for token refresh.");
      return token;
    }

    const response = await fetch(`${backendUrl}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refresh_token: token.refreshToken
      }),
    });

    if (!response.ok) {
      console.error("Token refresh failed:", response.status);
      // If refresh fails, return the token as is to trigger a new login
      return {
        ...token,
        error: 'RefreshAccessTokenError'
      };
    }

    const refreshedTokens = await response.json();

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      refreshToken: refreshedTokens.refresh_token,
      accessTokenExpires: Date.now() + 14.5 * 60 * 1000, // 14.5 minutes in ms
    };
  } catch (error) {
    console.error("Error during token refresh:", error);
    return {
      ...token,
      error: 'RefreshAccessTokenError'
    };
  }
}
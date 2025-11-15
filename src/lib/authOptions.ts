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
          const response = await fetch(`${backendUrl}/auth/token`, {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
              username: credentials.email,
              password: credentials.password,
            }),
          });

          if (!response.ok) {
            console.error("Backend authentication via /auth/token failed:", response.status);
            return null;
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
              accessToken: tokenData.access_token
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
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.accessToken = user.accessToken;
      }
      return token;
    },
    async session({ session, token }) {
      // This check ensures session.user is defined before we try to modify it.
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
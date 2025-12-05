import { DefaultSession, DefaultUser } from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user?: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string;
      tenant_id?: string;  // Add tenant_id to session user
    } & DefaultSession["user"];
    accessToken?: string;
  }

  interface User extends DefaultUser {
    id: string;
    role?: string;
    tenant_id?: string;  // Add tenant_id to user
    accessToken?: string;
    refreshToken?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
    tenant_id?: string;  // Add tenant_id to JWT
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpires?: number;
  }
}
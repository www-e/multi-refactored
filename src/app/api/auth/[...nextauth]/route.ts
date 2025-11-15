import NextAuth from "next-auth";
import { authOptions } from "@/lib/authOptions"; // Import from the new location

// This file is now extremely simple. It just imports the configuration
// and initializes NextAuth.
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
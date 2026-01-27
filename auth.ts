import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/auth/db";
import { verifyPassword } from "@/lib/auth/password";
import { authConfig } from "./auth.config";
import type { UserRole } from "@/types/auth";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        try {
          if (!credentials?.email || !credentials?.password) {
            console.log("[Auth] Missing credentials");
            return null;
          }

          const email = credentials.email as string;
          const password = credentials.password as string;

          console.log("[Auth] Looking up user:", email);

          const user = await prisma.user.findUnique({
            where: { email },
          });

          if (!user) {
            console.log("[Auth] User not found");
            return null;
          }

          if (!user.isActive) {
            console.log("[Auth] User not active");
            return null;
          }

          console.log("[Auth] Verifying password...");
          const isValid = await verifyPassword(password, user.password);

          if (!isValid) {
            console.log("[Auth] Invalid password");
            return null;
          }

          console.log("[Auth] Password valid, updating last login");

          // Update last login time
          await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
          });

          console.log("[Auth] Login successful for:", email);

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role as UserRole,
          };
        } catch (error) {
          console.error("[Auth] Error during authorization:", error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
});

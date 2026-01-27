import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { UserRole } from "@/types/auth";

// Import types to augment NextAuth types
import "@/types/auth";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async () => {
        // This will be overridden in auth.ts
        return null;
      },
    }),
  ],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isAdmin = (auth?.user as { role?: string } | undefined)?.role === "admin";
      const { pathname } = nextUrl;

      // /settings → connexion requise
      if (pathname.startsWith("/settings")) {
        return isLoggedIn;
      }

      // /admin → rôle admin requis
      if (pathname.startsWith("/admin")) {
        if (!isLoggedIn) return false;
        if (!isAdmin) return Response.redirect(new URL("/", nextUrl));
        return true;
      }

      // /login → rediriger si déjà connecté
      if (pathname === "/login" && isLoggedIn) {
        return Response.redirect(new URL("/", nextUrl));
      }

      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: UserRole }).role;
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as UserRole;
        session.user.id = token.id as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;

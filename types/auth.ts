import type { DefaultSession } from "next-auth";

export type UserRole = "admin" | "user";

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  isActive: boolean;
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
    } & DefaultSession["user"];
  }

  interface User {
    role: UserRole;
  }
}

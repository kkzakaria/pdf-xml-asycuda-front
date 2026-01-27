"use client";

import { signOut, useSession } from "next-auth/react";
import Link from "next/link";

export function UserNav() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="h-10 w-24 bg-gray-200 animate-pulse rounded-lg"></div>
    );
  }

  if (!session?.user) {
    return (
      <Link
        href="/login"
        className="text-sm font-medium text-gray-700 hover:text-blue-600 transition"
      >
        Se connecter
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <div className="text-sm text-gray-600">
        <span className="font-medium">{session.user.name || session.user.email}</span>
        {session.user.role === "admin" && (
          <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
            Admin
          </span>
        )}
      </div>

      {session.user.role === "admin" && (
        <Link
          href="/admin"
          className="text-sm font-medium text-gray-700 hover:text-blue-600 transition"
        >
          Administration
        </Link>
      )}

      <button
        onClick={() => signOut({ callbackUrl: "/" })}
        className="text-sm font-medium text-gray-700 hover:text-red-600 transition"
      >
        Déconnexion
      </button>
    </div>
  );
}

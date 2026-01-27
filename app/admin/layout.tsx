import Link from "next/link";
import { UserNav } from "@/components/auth/UserNav";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-8">
              <Link href="/" className="text-xl font-bold text-gray-900">
                PDF to XML
              </Link>
              <nav className="flex items-center gap-4">
                <Link
                  href="/admin"
                  className="text-sm font-medium text-gray-700 hover:text-blue-600 transition"
                >
                  Dashboard
                </Link>
                <Link
                  href="/admin/users"
                  className="text-sm font-medium text-gray-700 hover:text-blue-600 transition"
                >
                  Utilisateurs
                </Link>
                <Link
                  href="/settings"
                  className="text-sm font-medium text-gray-700 hover:text-blue-600 transition"
                >
                  Parametres
                </Link>
              </nav>
            </div>
            <UserNav />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}

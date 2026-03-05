import Link from "next/link";
import { prisma } from "@/lib/auth/db";
import { ExchangeRateManager } from "@/components/admin/ExchangeRateManager";

export default async function AdminDashboard() {
  const [totalUsers, activeUsers, adminUsers, recentUsers] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isActive: true } }),
    prisma.user.count({ where: { role: "admin" } }),
    prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">
        Tableau de bord
      </h1>

      <div className="mb-8">
        <ExchangeRateManager />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <div className="text-sm font-medium text-gray-500">
            Total utilisateurs
          </div>
          <div className="text-3xl font-bold text-gray-900 mt-2">
            {totalUsers}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <div className="text-sm font-medium text-gray-500">
            Utilisateurs actifs
          </div>
          <div className="text-3xl font-bold text-green-600 mt-2">
            {activeUsers}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <div className="text-sm font-medium text-gray-500">
            Administrateurs
          </div>
          <div className="text-3xl font-bold text-blue-600 mt-2">
            {adminUsers}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">
            Derniers utilisateurs
          </h2>
          <Link
            href="/admin/users"
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            Voir tout
          </Link>
        </div>
        <div className="divide-y">
          {recentUsers.map((user) => (
            <div
              key={user.id}
              className="px-6 py-4 flex justify-between items-center"
            >
              <div>
                <div className="font-medium text-gray-900">
                  {user.name || user.email}
                </div>
                <div className="text-sm text-gray-500">{user.email}</div>
              </div>
              <div className="flex items-center gap-4">
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    user.role === "admin"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {user.role === "admin" ? "Admin" : "Utilisateur"}
                </span>
                <span className="text-sm text-gray-500">
                  {new Date(user.createdAt).toLocaleDateString("fr-FR")}
                </span>
              </div>
            </div>
          ))}

          {recentUsers.length === 0 && (
            <div className="px-6 py-8 text-center text-gray-500">
              Aucun utilisateur
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

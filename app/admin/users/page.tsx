import Link from "next/link";
import { getUsers } from "@/lib/auth/actions";
import { UserTable } from "@/components/admin/UserTable";
import { auth } from "@/auth";

export default async function UsersPage() {
  const [users, session] = await Promise.all([getUsers(), auth()]);

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Utilisateurs</h1>
        <Link
          href="/admin/users/new"
          className="bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition"
        >
          Nouvel utilisateur
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <UserTable users={users} currentUserId={session?.user?.id || ""} />
      </div>
    </div>
  );
}

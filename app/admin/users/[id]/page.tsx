import { notFound } from "next/navigation";
import { getUser } from "@/lib/auth/actions";
import { UserForm } from "@/components/admin/UserForm";
import { auth } from "@/auth";

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [user, session] = await Promise.all([getUser(id), auth()]);

  if (!user) {
    notFound();
  }

  const isCurrentUser = session?.user?.id === user.id;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">
        Modifier l&apos;utilisateur
      </h1>

      <div className="bg-white rounded-xl shadow-sm border p-6">
        <UserForm user={user} isCurrentUser={isCurrentUser} />
      </div>
    </div>
  );
}

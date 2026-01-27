import { UserForm } from "@/components/admin/UserForm";

export default function NewUserPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">
        Nouvel utilisateur
      </h1>

      <div className="bg-white rounded-xl shadow-sm border p-6">
        <UserForm />
      </div>
    </div>
  );
}

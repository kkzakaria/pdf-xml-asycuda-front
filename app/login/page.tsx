import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Connexion</h1>
            <p className="text-gray-600 mt-2">
              Convertisseur PDF vers XML ASYCUDA
            </p>
          </div>

          <Suspense fallback={<div className="animate-pulse h-64 bg-gray-100 rounded-lg"></div>}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

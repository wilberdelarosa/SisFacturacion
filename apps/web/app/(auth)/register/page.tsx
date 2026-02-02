"use client";

import { Suspense, useState } from "react";
import { useRouter } from "next/navigation";

async function registerUser(email: string, password: string, name: string) {
  const res = await fetch("/api/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, name }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || "No se pudo registrar");
  }
  return res.json();
}

function RegisterForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!email || !password || !name) {
      setError("Completa nombre, correo y contraseña");
      return;
    }
    setLoading(true);
    try {
      await registerUser(email.trim(), password, name.trim());
      setSuccess("Usuario creado. Ahora puedes iniciar sesión.");
      setTimeout(() => router.replace("/login"), 1200);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-white">ALITO EIRL</h1>
          <p className="mt-2 text-slate-400">Registro de administrador</p>
        </div>

        <div className="rounded-lg border border-slate-700 bg-slate-800 p-8 shadow-xl">
          <h2 className="mb-2 text-2xl font-semibold text-white">Crear cuenta admin</h2>
          <p className="mb-6 text-sm text-slate-400">Se creará empresa, sucursal y usuario vinculados.</p>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Nombre</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Nombre completo"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Correo</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="admin@ejemplo.com"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Contraseña</label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                autoComplete="new-password"
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="!Admin"
              />
            </div>
            {error && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-lg border border-green-500/20 bg-green-500/10 p-3 text-sm text-green-400">
                {success}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-500"
            >
              {loading ? "Creando..." : "Registrarme"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-slate-500">Cargando registro...</div>}>
      <RegisterForm />
    </Suspense>
  );
}

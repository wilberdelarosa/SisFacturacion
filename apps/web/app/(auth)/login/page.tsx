"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { isLocked, login } from "../../../lib/auth";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    setLocked(isLocked());
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (locked) return;
    setLoading(true);
    const result = await login(username.trim(), password);
    setLoading(false);

    if (!result.ok) {
      if (result.reason === "locked") {
        setError("Cuenta bloqueada por intentos fallidos. Intenta más tarde.");
        setLocked(true);
      } else if (result.reason === "invalid-credentials") {
        const remaining = result.remaining ?? 0;
        const detail = (result as { message?: string }).message;
        setError(`Credenciales inválidas. Intentos restantes: ${remaining}. ${detail ?? ""}`.trim());
      } else {
        setError("No se pudo iniciar sesión. Intenta de nuevo.");
      }
      return;
    }

    const target = redirect && redirect.startsWith("/") ? redirect : "/dashboard";
    router.replace(target);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-white">ALITO EIRL</h1>
          <p className="mt-2 text-slate-400">Sistema de Facturación</p>
        </div>

        <div className="rounded-lg border border-slate-700 bg-slate-800 p-8 shadow-xl">
          <h2 className="mb-2 text-2xl font-semibold text-white">Ingresar al sistema</h2>
          <p className="mb-6 text-sm text-slate-400">Ingresa con tu usuario de Supabase Auth.</p>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Usuario</label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="tu-correo@empresa.com"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Contraseña</label>
              <div className="flex items-center gap-2">
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-400 hover:bg-slate-800 hover:text-white"
                >
                  {showPassword ? "Ocultar" : "Ver"}
                </button>
              </div>
            </div>
            {error && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={locked || loading}
              className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-500"
            >
              {locked ? "Bloqueado" : loading ? "Validando..." : "Ingresar"}
            </button>
            <div className="text-center text-xs text-slate-500">
              ¿No tienes cuenta? <Link href="/register" className="text-blue-400 hover:text-blue-300">Regístrate</Link>
            </div>
          </form>
        </div>

        <div className="mt-6 text-center text-xs text-slate-500">
          © 2026 ALITO EIRL. Sistema de Facturación v1.0
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-slate-500">Cargando login...</div>}>
      <LoginForm />
    </Suspense>
  );
}

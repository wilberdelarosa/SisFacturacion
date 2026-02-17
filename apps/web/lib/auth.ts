"use client";

import { supabase } from "./supabaseClient";

const ATTEMPTS_KEY = "sisfact-session-attempts";
const MAX_ATTEMPTS = 5;

export type Session = {
  user: string;
  role: string;
  email?: string;
  supabaseUserId?: string;
  empresaId?: string;
  sucursalId?: string;
  issuedAt: number;
};

const isBrowser = () => typeof window !== "undefined";

async function fetchProfile(userId: string, email?: string | null) {
  if (!supabase) return null;
  const matchByAuth = await supabase
    .from("usuarios")
    .select("empresa_id,sucursal_id,rol")
    .eq("auth_user_id", userId)
    .maybeSingle();

  if (matchByAuth.data) return matchByAuth.data;

  if (email) {
    const matchByEmail = await supabase
      .from("usuarios")
      .select("empresa_id,sucursal_id,rol")
      .eq("correo", email)
      .maybeSingle();
    if (matchByEmail.data) return matchByEmail.data;
  }

  return null;
}

export async function currentSession(): Promise<Session | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  const supaSession = data.session;
  if (!supaSession?.user) return null;

  const profile = await fetchProfile(supaSession.user.id, supaSession.user.email);

  return {
    user: supaSession.user.email || "Usuario",
    email: supaSession.user.email || undefined,
    supabaseUserId: supaSession.user.id,
    role: profile?.rol || "operador",
    empresaId: profile?.empresa_id || undefined,
    sucursalId: profile?.sucursal_id || undefined,
    issuedAt: Date.now(),
  };
}

export async function login(username: string, password: string) {
  if (!isBrowser()) return { ok: false as const, reason: "no-browser" as const };

  const attempts = Number(window.localStorage.getItem(ATTEMPTS_KEY) || 0);
  if (attempts >= MAX_ATTEMPTS) {
    return { ok: false as const, reason: "locked" as const };
  }

  if (!supabase) {
    return { ok: false as const, reason: "config" as const, message: "Supabase no está configurado. Añade apps/web/.env.local con NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY." };
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email: username, password });
  if (error) {
    window.localStorage.setItem(ATTEMPTS_KEY, String(attempts + 1));
    return {
      ok: false as const,
      reason: "invalid-credentials" as const,
      message: error.message,
      remaining: Math.max(0, MAX_ATTEMPTS - attempts - 1),
    };
  }

  window.localStorage.removeItem(ATTEMPTS_KEY);

  const user = data.user;
  const profile = await fetchProfile(user?.id || "", user?.email || null);

  const session: Session = {
    user: user?.email || username,
    email: user?.email || undefined,
    supabaseUserId: user?.id,
    role: profile?.rol || "operador",
    empresaId: profile?.empresa_id || undefined,
    sucursalId: profile?.sucursal_id || undefined,
    issuedAt: Date.now(),
  };

  return { ok: true as const, session };
}

export async function logout() {
  if (!supabase) return;
  await supabase.auth.signOut();
  if (isBrowser()) {
    window.localStorage.removeItem(ATTEMPTS_KEY);
  }
}

export function isLocked() {
  if (!isBrowser()) return false;
  const attempts = Number(window.localStorage.getItem(ATTEMPTS_KEY) || 0);
  return attempts >= MAX_ATTEMPTS;
}

/** Roles que pueden acceder a funciones de administración (coinciden con enum RolUsuario en BD) */
export const ADMIN_ROLES = ["admin", "super_admin"] as const;

export function isAdminRole(role: string): boolean {
  return ADMIN_ROLES.includes(role as (typeof ADMIN_ROLES)[number]);
}

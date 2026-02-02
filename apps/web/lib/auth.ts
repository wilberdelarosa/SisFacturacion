"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SESSION_KEY = "sisfact-session";
const MAX_ATTEMPTS = 5;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase: SupabaseClient | null = SUPABASE_URL && SUPABASE_ANON ? createClient(SUPABASE_URL, SUPABASE_ANON) : null;

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
const hasSupabase = Boolean(SUPABASE_URL && SUPABASE_ANON && supabase);

function getLocalSession(): Session | null {
  if (!isBrowser()) return null;
  const raw = window.localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Session;
  } catch {
    window.localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export async function currentSession(): Promise<Session | null> {
  if (hasSupabase && supabase) {
    const { data } = await supabase.auth.getSession();
    const supaSession = data.session;
    if (supaSession?.user) {
      return {
        user: supaSession.user.email || "Usuario",
        email: supaSession.user.email || undefined,
        supabaseUserId: supaSession.user.id,
        role: "admin", // Ajusta cuando uses claims/roles reales
        issuedAt: Date.now(),
      };
    }
  }
  return getLocalSession();
}

export async function login(username: string, password: string) {
  if (!isBrowser()) return { ok: false as const, reason: "no-browser" as const };

  const attempts = Number(window.localStorage.getItem(`${SESSION_KEY}-attempts`) || 0);
  if (attempts >= MAX_ATTEMPTS) {
    return { ok: false as const, reason: "locked" as const };
  }

  if (hasSupabase && supabase) {
    const { data, error } = await supabase.auth.signInWithPassword({ email: username, password });
    if (error) {
      window.localStorage.setItem(`${SESSION_KEY}-attempts`, String(attempts + 1));
      return {
        ok: false as const,
        reason: "invalid-credentials" as const,
        message: error.message,
        remaining: Math.max(0, MAX_ATTEMPTS - attempts - 1),
      };
    }
    const user = data.user;
    const session: Session = {
      user: user?.email || username,
      email: user?.email || undefined,
      supabaseUserId: user?.id,
      role: "admin", // Ajustar mapeando roles desde la tabla usuarios / claims
      issuedAt: Date.now(),
    };
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    window.localStorage.removeItem(`${SESSION_KEY}-attempts`);
    return { ok: true as const, session };
  }

  const validUser = username === "Admin" && password === "!Admin";

  if (!validUser) {
    window.localStorage.setItem(`${SESSION_KEY}-attempts`, String(attempts + 1));
    return { ok: false as const, reason: "invalid-credentials" as const, remaining: Math.max(0, MAX_ATTEMPTS - attempts - 1) };
  }

  const session: Session = {
    user: "Admin",
    role: "admin",
    empresaId: "demo-empresa",
    sucursalId: "demo-sucursal",
    issuedAt: Date.now(),
  };

  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  window.localStorage.removeItem(`${SESSION_KEY}-attempts`);

  return { ok: true as const, session };
}

export async function logout() {
  if (!isBrowser()) return;
  if (hasSupabase && supabase) {
    await supabase.auth.signOut();
  }
  window.localStorage.removeItem(SESSION_KEY);
  window.localStorage.removeItem(`${SESSION_KEY}-attempts`);
}

export function isLocked() {
  if (!isBrowser()) return false;
  const attempts = Number(window.localStorage.getItem(`${SESSION_KEY}-attempts`) || 0);
  return attempts >= MAX_ATTEMPTS;
}

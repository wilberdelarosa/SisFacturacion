import { createClient, SupabaseClient } from "@supabase/supabase-js";

function getAdminClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    if (process.env.NODE_ENV === "development") {
      console.error("❌ Supabase Admin: faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE. Asegura tener .env en la raíz o apps/web.");
    }
    throw new Error(
      "Falta configuración de Supabase Admin. Define NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE (o SUPABASE_SERVICE_ROLE_KEY) en .env o .env.local."
    );
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

let _admin: SupabaseClient | null = null;

/**
 * Cliente de Supabase con Service Role para operaciones administrativas.
 * ⚠️ SOLO USAR EN SERVER-SIDE (API routes, Server Components).
 * ⚠️ NO EXPONER AL CLIENTE - Bypassea Row Level Security.
 * Se crea bajo demanda para no fallar en build si faltan env.
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (typeof window !== "undefined") {
    throw new Error("supabaseAdmin solo debe usarse en el servidor (API routes / Server Components).");
  }
  if (!_admin) _admin = getAdminClient();
  return _admin;
}

/** @deprecated Usar getSupabaseAdmin() en nuevas rutas. Se mantiene por compatibilidad. */
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    return (getSupabaseAdmin() as Record<string, unknown>)[prop as string];
  },
});

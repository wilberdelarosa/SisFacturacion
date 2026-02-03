import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE!;

// Validación en desarrollo
if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ CONFIGURACIÓN FALTANTE:");
  console.error("SUPABASE_URL:", supabaseUrl ? "✓" : "✗ FALTA");
  console.error("SUPABASE_SERVICE_ROLE:", supabaseServiceKey ? "✓ (oculto)" : "✗ FALTA");
  throw new Error("Falta configuración de Supabase Admin. Verifica SUPABASE_SERVICE_ROLE en .env.local");
}

console.log("✅ Supabase Admin configurado correctamente");

/**
 * Cliente de Supabase con Service Role para operaciones administrativas.
 * ⚠️ SOLO USAR EN SERVER-SIDE O EN OPERACIONES ADMINISTRATIVAS.
 * ⚠️ NO EXPONER AL CLIENTE - Bypassea Row Level Security.
 */
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

"use client";

import { createClient, SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Cliente de Supabase para el navegador.
 * Si faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY en apps/web/.env.local,
 * será null y login/registro fallarán con un mensaje claro.
 */
export const supabase: SupabaseClient | null =
  url && anon ? createClient(url, anon) : (() => {
    if (typeof window !== "undefined") {
      console.error(
        "Supabase no configurado: añade NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en apps/web/.env.local"
      );
    }
    return null;
  })();

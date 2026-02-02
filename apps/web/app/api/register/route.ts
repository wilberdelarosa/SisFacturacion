import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;

const DEFAULT_COMPANY = {
  name: "ALITO EIRL",
  rnc: "000000000",
  commercialName: "ALITO EIRL",
  address: "N/D",
  phone: "N/D",
  email: "info@alito.test",
};

const DEFAULT_BRANCH = {
  code: "PRIN",
  name: "PRINCIPAL",
  address: "N/D",
};

export async function POST(req: Request) {
  try {
    if (!SUPABASE_URL || !SERVICE_ROLE) {
      return NextResponse.json({ message: "Faltan llaves de Supabase" }, { status: 500 });
    }

    const { email, password, name } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json({ message: "Nombre, correo y contraseña son requeridos" }, { status: 400 });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // 1) Crear usuario en Auth
    const { data: userData, error: userErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (userErr) {
      return NextResponse.json({ message: userErr.message }, { status: 400 });
    }

    const authUserId = userData.user?.id;
    if (!authUserId) {
      return NextResponse.json({ message: "No se obtuvo auth_user_id" }, { status: 500 });
    }

    // 2) Crear empresa
    const companyId = crypto.randomUUID();
    const branchId = crypto.randomUUID();
    const userId = crypto.randomUUID();

    const { error: companyErr } = await admin.from("empresas").insert({
      id: companyId,
      nombre: DEFAULT_COMPANY.name,
      nombre_comercial: DEFAULT_COMPANY.commercialName,
      rnc: DEFAULT_COMPANY.rnc,
      direccion: DEFAULT_COMPANY.address,
      telefono: DEFAULT_COMPANY.phone,
      correo: DEFAULT_COMPANY.email,
      sitio_web: null,
      logo: null,
    });

    if (companyErr) {
      return NextResponse.json({ message: companyErr.message }, { status: 400 });
    }

    // 3) Crear sucursal principal
    const { error: branchErr } = await admin.from("sucursales").insert({
      id: branchId,
      empresa_id: companyId,
      codigo: DEFAULT_BRANCH.code,
      nombre: DEFAULT_BRANCH.name,
      direccion: DEFAULT_BRANCH.address,
      telefono: null,
      correo: null,
      es_principal: true,
    });

    if (branchErr) {
      return NextResponse.json({ message: branchErr.message }, { status: 400 });
    }

    // 4) Crear usuario en tabla usuarios
    const { error: userTableErr } = await admin.from("usuarios").insert({
      id: userId,
      empresa_id: companyId,
      sucursal_id: branchId,
      auth_user_id: authUserId,
      nombre: name,
      correo: email,
      rol: "admin",
      telefono: null,
      estado: "activo",
    });

    if (userTableErr) {
      return NextResponse.json({ message: userTableErr.message }, { status: 400 });
    }

    return NextResponse.json({ message: "Usuario creado", authUserId });
  } catch (err) {
    return NextResponse.json({ message: (err as Error).message }, { status: 500 });
  }
}

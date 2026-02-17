import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const ROLES_VALIDOS = ["super_admin", "admin", "gerente", "vendedor", "contador", "operador"] as const;

type AdminUserPayload = {
  id?: string;
  nombre?: string;
  correo?: string;
  password_hash?: string;
  rol?: string;
  empresa_id?: string;
  sucursal_id?: string | null;
  estado?: string;
  fecha_actualizacion?: string;
};

const handleError = (error: unknown) => {
  const message = error instanceof Error ? error.message : "Error interno al procesar la solicitud";
  return NextResponse.json({ message }, { status: 500 });
};

/** Crear usuario: primero en Supabase Auth, luego en tabla usuarios con auth_user_id */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as AdminUserPayload;

    if (!body.nombre?.trim() || !body.correo?.trim() || !body.empresa_id) {
      return NextResponse.json({ message: "Nombre, correo y empresa son requeridos" }, { status: 400 });
    }

    const rol = body.rol && ROLES_VALIDOS.includes(body.rol as (typeof ROLES_VALIDOS)[number]) ? body.rol : "operador";

    // Contraseña para Auth (el front envía password_hash como campo pero es la contraseña en claro para nuevo usuario)
    const password = (body.password_hash ?? "").trim();
    if (password.length < 8) {
      return NextResponse.json({ message: "La contraseña debe tener al menos 8 caracteres" }, { status: 400 });
    }

    // 1) Crear usuario en Supabase Auth
    const { data: userData, error: userErr } = await supabaseAdmin.auth.admin.createUser({
      email: body.correo.trim(),
      password,
      email_confirm: true,
    });

    if (userErr) {
      return NextResponse.json({ message: userErr.message }, { status: 400 });
    }

    const authUserId = userData.user?.id;
    if (!authUserId) {
      return NextResponse.json({ message: "No se pudo obtener el id del usuario en Auth" }, { status: 500 });
    }

    // 2) Insertar en tabla usuarios (sin guardar contraseña; Auth es la fuente de verdad)
    const { data, error } = await supabaseAdmin
      .from("usuarios")
      .insert({
        nombre: body.nombre.trim(),
        correo: body.correo.trim(),
        auth_user_id: authUserId,
        rol,
        empresa_id: body.empresa_id,
        sucursal_id: body.sucursal_id || null,
        estado: body.estado || "activo",
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}

/** Actualizar usuario; si viene password_hash, actualizar en Auth por auth_user_id */
export async function PUT(req: NextRequest) {
  try {
    const body = (await req.json()) as AdminUserPayload;

    if (!body.id) {
      return NextResponse.json({ message: "Se requiere id del usuario" }, { status: 400 });
    }

    const rol =
      body.rol && ROLES_VALIDOS.includes(body.rol as (typeof ROLES_VALIDOS)[number]) ? body.rol : undefined;

    // Si se envía nueva contraseña, actualizar en Supabase Auth
    if (body.password_hash?.trim()) {
      const { data: userRow } = await supabaseAdmin.from("usuarios").select("auth_user_id").eq("id", body.id).single();
      if (userRow?.auth_user_id) {
        const { error: updateAuthErr } = await supabaseAdmin.auth.admin.updateUserById(userRow.auth_user_id, {
          password: body.password_hash.trim(),
        });
        if (updateAuthErr) {
          return NextResponse.json({ message: updateAuthErr.message }, { status: 400 });
        }
      }
    }

    const updatePayload: Record<string, unknown> = {
      fecha_actualizacion: new Date().toISOString(),
    };
    if (body.nombre !== undefined) updatePayload.nombre = body.nombre;
    if (body.correo !== undefined) updatePayload.correo = body.correo;
    if (rol !== undefined) updatePayload.rol = rol;
    if (body.empresa_id !== undefined) updatePayload.empresa_id = body.empresa_id;
    if (body.sucursal_id !== undefined) updatePayload.sucursal_id = body.sucursal_id;
    if (body.estado !== undefined) updatePayload.estado = body.estado;

    const { data, error } = await supabaseAdmin
      .from("usuarios")
      .update(updatePayload)
      .eq("id", body.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    return handleError(error);
  }
}

/** Eliminar usuario: borrar de Auth (si tiene auth_user_id) y luego de la tabla usuarios */
export async function DELETE(req: NextRequest) {
  try {
    const body = (await req.json()) as AdminUserPayload;

    if (!body.id) {
      return NextResponse.json({ message: "Se requiere id del usuario" }, { status: 400 });
    }

    const { data: userRow } = await supabaseAdmin.from("usuarios").select("auth_user_id").eq("id", body.id).single();

    if (userRow?.auth_user_id) {
      await supabaseAdmin.auth.admin.deleteUser(userRow.auth_user_id);
    }

    const { data, error } = await supabaseAdmin.from("usuarios").delete().eq("id", body.id).select().single();

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    return handleError(error);
  }
}

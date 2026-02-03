import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

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

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as AdminUserPayload;
    const insertPayload = {
      nombre: body.nombre,
      correo: body.correo,
      password_hash: body.password_hash,
      rol: body.rol,
      empresa_id: body.empresa_id,
      sucursal_id: body.sucursal_id,
      estado: body.estado,
    };

    const { data, error } = await supabaseAdmin
      .from("usuarios")
      .insert([insertPayload])
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

export async function PUT(req: NextRequest) {
  try {
    const body = (await req.json()) as AdminUserPayload;
    const updatePayload = {
      nombre: body.nombre,
      correo: body.correo,
      rol: body.rol,
      empresa_id: body.empresa_id,
      sucursal_id: body.sucursal_id,
      estado: body.estado,
      ...(body.password_hash ? { password_hash: body.password_hash } : {}),
      fecha_actualizacion: body.fecha_actualizacion,
    };

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

export async function DELETE(req: NextRequest) {
  try {
    const body = (await req.json()) as AdminUserPayload;
    const { data, error } = await supabaseAdmin
      .from("usuarios")
      .delete()
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

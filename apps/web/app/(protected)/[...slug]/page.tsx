"use client";

import { useParams } from "next/navigation";

export default function PlaceholderPage() {
  const params = useParams();
  const path = Array.isArray(params.slug) ? params.slug.join("/") : params.slug;
  return (
    <div className="space-y-3">
      <h1 className="text-xl font-semibold text-slate-900">Módulo en construcción</h1>
      <p className="text-sm text-slate-600">
        Estás en: <span className="font-mono text-slate-800">/{path}</span>
      </p>
      <p className="text-sm text-slate-600">
        Aquí irán los formularios y vistas conectados al esquema: maestros (empresas, sucursales, clientes, productos), documentos
        (cotizaciones, conduces, proformas, facturas, pagos), aprobaciones, envíos, auditoría y reportes.
      </p>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Button } from "../../../components/ui/Button";
import { Table } from "../../../components/ui/Table";

type Secuencia = {
  id: string;
  tipo: string;
  serie: string;
  desde: string;
  hasta: string;
  actual: string;
  disponibles: number;
  estado: string;
};

export default function NCFPage() {
  const [secuencias] = useState<Secuencia[]>([]);

  const columns = [
    { header: "Tipo", accessor: "tipo" as const },
    { header: "Serie", accessor: "serie" as const },
    { header: "Desde", accessor: "desde" as const },
    { header: "Hasta", accessor: "hasta" as const },
    { header: "Actual", accessor: "actual" as const },
    {
      header: "Disponibles",
      accessor: (row: Secuencia) => (
        <span className={row.disponibles < 100 ? "text-red-400" : "text-green-400"}>
          {row.disponibles}
        </span>
      ),
    },
    {
      header: "Estado",
      accessor: (row: Secuencia) => (
        <span
          className={`rounded-full px-2 py-1 text-xs font-medium ${
            row.estado === "activo" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
          }`}
        >
          {row.estado}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Secuencias NCF</h1>
          <p className="mt-1 text-sm text-slate-400">Administra tus comprobantes fiscales</p>
        </div>
        <Button>
          <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nueva Secuencia
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-slate-700 bg-slate-800 p-5">
          <p className="text-sm text-slate-400">Secuencias Activas</p>
          <p className="mt-2 text-3xl font-bold text-white">0</p>
        </div>
        <div className="rounded-lg border border-slate-700 bg-slate-800 p-5">
          <p className="text-sm text-slate-400">NCF Disponibles</p>
          <p className="mt-2 text-3xl font-bold text-green-400">0</p>
        </div>
        <div className="rounded-lg border border-slate-700 bg-slate-800 p-5">
          <p className="text-sm text-slate-400">Alertas</p>
          <p className="mt-2 text-3xl font-bold text-red-400">0</p>
        </div>
      </div>

      <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
        <Table columns={columns} data={secuencias} emptyMessage="No hay secuencias NCF configuradas" />
      </div>
    </div>
  );
}

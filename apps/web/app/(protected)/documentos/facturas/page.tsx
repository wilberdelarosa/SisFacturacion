"use client";

import { useState } from "react";
import { Button } from "../../../../components/ui/Button";
import { Input } from "../../../../components/ui/Input";
import { Select } from "../../../../components/ui/Select";
import { Table } from "../../../../components/ui/Table";
import Link from "next/link";

type Factura = {
  id: string;
  numero: string;
  cliente: string;
  fecha: string;
  monto: string;
  estado: string;
  ncf: string;
};

const estadosFactura = [
  { value: "", label: "Todos los estados" },
  { value: "BORRADOR", label: "Borrador" },
  { value: "ENVIADA", label: "Enviada" },
  { value: "PAGADA", label: "Pagada" },
  { value: "VENCIDA", label: "Vencida" },
  { value: "ANULADA", label: "Anulada" },
];

export default function FacturasPage() {
  const [facturas] = useState<Factura[]>([]);
  const [selectedEstado, setSelectedEstado] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const getEstadoBadge = (estado: string) => {
    const styles: Record<string, string> = {
      BORRADOR: "bg-gray-500/20 text-gray-400",
      ENVIADA: "bg-blue-500/20 text-blue-400",
      PAGADA: "bg-green-500/20 text-green-400",
      VENCIDA: "bg-red-500/20 text-red-400",
      ANULADA: "bg-orange-500/20 text-orange-400",
    };
    return styles[estado] || "bg-gray-500/20 text-gray-400";
  };

  const columns = [
    { header: "Número", accessor: "numero" as const },
    { header: "NCF", accessor: "ncf" as const },
    { header: "Cliente", accessor: "cliente" as const },
    { header: "Fecha", accessor: "fecha" as const },
    { header: "Monto", accessor: "monto" as const, className: "text-right font-semibold" },
    {
      header: "Estado",
      accessor: (row: Factura) => (
        <span className={`rounded-full px-2 py-1 text-xs font-medium ${getEstadoBadge(row.estado)}`}>
          {row.estado}
        </span>
      ),
    },
    {
      header: "Acciones",
      accessor: () => (
        <div className="flex gap-2">
          <button className="rounded p-1 text-blue-400 hover:bg-slate-700" title="Ver">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
          </button>
          <button className="rounded p-1 text-green-400 hover:bg-slate-700" title="Descargar PDF">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Facturas</h1>
          <p className="mt-1 text-sm text-slate-400">Gestiona tus facturas y comprobantes fiscales</p>
        </div>
        <Link href="/documentos/facturas/nueva">
          <Button>
            <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nueva Factura
          </Button>
        </Link>
      </div>

      {/* Stats rápidos */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-slate-700 bg-slate-800 p-4">
          <p className="text-sm text-slate-400">Total Facturas</p>
          <p className="mt-1 text-2xl font-bold text-white">0</p>
        </div>
        <div className="rounded-lg border border-slate-700 bg-slate-800 p-4">
          <p className="text-sm text-slate-400">Monto Total</p>
          <p className="mt-1 text-2xl font-bold text-white">$0.00</p>
        </div>
        <div className="rounded-lg border border-slate-700 bg-slate-800 p-4">
          <p className="text-sm text-slate-400">Por Cobrar</p>
          <p className="mt-1 text-2xl font-bold text-yellow-400">$0.00</p>
        </div>
        <div className="rounded-lg border border-slate-700 bg-slate-800 p-4">
          <p className="text-sm text-slate-400">Vencidas</p>
          <p className="mt-1 text-2xl font-bold text-red-400">0</p>
        </div>
      </div>

      <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
        <div className="mb-4 flex gap-4">
          <div className="flex-1">
            <Input
              placeholder="Buscar por número, cliente o NCF..."
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="w-48">
            <Select options={estadosFactura} value={selectedEstado} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedEstado(e.target.value)} />
          </div>
          <Button variant="secondary">
            <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Exportar
          </Button>
        </div>

        <Table columns={columns} data={facturas} emptyMessage="No hay facturas registradas" />
      </div>
    </div>
  );
}

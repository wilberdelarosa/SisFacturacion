"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "../../../../components/ui/Button";
import { Input } from "../../../../components/ui/Input";
import { Select } from "../../../../components/ui/Select";
import { Table } from "../../../../components/ui/Table";
import { currentSession } from "../../../../lib/auth";
import { supabase } from "../../../../lib/supabaseClient";

type Factura = {
  id: string;
  numero_factura: string;
  numero_ncf: string | null;
  cliente?: { nombre: string | null } | null;
  fecha_emision: string;
  total: number;
  estado: string;
  saldo_pendiente: number | null;
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
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [selectedEstado, setSelectedEstado] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [companyId, setCompanyId] = useState<string | null>(process.env.NEXT_PUBLIC_DEFAULT_COMPANY_ID ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabaseConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  useEffect(() => {
    currentSession()
      .then((session) => {
        if (session?.empresaId) setCompanyId(session.empresaId);
      })
      .catch(() => undefined);
  }, []);

  const fetchFacturas = useCallback(async () => {
    if (!supabaseConfigured) {
      setError("Configura Supabase para listar facturas.");
      return;
    }

    setLoading(true);
    setError(null);

    const query = supabase
      .from("facturas")
      .select("id,numero_factura,numero_ncf,fecha_emision,total,estado,saldo_pendiente,cliente:clientes(nombre)")
      .order("fecha_emision", { ascending: false })
      .limit(200);

    if (companyId) query.eq("empresa_id", companyId);

    const { data, error: fetchError } = await query;

    if (fetchError) {
      setError(fetchError.message);
      setLoading(false);
      return;
    }

    setFacturas(
      (data || []).map((row) => ({
        id: row.id,
        numero_factura: row.numero_factura,
        numero_ncf: row.numero_ncf,
        cliente: Array.isArray(row.cliente) ? row.cliente[0] : row.cliente,
        fecha_emision: row.fecha_emision,
        total: Number(row.total) || 0,
        estado: row.estado || "",
        saldo_pendiente: row.saldo_pendiente ?? 0,
      }))
    );
    setLoading(false);
  }, [companyId, supabaseConfigured]);

  useEffect(() => {
    fetchFacturas();
  }, [fetchFacturas]);

  const filteredFacturas = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return facturas.filter((factura) => {
      const matchesEstado = selectedEstado ? factura.estado === selectedEstado : true;
      const matchesTerm = term
        ? [factura.numero_factura, factura.numero_ncf || "", factura.cliente?.nombre || ""]
            .join(" ")
            .toLowerCase()
            .includes(term)
        : true;
      return matchesEstado && matchesTerm;
    });
  }, [facturas, searchTerm, selectedEstado]);

  const resumen = useMemo(() => {
    const totalMonto = facturas.reduce((sum, f) => sum + (Number(f.total) || 0), 0);
    const porCobrar = facturas.reduce((sum, f) => sum + (Number(f.saldo_pendiente) || 0), 0);
    const vencidas = facturas.filter((f) => f.estado === "VENCIDA").length;
    return { totalMonto, porCobrar, vencidas };
  }, [facturas]);

  const getEstadoBadge = (estado: string) => {
    const styles: Record<string, string> = {
      BORRADOR: "bg-slate-100 text-slate-700",
      ENVIADA: "bg-blue-100 text-blue-700",
      PAGADA: "bg-emerald-100 text-emerald-700",
      VENCIDA: "bg-red-100 text-red-700",
      ANULADA: "bg-amber-100 text-amber-700",
    };
    return styles[estado] || "bg-slate-100 text-slate-700";
  };

  const columns = [
    { header: "Número", accessor: "numero_factura" as const },
    { header: "NCF", accessor: "numero_ncf" as const },
    { header: "Cliente", accessor: (row: Factura) => row.cliente?.nombre || "Cliente" },
    { header: "Fecha", accessor: (row: Factura) => row.fecha_emision },
    {
      header: "Monto",
      accessor: (row: Factura) => row.total.toLocaleString("es-DO", { style: "currency", currency: "DOP" }),
      className: "text-right font-semibold",
    },
    {
      header: "Estado",
      accessor: (row: Factura) => (
        <span className={`rounded-full px-2 py-1 text-xs font-medium ${getEstadoBadge(row.estado)}`}>
          {row.estado || "-"}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Facturas</h1>
          <p className="mt-1 text-sm text-slate-600">Gestiona tus facturas y comprobantes fiscales</p>
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

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-600">Total Facturas</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{facturas.length}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-600">Monto Total</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {resumen.totalMonto.toLocaleString("es-DO", { style: "currency", currency: "DOP" })}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-600">Por Cobrar</p>
          <p className="mt-1 text-2xl font-bold text-amber-700">
            {resumen.porCobrar.toLocaleString("es-DO", { style: "currency", currency: "DOP" })}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-600">Vencidas</p>
          <p className="mt-1 text-2xl font-bold text-red-700">{resumen.vencidas}</p>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center">
          <div className="flex-1">
            <Input
              placeholder="Buscar por número, cliente o NCF..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="w-full md:w-52">
            <Select options={estadosFactura} value={selectedEstado} onChange={(e) => setSelectedEstado(e.target.value)} />
          </div>
          <Button variant="secondary" onClick={fetchFacturas}>
            Recargar
          </Button>
        </div>

        {error && <p className="mb-3 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">{error}</p>}
        {loading && <p className="mb-3 text-sm text-slate-600">Cargando facturas...</p>}

        <Table columns={columns} data={filteredFacturas} emptyMessage="No hay facturas registradas" />
      </div>
    </div>
  );
}

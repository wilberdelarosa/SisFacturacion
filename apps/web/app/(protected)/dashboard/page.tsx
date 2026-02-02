"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowRight, ArrowUpRight, CircleDollarSign, Clock3, FileText, LineChart, Users } from "lucide-react";
import { supabase } from "../../../lib/supabaseClient";
import { currentSession } from "../../../lib/auth";

type InvoiceRow = {
  id: string;
  numero_factura: string;
  numero_ncf: string | null;
  cliente?: { nombre: string | null; rnc_o_cedula: string | null };
  total: number;
  estado: string | null;
  estado_pago: string | null;
  fecha_emision: string;
  fecha_vencimiento: string | null;
  saldo_pendiente: number | null;
};

const supabaseConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const formatCurrency = (value: number) =>
  value.toLocaleString("es-DO", { style: "currency", currency: "DOP", minimumFractionDigits: 2 });

const monthLabel = (date: string) => {
  const d = new Date(date);
  return d.toLocaleDateString("es-DO", { month: "short", year: "2-digit" });
};

export default function DashboardPage() {
  const [empresaId, setEmpresaId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);

  const stats = useMemo(() => {
    const totalFacturas = invoices.length;
    const ingresosTotales = invoices.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
    const pagosPendientes = invoices.reduce((sum, item) => sum + (Number(item.saldo_pendiente) || 0), 0);
    const hoy = new Date();
    const facturasVencidas = invoices.filter((item) => {
      if (!item.fecha_vencimiento) return false;
      const venc = new Date(item.fecha_vencimiento);
      return venc < hoy && item.estado_pago !== "pagado";
    }).length;

    return { totalFacturas, ingresosTotales, pagosPendientes, facturasVencidas };
  }, [invoices]);

  const monthlySeries = useMemo(() => {
    const buckets = new Map<string, number>();
    invoices.forEach((inv) => {
      const key = monthLabel(inv.fecha_emision);
      const value = Number(inv.total) || 0;
      buckets.set(key, (buckets.get(key) || 0) + value);
    });

    return Array.from(buckets.entries())
      .sort((a, b) => {
        const [ma, ya] = a[0].split(" ");
        const [mb, yb] = b[0].split(" ");
        const orderMonth = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
        const idxA = orderMonth.indexOf(ma.toLowerCase());
        const idxB = orderMonth.indexOf(mb.toLowerCase());
        return Number(`20${ya}`) - Number(`20${yb}`) || idxA - idxB;
      })
      .slice(-12);
  }, [invoices]);

  const topClients = useMemo(() => {
    const totals = new Map<string, { nombre: string; rnc: string; total: number }>();
    invoices.forEach((inv) => {
      const name = inv.cliente?.nombre || "Cliente";
      const rnc = inv.cliente?.rnc_o_cedula || "";
      const entry = totals.get(name) || { nombre: name, rnc, total: 0 };
      entry.total += Number(inv.total) || 0;
      totals.set(name, entry);
    });
    return Array.from(totals.values()).sort((a, b) => b.total - a.total).slice(0, 5);
  }, [invoices]);

  const recentInvoices = useMemo(
    () =>
      [...invoices]
        .sort((a, b) => new Date(b.fecha_emision).getTime() - new Date(a.fecha_emision).getTime())
        .slice(0, 5),
    [invoices]
  );

  const loadData = useCallback(async () => {
    if (!supabaseConfigured) {
      setError("Configura Supabase para ver datos reales.");
      setLoading(false);
      return;
    }

    setLoading(true);
    const session = await currentSession();
    const empresa = session?.empresaId || process.env.NEXT_PUBLIC_DEFAULT_COMPANY_ID || null;
    setEmpresaId(empresa);

    const query = supabase
      .from("facturas")
      .select("id,numero_factura,numero_ncf,total,estado,estado_pago,fecha_emision,fecha_vencimiento,saldo_pendiente,cliente:clientes(nombre,rnc_o_cedula)")
      .order("fecha_emision", { ascending: false })
      .limit(200);

    if (empresa) {
      query.eq("empresa_id", empresa);
    }

    const { data, error: fetchError } = await query;

    if (fetchError) {
      setError(fetchError.message);
      setLoading(false);
      return;
    }

    setInvoices(
      (data || []).map((row) => ({
        id: row.id,
        numero_factura: row.numero_factura,
        numero_ncf: row.numero_ncf,
        total: Number(row.total) || 0,
        estado: row.estado,
        estado_pago: row.estado_pago,
        fecha_emision: row.fecha_emision,
        fecha_vencimiento: row.fecha_vencimiento,
        saldo_pendiente: Number(row.saldo_pendiente) || 0,
        cliente: Array.isArray(row.cliente) ? row.cliente[0] : row.cliente,
      }))
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-600">Resumen conectado a tu base de datos</p>
        </div>
      </div>

      {loading && !error && <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">Cargando datos...</p>}
      {error && <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{error}</p>}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Ingresos Totales</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{formatCurrency(stats.ingresosTotales)}</p>
              <p className="mt-1 flex items-center text-xs text-slate-500">
                <ArrowUpRight className="mr-1 h-4 w-4 text-emerald-600" />
                Basado en facturas registradas
              </p>
            </div>
            <div className="rounded-full bg-blue-50 p-3 text-blue-700">
              <CircleDollarSign className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Total Facturas</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{stats.totalFacturas}</p>
              <p className="mt-1 text-xs text-slate-500">Últimas {invoices.length || 0} registradas</p>
            </div>
            <div className="rounded-full bg-indigo-50 p-3 text-indigo-700">
              <FileText className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Pagos Pendientes</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{formatCurrency(stats.pagosPendientes)}</p>
              <p className="mt-1 text-xs text-slate-500">Saldo abierto por cobrar</p>
            </div>
            <div className="rounded-full bg-amber-50 p-3 text-amber-700">
              <Clock3 className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Facturas Vencidas</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{stats.facturasVencidas}</p>
              <p className="mt-1 text-xs text-slate-500">Comparado con todas las facturas</p>
            </div>
            <div className="rounded-full bg-red-50 p-3 text-red-700">
              <AlertTriangle className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Ingresos mensuales</h2>
              <p className="text-sm text-slate-600">Agrupado por fecha de emisión</p>
            </div>
          </div>

          <div className="relative h-64">
            {monthlySeries.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">No hay datos de facturas todavía.</div>
            ) : (
              <div className="flex h-full items-end gap-3">
                {monthlySeries.map(([month, total]) => (
                  <div key={month} className="flex flex-1 flex-col items-center">
                    <div className="w-full rounded-t bg-blue-100" style={{ height: `${Math.max(10, Math.min(100, total / (stats.ingresosTotales || 1) * 100))}%` }}></div>
                    <span className="mt-2 text-xs text-slate-600">{month}</span>
                    <span className="text-[11px] text-slate-500">{formatCurrency(total)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Estado general</h2>
            <LineChart className="h-5 w-5 text-slate-500" />
          </div>
          <div className="space-y-3 text-sm text-slate-700">
            <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
              <span>Empresa activa</span>
              <span className="font-semibold text-slate-900">{empresaId || "No definido"}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
              <span>Facturas cargadas</span>
              <span className="font-semibold text-slate-900">{invoices.length}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
              <span>Saldo pendiente</span>
              <span className="font-semibold text-slate-900">{formatCurrency(stats.pagosPendientes)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Facturas recientes</h2>
              <p className="text-sm text-slate-600">Últimas 5 facturas creadas</p>
            </div>
            <Link href="/documentos/facturas" className="text-sm font-medium text-blue-700 hover:text-blue-600">
              Ver todas
              <ArrowRight className="ml-1 inline h-4 w-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {recentInvoices.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                <p className="text-sm text-slate-600">No hay facturas recientes</p>
                <Link href="/documentos/facturas/nueva" className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-blue-700">
                  Crear primera factura
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ) : (
              recentInvoices.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 p-3">
                  <div>
                    <p className="font-medium text-slate-900">{invoice.numero_factura}</p>
                    <p className="text-sm text-slate-600">{invoice.cliente?.nombre || "Cliente"}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900">{formatCurrency(Number(invoice.total) || 0)}</p>
                    <span className="text-xs text-slate-500">{invoice.fecha_emision}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Top clientes</h2>
              <p className="text-sm text-slate-600">Ordenado por monto facturado</p>
            </div>
            <Users className="h-5 w-5 text-slate-500" />
          </div>
          <div className="space-y-3">
            {topClients.length === 0 ? (
              <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">No hay clientes con facturación aún.</p>
            ) : (
              topClients.map((client, index) => (
                <div key={`${client.nombre}-${index}`} className="flex items-center gap-4 rounded-lg border border-slate-100 bg-slate-50 p-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{client.nombre}</p>
                    <p className="text-sm text-slate-600">{client.rnc || "Sin RNC"}</p>
                  </div>
                  <p className="font-semibold text-slate-900">{formatCurrency(client.total)}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

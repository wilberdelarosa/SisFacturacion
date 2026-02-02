"use client";

import Link from "next/link";

const stats = [
  { label: "Ingresos Totales", value: "$0", change: "+0.00% desde el mes pasado", icon: "💰", trend: "up" },
  { label: "Total Facturas", value: "0", change: "+0.00% desde el mes pasado", icon: "📄", trend: "up" },
  { label: "Pagos Pendientes", value: "$0", change: "0 facturas", icon: "⏳", trend: "neutral" },
  { label: "Facturas Vencidas", value: "0", change: "Sin facturas vencidas", icon: "✅", trend: "neutral" },
];

const recentInvoices: Array<{ id: string; number: string; client: string; amount: string; date: string }> = [
  // Datos de ejemplo vacíos para mostrar el diseño
];

const topClients = [
  { id: 1, name: "JESUS", rnc: "101-00222-3", total: "$0" },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-400">Vista general de tu sistema de facturación</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-lg border border-slate-700 bg-slate-800 p-5 transition-all hover:border-slate-600">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-400">{stat.label}</p>
                <p className="mt-2 text-3xl font-bold text-white">{stat.value}</p>
                <p className="mt-2 flex items-center text-xs text-slate-500">
                  <span className={`mr-1 ${stat.trend === "up" ? "text-green-400" : "text-slate-400"}`}>
                    {stat.trend === "up" ? "↑" : "•"}
                  </span>
                  {stat.change}
                </p>
              </div>
              <div className="text-3xl opacity-50">{stat.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Ingresos Mensuales Chart */}
        <div className="rounded-lg border border-slate-700 bg-slate-800 p-6 lg:col-span-2">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Ingresos Mensuales</h2>
              <p className="text-sm text-slate-400">Últimos 12 meses</p>
            </div>
          </div>
          <div className="relative h-64">
            {/* Gráfico simplificado - aquí irá Chart.js o similar */}
            <div className="flex h-full items-end justify-around gap-2">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="flex flex-1 flex-col items-center">
                  <div className="w-full rounded-t bg-slate-700" style={{ height: `${Math.random() * 100}%` }}></div>
                  <span className="mt-2 text-xs text-slate-500">
                    {["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"][i]}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-4 border-t border-slate-700 pt-4">
            <div>
              <p className="text-xs text-slate-400">$0k</p>
              <p className="text-sm font-medium text-white">Promedio</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">$0k</p>
              <p className="text-sm font-medium text-white">Máximo</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">$0k</p>
              <p className="text-sm font-medium text-white">Total</p>
            </div>
          </div>
        </div>

        {/* Estado NCF */}
        <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Estado NCF 00</h2>
            <button className="rounded-lg p-2 text-slate-400 hover:bg-slate-700 hover:text-white">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
          </div>
          <p className="text-sm text-slate-400">Secuencias activas</p>
          <div className="mt-6 space-y-4">
            {/* Aquí irán las secuencias NCF cuando se conecte */}
            <div className="rounded-lg bg-slate-700/50 p-4 text-center">
              <p className="text-sm text-slate-400">No hay secuencias configuradas</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Facturas Recientes */}
        <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Facturas Recientes</h2>
              <p className="text-sm text-slate-400">Últimas 5 facturas creadas</p>
            </div>
            <Link
              href="/documentos/facturas"
              className="text-sm font-medium text-blue-400 hover:text-blue-300"
            >
              Ver todas →
            </Link>
          </div>
          <div className="space-y-3">
            {recentInvoices.length === 0 ? (
              <div className="rounded-lg bg-slate-700/50 p-8 text-center">
                <p className="text-sm text-slate-400">No hay facturas recientes</p>
                <Link
                  href="/documentos/facturas/nueva"
                  className="mt-3 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Crear primera factura
                </Link>
              </div>
            ) : (
              recentInvoices.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between rounded-lg bg-slate-700/50 p-3">
                  <div>
                    <p className="font-medium text-white">{invoice.number}</p>
                    <p className="text-sm text-slate-400">{invoice.client}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-white">{invoice.amount}</p>
                    <span className="text-xs text-slate-400">{invoice.date}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Clientes */}
        <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Top Clientes</h2>
              <p className="text-sm text-slate-400">Por ingresos generados</p>
            </div>
            <Link
              href="/catalogos/clientes"
              className="text-sm font-medium text-blue-400 hover:text-blue-300"
            >
              Ver todos →
            </Link>
          </div>
          <div className="space-y-3">
            {topClients.map((client, index) => (
              <div key={client.id} className="flex items-center gap-4 rounded-lg bg-slate-700/50 p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-600 text-lg font-bold text-white">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-white">{client.name}</p>
                  <p className="text-sm text-slate-400">{client.rnc}</p>
                </div>
                <p className="font-semibold text-blue-400">{client.total}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

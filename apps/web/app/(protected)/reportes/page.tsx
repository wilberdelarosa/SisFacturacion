"use client";

export default function ReportesPage() {
  const reportes = [
    { titulo: "Ventas por Período", descripcion: "Análisis de ventas en rango de fechas", icono: "📊" },
    { titulo: "Cuentas por Cobrar", descripcion: "Aging de cuentas pendientes", icono: "💰" },
    { titulo: "Top Clientes", descripcion: "Clientes con mayor facturación", icono: "👥" },
    { titulo: "Productos más Vendidos", descripcion: "Análisis de productos", icono: "📦" },
    { titulo: "Estado de NCF", descripcion: "Uso y disponibilidad de NCF", icono: "🔢" },
    { titulo: "Flujo de Documentos", descripcion: "Cotizaciones, proformas y facturas", icono: "📄" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Reportes</h1>
        <p className="mt-1 text-sm text-slate-400">Análisis y reportes del sistema</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {reportes.map((reporte) => (
          <button
            key={reporte.titulo}
            className="group rounded-lg border border-slate-700 bg-slate-800 p-6 text-left transition-all hover:border-blue-500 hover:bg-slate-700"
          >
            <div className="mb-3 text-4xl">{reporte.icono}</div>
            <h3 className="text-lg font-semibold text-white group-hover:text-blue-400">{reporte.titulo}</h3>
            <p className="mt-1 text-sm text-slate-400">{reporte.descripcion}</p>
            <div className="mt-4 flex items-center text-sm text-blue-400">
              <span>Generar reporte</span>
              <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <section className="space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Arquitectura preparada</h2>
        <p className="mt-2 text-sm text-slate-600">
          Next.js App Router + Tailwind + TypeScript. Este frontend consume únicamente el Gateway/BFF
          y mantiene la lógica de negocio fuera de la UI.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-md border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-800">
            <p className="font-medium">Segregación</p>
            <p>UI aislada; contratos versionados; sin dependencias directas a servicios.</p>
          </div>
          <div className="rounded-md border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
            <p className="font-medium">Lista para escalar</p>
            <p>Monorepo con Turborepo y pnpm para builds rápidos y cacheados.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SisFacturacion Web',
  description: 'Frontend aislado consumiendo el gateway'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <main className="mx-auto max-w-5xl px-6 py-10">
          <header className="mb-8 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">SisFacturacion</p>
              <h1 className="text-2xl font-semibold">Portal Web</h1>
            </div>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
              Monorepo · Hexagonal
            </span>
          </header>
          {children}
        </main>
      </body>
    </html>
  );
}

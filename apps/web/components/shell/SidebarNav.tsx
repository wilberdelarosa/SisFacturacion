"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

type MenuItem = {
  label: string;
  href?: string;
  icon: string;
  submenu?: { label: string; href: string }[];
};

const menuItems: MenuItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: "📊" },
  {
    label: "Facturas",
    icon: "📄",
    submenu: [
      { label: "Todas las Facturas", href: "/documentos/facturas" },
      { label: "Nueva Factura", href: "/documentos/facturas/nueva" },
      { label: "Cotizaciones", href: "/documentos/cotizaciones" },
      { label: "Proformas", href: "/documentos/proformas" },
      { label: "Conduces", href: "/documentos/conduces" },
    ],
  },
  { label: "Clientes", href: "/catalogos/clientes", icon: "👥" },
  { label: "Productos", href: "/catalogos/productos", icon: "📦" },
  { label: "NCF", href: "/ncf", icon: "🔢" },
  { label: "Reportes", href: "/reportes", icon: "📈" },
  {
    label: "Configuración",
    icon: "⚙️",
    submenu: [
      { label: "Empresas", href: "/catalogos/empresas" },
      { label: "Sucursales", href: "/catalogos/sucursales" },
      { label: "Usuarios", href: "/seguridad/usuarios" },
      { label: "Pagos", href: "/documentos/pagos" },
    ],
  },
];

export function SidebarNav() {
  const pathname = usePathname();
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set(["Facturas"]));

  const toggleMenu = (label: string) => {
    setExpandedMenus((prev) => {
      const next = new Set(prev);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      return next;
    });
  };

  return (
    <aside className="hidden w-64 shrink-0 border-r border-slate-800 bg-slate-900 sm:block">
      <div className="flex h-16 items-center border-b border-slate-800 px-4">
        <h1 className="text-xl font-bold text-white">ALITO EIRL</h1>
      </div>
      <nav className="space-y-1 p-4">
        {menuItems.map((item) => {
          const isExpanded = expandedMenus.has(item.label);
          const isActive = item.href ? pathname.startsWith(item.href) : false;
          const hasActiveSubmenu = item.submenu?.some((sub) => pathname.startsWith(sub.href));

          if (item.submenu) {
            return (
              <div key={item.label}>
                <button
                  onClick={() => toggleMenu(item.label)}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    hasActiveSubmenu || isExpanded
                      ? "bg-slate-800 text-white"
                      : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <span className="text-lg">{item.icon}</span>
                    {item.label}
                  </span>
                  <svg
                    className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {isExpanded && (
                  <div className="ml-9 mt-1 space-y-1">
                    {item.submenu.map((sub) => {
                      const subActive = pathname.startsWith(sub.href);
                      return (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                            subActive
                              ? "bg-slate-700 font-medium text-white"
                              : "text-slate-400 hover:bg-slate-800 hover:text-white"
                          }`}
                        >
                          {sub.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href!}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-slate-800 text-white"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

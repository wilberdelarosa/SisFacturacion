"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  FileText,
  Users,
  Package,
  FileDigit,
  BarChart3,
  Settings,
  ChevronDown,
  Shield
} from "lucide-react";

type MenuItem = {
  label: string;
  href?: string;
  icon: React.ElementType;
  submenu?: { label: string; href: string }[];
};

const menuItems: MenuItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  {
    label: "Facturas",
    icon: FileText,
    submenu: [
      { label: "Todas las Facturas", href: "/documentos/facturas" },
      { label: "Nueva Factura", href: "/documentos/facturas/nueva" },
      { label: "Cotizaciones", href: "/documentos/cotizaciones" },
      { label: "Proformas", href: "/documentos/proformas" },
      { label: "Conduces", href: "/documentos/conduces" },
    ],
  },
  { label: "Clientes", href: "/catalogos/clientes", icon: Users },
  { label: "Productos", href: "/catalogos/productos", icon: Package },
  { label: "NCF", href: "/ncf", icon: FileDigit },
  { label: "Reportes", href: "/reportes", icon: BarChart3 },
  {
    label: "Administración",
    icon: Shield,
    submenu: [
      { label: "Usuarios", href: "/admin/usuarios" },
      { label: "Roles", href: "/admin/roles" },
    ],
  },
  {
    label: "Configuración",
    icon: Settings,
    submenu: [
      { label: "Empresas", href: "/catalogos/empresas" },
      { label: "Sucursales", href: "/catalogos/sucursales" },
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
    <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white sm:block">
      <div className="flex h-16 items-center border-b border-slate-200 px-4">
        <h1 className="text-xl font-bold text-slate-900">SisFacturación</h1>
      </div>
      <nav className="space-y-1 p-4">
        {menuItems.map((item) => {
          const isExpanded = expandedMenus.has(item.label);
          const isActive = item.href ? pathname.startsWith(item.href) : false;
          const hasActiveSubmenu = item.submenu?.some((sub) => pathname.startsWith(sub.href));
          const Icon = item.icon;

          if (item.submenu) {
            return (
              <div key={item.label}>
                <button
                  onClick={() => toggleMenu(item.label)}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${hasActiveSubmenu || isExpanded
                      ? "bg-slate-100 text-slate-900"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                >
                  <span className="flex items-center gap-3">
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                  />
                </button>
                {isExpanded && (
                  <div className="ml-9 mt-1 space-y-1">
                    {item.submenu.map((sub) => {
                      const subActive = pathname.startsWith(sub.href);
                      return (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          className={`block rounded-lg px-3 py-2 text-sm transition-colors ${subActive
                              ? "bg-blue-50 font-medium text-blue-700"
                              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
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
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}


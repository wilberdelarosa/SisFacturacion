"use client";

import { useEffect, useState } from "react";
import { RoleBadge, Button } from "../../../../components/ui";
import { Shield, Users, Eye, TrendingUp, RefreshCw, Search } from "lucide-react";
import { supabase } from "../../../../lib/supabaseClient";

type Role = {
  id: string;
  key: string;
  name: string;
  description?: string;
  userCount?: number;
  permissions?: string[];
};

/** Roles según enum RolUsuario en BD */
const predefinedRoles: Role[] = [
  { id: "1", key: "super_admin", name: "Super Administrador", description: "Acceso total al sistema, gestión de empresas y configuración global", permissions: ["all"] },
  { id: "2", key: "admin", name: "Administrador", description: "Administrador de la empresa, gestiona usuarios y configuración", permissions: ["users.create", "users.edit", "users.delete", "reports.view", "settings.edit"] },
  { id: "3", key: "gerente", name: "Gerente", description: "Gerente con permisos de gestión y supervisión operativa", permissions: ["invoices.create", "invoices.edit", "reports.view", "users.view"] },
  { id: "4", key: "vendedor", name: "Vendedor", description: "Usuario enfocado en ventas y atención al cliente", permissions: ["invoices.create", "invoices.view", "customers.create", "customers.edit"] },
  { id: "5", key: "contador", name: "Contador", description: "Usuario con acceso a finanzas, reportes y auditoría", permissions: ["invoices.view", "reports.view", "reports.export", "payments.view"] },
  { id: "6", key: "operador", name: "Operador", description: "Usuario operativo básico con acceso limitado", permissions: ["invoices.view", "customers.view"] },
];

export default function AdminRolesPage() {
  const [roles, setRoles] = useState<Role[]>(predefinedRoles);
  const [filteredRoles, setFilteredRoles] = useState<Role[]>(predefinedRoles);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [totalUsers, setTotalUsers] = useState(0);

  useEffect(() => {
    loadRoleCounts();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = roles.filter(
        (role) =>
          role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          role.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredRoles(filtered);
    } else {
      setFilteredRoles(roles);
    }
  }, [searchTerm, roles]);

  const loadRoleCounts = async () => {
    if (!supabase) {
      setError("Supabase no configurado. Configura apps/web/.env.local");
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const { data, error: fetchError } = await supabase
        .from("usuarios")
        .select("rol");

      if (fetchError) {
        setError(fetchError.message);
        return;
      }

      // Count users per role
      const roleCounts = (data || []).reduce((acc, user) => {
        const role = user.rol || "operador";
        acc[role] = (acc[role] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Update roles with user counts
      const updatedRoles = predefinedRoles.map((role) => ({
        ...role,
        userCount: roleCounts[role.key] || 0,
      }));

      setRoles(updatedRoles);
      setFilteredRoles(updatedRoles);
      setTotalUsers((data || []).length);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Shield className="h-6 w-6 text-blue-600" />
            Gestión de Roles
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Configura roles, permisos y controla el acceso al sistema
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadRoleCounts} className="flex items-center gap-2 bg-slate-100 text-slate-700 hover:bg-slate-200">
            <RefreshCw className="h-4 w-4" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-gradient-to-br from-blue-50 to-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Total de Roles</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{roles.length}</p>
            </div>
            <div className="rounded-full bg-blue-100 p-3">
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-gradient-to-br from-green-50 to-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Total de Usuarios</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{totalUsers}</p>
            </div>
            <div className="rounded-full bg-green-100 p-3">
              <Users className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-gradient-to-br from-purple-50 to-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Rol Más Usado</p>
              <p className="text-lg font-bold text-slate-900 mt-1">
                {roles.reduce((prev, curr) => (curr.userCount || 0) > (prev.userCount || 0) ? curr : prev).name}
              </p>
            </div>
            <div className="rounded-full bg-purple-100 p-3">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="rounded-lg border border-slate-200 bg-white shadow-sm p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar roles por nombre o descripción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white pl-10 pr-4 py-2 text-sm text-slate-900 placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Roles Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="col-span-full flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mr-2" />
            <span className="text-sm text-slate-500">Cargando roles...</span>
          </div>
        ) : filteredRoles.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-12">
            <Shield className="h-16 w-16 text-slate-300 mb-3" />
            <p className="text-sm font-medium text-slate-700">
              {searchTerm ? "No se encontraron roles con ese criterio" : "No hay roles configurados"}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {searchTerm ? "Intenta ajustar tu búsqueda" : ""}
            </p>
          </div>
        ) : (
          filteredRoles.map((role) => (
            <div
              key={role.id}
              className="rounded-lg border border-slate-200 bg-white shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden group"
            >
              {/* Header con color según rol */}
              <div className={`h-2 ${getRoleHeaderColor(role.key)}`}></div>
              
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">{role.name}</h3>
                    <RoleBadge role={role.key} />
                  </div>
                  <div className="flex-shrink-0 ml-3">
                    <div className="rounded-full bg-slate-100 p-2 group-hover:bg-blue-50 transition-colors">
                      <Shield className="h-5 w-5 text-slate-600 group-hover:text-blue-600" />
                    </div>
                  </div>
                </div>

                {role.description && (
                  <p className="text-sm text-slate-600 mb-4 leading-relaxed">{role.description}</p>
                )}

                {/* User Count */}
                <div className="mb-4 pb-4 border-b border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500 uppercase">Usuarios Activos</span>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-50 text-blue-700 font-semibold">
                      {role.userCount || 0}
                    </span>
                  </div>
                </div>

                {/* Permissions Preview */}
                <div className="mb-4">
                  <p className="text-xs font-medium text-slate-500 uppercase mb-2">Permisos</p>
                  <div className="flex flex-wrap gap-1">
                    {role.permissions && role.permissions.length > 0 ? (
                      <>
                        {role.permissions.slice(0, 3).map((perm, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-700"
                          >
                            {perm === "all" ? "Todos" : perm}
                          </span>
                        ))}
                        {role.permissions.length > 3 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-slate-200 text-slate-700 font-medium">
                            +{role.permissions.length - 3} más
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-xs text-slate-400">Sin permisos configurados</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button className="flex-1 text-sm py-2 bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-1">
                    <Eye className="h-4 w-4" />
                    Ver Detalles
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function getRoleHeaderColor(roleKey: string): string {
  const colorMap: Record<string, string> = {
    super_admin: "bg-gradient-to-r from-red-500 to-red-600",
    admin: "bg-gradient-to-r from-red-400 to-orange-500",
    gerente: "bg-gradient-to-r from-blue-500 to-blue-600",
    vendedor: "bg-gradient-to-r from-green-500 to-green-600",
    contador: "bg-gradient-to-r from-purple-500 to-purple-600",
    operador: "bg-gradient-to-r from-slate-400 to-slate-500",
  };
  return colorMap[roleKey] || "bg-gradient-to-r from-slate-400 to-slate-500";
}
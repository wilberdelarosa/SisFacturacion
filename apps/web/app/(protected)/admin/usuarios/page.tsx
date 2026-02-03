"use client";

import { useEffect, useState } from "react";
import { RoleBadge, Button } from "../../../../components/ui";
import { UserPlus, Shield, Search, Filter, Edit2, Trash2, RefreshCw } from "lucide-react";
import { supabase } from "../../../../lib/supabaseClient";
import { currentSession } from "../../../../lib/auth";
import { UserFormModal } from "../../../../components/admin/UserFormModal";
import { DeleteConfirmModal } from "../../../../components/admin/DeleteConfirmModal";

type User = {
  id: string;
  email: string;
  name: string;
  role?: string;
  companyId: string;
  branchId?: string | null;
  status?: string;
  createdAt?: string;
};

type EditingUser = {
  id: string;
  nombre: string;
  correo: string;
  rol: string;
  empresa_id: string;
  sucursal_id: string;
  estado: string;
};

const ADMIN_USERS_API = "/api/admin/users";

async function callAdminUsersApi(
  method: "POST" | "PUT" | "DELETE",
  payload: Record<string, unknown>
) {
  const response = await fetch(ADMIN_USERS_API, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(body?.message || "Error administrativo al procesar la solicitud");
  }

  return body;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  
  // Modal states
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<EditingUser | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    checkAdminAccess();
    loadUsers();
  }, []);

  const checkAdminAccess = async () => {
    const session = await currentSession();
    if (session) {
      setCurrentUserRole(session.role);
      if (!["admin", "superadmin"].includes(session.role)) {
        setError("⛔ Acceso denegado. Solo usuarios Admin o SuperAdmin pueden acceder a esta sección.");
      }
    }
  };

  useEffect(() => {
    filterUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users, searchTerm, filterRole, filterStatus]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error: fetchError } = await supabase
        .from("usuarios")
        .select("id, nombre, correo, rol, empresa_id, sucursal_id, estado, fecha_creacion")
        .order("fecha_creacion", { ascending: false });

      if (fetchError) {
        setError(fetchError.message);
        return;
      }

      const mappedUsers: User[] = (data || []).map((user) => ({
        id: user.id,
        name: user.nombre,
        email: user.correo,
        role: user.rol,
        companyId: user.empresa_id,
        branchId: user.sucursal_id,
        status: user.estado,
        createdAt: user.fecha_creacion,
      }));

      setUsers(mappedUsers);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    // Búsqueda por texto
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.name.toLowerCase().includes(search) ||
          user.email.toLowerCase().includes(search)
      );
    }

    // Filtro por rol
    if (filterRole !== "all") {
      filtered = filtered.filter((user) => user.role === filterRole);
    }

    // Filtro por estado
    if (filterStatus !== "all") {
      filtered = filtered.filter((user) => user.status === filterStatus);
    }

    setFilteredUsers(filtered);
  };

  const handleCreateUser = () => {
    if (!currentUserRole || !["admin", "superadmin"].includes(currentUserRole)) {
      setError("⛔ No tienes permisos para crear usuarios. Solo usuarios Admin o SuperAdmin.");
      return;
    }
    setEditingUser(null);
    setShowUserModal(true);
  };

  const handleEditUser = (user: User) => {
    if (!currentUserRole || !["admin", "superadmin"].includes(currentUserRole)) {
      setError("⛔ No tienes permisos para editar usuarios. Solo usuarios Admin o SuperAdmin.");
      return;
    }
    setEditingUser({
      id: user.id,
      nombre: user.name,
      correo: user.email,
      rol: user.role || "operador",
      empresa_id: user.companyId,
      sucursal_id: user.branchId || "",
      estado: user.status || "activo",
    });
    setShowUserModal(true);
  };

  const handleDeleteClick = (user: User) => {
    if (!currentUserRole || !["admin", "superadmin"].includes(currentUserRole)) {
      setError("⛔ No tienes permisos para eliminar usuarios. Solo usuarios Admin o SuperAdmin.");
      return;
    }
    setDeletingUser(user);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingUser) return;

    const session = await currentSession();
    if (!session || !["admin", "superadmin"].includes(session.role)) {
      setError("⛔ No tienes permisos para eliminar usuarios. Solo usuarios Admin o SuperAdmin.");
      setShowDeleteModal(false);
      return;
    }

    setDeleteLoading(true);
    try {
      await callAdminUsersApi("DELETE", { id: deletingUser.id });
      console.log("✅ Usuario eliminado exitosamente por admin:", session.email);
      await loadUsers();
      setShowDeleteModal(false);
      setDeletingUser(null);
    } catch (error) {
      console.error("Error deleting user:", error);
      setError((error as Error).message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleModalSuccess = async () => {
    await loadUsers();
  };

  const getStatusBadge = (status?: string) => {
    const statusMap = {
      activo: "bg-green-100 text-green-800",
      inactivo: "bg-gray-100 text-gray-800",
      suspendido: "bg-red-100 text-red-800",
    };
    const className = statusMap[status as keyof typeof statusMap] || statusMap.activo;
    const label = status || "activo";

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
        {label.charAt(0).toUpperCase() + label.slice(1)}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Shield className="h-6 w-6 text-blue-600" />
            Administración de Usuarios
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {filteredUsers.length} usuario{filteredUsers.length !== 1 ? "s" : ""} 
            {searchTerm || filterRole !== "all" || filterStatus !== "all" ? ` encontrado${filteredUsers.length !== 1 ? "s" : ""}` : ""} de {users.length} total
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadUsers} className="flex items-center gap-2 bg-slate-100 text-slate-700 hover:bg-slate-200">
            <RefreshCw className="h-4 w-4" />
            Actualizar
          </Button>
          <Button onClick={handleCreateUser} className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Crear Usuario
          </Button>
        </div>
      </div>

      {/* Filtros y Búsqueda */}
      <div className="rounded-lg border border-slate-200 bg-white shadow-sm p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white pl-10 pr-4 py-2 text-sm text-slate-900 placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Filtro por Rol */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white pl-10 pr-4 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">Todos los roles</option>
              <option value="superadmin">Super Administrador</option>
              <option value="admin">Administrador</option>
              <option value="gerente">Gerente</option>
              <option value="vendedor">Vendedor</option>
              <option value="operador">Operador</option>
              <option value="contabilidad">Contabilidad</option>
              <option value="auditor">Auditor</option>
            </select>
          </div>

          {/* Filtro por Estado */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white pl-10 pr-4 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">Todos los estados</option>
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
              <option value="suspendido">Suspendido</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 flex items-start gap-2">
          <Shield className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div>
            <strong>Error:</strong> {error}
          </div>
        </div>
      )}

      {/* Tabla de Usuarios */}
      <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Rol
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center">
                    <div className="flex items-center justify-center">
                      <RefreshCw className="h-6 w-6 animate-spin text-blue-600 mr-2" />
                      <span className="text-sm text-slate-500">Cargando usuarios...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Shield className="h-12 w-12 text-slate-300 mb-2" />
                      <p className="text-sm font-medium text-slate-700">
                        {searchTerm || filterRole !== "all" || filterStatus !== "all"
                          ? "No se encontraron usuarios con esos criterios"
                          : "No hay usuarios registrados"}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {searchTerm || filterRole !== "all" || filterStatus !== "all"
                          ? "Intenta ajustar los filtros de búsqueda"
                          : "Crea tu primer usuario para comenzar"}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-700">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-slate-900">{user.name}</div>
                          <div className="text-xs text-slate-500">
                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString("es-DO") : ""}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-700">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.role && <RoleBadge role={user.role} />}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(user.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEditUser(user)}
                          className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-50 transition-colors"
                        >
                          <Edit2 className="h-4 w-4" />
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeleteClick(user)}
                          className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modales */}
      <UserFormModal
        isOpen={showUserModal}
        onClose={() => setShowUserModal(false)}
        onSuccess={handleModalSuccess}
        editingUser={editingUser}
      />

      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        title="Eliminar Usuario"
        message="¿Estás seguro de que deseas eliminar este usuario? Esta acción no se puede deshacer."
        itemName={deletingUser ? `${deletingUser.name} (${deletingUser.email})` : ""}
        loading={deleteLoading}
      />
    </div>
  );
}
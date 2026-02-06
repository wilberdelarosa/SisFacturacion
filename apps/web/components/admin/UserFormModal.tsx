"use client";

import { useState, useEffect } from "react";
import { Modal, Input, Select, Button } from "../ui";
import { supabase } from "../../lib/supabaseClient";
import { currentSession, isAdminRole } from "../../lib/auth";
import { Loader2 } from "lucide-react";

type UserFormData = {
  nombre: string;
  correo: string;
  contrasena: string;
  rol: string;
  empresa_id: string;
  sucursal_id: string;
  estado: string;
};

type Company = {
  id: string;
  nombre: string;
};

type Branch = {
  id: string;
  nombre: string;
  empresa_id: string;
};

type UserFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingUser?: {
    id: string;
    nombre: string;
    correo: string;
    rol: string;
    empresa_id: string;
    sucursal_id: string;
    estado: string;
  } | null;
};

/** Opciones de rol según enum RolUsuario en BD */
const ROLE_OPTIONS = [
  { value: "super_admin", label: "Super Administrador" },
  { value: "admin", label: "Administrador" },
  { value: "gerente", label: "Gerente" },
  { value: "vendedor", label: "Vendedor" },
  { value: "contador", label: "Contador" },
  { value: "operador", label: "Operador" },
];

const STATUS_OPTIONS = [
  { value: "activo", label: "Activo" },
  { value: "inactivo", label: "Inactivo" },
  { value: "suspendido", label: "Suspendido" },
];

export function UserFormModal({ isOpen, onClose, onSuccess, editingUser }: UserFormModalProps) {
  const [formData, setFormData] = useState<UserFormData>({
    nombre: "",
    correo: "",
    contrasena: "",
    rol: "operador",
    empresa_id: "",
    sucursal_id: "",
    estado: "activo",
  });

  const [companies, setCompanies] = useState<Company[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [filteredBranches, setFilteredBranches] = useState<Branch[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadCompaniesAndBranches();
      if (editingUser) {
        setFormData({
          nombre: editingUser.nombre,
          correo: editingUser.correo,
          contrasena: "",
          rol: editingUser.rol,
          empresa_id: editingUser.empresa_id,
          sucursal_id: editingUser.sucursal_id || "",
          estado: editingUser.estado,
        });
      } else {
        resetForm();
      }
    }
  }, [isOpen, editingUser]);

  useEffect(() => {
    if (formData.empresa_id) {
      const filtered = branches.filter((b) => b.empresa_id === formData.empresa_id);
      setFilteredBranches(filtered);
      // Si la sucursal seleccionada no pertenece a la empresa, limpiarla
      if (formData.sucursal_id && !filtered.find((b) => b.id === formData.sucursal_id)) {
        setFormData((prev) => ({ ...prev, sucursal_id: "" }));
      }
    } else {
      setFilteredBranches([]);
    }
  }, [formData.empresa_id, formData.sucursal_id, branches]);

  const loadCompaniesAndBranches = async () => {
    if (!supabase) return;
    setLoadingData(true);
    try {
      const [companiesRes, branchesRes] = await Promise.all([
        supabase.from("empresas").select("id, nombre").eq("estado", "activo").order("nombre"),
        supabase.from("sucursales").select("id, nombre, empresa_id").eq("estado", "activo").order("nombre"),
      ]);

      if (companiesRes.data) setCompanies(companiesRes.data);
      if (branchesRes.data) setBranches(branchesRes.data);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoadingData(false);
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: "",
      correo: "",
      contrasena: "",
      rol: "operador",
      empresa_id: "",
      sucursal_id: "",
      estado: "activo",
    });
    setErrors({});
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = "El nombre es requerido";
    }

    if (!formData.correo.trim()) {
      newErrors.correo = "El correo es requerido";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.correo)) {
      newErrors.correo = "El correo no es válido";
    }

    if (!editingUser && !formData.contrasena) {
      newErrors.contrasena = "La contraseña es requerida";
    } else if (!editingUser && formData.contrasena.length < 8) {
      newErrors.contrasena = "La contraseña debe tener al menos 8 caracteres";
    }

    if (!formData.empresa_id) {
      newErrors.empresa_id = "La empresa es requerida";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    // Validar que solo usuarios admin o superadmin puedan crear/editar usuarios
    const session = await currentSession();
    if (!session || !isAdminRole(session.role)) {
      setErrors({ submit: "No tienes permisos para realizar esta acción. Solo usuarios Admin o Super Admin." });
      return;
    }

    setLoading(true);
    try {
      const payload = editingUser
        ? {
            id: editingUser.id,
            nombre: formData.nombre,
            correo: formData.correo,
            rol: formData.rol,
            empresa_id: formData.empresa_id,
            sucursal_id: formData.sucursal_id || null,
            estado: formData.estado,
            fecha_actualizacion: new Date().toISOString(),
            ...(formData.contrasena ? { password_hash: formData.contrasena } : {}),
          }
        : {
            nombre: formData.nombre,
            correo: formData.correo,
            password_hash: formData.contrasena,
            rol: formData.rol,
            empresa_id: formData.empresa_id,
            sucursal_id: formData.sucursal_id || null,
            estado: formData.estado,
          };

      const response = await fetch("/api/admin/users", {
        method: editingUser ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const body = await response.json().catch(() => null);

      if (!response.ok) {
        const serverMessage = body?.message || "Error desconocido en el servidor";
        throw new Error(serverMessage);
      }

      console.log(
        editingUser ? "✅ Usuario actualizado por admin:" : "✅ Usuario creado por admin:",
        session.email,
        body
      );

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error saving user:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Error desconocido al guardar el usuario";
      setErrors({ submit: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof UserFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Limpiar error del campo cuando el usuario empieza a escribir
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingUser ? "Editar Usuario" : "Crear Nuevo Usuario"}
      size="lg"
    >
      {loadingData ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {errors.submit && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
              {errors.submit}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              label="Nombre Completo"
              value={formData.nombre}
              onChange={(e) => handleChange("nombre", e.target.value)}
              error={errors.nombre}
              required
              placeholder="Juan Pérez"
            />

            <Input
              label="Correo Electrónico"
              type="email"
              value={formData.correo}
              onChange={(e) => handleChange("correo", e.target.value)}
              error={errors.correo}
              required
              placeholder="juan@empresa.com"
            />
          </div>

          <Input
            label={editingUser ? "Nueva Contraseña (dejar vacío para mantener)" : "Contraseña"}
            type="password"
            value={formData.contrasena}
            onChange={(e) => handleChange("contrasena", e.target.value)}
            error={errors.contrasena}
            required={!editingUser}
            placeholder="••••••••"
            hint={editingUser ? "Solo completa si deseas cambiar la contraseña" : "Mínimo 8 caracteres"}
          />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Select
              label="Rol"
              value={formData.rol}
              onChange={(e) => handleChange("rol", e.target.value)}
              options={ROLE_OPTIONS}
              required
            />

            <Select
              label="Estado"
              value={formData.estado}
              onChange={(e) => handleChange("estado", e.target.value)}
              options={STATUS_OPTIONS}
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Select
              label="Empresa"
              value={formData.empresa_id}
              onChange={(e) => handleChange("empresa_id", e.target.value)}
              options={[
                { value: "", label: "Seleccione una empresa" },
                ...companies.map((c) => ({ value: c.id, label: c.nombre })),
              ]}
              error={errors.empresa_id}
              required
            />

            <Select
              label="Sucursal"
              value={formData.sucursal_id}
              onChange={(e) => handleChange("sucursal_id", e.target.value)}
              options={[
                { value: "", label: "Seleccione una sucursal (opcional)" },
                ...filteredBranches.map((b) => ({ value: b.id, label: b.nombre })),
              ]}
              disabled={!formData.empresa_id}
              hint={!formData.empresa_id ? "Primero selecciona una empresa" : ""}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <Button type="button" onClick={onClose} className="bg-slate-100 text-slate-700 hover:bg-slate-200">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : editingUser ? (
                "Actualizar Usuario"
              ) : (
                "Crear Usuario"
              )}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}

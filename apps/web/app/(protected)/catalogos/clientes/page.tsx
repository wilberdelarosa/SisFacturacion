"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent, ChangeEvent } from "react";
import { Button } from "../../../../components/ui/Button";
import { Input } from "../../../../components/ui/Input";
import { Select } from "../../../../components/ui/Select";
import { Table } from "../../../../components/ui/Table";
import { Modal } from "../../../../components/ui/Modal";
import { supabase } from "../../../../lib/supabaseClient";
import { currentSession } from "../../../../lib/auth";

type ClienteRow = {
  id: string;
  codigo: string | null;
  nombre: string;
  rnc_o_cedula: string | null;
  tipo: string;
  telefono: string | null;
  correo: string | null;
  estado: string | null;
};

type Cliente = {
  id: string;
  codigo: string;
  nombre: string;
  rnc: string;
  tipo: string;
  telefono: string;
  email: string;
  estado: string;
};

type ClienteForm = {
  tipo: string;
  nombre: string;
  rnc: string;
  nombreComercial: string;
  telefono: string;
  email: string;
  contacto: string;
  cargoContacto: string;
  direccion: string;
  tipoPago: "CONTADO" | "CREDITO";
  limiteCredito: string;
  diasCredito: string;
};

const tiposCliente = [
  { value: "INDIVIDUAL", label: "Individual" },
  { value: "EMPRESA", label: "Empresa" },
];

const initialForm: ClienteForm = {
  tipo: "INDIVIDUAL",
  nombre: "",
  rnc: "",
  nombreComercial: "",
  telefono: "",
  email: "",
  contacto: "",
  cargoContacto: "",
  direccion: "",
  tipoPago: "CONTADO",
  limiteCredito: "",
  diasCredito: "0",
};

const supabaseConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const defaultCompanyId = process.env.NEXT_PUBLIC_DEFAULT_COMPANY_ID ?? null;

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [form, setForm] = useState<ClienteForm>(initialForm);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(defaultCompanyId);

  useEffect(() => {
    currentSession()
      .then((session) => {
        if (session?.empresaId) setCompanyId(session.empresaId);
      })
      .catch(() => {
        // keep default company id
      });
  }, []);

  const mapRow = (row: ClienteRow): Cliente => ({
    id: row.id,
    codigo: row.codigo || "—",
    nombre: row.nombre,
    rnc: row.rnc_o_cedula || "—",
    tipo: row.tipo,
    telefono: row.telefono || "—",
    email: row.correo || "—",
    estado: row.estado || "activo",
  });

  const fetchClientes = useCallback(async () => {
    if (!supabaseConfigured) {
      setError("Configura NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY para cargar los clientes.");
      return;
    }

    setLoading(true);
    setError(null);

    const query = supabase
      .from("clientes")
      .select("id,codigo,nombre,rnc_o_cedula,tipo,telefono,correo,estado")
      .order("nombre", { ascending: true });

    if (companyId) {
      query.eq("empresa_id", companyId);
    }

    const { data, error: fetchError } = await query;

    if (fetchError) {
      setError(fetchError.message);
      setLoading(false);
      return;
    }

    setClientes((data || []).map(mapRow));
    setLoading(false);
  }, [companyId]);

  useEffect(() => {
    fetchClientes();
  }, [fetchClientes]);

  const handleFormChange = (field: keyof ClienteForm) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!supabaseConfigured) {
      setError("Configura Supabase antes de crear clientes.");
      return;
    }

    if (!companyId) {
      setError("Define la empresa activa (NEXT_PUBLIC_DEFAULT_COMPANY_ID o session.empresaId).");
      return;
    }

    const { nombre, rnc, nombreComercial, telefono, email, contacto, cargoContacto, direccion, tipoPago, limiteCredito, diasCredito, tipo } = form;

    const payload = {
      empresa_id: companyId,
      nombre,
      rnc_o_cedula: rnc || null,
      nombre_comercial: nombreComercial || null,
      tipo,
      telefono: telefono || null,
      correo: email || null,
      contacto: contacto || null,
      cargo_contacto: cargoContacto || null,
      direccion: direccion || null,
      tipo_pago: tipoPago,
      limite_credito: limiteCredito ? Number(limiteCredito) : null,
      dias_credito: diasCredito ? Number(diasCredito) : null,
      estado: "activo",
    };

    const { data, error: insertError } = await supabase
      .from("clientes")
      .insert(payload)
      .select("id,codigo,nombre,rnc_o_cedula,tipo,telefono,correo,estado")
      .single();

    if (insertError) {
      setError(insertError.message);
      return;
    }

    if (data) {
      setClientes((prev) => [mapRow(data), ...prev]);
    }

    setForm(initialForm);
    setIsModalOpen(false);
  };

  const filteredClientes = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return clientes;
    return clientes.filter((cliente) =>
      [cliente.nombre, cliente.codigo, cliente.rnc, cliente.telefono, cliente.email]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(term)),
    );
  }, [clientes, searchTerm]);

  const columns = [
    { header: "Código", accessor: "codigo" as const },
    { header: "Nombre", accessor: "nombre" as const },
    { header: "RNC/Cédula", accessor: "rnc" as const },
    { header: "Tipo", accessor: "tipo" as const },
    { header: "Teléfono", accessor: "telefono" as const },
    { header: "Email", accessor: "email" as const },
    {
      header: "Estado",
      accessor: (row: Cliente) => (
        <span
          className={`rounded-full px-2 py-1 text-xs font-medium ${
            row.estado === "activo" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
          }`}
        >
          {row.estado}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Clientes</h1>
          <p className="mt-1 text-sm text-slate-600">Gestiona tu cartera de clientes</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Cliente
        </Button>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
          <div className="flex-1">
            <Input
              placeholder="Buscar por nombre, RNC o código..."
              value={searchTerm}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="secondary" onClick={fetchClientes}>
            <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
            Refrescar
          </Button>
        </div>

        {error && <p className="mb-3 text-sm text-amber-700">{error}</p>}
        {loading && <p className="mb-3 text-sm text-slate-600">Cargando clientes...</p>}

        <Table columns={columns} data={filteredClientes} emptyMessage="No hay clientes registrados" />
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nuevo Cliente" size="lg">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Código" placeholder="AUTO" disabled />
            <Select label="Tipo" options={tiposCliente} value={form.tipo} onChange={handleFormChange("tipo")} required />
          </div>

          <Input
            label="Nombre o Razón Social"
            placeholder="Ej: Juan Pérez o Empresa XYZ"
            value={form.nombre}
            onChange={handleFormChange("nombre")}
            required
          />

          <div className="grid gap-4 md:grid-cols-2">
            <Input label="RNC/Cédula" placeholder="000-0000000-0" value={form.rnc} onChange={handleFormChange("rnc")} required />
            <Input
              label="Nombre Comercial"
              placeholder="Opcional"
              value={form.nombreComercial}
              onChange={handleFormChange("nombreComercial")}
            />
          </div>

          <Input label="Dirección" placeholder="Calle, sector, ciudad" value={form.direccion} onChange={handleFormChange("direccion")} />

          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Teléfono" type="tel" placeholder="(809) 000-0000" value={form.telefono} onChange={handleFormChange("telefono")} required />
            <Input label="Email" type="email" placeholder="cliente@ejemplo.com" value={form.email} onChange={handleFormChange("email")} required />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Contacto" placeholder="Nombre del contacto" value={form.contacto} onChange={handleFormChange("contacto")} />
            <Input
              label="Cargo del Contacto"
              placeholder="Ej: Gerente de Compras"
              value={form.cargoContacto}
              onChange={handleFormChange("cargoContacto")}
            />
          </div>

          <div className="border-t border-slate-700 pt-4">
            <h3 className="mb-3 text-sm font-semibold text-slate-900">Configuración de Crédito</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <Select
                label="Tipo de Pago"
                options={[
                  { value: "CONTADO", label: "Contado" },
                  { value: "CREDITO", label: "Crédito" },
                ]}
                value={form.tipoPago}
                onChange={handleFormChange("tipoPago")}
              />
              <Input
                label="Límite de Crédito"
                type="number"
                placeholder="0.00"
                value={form.limiteCredito}
                onChange={handleFormChange("limiteCredito")}
              />
              <Input
                label="Días de Crédito"
                type="number"
                placeholder="0"
                value={form.diasCredito}
                onChange={handleFormChange("diasCredito")}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
            <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">Guardar Cliente</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

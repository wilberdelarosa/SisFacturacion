"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "../../../../components/ui/Button";
import { Input } from "../../../../components/ui/Input";
import { Select } from "../../../../components/ui/Select";
import { Table } from "../../../../components/ui/Table";
import { Modal } from "../../../../components/ui/Modal";
import { supabase } from "../../../../lib/supabaseClient";
import { currentSession } from "../../../../lib/auth";

type Producto = {
  id: string;
  codigo: string;
  nombre: string;
  tipo: string;
  precio: number;
  unidad: string;
  impuesto: number;
  estado: string;
};

type ProductoForm = {
  tipo: string;
  nombre: string;
  descripcion: string;
  precio: string;
  costo: string;
  unidad: string;
  impuesto: string;
  categoria: string;
};

const tiposProducto = [
  { value: "", label: "Seleccionar..." },
  { value: "PRODUCTO", label: "Producto" },
  { value: "SERVICIO", label: "Servicio" },
  { value: "ALQUILER", label: "Alquiler" },
  { value: "TRANSPORTE", label: "Transporte" },
];

const unidades = [
  { value: "UND", label: "Unidad" },
  { value: "CJA", label: "Caja" },
  { value: "KG", label: "Kilogramo" },
  { value: "M", label: "Metro" },
  { value: "HR", label: "Hora" },
  { value: "DIA", label: "Día" },
];

const supabaseConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const initialForm: ProductoForm = {
  tipo: "",
  nombre: "",
  descripcion: "",
  precio: "",
  costo: "",
  unidad: "",
  impuesto: "18.00",
  categoria: "",
};

export default function ProductosPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [form, setForm] = useState<ProductoForm>(initialForm);
  const [companyId, setCompanyId] = useState<string | null>(process.env.NEXT_PUBLIC_DEFAULT_COMPANY_ID ?? null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadCompany = useCallback(() => {
    currentSession()
      .then((session) => {
        if (session?.empresaId) setCompanyId(session.empresaId);
      })
      .catch(() => undefined);
  }, []);

  const fetchProductos = useCallback(async () => {
    if (!supabaseConfigured) {
      setError("Configura Supabase para cargar productos.");
      return;
    }

    setLoading(true);
    setError(null);

    const query = supabase
      .from("productos_servicios")
      .select("id,codigo,nombre,tipo,precio_unitario,unidad,tasa_impuesto,estado")
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

    setProductos(
      (data || []).map((row) => ({
        id: row.id,
        codigo: row.codigo || "—",
        nombre: row.nombre,
        tipo: row.tipo,
        precio: Number(row.precio_unitario) || 0,
        unidad: row.unidad || "",
        impuesto: Number(row.tasa_impuesto) || 0,
        estado: row.estado || "activo",
      }))
    );
    setLoading(false);
  }, [companyId]);

  useEffect(() => {
    loadCompany();
  }, [loadCompany]);

  useEffect(() => {
    fetchProductos();
  }, [fetchProductos]);

  const handleFormChange = (field: keyof ProductoForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!supabaseConfigured) {
      setError("Supabase no está configurado.");
      return;
    }

    if (!companyId) {
      setError("Define la empresa activa (NEXT_PUBLIC_DEFAULT_COMPANY_ID o session.empresaId).");
      return;
    }

    const { tipo, nombre, descripcion, precio, costo, unidad, impuesto, categoria } = form;

    const payload = {
      empresa_id: companyId,
      tipo,
      nombre,
      descripcion: descripcion || null,
      precio_unitario: precio ? Number(precio) : 0,
      costo: costo ? Number(costo) : null,
      unidad: unidad || null,
      tasa_impuesto: impuesto ? Number(impuesto) : null,
      categoria: categoria || null,
      estado: "activo",
    };

    const { data, error: insertError } = await supabase
      .from("productos_servicios")
      .insert(payload)
      .select("id,codigo,nombre,tipo,precio_unitario,unidad,tasa_impuesto,estado")
      .single();

    if (insertError) {
      setError(insertError.message);
      return;
    }

    if (data) {
      setProductos((prev) => [
        {
          id: data.id,
          codigo: data.codigo || "—",
          nombre: data.nombre,
          tipo: data.tipo,
          precio: Number(data.precio_unitario) || 0,
          unidad: data.unidad || "",
          impuesto: Number(data.tasa_impuesto) || 0,
          estado: data.estado || "activo",
        },
        ...prev,
      ]);
    }

    setForm(initialForm);
    setIsModalOpen(false);
  };

  const filteredProductos = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return productos;
    return productos.filter((producto) => [producto.nombre, producto.codigo, producto.tipo].some((field) => field.toLowerCase().includes(term)));
  }, [productos, searchTerm]);

  const columns = [
    { header: "Código", accessor: "codigo" as const },
    { header: "Nombre", accessor: "nombre" as const },
    { header: "Tipo", accessor: "tipo" as const },
    {
      header: "Precio",
      accessor: (row: Producto) => row.precio.toLocaleString("es-DO", { style: "currency", currency: "DOP" }),
      className: "text-right",
    },
    { header: "Unidad", accessor: "unidad" as const },
    {
      header: "Impuesto",
      accessor: (row: Producto) => `${row.impuesto.toFixed(2)}%`,
      className: "text-right",
    },
    {
      header: "Estado",
      accessor: (row: Producto) => (
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
          <h1 className="text-2xl font-bold text-slate-900">Productos y Servicios</h1>
          <p className="mt-1 text-sm text-slate-600">Gestiona tu catálogo conectado a la base de datos</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Producto
        </Button>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex gap-4">
          <div className="flex-1">
            <Input
              placeholder="Buscar por nombre o código..."
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="secondary" onClick={fetchProductos}>
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
        {loading && <p className="mb-3 text-sm text-slate-600">Cargando productos...</p>}

        <Table columns={columns} data={filteredProductos} emptyMessage="No hay productos registrados" />
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nuevo Producto/Servicio" size="lg">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Código" placeholder="AUTO" disabled />
            <Select label="Tipo" options={tiposProducto} required value={form.tipo} onChange={handleFormChange("tipo")} />
          </div>

          <Input label="Nombre" placeholder="Ej: Servicio de Consultoría" required value={form.nombre} onChange={handleFormChange("nombre")} />

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Descripción</label>
            <textarea
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              rows={3}
              placeholder="Descripción detallada del producto o servicio"
              value={form.descripcion}
              onChange={handleFormChange("descripcion")}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Input label="Precio Unitario" type="number" placeholder="0.00" required step="0.01" value={form.precio} onChange={handleFormChange("precio")} />
            <Input label="Costo" type="number" placeholder="0.00" step="0.01" value={form.costo} onChange={handleFormChange("costo")} />
            <Select label="Unidad" options={unidades} required value={form.unidad} onChange={handleFormChange("unidad")} />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Tasa de Impuesto (%)" type="number" placeholder="18.00" value={form.impuesto} onChange={handleFormChange("impuesto")} step="0.01" />
            <Input label="Categoría" placeholder="Ej: Servicios profesionales" value={form.categoria} onChange={handleFormChange("categoria")} />
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
            <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">Guardar Producto</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

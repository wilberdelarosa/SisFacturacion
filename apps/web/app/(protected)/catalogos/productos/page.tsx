"use client";

import { useState } from "react";
import { Button } from "../../../../components/ui/Button";
import { Input } from "../../../../components/ui/Input";
import { Select } from "../../../../components/ui/Select";
import { Table } from "../../../../components/ui/Table";
import { Modal } from "../../../../components/ui/Modal";

type Producto = {
  id: string;
  codigo: string;
  nombre: string;
  tipo: string;
  precio: string;
  unidad: string;
  impuesto: string;
  estado: string;
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

export default function ProductosPage() {
  const [productos] = useState<Producto[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const columns = [
    { header: "Código", accessor: "codigo" as const },
    { header: "Nombre", accessor: "nombre" as const },
    { header: "Tipo", accessor: "tipo" as const },
    { header: "Precio", accessor: "precio" as const, className: "text-right" },
    { header: "Unidad", accessor: "unidad" as const },
    { header: "Impuesto", accessor: "impuesto" as const, className: "text-right" },
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
          <h1 className="text-2xl font-bold text-white">Productos y Servicios</h1>
          <p className="mt-1 text-sm text-slate-400">Gestiona tu catálogo de productos y servicios</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Producto
        </Button>
      </div>

      <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
        <div className="mb-4 flex gap-4">
          <div className="flex-1">
            <Input
              placeholder="Buscar por nombre o código..."
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="secondary">
            <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
            Filtros
          </Button>
        </div>

        <Table columns={columns} data={productos} emptyMessage="No hay productos registrados" />
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nuevo Producto/Servicio" size="lg">
        <form className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Código" placeholder="AUTO" disabled />
            <Select label="Tipo" options={tiposProducto} required />
          </div>

          <Input label="Nombre" placeholder="Ej: Servicio de Consultoría" required />

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">Descripción</label>
            <textarea
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              rows={3}
              placeholder="Descripción detallada del producto o servicio"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Input label="Precio Unitario" type="number" placeholder="0.00" required step="0.01" />
            <Input label="Costo" type="number" placeholder="0.00" step="0.01" />
            <Select label="Unidad" options={unidades} required />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Tasa de Impuesto (%)" type="number" placeholder="18.00" defaultValue="18.00" step="0.01" />
            <Input label="Categoría" placeholder="Ej: Servicios profesionales" />
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-700 pt-4">
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

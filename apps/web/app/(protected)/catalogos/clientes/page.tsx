"use client";

import { useState } from "react";
import { Button } from "../../../../components/ui/Button";
import { Input } from "../../../../components/ui/Input";
import { Select } from "../../../../components/ui/Select";
import { Table } from "../../../../components/ui/Table";
import { Modal } from "../../../../components/ui/Modal";

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

const tiposCliente = [
  { value: "", label: "Seleccionar..." },
  { value: "INDIVIDUAL", label: "Individual" },
  { value: "EMPRESA", label: "Empresa" },
];

export default function ClientesPage() {
  const [clientes] = useState<Cliente[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

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
          <h1 className="text-2xl font-bold text-white">Clientes</h1>
          <p className="mt-1 text-sm text-slate-400">Gestiona tu cartera de clientes</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Cliente
        </Button>
      </div>

      <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
        <div className="mb-4 flex gap-4">
          <div className="flex-1">
            <Input
              placeholder="Buscar por nombre, RNC o código..."
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

        <Table columns={columns} data={clientes} emptyMessage="No hay clientes registrados" />
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nuevo Cliente" size="lg">
        <form className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Código" placeholder="AUTO" disabled />
            <Select label="Tipo" options={tiposCliente} required />
          </div>

          <Input label="Nombre o Razón Social" placeholder="Ej: Juan Pérez o Empresa XYZ" required />

          <div className="grid gap-4 md:grid-cols-2">
            <Input label="RNC/Cédula" placeholder="000-0000000-0" required />
            <Input label="Nombre Comercial" placeholder="Opcional" />
          </div>

          <Input label="Dirección" placeholder="Calle, sector, ciudad" />

          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Teléfono" type="tel" placeholder="(809) 000-0000" required />
            <Input label="Email" type="email" placeholder="cliente@ejemplo.com" required />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Contacto" placeholder="Nombre del contacto" />
            <Input label="Cargo del Contacto" placeholder="Ej: Gerente de Compras" />
          </div>

          <div className="border-t border-slate-700 pt-4">
            <h3 className="mb-3 text-sm font-semibold text-white">Configuración de Crédito</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <Select
                label="Tipo de Pago"
                options={[
                  { value: "CONTADO", label: "Contado" },
                  { value: "CREDITO", label: "Crédito" },
                ]}
              />
              <Input label="Límite de Crédito" type="number" placeholder="0.00" />
              <Input label="Días de Crédito" type="number" placeholder="0" />
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-700 pt-4">
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

"use client";

import { useState } from "react";
import { Button } from "../../../../../components/ui/Button";
import { Input } from "../../../../../components/ui/Input";
import { Select } from "../../../../../components/ui/Select";
import { useRouter } from "next/navigation";

type Item = {
  id: string;
  producto: string;
  descripcion: string;
  cantidad: number;
  precio: number;
  descuento: number;
  impuesto: number;
  total: number;
};

const tiposNCF = [
  { value: "B01", label: "B01 - Crédito Fiscal" },
  { value: "B02", label: "B02 - Consumidor Final" },
  { value: "B14", label: "B14 - Régimen Especial" },
  { value: "B15", label: "B15 - Gubernamental" },
];

export default function NuevaFacturaPage() {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);

  const agregarItem = () => {
    const nuevoItem: Item = {
      id: Date.now().toString(),
      producto: "Producto de ejemplo",
      descripcion: "Descripción del producto",
      cantidad: 1,
      precio: 100,
      descuento: 0,
      impuesto: 18,
      total: 118,
    };
    setItems([...items, nuevoItem]);
  };

  const eliminarItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const subtotal = items.reduce((sum, item) => sum + item.precio * item.cantidad, 0);
  const descuentoTotal = items.reduce((sum, item) => sum + (item.precio * item.cantidad * item.descuento) / 100, 0);
  const impuestoTotal = items.reduce((sum, item) => sum + ((item.precio * item.cantidad - (item.precio * item.cantidad * item.descuento) / 100) * item.impuesto) / 100, 0);
  const total = subtotal - descuentoTotal + impuestoTotal;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Nueva Factura</h1>
          <p className="mt-1 text-sm text-slate-400">Crea una nueva factura con comprobante fiscal</p>
        </div>
        <Button variant="ghost" onClick={() => router.back()}>
          ← Volver
        </Button>
      </div>

      <form className="space-y-6">
        {/* Datos del Cliente */}
        <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">Datos del Cliente</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <Select
                label="Cliente"
                options={[
                  { value: "", label: "Seleccionar cliente..." },
                  { value: "1", label: "JESUS - 101-00222-3" },
                ]}
                required
              />
            </div>
            <Input label="RNC/Cédula" placeholder="Automático" disabled />
            <Input label="Dirección" placeholder="Automático" disabled />
          </div>
        </div>

        {/* Datos de la Factura */}
        <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">Datos de la Factura</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <Input label="Número de Factura" placeholder="AUTO" disabled />
            <Select label="Tipo de NCF" options={tiposNCF} required />
            <Input label="NCF" placeholder="Se asignará automáticamente" disabled />
            <Input label="Fecha de Emisión" type="date" defaultValue={new Date().toISOString().split("T")[0]} required />
            <Input label="Fecha de Vencimiento" type="date" required />
            <Select
              label="Condición de Pago"
              options={[
                { value: "CONTADO", label: "Contado" },
                { value: "CREDITO", label: "Crédito" },
              ]}
            />
          </div>
        </div>

        {/* Items */}
        <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Items de la Factura</h2>
            <Button type="button" onClick={agregarItem} size="sm">
              <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Agregar Item
            </Button>
          </div>

          {items.length === 0 ? (
            <div className="rounded-lg bg-slate-700/50 p-8 text-center">
              <p className="text-sm text-slate-400">No hay items agregados</p>
              <Button type="button" onClick={agregarItem} variant="ghost" size="sm" className="mt-3">
                Agregar primer item
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-slate-700">
                  <tr className="text-left text-xs text-slate-400">
                    <th className="pb-3">Producto</th>
                    <th className="pb-3">Descripción</th>
                    <th className="pb-3 text-right">Cant.</th>
                    <th className="pb-3 text-right">Precio</th>
                    <th className="pb-3 text-right">Desc%</th>
                    <th className="pb-3 text-right">ITBIS%</th>
                    <th className="pb-3 text-right">Total</th>
                    <th className="pb-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {items.map((item) => (
                    <tr key={item.id} className="text-sm text-slate-300">
                      <td className="py-3">{item.producto}</td>
                      <td className="py-3">{item.descripcion}</td>
                      <td className="py-3 text-right">{item.cantidad}</td>
                      <td className="py-3 text-right">${item.precio.toFixed(2)}</td>
                      <td className="py-3 text-right">{item.descuento}%</td>
                      <td className="py-3 text-right">{item.impuesto}%</td>
                      <td className="py-3 text-right font-semibold">${item.total.toFixed(2)}</td>
                      <td className="py-3 text-right">
                        <button
                          type="button"
                          onClick={() => eliminarItem(item.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Totales */}
          {items.length > 0 && (
            <div className="mt-6 flex justify-end">
              <div className="w-80 space-y-2 rounded-lg border border-slate-700 bg-slate-900 p-4">
                <div className="flex justify-between text-sm text-slate-400">
                  <span>Subtotal:</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-400">
                  <span>Descuento:</span>
                  <span>-${descuentoTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-400">
                  <span>ITBIS (18%):</span>
                  <span>${impuestoTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-700 pt-2 text-lg font-bold text-white">
                  <span>Total:</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Notas */}
        <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
          <label className="mb-2 block text-sm font-medium text-slate-300">Notas / Observaciones</label>
          <textarea
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            rows={3}
            placeholder="Notas adicionales para la factura..."
          />
        </div>

        {/* Acciones */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button type="button" variant="secondary">
            Guardar como Borrador
          </Button>
          <Button type="submit">Emitir Factura</Button>
        </div>
      </form>
    </div>
  );
}

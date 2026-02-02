"use client";

import { useEffect, useState } from "react";
import { Button } from "../../../../../components/ui/Button";
import { Input } from "../../../../../components/ui/Input";
import { Select } from "../../../../../components/ui/Select";
import { useRouter } from "next/navigation";
import { supabase } from "../../../../../lib/supabaseClient";
import { currentSession } from "../../../../../lib/auth";
import { v4 as uuid } from "uuid";

type Item = {
  id: string;
  productoId: string;
  producto: string;
  descripcion: string;
  cantidad: number;
  precio: number;
  descuento: number;
  impuesto: number;
  total: number;
};

type ClienteOption = { id: string; label: string; rnc: string; direccion: string | null };
type ProductoOption = {
  id: string;
  nombre: string;
  precio: number;
  unidad: string;
  impuesto: number;
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
  const [clientes, setClientes] = useState<ClienteOption[]>([]);
  const [productos, setProductos] = useState<ProductoOption[]>([]);
  const [selectedCliente, setSelectedCliente] = useState<string>("");
  const [selectedProducto, setSelectedProducto] = useState<string>("");
  const [cantidad, setCantidad] = useState<string>("1");
  const [descuento, setDescuento] = useState<string>("0");
  const [tipoNCF, setTipoNCF] = useState<string>(tiposNCF[1].value);
  const [fechaEmision, setFechaEmision] = useState<string>(new Date().toISOString().split("T")[0]);
  const [fechaVencimiento, setFechaVencimiento] = useState<string>("");
  const [condicionPago, setCondicionPago] = useState<string>("CONTADO");
  const [notas, setNotas] = useState<string>("");
  const [empresaId, setEmpresaId] = useState<string | null>(process.env.NEXT_PUBLIC_DEFAULT_COMPANY_ID ?? null);
  const [sucursalId, setSucursalId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const supabaseConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  useEffect(() => {
    currentSession()
      .then((session) => {
        if (session?.empresaId) setEmpresaId(session.empresaId);
        if (session?.sucursalId) setSucursalId(session.sucursalId);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!supabaseConfigured) {
      setError("Supabase no está configurado.");
      return;
    }

    supabase
      .from("clientes")
      .select("id,nombre,rnc_o_cedula,direccion")
      .order("nombre", { ascending: true })
      .then(({ data, error: fetchError }) => {
        if (fetchError) {
          setError(fetchError.message);
          return;
        }
        setClientes(
          (data || []).map((c) => ({
            id: c.id,
            label: c.nombre,
            rnc: c.rnc_o_cedula || "",
            direccion: c.direccion || null,
          }))
        );
      });

    supabase
      .from("productos_servicios")
      .select("id,nombre,precio_unitario,unidad,tasa_impuesto")
      .order("nombre", { ascending: true })
      .then(({ data, error: fetchError }) => {
        if (fetchError) {
          setError(fetchError.message);
          return;
        }
        setProductos(
          (data || []).map((p) => ({
            id: p.id,
            nombre: p.nombre,
            precio: Number(p.precio_unitario) || 0,
            unidad: p.unidad || "UND",
            impuesto: Number(p.tasa_impuesto) || 0,
          }))
        );
      });
  }, [supabaseConfigured]);

  const agregarItem = () => {
    const producto = productos.find((p) => p.id === selectedProducto);
    if (!producto) {
      setError("Selecciona un producto antes de agregar.");
      return;
    }

    const qty = Number(cantidad) || 1;
    const descPct = Number(descuento) || 0;
    const base = producto.precio * qty;
    const descuentoMonto = base * (descPct / 100);
    const neto = base - descuentoMonto;
    const impuestoMonto = neto * (producto.impuesto / 100);
    const total = neto + impuestoMonto;

    const nuevoItem: Item = {
      id: uuid(),
      productoId: producto.id,
      producto: producto.nombre,
      descripcion: producto.nombre,
      cantidad: qty,
      precio: producto.precio,
      descuento: descPct,
      impuesto: producto.impuesto,
      total,
    };
    setItems((prev) => [...prev, nuevoItem]);
    setCantidad("1");
    setDescuento("0");
    setSelectedProducto("");
    setError(null);
  };

  const eliminarItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const subtotal = items.reduce((sum, item) => sum + item.precio * item.cantidad, 0);
  const descuentoTotal = items.reduce((sum, item) => sum + (item.precio * item.cantidad * item.descuento) / 100, 0);
  const impuestoTotal = items.reduce((sum, item) => sum + ((item.precio * item.cantidad - (item.precio * item.cantidad * item.descuento) / 100) * item.impuesto) / 100, 0);
  const total = subtotal - descuentoTotal + impuestoTotal;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!supabaseConfigured) {
      setError("Supabase no está configurado.");
      return;
    }

    if (!empresaId) {
      setError("Define la empresa activa (NEXT_PUBLIC_DEFAULT_COMPANY_ID o session.empresaId).");
      return;
    }

    if (!selectedCliente) {
      setError("Selecciona un cliente.");
      return;
    }

    if (items.length === 0) {
      setError("Agrega al menos un item.");
      return;
    }

    setSaving(true);
    setError(null);

    const numeroFactura = `FA-${Date.now()}`;
    const descuentoMonto = descuentoTotal;
    const gravado = subtotal - descuentoMonto;

    const facturaPayload = {
      numero_factura: numeroFactura,
      empresa_id: empresaId,
      sucursal_id: sucursalId,
      cliente_id: selectedCliente,
      fecha_emision: fechaEmision,
      fecha_vencimiento: fechaVencimiento || null,
      tipo_ncf: tipoNCF,
      numero_ncf: null,
      subtotal,
      descuento_total: descuentoMonto,
      valor_gravado: gravado,
      monto_impuesto: impuestoTotal,
      itbis_18: impuestoTotal,
      total,
      saldo_pendiente: total,
      notas: notas || null,
      estado: "pendiente_pago",
      estado_pago: "sin_pagar",
    } as const;

    const { data: facturaData, error: facturaError } = await supabase
      .from("facturas")
      .insert(facturaPayload)
      .select("id")
      .single();

    if (facturaError || !facturaData) {
      setError(facturaError?.message || "No se pudo crear la factura.");
      setSaving(false);
      return;
    }

    const itemsPayload = items.map((item, idx) => {
      const base = item.precio * item.cantidad;
      const descuentoMontoItem = base * (item.descuento / 100);
      const neto = base - descuentoMontoItem;
      const impuestoMontoItem = neto * (item.impuesto / 100);
      const totalItem = neto + impuestoMontoItem;

      return {
        factura_id: facturaData.id,
        producto_servicio_id: item.productoId,
        descripcion: item.descripcion,
        cantidad: item.cantidad,
        unidad: productos.find((p) => p.id === item.productoId)?.unidad || "UND",
        precio_unitario: item.precio,
        descuento: descuentoMontoItem,
        tasa_impuesto: item.impuesto,
        monto_impuesto: impuestoMontoItem,
        itbis: impuestoMontoItem,
        subtotal: neto,
        total: totalItem,
        orden: idx,
      };
    });

    const { error: itemError } = await supabase.from("facturas_items").insert(itemsPayload);

    if (itemError) {
      setError(itemError.message);
      setSaving(false);
      return;
    }

    setSaving(false);
    router.replace("/documentos/facturas");
  };

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

      <form className="space-y-6" onSubmit={handleSubmit}>
        {/* Datos del Cliente */}
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Datos del Cliente</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <Select
                label="Cliente"
                options={[{ value: "", label: "Seleccionar cliente..." }, ...clientes.map((c) => ({ value: c.id, label: `${c.label} ${c.rnc ? `- ${c.rnc}` : ""}` }))]}
                value={selectedCliente}
                onChange={(e) => setSelectedCliente(e.target.value)}
                required
              />
            </div>
            <Input label="RNC/Cédula" placeholder="Automático" disabled value={clientes.find((c) => c.id === selectedCliente)?.rnc || ""} />
            <Input label="Dirección" placeholder="Automático" disabled value={clientes.find((c) => c.id === selectedCliente)?.direccion || ""} />
          </div>
        </div>

        {/* Datos de la Factura */}
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Datos de la Factura</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <Input label="Número de Factura" placeholder="AUTO" disabled />
            <Select label="Tipo de NCF" options={tiposNCF} required value={tipoNCF} onChange={(e) => setTipoNCF(e.target.value)} />
            <Input label="NCF" placeholder="Se asignará automáticamente" disabled />
            <Input label="Fecha de Emisión" type="date" value={fechaEmision} onChange={(e) => setFechaEmision(e.target.value)} required />
            <Input label="Fecha de Vencimiento" type="date" value={fechaVencimiento} onChange={(e) => setFechaVencimiento(e.target.value)} />
            <Select
              label="Condición de Pago"
              options={[
                { value: "CONTADO", label: "Contado" },
                { value: "CREDITO", label: "Crédito" },
              ]}
              value={condicionPago}
              onChange={(e) => setCondicionPago(e.target.value)}
            />
          </div>
        </div>

        {/* Items */}
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Items de la Factura</h2>
            <Button type="button" onClick={agregarItem} size="sm">
              <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Agregar Item
            </Button>
          </div>

          <div className="mb-4 grid gap-3 md:grid-cols-4">
            <Select
              label="Producto"
              options={[{ value: "", label: "Selecciona un producto" }, ...productos.map((p) => ({ value: p.id, label: p.nombre }))]}
              value={selectedProducto}
              onChange={(e) => setSelectedProducto(e.target.value)}
            />
            <Input label="Cantidad" type="number" min="1" value={cantidad} onChange={(e) => setCantidad(e.target.value)} />
            <Input label="Descuento (%)" type="number" min="0" value={descuento} onChange={(e) => setDescuento(e.target.value)} />
            <div className="flex items-end">
              <Button type="button" className="w-full" onClick={agregarItem}>
                Añadir item
              </Button>
            </div>
          </div>

          {items.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
              <p className="text-sm text-slate-600">No hay items agregados</p>
              <Button type="button" onClick={agregarItem} variant="ghost" size="sm" className="mt-3">
                Agregar primer item
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-slate-200">
                  <tr className="text-left text-xs text-slate-600">
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
                <tbody className="divide-y divide-slate-200">
                  {items.map((item) => (
                    <tr key={item.id} className="text-sm text-slate-800">
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
                          className="text-red-600 hover:text-red-500"
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
              <div className="w-80 space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Subtotal:</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Descuento:</span>
                  <span>-${descuentoTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-600">
                  <span>ITBIS:</span>
                  <span>${impuestoTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-2 text-lg font-bold text-slate-900">
                  <span>Total:</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Notas */}
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <label className="mb-2 block text-sm font-medium text-slate-700">Notas / Observaciones</label>
          <textarea
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            rows={3}
            placeholder="Notas adicionales para la factura..."
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
          />
        </div>

        {/* Acciones */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button type="submit" variant="secondary" disabled={saving}>
            Guardar como Borrador
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Guardando..." : "Emitir Factura"}
          </Button>
        </div>

        {error && <p className="text-sm text-amber-700">{error}</p>}
      </form>
    </div>
  );
}

"use client";

import { IPurchase } from "../Types/Purchase.type";
import Image from "next/image";
import { useMemo } from "react";

type ViewPurchaseProps = {
  purchase: IPurchase;
};

const FALLBACK_IMG = "https://cdn-icons-png.flaticon.com/512/679/679720.png";

const formatCOP = (value: any) =>
  Number(value || 0).toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

/**
 * Evita el corrimiento de fecha por zona horaria:
 * - Si viene ISO string: "2026-03-05T12:00:00.000Z" => toma "2026-03-05"
 * - Devuelve "dd/mm/yyyy"
 */
const formatDateOnly = (value: string | Date | null | undefined) => {
  if (!value) return "";

  if (typeof value === "string") {
    const ymd = value.split("T")[0]; // YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(ymd)) {
      const [y, m, d] = ymd.split("-").map(Number);
      return `${d}/${m}/${y}`;
    }
  }

  // Fallback por si viene Date u otro formato
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return "";
  // Nota: este fallback sí puede aplicar TZ, pero solo se usa si no viene ISO normal
  return dt.toLocaleDateString("es-CO");
};

export default function ViewPurchase({ purchase }: ViewPurchaseProps) {
  const products = purchase.purchaseProducts ?? [];

  const statusLabel = useMemo(() => {
    const s = purchase.state?.name?.toLowerCase();
    return s === "approved"
      ? "Aprobada"
      : s === "revoke"
      ? "Anulada"
      : "Desconocido";
  }, [purchase.state?.name]);

  const statusClass = useMemo(() => {
    const s = purchase.state?.name?.toLowerCase();
    return s === "approved"
      ? "text-green-600 font-medium"
      : s === "revoke"
      ? "text-red-600 font-medium"
      : "text-gray-600 font-medium";
  }, [purchase.state?.name]);

  return (
    <div className="space-y-6 pr-2">
      <div className="bg-white border rounded-lg px-5 py-4 md:px-6 md:py-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base md:text-lg font-semibold">Resumen</h2>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Monto</span>
            <span className="text-lg md:text-l font-bold text-green-700 bg-green-50 px-3 py-1 rounded-lg border border-green-200 shadow-sm">
              {formatCOP(purchase.amount)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Field label="ID Compra" value={String(purchase.purchaseorderid)} />
          <Field label="N° Orden" value={purchase.numberoforder ?? ""} />
          <Field label="N° Factura" value={purchase.reference ?? ""} />

          <div>
            <label className="block text-sm font-medium text-gray-600">
              Estado
            </label>
            <input
              type="text"
              value={statusLabel}
              disabled
              className={`w-full border px-3 py-2 rounded-lg bg-gray-100 ${statusClass}`}
            />
          </div>

          <Field label="Fecha Registro" value={formatDateOnly(purchase.createdat as any)} />
          <Field
            label="Fecha Actualización"
            value={formatDateOnly(purchase.updatedat as any)}
          />

          <Field
            label="Orden de compra"
            value={
              purchase.purchaseOrder?.numeroOrden
                ? purchase.purchaseOrder.numeroOrden
                : purchase.purchaseOrderId
                ? String(purchase.purchaseOrderId)
                : "No aplica"
            }
          />

          <div className="lg:col-span-4">
            <Field
              label="Observación"
              value={purchase.observation || "Sin observación"}
              multiline
            />
          </div>
        </div>
      </div>

      <div className="bg-white border rounded-lg px-5 py-4 md:px-6 md:py-5">
        <h2 className="text-base md:text-lg font-semibold mb-3">Proveedor</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Field label="Nombre" value={purchase.supplier?.name ?? ""} />
          <Field label="NIT" value={purchase.supplier?.nit ?? ""} />
          <Field label="Teléfono" value={purchase.supplier?.phone ?? ""} />
          <Field label="Email" value={purchase.supplier?.email ?? ""} />
          <Field label="Dirección" value={purchase.supplier?.address ?? ""} />
          <Field
            label="Persona de Contacto"
            value={purchase.supplier?.contactname ?? ""}
          />
        </div>
      </div>

      <div className="bg-white border rounded-lg px-5 py-4 md:px-6 md:py-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base md:text-lg font-semibold">Productos</h2>
          <div className="text-xs text-gray-600">{products.length} item(s)</div>
        </div>

        {products.length === 0 ? (
          <div className="border rounded-lg bg-gray-50 p-4 text-sm text-gray-600">
            Esta compra no tiene productos asociados.
          </div>
        ) : (
          <div className="space-y-3">
            {products.map((item) => {
              const product = item.product;

              const proveedor = product?.productpriceofsupplier ?? item.unitprice;
              const venta = product?.productpriceofsale;

              return (
                <div
                  key={item.purchaseProductId}
                  className="border rounded-lg bg-gray-50 p-4 shadow-sm hover:shadow-md transition"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className="w-14 h-14 rounded-md bg-white border overflow-hidden flex items-center justify-center shrink-0">
                        <Image
                          src={
                            product?.image && product.image.trim() !== ""
                              ? product.image
                              : FALLBACK_IMG
                          }
                          alt={product?.productname ?? "Producto"}
                          width={56}
                          height={56}
                          className="w-full h-full object-contain"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-900 whitespace-normal break-words">
                          {product?.productname ?? "Producto sin nombre"}
                        </p>

                        <div className="mt-2 flex flex-wrap gap-2">
                          <Chip label={`ID ${String(product?.productid ?? "")}`} />
                          <Chip
                            label={
                              product?.productcode
                                ? `Código ${product.productcode}`
                                : "Sin código"
                            }
                          />
                        </div>
                      </div>
                    </div>

                    <div className="w-full lg:w-auto">
                      <div className="flex flex-wrap gap-2 lg:justify-end">
                        <Chip label={`Cant. ${item.quantity}`} />
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold text-green-700 bg-green-50 border border-green-200">
                          Subt. {formatCOP(item.subtotal)}
                        </span>
                      </div>

                      <div className="mt-2 flex flex-wrap gap-2 lg:justify-end">
                        <Chip label={`Prov. ${formatCOP(proveedor)}`} />
                        <Chip label={`Venta ${formatCOP(venta)}`} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  multiline,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-600">{label}</label>

      {multiline ? (
        <textarea
          value={value}
          disabled
          rows={4}
          className="w-full border px-3 py-2 rounded-lg bg-gray-100 text-gray-900 resize-none"
        />
      ) : (
        <input
          type="text"
          value={value}
          disabled
          className="w-full border px-3 py-2 rounded-lg bg-gray-100 text-gray-900"
        />
      )}
    </div>
  );
}

function Chip({ label, strong }: { label: string; strong?: boolean }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs border bg-white ${
        strong ? "text-gray-900 font-semibold" : "text-gray-700"
      }`}
    >
      {label}
    </span>
  );
}
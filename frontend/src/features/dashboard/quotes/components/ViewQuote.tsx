"use client";

import { IQuote } from "../types/Quote.type";

interface ViewQuoteProps {
  quote: IQuote;
  canComplete?: boolean;
  isCompleting?: boolean;
  onComplete?: () => Promise<void> | void;
  canFinalize?: boolean;
  isFinalizing?: boolean;
  onFinalize?: () => Promise<void> | void;
}

const formatCOP = (value: number | string) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(Number(value));

export default function ViewQuote({
  quote,
  canComplete = false,
  isCompleting = false,
  onComplete,
  canFinalize = false,
  isFinalizing = false,
  onFinalize,
}: ViewQuoteProps) {
  if (!quote) return null;

  const client = quote.customer?.users
    ? `${quote.customer.users.name} ${quote.customer.users.lastname}`
    : "—";

  const technician = quote.technician?.users
    ? `${quote.technician.users.name} ${quote.technician.users.lastname}`
    : "—";

  const createdAt = quote.createdat
    ? new Date(quote.createdat).toLocaleString("es-CO")
    : "—";

  const updatedAt = quote.updatedat
    ? new Date(quote.updatedat).toLocaleString("es-CO")
    : "—";

  return (
    <div className="flex flex-col gap-5 text-sm text-gray-800 p-4 max-h-[85vh] overflow-y-hidden">
      {/* ================================
       * INFORMACIÓN GENERAL
       * ================================ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="ID Cotización" value={quote.quotesid} />
        <Field label="Solicitud de servicio" value={quote.serviceRequestId} />
        <Field label="Cliente" value={client} />
        <Field label="Técnico" value={technician} />
        <Field label="Tipo de servicio" value={quote.servicetype ?? "—"} />
        <Field label="Estado" value={quote.state?.name ?? "—"} />
        <Field label="Fecha creación" value={createdAt} />
        <Field label="Última actualización" value={updatedAt} />
      </div>

      {/* ================================
       * OBSERVACIÓN
       * ================================ */}
      <div>
        <label className="block font-medium mb-1">Observación</label>
        <textarea
          disabled
          value={quote.observation ?? ""}
          rows={3}
          className="w-full border rounded-md px-3 py-2 bg-gray-100 resize-none"
        />
      </div>

      {/* ================================
       * DETALLES / PRODUCTOS
       * ================================ */}
      <div>
        <label className="block font-medium mb-2">
          Detalles de la cotización
        </label>

        <div className="border rounded-md bg-gray-50 divide-y">
          {quote.details?.map((d: any, index: number) => (
            <div
              key={d.quotedetailid ?? index}
              className="p-3 flex flex-col gap-1"
            >
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-900">
                  {d.description}
                </span>
                <span
                  className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    d.availability === "DISPONIBLE"
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {d.availability}
                </span>
              </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-gray-700 mt-1">
                  <Info
                    label="Producto ID"
                    value={d.productid ?? d.quotedetailid ?? "Manual"}
                  />
                <Info label="Cantidad" value={d.quantity} />
                <Info label="Precio unitario" value={formatCOP(d.unitprice)} />
                <Info label="Subtotal" value={formatCOP(d.subtotal)} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ================================
       * TOTALES
       * ================================ */}
      <div className="border-t pt-4 space-y-2 text-sm">
        <Row label="Subtotal" value={formatCOP(quote.subtotal)} />
        <Row label="IVA (19%)" value={formatCOP(quote.tax)} />
        <Row label="Total" value={formatCOP(quote.total)} bold />
      </div>

      {(canComplete && onComplete) || (canFinalize && onFinalize) ? (
        <div className="flex flex-wrap justify-end gap-2 mt-3">
          {canFinalize && onFinalize && (
            <button
              onClick={onFinalize}
              disabled={isFinalizing || isCompleting}
              className="bg-sky-600 text-white px-5 py-2 rounded-md shadow-sm hover:bg-sky-700 transition disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isFinalizing ? "Actualizando..." : "Finalizar cotización"}
            </button>
          )}
          {canComplete && onComplete && (
            <button
              onClick={onComplete}
              disabled={isCompleting || isFinalizing}
              className="bg-emerald-600 text-white px-5 py-2 rounded-md shadow-sm hover:bg-emerald-700 transition disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isCompleting ? "Generando venta..." : "Completar cotización"}
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}

/* ================================
 * COMPONENTES AUXILIARES
 * ================================ */

function Field({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label}
      </label>
      <input
        disabled
        value={value ?? "—"}
        className="w-full border rounded-md px-3 py-2 bg-gray-100 text-gray-800"
      />
    </div>
  );
}

function Info({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <span className="text-gray-500">{label}: </span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function Row({
  label,
  value,
  bold = false,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div className="flex justify-between">
      <span className={bold ? "font-semibold" : ""}>{label}</span>
      <span className={bold ? "font-semibold" : ""}>{value}</span>
    </div>
  );
}

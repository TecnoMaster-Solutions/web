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

const formatCOP = (value?: number | string | null) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(Number(value ?? 0));

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

  const hasActions = (canComplete && onComplete) || (canFinalize && onFinalize);
  const stateName = quote.state?.name ?? "—";
  const details = quote.details ?? [];

  return (
    <div className="space-y-4 text-sm text-gray-800">
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Cotización</p>
            <h2 className="text-lg font-semibold text-slate-900">#{quote.quotesid ?? "—"}</h2>
            <p className="text-sm text-slate-600">{client}</p>
          </div>
          <div className="text-right">
            <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              {stateName}
            </span>
            <p className="mt-2 text-xs text-slate-500">Total cotización</p>
            <p className="text-xl font-bold text-slate-900">{formatCOP(quote.total)}</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Solicitud de servicio" value={quote.serviceRequestId} />
          <Field label="Técnico" value={technician} />
          <Field label="Tipo de servicio" value={quote.servicetype ?? "—"} />
          <Field label="Última actualización" value={updatedAt} />
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:col-span-2">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-slate-900">Detalle de productos</h3>
            <span className="text-xs text-slate-500">{details.length} item(s)</span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2 pr-2 font-medium">Descripción</th>
                  <th className="px-2 py-2 font-medium">Disponibilidad</th>
                  <th className="px-2 py-2 font-medium">Cant.</th>
                  <th className="px-2 py-2 font-medium">Unitario</th>
                  <th className="py-2 pl-2 text-right font-medium">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {details.map((d: QuoteDetailItem, index: number) => (
                  <tr key={d.quotedetailid ?? index} className="border-b border-slate-100 last:border-b-0">
                    <td className="py-2 pr-2">
                      <p className="font-medium text-slate-800">{d.description ?? "Ítem sin descripción"}</p>
                      <p className="text-[11px] text-slate-500">
                        ID: {d.productid ?? d.quotedetailid ?? "Manual"}
                      </p>
                    </td>
                    <td className="px-2">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          d.availability === "DISPONIBLE"
                            ? "bg-green-100 text-green-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {d.availability ?? "—"}
                      </span>
                    </td>
                    <td className="px-2 font-medium text-slate-700">{d.quantity ?? "—"}</td>
                    <td className="px-2 font-medium text-slate-700">{formatCOP(d.unitprice)}</td>
                    <td className="py-2 pl-2 text-right font-semibold text-slate-900">
                      {formatCOP(d.subtotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!details.length ? (
            <p className="py-4 text-center text-xs text-slate-500">Esta cotización no tiene productos registrados.</p>
          ) : null}
        </section>

        <section className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="mb-2 text-sm font-semibold text-slate-900">Observación</h3>
            <p className="text-sm leading-relaxed text-slate-700">{quote.observation || "Sin observaciones."}</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-slate-900">Resumen</h3>
            <div className="space-y-2">
              <Row label="Subtotal" value={formatCOP(quote.subtotal)} />
              <Row label="Viaticos" value={formatCOP(quote.viaticos)} />
              <Row label="IVA (19%)" value={formatCOP(quote.tax)} />
              <Row label="Total" value={formatCOP(quote.total)} bold />
              <Row label="Creada" value={createdAt} />
            </div>
          </div>
        </section>
      </div>

      {hasActions ? (
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="flex flex-wrap justify-end gap-2">
            {canFinalize && onFinalize && (
              <button
                onClick={onFinalize}
                disabled={isFinalizing || isCompleting}
                className="rounded-md bg-sky-600 px-4 py-2 text-sm text-white shadow-sm transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isFinalizing ? "Actualizando..." : "Finalizar cotización"}
              </button>
            )}
            {canComplete && onComplete && (
              <button
                onClick={onComplete}
                disabled={isCompleting || isFinalizing}
                className="rounded-md bg-emerald-600 px-4 py-2 text-sm text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isCompleting ? "Generando venta..." : "Completar cotización"}
              </button>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Field({ label, value }: { label: string; value: FieldValue }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
      <p className="mb-0.5 text-[11px] font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="truncate text-sm font-medium text-slate-800" title={String(value ?? "—")}>
        {value ?? "—"}
      </p>
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
    <div className="flex items-center justify-between gap-3">
      <span className={bold ? "font-semibold text-slate-900" : "text-slate-600"}>{label}</span>
      <span className={bold ? "font-semibold text-slate-900" : "font-medium text-slate-800"}>{value}</span>
    </div>
  );
}

type FieldValue = string | number | null | undefined;
type QuoteDetailItem = NonNullable<IQuote["details"]>[number];

"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import RequireAuth from "@/features/auth/requireauth";
import { OrderServiceDTO, useOrderServiceDetail } from "../hooks/useOrderServices";

const IVA_RATE = 0.19;
const IVA_LABEL = `${Math.round(IVA_RATE * 100)}%`;

const currencyFormatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

const cn = (...v: Array<string | false | null | undefined>) => v.filter(Boolean).join(" ");

const stateStyles: Record<string, string> = {
  activo: "bg-emerald-600 text-white",
  pendiente: "bg-amber-300 text-slate-900",
  anulada: "bg-rose-600 text-white",
  garantia: "bg-sky-600 text-white",
  garantiareportada: "bg-sky-700 text-white",
};

interface OrderServiceDetailProps {
  orderId: number;
  embedded?: boolean;
}

const RequestLoader: React.FC<{ embedded?: boolean }> = ({ embedded }) => (
  <div
    className={cn(
      embedded ? "absolute inset-0" : "fixed inset-0",
      "z-50 flex items-center justify-center bg-black/50"
    )}
  >
    <div className="h-14 w-14 rounded-full border-4 border-red-600 border-t-transparent animate-spin" />
  </div>
);

const formatCurrency = (value?: number) => currencyFormatter.format(value ?? 0);

const normalizeStateKey = (value?: string) =>
  (value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "");

const normalizeTime = (time?: string) => {
  const t = (time ?? "").trim();
  if (!t) return "00:00:00";
  if (/^\d{2}:\d{2}$/.test(t)) return `${t}:00`;
  if (/^\d{2}:\d{2}:\d{2}$/.test(t)) return t;
  return "00:00:00";
};

const buildDateTime = (date?: string, time?: string) => {
  if (!date) return null;
  return new Date(`${date}T${normalizeTime(time)}`);
};

const formatDateTime = (value?: Date | null) =>
  value ? value.toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" }) : "-";

const isImageFile = (value: string) => /\.(jpe?g|png|gif|webp|bmp)$/i.test(value);

const safeNumber = (v: any) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const SectionCard: React.FC<{
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}> = ({ title, right, children, className }) => (
  <section className={cn("rounded-2xl border border-slate-200 bg-white/95 shadow-sm", className)}>
    <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-6 py-4">
      <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      {right}
    </div>
    <div className="px-6 py-5">{children}</div>
  </section>
);

const FilesGrid: React.FC<{ files: string[] }> = ({ files }) => {
  if (!files.length) return <p className="text-sm font-medium text-slate-500">No hay archivos adjuntos.</p>;

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {files.map((file, index) => {
        const isImg = isImageFile(file);

        return (
          <div key={`${file}-${index}`} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="bg-slate-50 p-2">
              {isImg ? (
                <img src={file} alt={`Archivo ${index + 1}`} className="h-44 w-full rounded-lg object-cover" />
              ) : (
                <div className="flex h-44 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-white px-3 text-center">
                  <p className="text-xs font-semibold text-slate-700">Archivo #{index + 1}</p>
                </div>
              )}
            </div>

            <div className="px-3 py-2">
              <a
                href={file}
                target="_blank"
                rel="noreferrer"
                className="block w-full rounded-md bg-slate-900 px-3 py-2 text-center text-xs font-semibold text-white hover:bg-slate-800"
              >
                Abrir archivo
              </a>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const TechnicianCard: React.FC<{ tech: OrderServiceDTO["technicians"][0] }> = ({ tech }) => {
  const name = tech?.users
    ? [tech.users.name ?? "", tech.users.lastname ?? ""].filter(Boolean).join(" ").trim()
    : `Técnico ${tech?.technicianid ?? "N/A"}`;

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="min-w-0 truncate text-sm font-semibold text-slate-900">{name || "Técnico"}</p>
      {(tech as any)?.CV ? (
        <a
          href={(tech as any).CV}
          target="_blank"
          rel="noreferrer"
          className="shrink-0 text-xs font-semibold uppercase text-amber-700 hover:underline"
        >
          Ver CV
        </a>
      ) : null}
    </div>
  );
};

type ServiceLine = {
  ordersservicesservicesid?: number | string;
  cantidad?: number;
  unitprice?: number;
  subtotal?: number;
  service?: {
    name?: string;
    typeofservice?: { name?: string };
  };
};

type HistoryEntry = {
  ordersserviceshistoryid: number;
  actionlabel?: string;
  description?: string | null;
  createdat?: string;
  message?: string;
  action?: string;
  type?: string;
  actoruserid?: number | null;
  technician?: any;
  user?: any;
  users?: any;
  actor?: any;
  createdby?: any;
  [key: string]: any;
};

const getFullName = (u: any) => {
  const name = [u?.name ?? "", u?.lastname ?? ""].filter(Boolean).join(" ").trim();
  return name || "";
};

const pickActorLabel = (entry: HistoryEntry) => {
  const candidates = [
    entry?.technician?.users,
    entry?.technician?.user,
    entry?.technician,
    entry?.actor?.users,
    entry?.actor,
    entry?.createdby?.users,
    entry?.createdby,
    entry?.user,
    entry?.users,
  ];

  for (const c of candidates) {
    const fromUsers = getFullName(c?.users);
    if (fromUsers) return fromUsers;

    const direct = getFullName(c);
    if (direct) return direct;
  }

  const id = entry?.actoruserid ?? entry?.userid ?? entry?.userId ?? null;
  return id != null ? `Usuario #${id}` : "Sistema";
};

const pickHistoryTitle = (entry: HistoryEntry) =>
  (entry?.actionlabel ?? entry?.title ?? entry?.message ?? entry?.action ?? "Evento").toString().trim() || "Evento";

const pickHistoryBody = (entry: HistoryEntry) => {
  const v = entry?.description ?? entry?.detail ?? entry?.details ?? null;
  if (typeof v === "string" && v.trim()) return v.trim();
  if (typeof entry?.message === "string" && entry.message.trim()) return entry.message.trim();
  return "";
};

const HistoryDetailsModal: React.FC<{
  open: boolean;
  entry: HistoryEntry | null;
  onClose: () => void;
  embedded?: boolean;
}> = ({ open, entry, onClose, embedded }) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !entry) return null;

  const created = entry.createdat ? new Date(entry.createdat) : null;
  const title = pickHistoryTitle(entry);
  const actor = pickActorLabel(entry);
  const body = pickHistoryBody(entry);

  return (
    <div
      className={cn(
        embedded ? "absolute inset-0" : "fixed inset-0",
        "z-[60] flex items-center justify-center bg-black/50 p-4"
      )}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-6 py-4">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wide text-slate-500">Detalle del evento</p>
            <p className="mt-1 truncate text-lg font-semibold text-slate-900">{title}</p>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-600">
              <span>{formatDateTime(created)}</span>
              <span className="text-slate-300">•</span>
              <span className="font-medium text-slate-700">Por: {actor}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cerrar
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-6 py-5">
          {body ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">Descripción</p>
              <p className="mt-2 whitespace-pre-line text-sm text-slate-800">{body}</p>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Este evento no tiene descripción.</p>
          )}
        </div>
      </div>
    </div>
  );
};

const OrderServiceDetailContent: React.FC<{ order: OrderServiceDTO; embedded?: boolean }> = ({ order, embedded }) => {
  const router = useRouter();
  const [selectedHistory, setSelectedHistory] = useState<HistoryEntry | null>(null);

  const scheduleStart = buildDateTime(order.fechainicio, order.horainicio);
  const scheduleEnd = buildDateTime(order.fechafin, order.horafin);

  const stateLabel = order.state?.name ?? "Sin estado";
  const headerStateColor = stateStyles[normalizeStateKey(stateLabel)] ?? "bg-slate-200 text-slate-900";

  const files = (order.files ?? []).filter(Boolean);

  const clientLabel = useMemo(() => {
    const client = (order as any)?.client;
    if (!client) return "Cliente no asignado";

    const base = client?.customer || client?.client || client;
    const u = base?.users || base?.user || base?.Users || {};

    const nameParts = [base?.name ?? u?.name ?? "", base?.lastname ?? u?.lastname ?? ""]
      .filter(Boolean)
      .join(" ")
      .trim();

    const altName = String(
      base?.fullname ??
        base?.fullName ??
        base?.customername ??
        base?.customerName ??
        base?.clientname ??
        base?.clientName ??
        ""
    )
      .trim();

    const city = base?.customercity ?? base?.city ?? "";
    const labelParts = [nameParts || altName, city].filter(Boolean).join(" - ");

    const id =
      base?.customerid ??
      base?.clientid ??
      base?.customer_id ??
      base?.client_id ??
      base?.id ??
      client?.userid ??
      "";

    return labelParts || `Cliente ${id ?? ""}`;
  }, [order.client]);

  const serviceItems: ServiceLine[] = useMemo(() => {
    const v = (order as any)?.services;
    return Array.isArray(v) ? (v as ServiceLine[]) : [];
  }, [order]);

  const historyEntries: HistoryEntry[] = useMemo(() => {
    const v = (order as any)?.history;
    return Array.isArray(v) ? (v as HistoryEntry[]) : [];
  }, [order]);

  const viaticos = useMemo(() => safeNumber((order as any)?.viaticos ?? 0), [order]);

  const totalProducts = useMemo(
    () => order.products?.reduce((sum, item) => sum + safeNumber(item.subtotal), 0) ?? 0,
    [order.products]
  );

  const totalServices = useMemo(() => {
    return serviceItems.reduce((sum, item) => {
      const qty = safeNumber(item.cantidad);
      const unit = safeNumber(item.unitprice);
      const sub = typeof item.subtotal === "number" && Number.isFinite(item.subtotal) ? item.subtotal : unit * qty;
      return sum + safeNumber(sub);
    }, 0);
  }, [serviceItems]);

  const subtotal = totalProducts + totalServices + viaticos;
  const iva = Math.max(0, Math.round(subtotal * IVA_RATE));
  const total = subtotal + iva;

  const firstServiceType = serviceItems?.[0]?.service?.typeofservice?.name ?? "-";

  return (
    <div className={cn(embedded ? "space-y-4" : "space-y-6")}>
      <section
        className={cn(
          "rounded-2xl border border-slate-200 bg-white/95 shadow-sm",
          embedded && "sticky top-0 z-10"
        )}
      >
        <div className="border-b border-slate-100 px-6 py-4">
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-slate-700">
                <path
                  d="M15 18l-6-6 6-6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Volver
            </button>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wide text-slate-400">Orden de servicio</p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold text-slate-900">
                  OS-{String(order.ordersservicesid).padStart(6, "0")}
                </h1>
                <span className={cn("inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold", headerStateColor)}>
                  {stateLabel}
                </span>
              </div>

              <p className="mt-2 text-sm text-slate-700 whitespace-pre-line">
                {order.description || "Sin descripción adicional del servicio."}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 lg:text-right">
              <p className="text-xs uppercase tracking-wide text-slate-500">Total</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">{formatCurrency(total)}</p>

              <div className="mt-2 space-y-1 text-xs text-slate-600">
                <div className="flex items-center justify-between gap-3">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-800">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>IVA ({IVA_LABEL})</span>
                  <span className="font-semibold text-slate-800">{formatCurrency(iva)}</span>
                </div>
              </div>

              <p className="mt-2 text-xs text-slate-500">
                Tipo: <span className="font-semibold text-slate-700 capitalize">{firstServiceType}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 py-5">
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">Inicio</p>
              <p className="mt-1 text-sm font-medium text-slate-900">{formatDateTime(scheduleStart)}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">Fin</p>
              <p className="mt-1 text-sm font-medium text-slate-900">{formatDateTime(scheduleEnd)}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">Cliente</p>
              <p className="mt-1 text-sm font-medium text-slate-900">{clientLabel}</p>
            </div>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-1">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Productos</span>
                <span className="font-semibold text-slate-900">{formatCurrency(totalProducts)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-slate-600">Servicios</span>
                <span className="font-semibold text-slate-900">{formatCurrency(totalServices)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-slate-600">Viáticos</span>
                <span className="font-semibold text-slate-900">{formatCurrency(viaticos)}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-7">
          <SectionCard
            title="Productos"
            right={<span className="text-sm font-medium text-slate-600">{formatCurrency(totalProducts)}</span>}
          >
            {order.products && order.products.length > 0 ? (
              <div className="overflow-hidden rounded-xl border border-slate-200">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-4 py-3">Producto</th>
                        <th className="px-4 py-3 text-center whitespace-nowrap">Cant.</th>
                        <th className="px-4 py-3 text-right whitespace-nowrap">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {order.products.map((item) => (
                        <tr key={item.ordersservicesproductsid}>
                          <td className="px-4 py-3">
                            <p className="text-sm font-medium text-slate-900">
                              {item.product?.productname ?? "Producto sin nombre"}
                            </p>
                          </td>
                          <td className="px-4 py-3 text-center text-slate-700">{item.cantidad}</td>
                          <td className="px-4 py-3 text-right font-semibold text-slate-900">
                            {formatCurrency(item.subtotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500">No se registraron productos.</p>
            )}
          </SectionCard>

          <SectionCard
            title="Servicios"
            right={<span className="text-sm font-medium text-slate-600">{formatCurrency(totalServices)}</span>}
          >
            {serviceItems.length > 0 ? (
              <div className="overflow-hidden rounded-xl border border-slate-200">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-4 py-3">Servicio</th>
                        <th className="px-4 py-3 text-center whitespace-nowrap">Cant.</th>
                        <th className="px-4 py-3 text-right whitespace-nowrap">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {serviceItems.map((item, idx) => {
                        const qty = safeNumber(item.cantidad);
                        const unit = safeNumber(item.unitprice);
                        const sub =
                          typeof item.subtotal === "number" && Number.isFinite(item.subtotal) ? item.subtotal : unit * qty;

                        return (
                          <tr key={String(item.ordersservicesservicesid ?? idx)}>
                            <td className="px-4 py-3">
                              <p className="text-sm font-medium text-slate-900">
                                {item.service?.name ?? "Servicio sin nombre"}
                              </p>
                              {item.service?.typeofservice?.name ? (
                                <p className="text-xs text-slate-500">Tipo: {item.service.typeofservice.name}</p>
                              ) : null}
                            </td>
                            <td className="px-4 py-3 text-center text-slate-700">{qty}</td>
                            <td className="px-4 py-3 text-right font-semibold text-slate-900">{formatCurrency(sub)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500">No se registraron servicios.</p>
            )}
          </SectionCard>
        </div>

        <div className="space-y-4 lg:col-span-5">
          <SectionCard title="Técnicos">
            {(order.technicians ?? []).length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                {(order.technicians ?? []).map((tech) => (
                  <TechnicianCard key={tech.technicianid ?? `${(tech as any).userid ?? ""}`} tech={tech} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No hay técnicos asignados.</p>
            )}
          </SectionCard>

          <SectionCard
            title="Archivos"
            right={<span className="text-xs uppercase tracking-wide text-slate-400">{files.length}</span>}
          >
            <FilesGrid files={files} />
          </SectionCard>
        </div>
      </div>

      <SectionCard
        title="Historial"
        right={
          <span className="text-xs uppercase tracking-wide text-slate-400">
            {historyEntries.length} evento{historyEntries.length === 1 ? "" : "s"}
          </span>
        }
      >
        {historyEntries.length === 0 ? (
          <p className="text-sm text-slate-500">No hay registros.</p>
        ) : (
          <div className="relative space-y-3">
            <div className="absolute left-2 top-2 h-[calc(100%-8px)] w-px bg-slate-200" />

            {historyEntries.map((entry) => {
              const title = pickHistoryTitle(entry);
              const actor = pickActorLabel(entry);

              return (
                <div key={entry.ordersserviceshistoryid} className="relative pl-8">
                  <div className="absolute left-0 top-3 h-4 w-4 rounded-full border-2 border-slate-300 bg-white" />

                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs uppercase tracking-wide text-slate-500">
                          {entry.createdat ? formatDateTime(new Date(entry.createdat)) : "-"}
                        </p>
                        <p className="mt-1 truncate text-sm font-semibold text-slate-900">{title}</p>
                        <p className="mt-1 text-sm text-slate-600">
                          Por: <span className="font-medium text-slate-700">{actor}</span>
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedHistory(entry)}
                        className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Ver detalles
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>

      <HistoryDetailsModal
        open={!!selectedHistory}
        entry={selectedHistory}
        onClose={() => setSelectedHistory(null)}
        embedded={embedded}
      />
    </div>
  );
};

const OrderServiceDetail: React.FC<OrderServiceDetailProps> = ({ orderId, embedded = false }) => {
  const { data, isLoading, isError } = useOrderServiceDetail(orderId);
  const invalidId = !Number.isFinite(orderId) || orderId <= 0;

  const Shell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    if (embedded) {
      return (
        <div className="relative">
          <div className="max-h-[80vh] overflow-y-auto bg-slate-50 p-4">{children}</div>
        </div>
      );
    }
    return (
      <RequireAuth>
        <div className="min-h-screen bg-slate-50 px-4 py-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </div>
      </RequireAuth>
    );
  };

  if (invalidId) {
    return (
      <Shell>
        <div className="flex items-center justify-center py-10">
          <div className="max-w-xl rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center">
            <p className="text-sm font-semibold text-rose-700">Identificador inválido</p>
            <p className="mt-2 text-sm text-rose-800">No se puede cargar esta orden.</p>
          </div>
        </div>
      </Shell>
    );
  }

  if (isLoading) {
    return (
      <Shell>
        <RequestLoader embedded={embedded} />
      </Shell>
    );
  }

  if (isError || !data) {
    return (
      <Shell>
        <div className="flex min-h-[40vh] items-center justify-center py-10">
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-6 py-5 text-center">
            <p className="text-sm font-semibold text-rose-700">No se pudo obtener la información</p>
            <p className="mt-1 text-sm text-rose-800">Intenta recargar o revisa tu conexión.</p>
          </div>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <OrderServiceDetailContent order={data} embedded={embedded} />
    </Shell>
  );
};

export default OrderServiceDetail;

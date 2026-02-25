"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Swal from "sweetalert2";
import RequireAuth from "@/features/auth/requireauth";
import { useAuth } from "@/features/auth/authcontext";
import { usePermissions } from "@/features/auth/hooks/usePermissions";
import { showError, showSuccess } from "@/shared/utils/notifications";
import ClientRequestModal, {
  type CreateRequestPayload,
} from "@/features/dashboard/requests/components/ClientRequestModal";
import EditRequestModal, {
  type EditRequestPayload,
} from "@/features/dashboard/requests/components/EditRequestModal";
import { useLookups } from "@/features/dashboard/requests/hooks/useLookups";
import { buildScheduledAt, splitDateTime } from "@/features/dashboard/requests/utils/schedule";
import {
  cancelServiceRequest,
  createServiceRequest,
  listServiceRequests,
  updateServiceRequest,
  type ServiceRequestDTO,
} from "@/features/dashboard/requests/services/servicerequests.service";

type EstadoKey = "Aprobada" | "Anulada" | "Pendiente" | "Finalizado" | "Agendada";

type Row = {
  id: number;
  cliente: string;
  clienteId?: number;
  servicio: string;
  serviceId?: number;
  tipo: string;
  fecha: string;
  direccion: string;
  descripcion: string;
  estado: string;
  estadoKey: EstadoKey;
  programada?: string | null;
  programadaEnd?: string | null;
  stateId?: number;
};

const ICONS = {
  edit: "/icons/Edit.svg",
  cancel: "/icons/minus-circle.svg",
  view: "/icons/Eye.svg",
  print: "/icons/printer.svg",
};
const MODULE_KEY = "servicesrequest";

const gridVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

function normalizeText(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function toPositiveId(value: any): number | null {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function extractAuthClientId(user: any, profile: any): number | null {
  const candidates = [
    user?.customerid,
    user?.clientid,
    user?.clientId,
    user?.customer?.customerid,
    user?.customers?.[0]?.customerid,
    user?.customer?.id,
    user?.customers?.[0]?.id,
    profile?.customerid,
    profile?.clientid,
    profile?.clientId,
    profile?.customer?.customerid,
    profile?.customers?.[0]?.customerid,
    profile?.customer?.id,
    profile?.customers?.[0]?.id,
  ];

  for (const candidate of candidates) {
    const id = toPositiveId(candidate);
    if (id) return id;
  }
  return null;
}

function extractRequestClientIds(r: any): number[] {
  const ids = [
    r?.clientId,
    r?.clientid,
    r?.customer?.customerid,
    r?.customer?.clientid,
    r?.customer?.id,
    r?.customer?.userid,
    r?.customer?.users?.userid,
    r?.customer?.users?.id,
  ];

  return Array.from(
    new Set(ids.map((id) => toPositiveId(id)).filter((id): id is number => id != null))
  );
}

function mapEstadoKey(name?: string | null): EstadoKey {
  const n = normalizeText(name);
  if (n.includes("anul") || n.includes("cancel")) return "Anulada";
  if (n.includes("final") || n.includes("complet") || n.includes("finish")) return "Finalizado";
  if (n.includes("agend") || n.includes("program")) return "Agendada";
  if (n.includes("aprob") || n.includes("approved")) return "Aprobada";
  return "Pendiente";
}

function mapTipo(input?: string | null) {
  const n = normalizeText(input);
  if (n.includes("instal")) return "Instalacion";
  if (n.includes("manten")) return "Mantenimiento";
  return String(input || "-").trim() || "-";
}

function formatDate(input?: string | null) {
  if (!input) return "-";
  const dt = new Date(String(input));
  return Number.isNaN(dt.getTime()) ? "-" : dt.toLocaleDateString("es-CO");
}

function tipoToBackend(tipo?: string | null) {
  const n = normalizeText(tipo);
  if (n.includes("instal")) return "INSTALACION";
  return "MANTENIMIENTO";
}

function toRow(r: ServiceRequestDTO): Row {
  const anyR: any = r;
  const id = Number(anyR?.serviceRequestId ?? anyR?.servicerequestid ?? anyR?.id ?? 0);
  const nombre = anyR?.customer?.users?.name ?? anyR?.customer?.name ?? "";
  const apellido = anyR?.customer?.users?.lastname ?? anyR?.customer?.lastname ?? "";
  const cliente = [nombre, apellido].filter(Boolean).join(" ").trim() || "-";
  const estadoApi = String(anyR?.state?.name ?? anyR?.status ?? "").trim();

  return {
    id,
    cliente,
    clienteId: toPositiveId(anyR?.clientId ?? anyR?.customer?.customerid ?? anyR?.customer?.id) ?? undefined,
    servicio: String(anyR?.service?.name ?? anyR?.service?.servicename ?? "-"),
    serviceId: toPositiveId(anyR?.service?.serviceid ?? anyR?.serviceId ?? anyR?.service?.id) ?? undefined,
    tipo: mapTipo(anyR?.serviceType ?? anyR?.servicetype ?? null),
    fecha: formatDate(anyR?.createdAt ?? anyR?.createdat ?? null),
    direccion: String(anyR?.direccion ?? anyR?.address ?? anyR?.customer?.customercity ?? "-"),
    descripcion: String(anyR?.description ?? ""),
    estado: estadoApi || mapEstadoKey(estadoApi),
    estadoKey: mapEstadoKey(estadoApi),
    programada: String(anyR?.scheduledAt ?? anyR?.scheduledat ?? "") || null,
    programadaEnd: String(anyR?.scheduledEndAt ?? anyR?.scheduledendat ?? "") || null,
    stateId: toPositiveId(anyR?.stateId ?? anyR?.state?.stateid ?? anyR?.stateid) ?? undefined,
  };
}

function pageList(totalPages: number, current: number) {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const pages: (number | "...")[] = [1];
  const left = Math.max(2, current - 1);
  const right = Math.min(totalPages - 1, current + 1);
  if (left > 2) pages.push("...");
  for (let p = left; p <= right; p++) pages.push(p);
  if (right < totalPages - 1) pages.push("...");
  pages.push(totalPages);
  return pages;
}

function estadoBadgeClass(key: Row["estadoKey"]) {
  if (key === "Aprobada") return "bg-green-100 text-green-700 ring-1 ring-inset ring-green-200";
  if (key === "Pendiente") return "bg-yellow-100 text-yellow-700 ring-1 ring-inset ring-yellow-200";
  if (key === "Agendada") return "bg-sky-100 text-sky-700 ring-1 ring-inset ring-sky-200";
  if (key === "Finalizado") return "bg-emerald-100 text-emerald-700 ring-1 ring-inset ring-emerald-200";
  return "bg-red-100 text-red-700 ring-1 ring-inset ring-red-200";
}

function tipoBadgeClass(tipo: string) {
  const normalized = normalizeText(tipo);
  if (normalized.includes("instal")) return "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200";
  return "bg-gray-100 text-gray-700 ring-1 ring-inset ring-gray-200";
}

export default function ServiceRequestsClientsPage() {
  const router = useRouter();
  const { user, profile, ready } = useAuth();
  const { has, canCreate, canView, canUpdate, canDelete } = usePermissions();
  const { serviceOptions, customerOptions } = useLookups();

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [selected, setSelected] = useState<Row | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const pageSize = 6;

  const clientIdFromAuth = useMemo(() => extractAuthClientId(user, profile), [user, profile]);

  async function loadData() {
    setLoading(true);
    try {
      const data = await listServiceRequests();
      const list = Array.isArray(data) ? data : [];
      const filtered = list.filter((r: any) => {
        if (!clientIdFromAuth) return false;
        const ids = extractRequestClientIds(r);
        return ids.includes(clientIdFromAuth);
      });
      const mapped = filtered.map(toRow).filter((r) => r.id > 0).sort((a, b) => b.id - a.id);
      setRows(mapped);
    } catch {
      setRows([]);
      Swal.fire({ icon: "error", title: "Error", text: "No se pudieron cargar las solicitudes." });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!ready) return;
    void loadData();
  }, [ready, clientIdFromAuth]);

  const filteredRows = useMemo(() => {
    const q = normalizeText(query);
    return rows.filter((r) => {
      return (
        !q ||
        normalizeText(r.id).includes(q) ||
        normalizeText(r.cliente).includes(q) ||
        normalizeText(r.servicio).includes(q) ||
        normalizeText(r.tipo).includes(q) ||
        normalizeText(r.estado).includes(q) ||
        normalizeText(r.fecha).includes(q)
      );
    });
  }, [rows, query]);

  useEffect(() => setPage(1), [query]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const current = Math.min(page, totalPages);
  const paged = filteredRows.slice((current - 1) * pageSize, current * pageSize);
  const pages = pageList(totalPages, current);
  const busy = loading || actionLoading;
  const canCreateRequests = canCreate(MODULE_KEY);
  const canViewRequests = canView(MODULE_KEY);
  const canUpdateRequests = canUpdate(MODULE_KEY);
  const canCancelRequests = canDelete(MODULE_KEY) || has(MODULE_KEY, "deactivate");
  const canPrintRequests = canViewRequests || has(MODULE_KEY, "print");

  function canMutateRow(row: Row) {
    return row.estadoKey !== "Anulada" && row.estadoKey !== "Finalizado";
  }

  async function handleCreate(values: CreateRequestPayload) {
    if (!canCreateRequests) return;
    setActionLoading(true);
    try {
      await createServiceRequest({
        scheduledAt: values.scheduledAt ?? null,
        scheduledEndAt: values.scheduledEndAt ?? null,
        serviceType: values.serviceType as any,
        description: String(values.description ?? "").trim(),
        direccion: String(values.direccion ?? "").trim(),
        stateId: Number(values.stateId ?? 5),
        serviceId: Number(values.serviceId),
        clientId: Number(values.clientId),
        technicians: [],
      } as any);
      setOpenCreate(false);
      await loadData();
      showSuccess("Solicitud creada correctamente.");
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.message ?? "No se pudo crear la solicitud.";
      showError(Array.isArray(msg) ? msg.join(" | ") : String(msg));
    } finally {
      setActionLoading(false);
    }
  }

  async function handleUpdate(values: EditRequestPayload) {
    if (!canUpdateRequests || !selected) return;
    setActionLoading(true);
    try {
      const startParts = splitDateTime(selected.programada ?? null);
      const endParts = splitDateTime(selected.programadaEnd ?? null);
      const startDate = values.programada ?? startParts.date ?? null;
      const startTime = values.horaProgramada ?? startParts.time ?? null;
      const endTime = values.horaFinal ?? endParts.time ?? null;
      const payload: Record<string, unknown> = {
        serviceType: tipoToBackend(values.tipos?.[0] ?? selected.tipo),
        description: String(values.descripcion ?? selected.descripcion ?? "").trim(),
        direccion: String(values.direccion ?? selected.direccion ?? "").trim(),
      };

      const serviceId = Number(values.servicio ?? selected.serviceId ?? 0);
      if (Number.isFinite(serviceId) && serviceId > 0) payload.serviceId = serviceId;

      const clientId = Number(values.cliente ?? selected.clienteId ?? 0);
      if (Number.isFinite(clientId) && clientId > 0) payload.clientId = clientId;

      const stateId = Number(values.estado ?? selected.stateId ?? 0);
      if (Number.isFinite(stateId) && stateId > 0) payload.stateId = stateId;

      if (startDate && startTime) {
        payload.scheduledAt = buildScheduledAt(startDate, startTime, null);
      }
      if (startDate && endTime) {
        payload.scheduledEndAt = buildScheduledAt(startDate, endTime, null);
      }

      await updateServiceRequest(selected.id, payload as any);
      setOpenEdit(false);
      setSelected(null);
      await loadData();
      showSuccess("Solicitud actualizada correctamente.");
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.message ?? "No se pudo actualizar la solicitud.";
      showError(Array.isArray(msg) ? msg.join(" | ") : String(msg));
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCancel(row: Row) {
    if (!canCancelRequests || !canMutateRow(row)) return;
    const res = await Swal.fire({
      title: "¿Cancelar solicitud?",
      text: `Se marcará la solicitud #${row.id} como cancelada.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, cancelar",
      cancelButtonText: "Volver",
      confirmButtonColor: "#d33",
      reverseButtons: true,
      focusCancel: true,
    });
    if (!res.isConfirmed) return;

    setActionLoading(true);
    try {
      const updated = await cancelServiceRequest(row.id);
      const updatedRow = toRow(updated);
      setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, ...updatedRow } : r)));
      showSuccess("La solicitud fue cancelada.");
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.message ?? "No se pudo cancelar la solicitud.";
      showError(Array.isArray(msg) ? msg.join(" | ") : String(msg));
    } finally {
      setActionLoading(false);
    }
  }

  function printRow(row: Row) {
    const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"/><title>Solicitud #${row.id}</title></head><body><h2>Solicitud #${row.id}</h2><p>Cliente: ${row.cliente}</p><p>Servicio: ${row.servicio}</p><p>Tipo: ${row.tipo}</p><p>Estado: ${row.estado}</p><p>Fecha: ${row.fecha}</p><p>Direccion: ${row.direccion}</p></body></html>`;
    const iframe = document.createElement("iframe");
    Object.assign(iframe.style, { position: "fixed", right: "0", bottom: "0", width: "0", height: "0", border: "0" });
    iframe.onload = () => {
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => document.body.removeChild(iframe), 120);
      }, 60);
    };
    iframe.srcdoc = html;
    document.body.appendChild(iframe);
  }

  return (
    <RequireAuth>
      <main className="flex-1 flex flex-col bg-gray-100">
        <div className="px-4 pb-8 pt-4 max-w-7xl w-full mx-auto">
          <div className="mb-5 rounded-xl border border-gray-200 bg-white px-4 py-3">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-2 md:flex-row md:items-center">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar (id, cliente, servicio, tipo, estado, fecha)"
                className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-gray-200"
                disabled={busy}
              />
                {canCreateRequests && (
                  <button
                    onClick={() => setOpenCreate(true)}
                    className="inline-flex h-10 items-center rounded-md bg-[#B20000] px-3 text-sm font-semibold text-white shadow-sm hover:opacity-90 whitespace-nowrap"
                    disabled={busy || !clientIdFromAuth}
                  >
                    Crear Solicitud
                  </button>
                )}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-600">
              Cargando solicitudes...
            </div>
          ) : (
            <motion.div
              variants={gridVariants}
              initial="hidden"
              animate="visible"
              key={`${page}-${query}`}
              className="grid gap-5 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3"
            >
              <AnimatePresence>
                {paged.map((row) => (
                  <motion.article
                    key={row.id}
                    variants={cardVariants}
                    exit={{ opacity: 0, y: 8 }}
                    className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 flex flex-col"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="inline-flex h-7 items-center rounded-md bg-gray-100 px-2.5 text-xs font-bold text-gray-800 ring-1 ring-inset ring-gray-200">
                            Solicitud #{row.id}
                          </span>
                          <span
                            className={`inline-flex items-center rounded-md px-2 py-1 text-[11px] font-semibold ${tipoBadgeClass(
                              row.tipo
                            )}`}
                          >
                            {row.tipo}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-base font-semibold text-gray-900 leading-tight break-words">
                            {row.cliente}
                          </h3>
                          <p className="text-xs text-gray-500 mt-1">Fecha: {row.fecha}</p>
                        </div>
                      </div>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${estadoBadgeClass(
                          row.estadoKey
                        )}`}
                      >
                        {row.estado}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-3">
                      <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5">
                        <p className="text-[11px] uppercase tracking-wide text-gray-500">Servicio</p>
                        <p className="mt-1 text-sm font-medium text-gray-800 break-words">{row.servicio}</p>
                      </div>
                      <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5">
                        <p className="text-[11px] uppercase tracking-wide text-gray-500">Direccion</p>
                        <p className="mt-1 text-sm font-medium text-gray-800 break-words">{row.direccion}</p>
                      </div>
                    </div>

                    {(canUpdateRequests || canCancelRequests || canPrintRequests || canViewRequests) && (
                      <div className="mt-5 flex items-center justify-end gap-2 border-t border-gray-100 pt-4">
                        {canUpdateRequests && (
                          <button
                            title="Editar"
                            onClick={() => {
                              setSelected(row);
                              setOpenEdit(true);
                            }}
                            disabled={!canMutateRow(row) || busy}
                            className="h-8 w-8 rounded-md border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50 disabled:opacity-50"
                          >
                            <img src={ICONS.edit} alt="Editar" className="h-4 w-4" />
                          </button>
                        )}
                        {canCancelRequests && (
                          <button
                            title="Cancelar"
                            onClick={() => void handleCancel(row)}
                            disabled={!canMutateRow(row) || busy}
                            className="h-8 w-8 rounded-md border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50 disabled:opacity-50"
                          >
                            <img src={ICONS.cancel} alt="Cancelar" className="h-4 w-4" />
                          </button>
                        )}
                        {canViewRequests && (
                          <button
                            title="Ver detalle"
                            onClick={() => router.push(`/dashboard/requests/${row.id}`)}
                            className="h-8 w-8 rounded-md border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50"
                          >
                            <img src={ICONS.view} alt="Ver detalle" className="h-4 w-4" />
                          </button>
                        )}
                        {canPrintRequests && (
                          <button
                            title="Imprimir"
                            onClick={() => printRow(row)}
                            disabled={busy}
                            className="h-8 w-8 rounded-md border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50 disabled:opacity-50"
                          >
                            <img src={ICONS.print} alt="Imprimir" className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </motion.article>
                ))}
              </AnimatePresence>
            </motion.div>
          )}

          {!loading && paged.length === 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-600 mt-4">
              No hay solicitudes para mostrar.
            </div>
          )}

          <div className="mt-6 flex flex-col items-center gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={current === 1}
                className="h-9 px-3 rounded-md border border-gray-300 bg-white text-sm disabled:opacity-50"
              >
                Anterior
              </button>
              {pages.map((p, i) =>
                p === "..." ? (
                  <span key={`e${i}`} className="px-2 text-sm text-gray-500">...</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p as number)}
                    className={`h-9 min-w-9 px-3 rounded-md border text-sm ${
                      current === p ? "bg-[#CC0000] border-[#CC0000] text-white" : "bg-white border-gray-300"
                    }`}
                  >
                    {p}
                  </button>
                )
              )}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={current === totalPages}
                className="h-9 px-3 rounded-md border border-gray-300 bg-white text-sm disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      </main>

      {clientIdFromAuth && (
        <ClientRequestModal
          isOpen={openCreate}
          onClose={() => setOpenCreate(false)}
          onSave={handleCreate}
          clientId={clientIdFromAuth}
          clientLabel={String(profile?.name || user?.name || "Cliente")}
          title="Crear Solicitud"
        />
      )}

      {openEdit && selected && (
        <EditRequestModal
          key={`edit-${selected.id}`}
          isOpen={openEdit}
          onClose={() => {
            setOpenEdit(false);
            setSelected(null);
          }}
          requestId={selected.id}
          initial={{
            tipos: selected.tipo.includes("Instal")
              ? ["Instalacion"]
              : ["Mantenimiento"],
            servicio: selected.serviceId ? String(selected.serviceId) : "",
            cliente: selected.clienteId ? String(selected.clienteId) : "",
            descripcion: selected.descripcion ?? "",
            direccion: selected.direccion ?? "",
            programada: splitDateTime(selected.programada ?? null).date,
            horaProgramada: splitDateTime(selected.programada ?? null).time,
            horaFinal: splitDateTime(selected.programadaEnd ?? null).time,
            estado: selected.stateId ? String(selected.stateId) : undefined,
          }}
          servicios={serviceOptions}
          clientes={customerOptions}
          onSave={handleUpdate}
          title="Editar Solicitud"
        />
      )}
    </RequireAuth>
  );
}

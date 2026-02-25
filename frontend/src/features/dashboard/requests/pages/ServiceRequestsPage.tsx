"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Swal from "sweetalert2";
import { useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import RequireAuth from "@/features/auth/requireauth";
import { DataTable } from "@/features/dashboard/components/datatable/DataTable";
import { Column } from "@/features/dashboard/components/datatable/types/column.types";
import {
  useServiceRequests,
  useCreateServiceRequest,
  useUpdateServiceRequest,
} from "@/features/dashboard/requests/hooks/useServiceRequests";
import CreateRequestModal, {
  type CreateRequestPayload,
} from "@/features/dashboard/requests/components/CreateRequestModal";
import EditRequestModal, {
  type EditRequestPayload,
} from "@/features/dashboard/requests/components/EditRequestModal";
import ViewRequestModal from "@/features/dashboard/requests/components/ViewRequestModal";
import { useLookups } from "@/features/dashboard/requests/hooks/useLookups";
import {
  buildScheduledAt,
  splitDateTime,
  toLocalDateTimeValue,
} from "@/features/dashboard/requests/utils/schedule";
import { ToastContainer } from "react-toastify";
import { showError, showSuccess } from "@/shared/utils/notifications";
import DownloadXLSXButton from "@/features/dashboard/components/DownloadXLSXButton";
import { useRequestStates } from "@/features/dashboard/requests/hooks/useRequestStates";
import { useAuth } from "@/features/auth/authcontext";
import { usePermissions } from "@/features/auth/hooks/usePermissions";

const ICONS = {
  print: "/icons/printer.svg",
};
const MODULE_KEY = "servicesrequest";

type Row = {
  id: number | string;
  descripcion: string;
  tipo: string;
  tipos: ("Mantenimiento" | "Instalacion")[];
  servicio: string;
  serviceId?: number | string;
  cliente: string;
  clienteId?: number | string;
  direccion: string;
  fecha: string;
  estado: string;
  stateId?: number | string;
  programada?: string | null;
  programadaEnd?: string | null;
  technicians: number[];
  technicianNames: string[];
};

function Loader() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-[9999]">
      <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function estadoClass(v: string) {
  const s = (v || "").toLowerCase();
  if (s.includes("aprob")) return "text-green-600";
  if (s.includes("anul") || s.includes("cancel")) return "text-red-600";
  if (s.includes("pend")) return "text-yellow-600";
  if (s.includes("activo")) return "text-green-600";
  return "text-gray-700";
}

function parseMaybeId(s: string) {
  const n = Number(s);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function tipoToBackend(t: "Mantenimiento" | "Instalacion" | undefined) {
  if (!t) return "MANTENIMIENTO";
  return t.toUpperCase();
}

function getBackendMessage(err: any) {
  const msg = err?.response?.data?.message ?? err?.message ?? "";
  if (Array.isArray(msg)) return msg.filter(Boolean).join(" | ");
  return String(msg || "");
}

function extractTechnicianIds(r: any): number[] {
  const raw = r?.techniciansMap;
  if (!Array.isArray(raw)) return [];
  return raw
    .map((m: any) =>
      Number(
        m?.technicianId ??
          m?.technician?.technicianid ??
          m?.technician?.id ??
          m?.id
      )
    )
    .filter((n) => Number.isFinite(n) && n > 0);
}

function extractTechnicianNames(r: any): string[] {
  const raw = r?.techniciansMap;
  if (!Array.isArray(raw)) return [];
  const names = raw
    .map((m: any) => {
      const u = m?.technician?.users ?? m?.users ?? null;
      const name = String(u?.name ?? "").trim();
      const last = String(u?.lastname ?? "").trim();
      const full = [name, last].filter(Boolean).join(" ").trim();
      if (full) return full;

      const alt1 = String(m?.technician?.name ?? "").trim();
      const alt2 = String(m?.technician?.lastname ?? "").trim();
      const altFull = [alt1, alt2].filter(Boolean).join(" ").trim();
      return altFull || "";
    })
    .map((x: string) => x.trim())
    .filter(Boolean);

  return Array.from(new Set(names));
}

function normalizeRoleName(role: any) {
  return String(role ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
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

function extractAuthTechnicianId(user: any, profile: any): number | null {
  const candidates = [
    user?.technicianid,
    user?.technicianId,
    user?.technician?.technicianid,
    user?.technicians?.[0]?.technicianid,
    user?.technician?.id,
    user?.technicians?.[0]?.id,
    profile?.technicianid,
    profile?.technicianId,
    profile?.technician?.technicianid,
    profile?.technicians?.[0]?.technicianid,
    profile?.technician?.id,
    profile?.technicians?.[0]?.id,
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
    new Set(
      ids
        .map((id) => toPositiveId(id))
        .filter((id): id is number => id != null)
    )
  );
}

function useDesktopQuery() {
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(min-width: 1024px)");
    const fn = () => setIsDesktop(mq.matches);
    fn();
    mq.addEventListener?.("change", fn);
    return () => mq.removeEventListener?.("change", fn);
  }, []);
  return isDesktop;
}

function useSidebarWidth(selector = "#app-sidebar") {
  const [w, setW] = useState(0);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const el = document.querySelector(selector) as HTMLElement | null;
    if (!el) return;
    const update = () => setW(el.offsetWidth || 0);
    update();
    let ro: ResizeObserver | null = null;
    if ("ResizeObserver" in window) {
      ro = new ResizeObserver(() => update());
      ro.observe(el);
    }
    const mo = new MutationObserver(update);
    mo.observe(el, { attributes: true, attributeFilter: ["class", "style"] });
    window.addEventListener("resize", update);
    return () => {
      if (ro) {
        try {
          ro.disconnect();
        } catch {}
        ro = null;
      }
      mo.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [selector]);
  return w;
}

export default function ServiceRequestsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openView, setOpenView] = useState(false);
  const [selected, setSelected] = useState<Row | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const cancelHandledRef = useRef(false);

  const queryClient = useQueryClient();
  const { serviceOptions, customerOptions } = useLookups();
  const { pendingStateId, scheduledStateId } = useRequestStates();
  const { user, profile } = useAuth();
  const { has, canView, canCreate, canUpdate, canDelete } = usePermissions();
  const isDesktop = useDesktopQuery();
  const sidebarW = useSidebarWidth("#app-sidebar");

  const { data, isLoading, error } = useServiceRequests();
  const createMut = useCreateServiceRequest();
  const updateMut = useUpdateServiceRequest();

  const normalizedRole = useMemo(() => {
    const candidates = [
      user?.rolename,
      (user as any)?.role,
      (user as any)?.role?.name,
      (user as any)?.roles?.name,
      profile?.rolename,
      (profile as any)?.role,
      (profile as any)?.role?.name,
      (profile as any)?.roles?.name,
    ];

    const normalized = candidates
      .map((r) => normalizeRoleName(r))
      .find((r) => !!r);

    return normalized || "";
  }, [user, profile]);

  const isClientRole = useMemo(
    () =>
      normalizedRole === "cliente" ||
      normalizedRole === "client" ||
      normalizedRole === "customer",
    [normalizedRole]
  );

  const isTechnicianRole = useMemo(
    () => normalizedRole === "tecnico" || normalizedRole === "technician",
    [normalizedRole]
  );

  const clientIdFromAuth = useMemo(() => {
    if (!isClientRole) return null;
    return extractAuthClientId(user, profile);
  }, [isClientRole, user, profile]);

  const technicianIdFromAuth = useMemo(() => {
    if (!isTechnicianRole) return null;
    return extractAuthTechnicianId(user, profile);
  }, [isTechnicianRole, user, profile]);

  const filteredData = useMemo(() => {
    const list = Array.isArray(data) ? data : [];

    return list.filter((r: any) => {
      if (isClientRole) {
        const clientIds = extractRequestClientIds(r);
        const targetClientId = clientIdFromAuth ?? -1;
        if (!clientIds.includes(targetClientId)) return false;
      }

      if (isTechnicianRole) {
        const techIds = extractTechnicianIds(r);
        const targetTechId = technicianIdFromAuth ?? -1;
        if (!techIds.some((id) => id === targetTechId)) return false;
      }

      return true;
    });
  }, [data, clientIdFromAuth, isClientRole, isTechnicianRole, technicianIdFromAuth]);

  const rows: Row[] = useMemo(() => {
    const list = Array.isArray(filteredData) ? filteredData : [];
    return list.map((r: any) => {
      const id = r?.serviceRequestId ?? r?.id ?? "";
      const servicio = r?.service?.name ?? r?.serviceType ?? "";
      const serviceId =
        r?.service?.serviceid ?? r?.serviceId ?? r?.service?.id ?? undefined;

      const clienteId =
        r?.clientId ?? r?.customer?.customerid ?? r?.customer?.id ?? "";
      const nombre = r?.customer?.users?.name ?? r?.customer?.name ?? "";
      const apellido =
        r?.customer?.users?.lastname ?? r?.customer?.lastname ?? "";
      const cliente = [nombre, apellido].filter(Boolean).join(" ");

      const descripcion = r?.description ?? "";
      const direccion =
        r?.direccion ?? r?.customer?.customercity ?? r?.address ?? "";

      const tipoRaw = r?.serviceType ?? r?.service?.category ?? "";
      const lower = String(tipoRaw).toLowerCase();
      const tipo = lower.includes("instal")
        ? "Instalacion"
        : lower.includes("manten")
        ? "Mantenimiento"
        : String(tipoRaw || "");

      const tipos: ("Mantenimiento" | "Instalacion")[] =
        tipo === "Mantenimiento"
          ? ["Mantenimiento"]
          : tipo === "Instalacion"
          ? ["Instalacion"]
          : [];

      const scheduledAtDate = r?.scheduledAt ? new Date(r.scheduledAt) : null;
      const scheduledEndAtDate = r?.scheduledEndAt
        ? new Date(r.scheduledEndAt)
        : null;

      const programada = scheduledAtDate
        ? toLocalDateTimeValue(scheduledAtDate)
        : null;
      const programadaEnd = scheduledEndAtDate
        ? toLocalDateTimeValue(scheduledEndAtDate)
        : null;

      const estado = r?.state?.name ?? r?.status ?? "";
      const stateId = r?.stateId ?? r?.state?.stateid ?? undefined;

      const fecha = r?.createdAt
        ? new Date(r.createdAt).toLocaleDateString("es-CO")
        : "";

      const technicians = extractTechnicianIds(r);
      const technicianNames = extractTechnicianNames(r);

      return {
        id,
        descripcion: String(descripcion),
        tipo,
        tipos,
        servicio: String(servicio),
        serviceId,
        cliente: String(cliente),
        clienteId,
        direccion: String(direccion),
        fecha,
        estado: String(estado),
        stateId,
        programada,
        programadaEnd,
        technicians,
        technicianNames,
      };
    });
  }, [filteredData]);

  const xlsxRows = useMemo(() => {
    return rows.map((r) => ({
      Id: r.id,
      Cliente: r.cliente,
      Descripción: r.descripcion,
      Servicio: r.servicio,
      Tipo: r.tipo,
      Dirección: r.direccion,
      Fecha: r.fecha,
      Estado: r.estado,
      Programada: r.programada ?? "",
      "Programada Fin": r.programadaEnd ?? "",
      Técnicos:
        (r.technicianNames || []).join(", ") ||
        (r.technicians || []).join(", "),
    }));
  }, [rows]);

  const columns: Column<Row>[] = [
    { key: "id", header: "ID" },
    {
      key: "cliente",
      header: "Cliente",
      render: (r) => <span className="font-medium">{r.cliente}</span>,
    },
    { key: "servicio", header: "Servicio" },
    { key: "tipo", header: "Tipo" },
    {
      key: "estado",
      header: "Estado",
      render: (r) => (
        <span className={`font-medium ${estadoClass(r.estado)}`}>{r.estado}</span>
      ),
    },
  ];

  const createPending =
    (createMut as any).isPending ?? (createMut as any).isLoading ?? false;
  const updatePending =
    (updateMut as any).isPending ?? (updateMut as any).isLoading ?? false;

  const busy = isLoading || actionLoading || createPending || updatePending;
  const canViewRequests = canView(MODULE_KEY);
  const canCreateRequests = canCreate(MODULE_KEY);
  const canUpdateRequests = canUpdate(MODULE_KEY);
  const canCancelRequests = canDelete(MODULE_KEY) || has(MODULE_KEY, "deactivate");
  const canPrintRequests = canViewRequests || has(MODULE_KEY, "print");
  const canExportRequests = canViewRequests || has(MODULE_KEY, "export");

  useEffect(() => {
    if (cancelHandledRef.current) return;

    const action = searchParams.get("action");
    const targetId = searchParams.get("serviceRequestId") ?? searchParams.get("id");

    if (action !== "cancel" || !targetId) return;
    if (isLoading || actionLoading) return;

    const clearParams = () => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("action");
      params.delete("serviceRequestId");
      params.delete("id");
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    };

    if (!canCancelRequests) {
      cancelHandledRef.current = true;
      showError("No tienes permisos para cancelar solicitudes.");
      clearParams();
      return;
    }

    const row = rows.find((r) => String(r.id) === String(targetId));
    if (!row) {
      cancelHandledRef.current = true;
      showError("No se encontró la solicitud para cancelar.");
      clearParams();
      return;
    }

    cancelHandledRef.current = true;
    void (async () => {
      await handleCancel(row);
      clearParams();
    })();
  }, [searchParams, isLoading, actionLoading, rows, router, pathname, canCancelRequests]);

  function optimisticPatch(id: number, patch: Partial<Row>) {
    queryClient.setQueryData<any>(["service-requests"], (old: any) => {
      if (!Array.isArray(old)) return old;
      return old.map((it: any) => {
        const itId = it?.serviceRequestId ?? it?.id;
        if (Number(itId) !== Number(id)) return it;

        const merged: any = { ...it, ...patch };

        if (patch.stateId !== undefined) merged.stateId = patch.stateId;
        if (patch.estado !== undefined)
          merged.state = {
            ...(it.state || {}),
            name: patch.estado,
            stateid: patch.stateId ?? it?.state?.stateid,
          };

        if (patch.programada !== undefined) {
          if (patch.programada) {
            const parts = splitDateTime(patch.programada);
            const iso = buildScheduledAt(
              parts.date,
              parts.time,
              it.scheduledAt ? new Date(it.scheduledAt) : null
            );
            merged.scheduledAt = iso;
          } else {
            merged.scheduledAt = null;
          }
        }

        if (patch.programadaEnd !== undefined) {
          if (patch.programadaEnd) {
            const parts = splitDateTime(patch.programadaEnd);
            const iso = buildScheduledAt(
              parts.date,
              parts.time,
              it.scheduledEndAt ? new Date(it.scheduledEndAt) : null
            );
            merged.scheduledEndAt = iso;
          } else {
            merged.scheduledEndAt = null;
          }
        }

        if (patch.descripcion !== undefined) merged.description = patch.descripcion;

        if (patch.servicio !== undefined)
          merged.service = {
            ...(it.service || {}),
            name: patch.servicio,
            serviceid: patch.serviceId ?? it?.service?.serviceid,
          };

        if (patch.direccion !== undefined) merged.direccion = patch.direccion;

        return merged;
      });
    });

    setSelected((prev) =>
      prev && Number(prev.id) === Number(id) ? { ...prev, ...patch } : prev
    );
  }

  async function handleCreate(values: CreateRequestPayload) {
    setActionLoading(true);
    try {
      const v: any = values as any;
      const stateIdToSend =
        (scheduledStateId && Number.isFinite(scheduledStateId) && scheduledStateId > 0 && scheduledStateId) ||
        (pendingStateId && Number.isFinite(pendingStateId) && pendingStateId > 0 && pendingStateId) ||
        5;

      const dto = {
        scheduledAt: v?.scheduledAt ?? null,
        scheduledEndAt: v?.scheduledEndAt ?? null,
        serviceType:
          v?.serviceType ?? tipoToBackend(Array.isArray(v?.tipos) ? v?.tipos?.[0] : undefined),
        description: (v?.description ?? v?.descripcion ?? "").trim(),
        direccion: (v?.direccion ?? "").trim(),
        stateId: stateIdToSend,
        serviceId: Number(v?.serviceId ?? parseMaybeId(String(v?.servicio ?? ""))),
        clientId: Number(v?.clientId ?? parseMaybeId(String(v?.cliente ?? ""))),
        technicians: Array.isArray(v?.technicians) ? v.technicians : [],
      };

      await createMut.mutateAsync(dto as any);
      await queryClient.invalidateQueries({ queryKey: ["service-requests"] });
      setOpenCreate(false);

      showSuccess("Solicitud creada correctamente.");
    } catch (err: any) {
      const msg = getBackendMessage(err);
      showError(msg || "No se pudo crear la solicitud.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleUpdate(values: EditRequestPayload) {
    if (!selected) return;

    setActionLoading(true);
    try {
      const id = Number(selected.id);
      const v: any = values as any;

      const scheduledAt =
        v?.scheduledAt ??
        buildScheduledAt(
          v?.programada ?? null,
          v?.horaProgramada ?? null,
          selected.programada ? new Date(selected.programada) : null
        );

      const scheduledEndAt =
        v?.scheduledEndAt ??
        buildScheduledAt(
          v?.programada ?? null,
          v?.horaFinal ?? null,
          selected.programadaEnd ? new Date(selected.programadaEnd) : null
        );

      const direccion = String(v?.direccion ?? selected.direccion ?? "").trim();

      const serviceType =
        v?.serviceType ??
        tipoToBackend(Array.isArray(v?.tipos) ? v?.tipos?.[0] : undefined);

      const description = String(v?.description ?? v?.descripcion ?? "").trim();

      const serviceId = Number(
        v?.serviceId ?? parseMaybeId(String(v?.servicio ?? selected.serviceId ?? ""))
      );

      const clientId = Number(
        v?.clientId ?? parseMaybeId(String(v?.cliente ?? selected.clienteId ?? ""))
      );

      const technicians = Array.isArray(v?.technicians)
        ? v.technicians
        : Array.isArray(selected.technicians)
        ? selected.technicians
        : [];

      const payload: any = {
        scheduledAt,
        scheduledEndAt,
        serviceType,
        description,
        direccion,
        serviceId,
        clientId,
        technicians,
      };

      let stateIdNum =
        v?.stateId && Number.isFinite(Number(v.stateId))
          ? Number(v.stateId)
          : v?.estado
          ? parseMaybeId(String(v.estado))
          : 0;

      if (!stateIdNum && scheduledAt) {
        const fallbackState =
          (scheduledStateId && Number.isFinite(scheduledStateId) && scheduledStateId > 0 && scheduledStateId) ||
          (pendingStateId && Number.isFinite(pendingStateId) && pendingStateId > 0 && pendingStateId) ||
          0;
        stateIdNum = fallbackState;
      }

      if (stateIdNum > 0) payload.stateId = stateIdNum;

      optimisticPatch(id, {
        programada: scheduledAt ? toLocalDateTimeValue(new Date(scheduledAt)) : null,
        programadaEnd: scheduledEndAt ? toLocalDateTimeValue(new Date(scheduledEndAt)) : null,
        descripcion: description,
        direccion,
        servicio: String(
          serviceOptions.find((o) => String(o.id) === String(serviceId))?.label ??
            selected.servicio
        ),
        serviceId,
        cliente: selected.cliente,
        clienteId: selected.clienteId,
        estado: stateIdNum
          ? String(v?.estadoLabel ?? v?.estadoName ?? v?.estadoText ?? selected.estado)
          : selected.estado,
        stateId: stateIdNum || selected.stateId,
        tipo: String(serviceType || "").toLowerCase().includes("instal")
          ? "Instalacion"
          : "Mantenimiento",
        tipos: String(serviceType || "").toLowerCase().includes("instal")
          ? ["Instalacion"]
          : ["Mantenimiento"],
        technicians,
      });

      await updateMut.mutateAsync({ id, payload });
      await queryClient.invalidateQueries({ queryKey: ["service-requests"] });
      setOpenEdit(false);

      showSuccess("Solicitud actualizada correctamente.");
    } catch (err: any) {
      const msg = getBackendMessage(err);
      showError(msg || "No se pudo actualizar la solicitud.");
      await queryClient.invalidateQueries({ queryKey: ["service-requests"] });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCancel(row: Row) {
    if (!canCancelRequests) {
      showError("No tienes permisos para cancelar solicitudes.");
      return;
    }

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
      const id = Number(row.id);
      optimisticPatch(id, { estado: "Cancelado", stateId: 4 });

      const parts = splitDateTime(row.programada ?? null);
      const scheduledAt = buildScheduledAt(
        parts.date,
        parts.time,
        row.programada ? new Date(row.programada) : new Date()
      );

      const payload: any = {
        scheduledAt,
        scheduledEndAt: row.programadaEnd
          ? buildScheduledAt(
              splitDateTime(row.programadaEnd).date,
              splitDateTime(row.programadaEnd).time,
              row.programadaEnd ? new Date(row.programadaEnd) : null
            )
          : null,
        serviceType: tipoToBackend(row.tipos?.[0]),
        description: row.descripcion?.trim(),
        direccion: row.direccion?.trim(),
        stateId: 4,
        serviceId: parseMaybeId(String(row.serviceId ?? "")),
        clientId: parseMaybeId(String(row.clienteId ?? "")),
        technicians: Array.isArray(row.technicians) ? row.technicians : [],
      };

      await updateMut.mutateAsync({ id, payload });
      await queryClient.invalidateQueries({ queryKey: ["service-requests"] });

      showSuccess("La solicitud fue cancelada.");
    } catch (err: any) {
      const msg = getBackendMessage(err);
      showError(msg || "No se pudo cancelar la solicitud.");
      await queryClient.invalidateQueries({ queryKey: ["service-requests"] });
    } finally {
      setActionLoading(false);
    }
  }

  function printRequest(row: Row) {
    const techs =
      (row.technicianNames || []).length
        ? row.technicianNames.join(", ")
        : (row.technicians || []).length
        ? row.technicians.join(", ")
        : "—";

    const fechaProg = row.programada ? row.programada : "—";
    const fechaFin = row.programadaEnd ? row.programadaEnd : "—";

    const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><title>Solicitud #${
      row.id
    }</title><style>:root{color-scheme:light}body{font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,"Noto Sans";margin:24px}.card{border:1px solid #e5e7eb;border-radius:12px;padding:20px}.h{font-size:20px;font-weight:700;margin:0 0 12px 0}.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:8px}.item{background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:10px 12px}.label{font-size:11px;text-transform:uppercase;letter-spacing:.04em;color:#6b7280;margin-bottom:4px}.val{font-size:14px;color:#111827}.desc{white-space:pre-wrap}.footer{margin-top:16px;font-size:12px;color:#6b7280}@media print{@page{size:A4;margin:16mm}body{margin:0}}</style></head><body><div class="card"><div class="h">Solicitud #${
      row.id
    }</div><div class="grid"><div class="item"><div class="label">Estado</div><div class="val">${
      row.estado
    }</div></div><div class="item"><div class="label">Fecha</div><div class="val">${
      row.fecha
    }</div></div><div class="item"><div class="label">Cliente</div><div class="val">${
      row.cliente
    }</div></div><div class="item"><div class="label">Servicio</div><div class="val">${
      row.servicio
    }</div></div><div class="item"><div class="label">Técnicos</div><div class="val">${techs}</div></div><div class="item"><div class="label">Programada</div><div class="val">${fechaProg}</div></div><div class="item"><div class="label">Hora final</div><div class="val">${fechaFin}</div></div><div class="item" style="grid-column:1/-1"><div class="label">Dirección</div><div class="val">${
      row.direccion || "—"
    }</div></div></div><div class="item" style="margin-top:12px"><div class="label">Tipo de servicio</div><div class="val">${
      row.tipo || "—"
    }</div></div><div class="item" style="margin-top:12px"><div class="label">Descripción</div><div class="val desc">${
      row.descripcion || "—"
    }</div></div><div class="footer">Código: SRV-${String(row.id).padStart(
      6,
      "0"
    )}</div></div></body></html>`;

    const iframe: HTMLIFrameElement = document.createElement("iframe");
    Object.assign(iframe.style, {
      position: "fixed",
      right: "0",
      bottom: "0",
      width: "0",
      height: "0",
      border: "0",
    });
    iframe.onload = () => {
      setTimeout(() => {
        iframe.contentWindow?.focus?.();
        iframe.contentWindow?.print?.();
        setTimeout(() => document.body.removeChild(iframe), 100);
      }, 50);
    };
    iframe.srcdoc = html;
    document.body.appendChild(iframe);
  }

  return (
    <RequireAuth>
      <div className="relative" style={{ paddingLeft: isDesktop ? sidebarW : 0 }}>
        <main className="min-h-[100dvh] bg-gray-100 relative">
        <ToastContainer position="bottom-right" />
        {busy && <Loader />}

        {error ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-red-600">Error cargando solicitudes</div>
          </div>
        ) : (
          <DataTable<Row>
            module={MODULE_KEY}
            data={rows}
            columns={columns}
            pageSize={5}
            disableInternalScroll
            searchableKeys={["id", "cliente", "servicio", "tipo", "estado"]}
            actionGuard={(row) => {
              const estado = String(row?.estado ?? "").toLowerCase().trim();
              const cancelado =
                estado.includes("cancel") ||
                estado.includes("anul") ||
                estado.includes("anulado");

              return {
                disableCancel: cancelado,
                cancelTitle: cancelado ? "Ya está cancelada." : "Anular",
              };
            }}
            rightActions={
              canExportRequests ? (
                <>
                <div className="hidden md:block">
                  <DownloadXLSXButton
                    id="download-excel-btn"
                    data={xlsxRows as unknown as Record<string, unknown>[]}
                    fileName="reporte_solicitudes.xlsx"
                    headers={[
                      "Id",
                      "Cliente",
                      "Descripción",
                      "Servicio",
                      "Tipo",
                      "Dirección",
                      "Fecha",
                      "Estado",
                      "Programada",
                      "Programada Fin",
                      "Técnicos",
                    ]}
                    excludeKeys={[]}
                  />
                </div>

                <button
                  onClick={() =>
                    document
                      .querySelector<HTMLButtonElement>("#download-excel-btn")
                      ?.click()
                  }
                  className="fixed bottom-20 right-6 z-50 flex md:hidden items-center justify-center w-12 h-12 rounded-full shadow-lg text-white transition-transform hover:scale-105"
                  style={{ background: "#B20000" }}
                  type="button"
                  title="Descargar reporte"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4"
                    />
                  </svg>
                </button>
                </>
              ) : null
            }
            onCreate={canCreateRequests ? () => setOpenCreate(true) : undefined}
            createButtonText="Crear Solicitud"
            onView={
              canViewRequests
                ? (r) => {
                    setSelected(r);
                    setOpenView(true);
                  }
                : undefined
            }
            onEdit={
              canUpdateRequests
                ? (r) => {
                    setSelected(r);
                    setOpenEdit(true);
                  }
                : undefined
            }
            onCancel={canCancelRequests ? handleCancel : undefined}
            tailHeader={canPrintRequests ? "Imprimir" : undefined}
            renderTail={
              canPrintRequests
                ? (row) => (
                    <button
                      key={`print-${row.id}`}
                      className="p-1 rounded-full cursor-pointer transition-all duration-300 hover:scale-110 hover:bg-red-300/60"
                      title="Imprimir"
                      onClick={() => printRequest(row)}
                    >
                      <img src={ICONS.print} className="h-4 w-4 mx-auto" />
                    </button>
                  )
                : undefined
            }
          />
        )}

        <CreateRequestModal
          isOpen={openCreate}
          onClose={() => setOpenCreate(false)}
          onSave={handleCreate}
          title="Crear Solicitud"
          servicios={serviceOptions}
          clientes={customerOptions}
          pendingStateId={pendingStateId ?? undefined}
          scheduledStateId={scheduledStateId ?? undefined}
        />

        {openEdit &&
          selected &&
          (() => {
            const partsStart = splitDateTime(selected.programada ?? null);
            const partsEnd = splitDateTime(selected.programadaEnd ?? null);

            const initialAny = {
              serviceId: Number(selected.serviceId ?? 0) || undefined,
              clientId: Number(selected.clienteId ?? 0) || undefined,
              description: selected.descripcion ?? "",
              direccion: selected.direccion ?? "",
              scheduledAt:
                partsStart.date && partsStart.time
                  ? buildScheduledAt(partsStart.date, partsStart.time, null)
                  : null,
              scheduledEndAt:
                partsStart.date && partsEnd.time
                  ? buildScheduledAt(partsStart.date, partsEnd.time, null)
                  : null,
              stateId: Number(selected.stateId ?? 0) || undefined,
              estado: Number(selected.stateId ?? 0) ? String(selected.stateId) : undefined,
              estadoLabel: selected.estado ?? "",
              technicians: selected.technicians ?? [],
            };

            return (
              <EditRequestModal
                key={`edit-${selected.id}`}
                isOpen={openEdit}
                onClose={() => setOpenEdit(false)}
                requestId={Number(selected.id)}
                initial={initialAny as any}
                servicios={serviceOptions as any}
                clientes={customerOptions as any}
                onSave={handleUpdate}
                title="Editar Solicitud"
              />
            );
          })()}

        {openView && selected && (
          <ViewRequestModal
            key={`view-${selected.id}`}
            isOpen={openView}
            onClose={() => setOpenView(false)}
            data={{
              tipos: selected.tipos,
              servicio: selected.servicio,
              descripcion: selected.descripcion,
              direccion: selected.direccion,
              cliente: selected.cliente,
              fecha: selected.fecha,
              estado: selected.estado,
              codigo: `SRV-${String(selected.id).padStart(6, "0")}`,
              programada: selected.programada ?? null,
              programadaEnd: selected.programadaEnd ?? null,
              tecnicos: selected.technicianNames ?? [],
            }}
            title="Detalle de la Solicitud"
          />
        )}
      </main>
      </div>
    </RequireAuth>
  );
}

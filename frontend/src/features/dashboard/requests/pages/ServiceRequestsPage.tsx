"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import {
  useLookups,
} from "@/features/dashboard/requests/hooks/useLookups";
import {
  buildScheduledAt,
  splitDateTime,
  toLocalDateTimeValue,
} from "@/features/dashboard/requests/utils/schedule";
import { showError, showSuccess } from "@/shared/utils/notifications";
import DownloadXLSXButton from "@/features/dashboard/components/DownloadXLSXButton";
import { exportXlsx } from "@/shared/utils/exportXlsx";
import { useRequestStates } from "@/features/dashboard/requests/hooks/useRequestStates";
import { useAuth } from "@/features/auth/authcontext";
import { usePermissions } from "@/features/auth/hooks/usePermissions";
import { listServiceRequests } from "@/features/dashboard/requests/services/servicerequests.service";
import type {
  CreateServiceRequestInput,
  PaginatedResponse,
  ServiceRequestDTO,
  ServiceRequestTechnicianMapDTO,
  ServiceTypeApi,
  UpdateServiceRequestInput,
} from "@/features/dashboard/requests/services/servicerequests.service";

const ICONS = {
  print: "/icons/Printer.svg",
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

type ApiErrorLike = {
  response?: { data?: { message?: string | string[] } };
  message?: string;
};

type RoleNameContainer = {
  name?: string;
};

type AuthRecord = {
  rolename?: string;
  role?: string | RoleNameContainer | null;
  roles?: RoleNameContainer | null;
  customerid?: number;
  clientid?: number;
  clientId?: number;
  customer?: { customerid?: number; id?: number } | null;
  customers?: Array<{ customerid?: number; id?: number }> | null;
  technicianid?: number;
  technicianId?: number;
  technician?: { technicianid?: number; id?: number } | null;
  technicians?: Array<{ technicianid?: number; id?: number }> | null;
};

type ServiceRequestRowLike = ServiceRequestDTO & {
  id?: number | string;
  address?: string | null;
  clientId?: number | string | null;
  status?: string | null;
  serviceType?: string | null;
  stateId?: number | string | null;
  customer?: (ServiceRequestDTO["customer"] & {
    id?: number | string | null;
    name?: string | null;
    lastname?: string | null;
  }) | null;
  service?: (ServiceRequestDTO["service"] & {
    id?: number | string | null;
  }) | null;
  techniciansMap?: Array<
    ServiceRequestTechnicianMapDTO & {
      id?: number | string | null;
      technician?: (ServiceRequestTechnicianMapDTO["technician"] & {
        id?: number | string | null;
        name?: string | null;
        lastname?: string | null;
      }) | null;
    }
  > | null;
};

type RequestListCache = PaginatedResponse<ServiceRequestDTO> | ServiceRequestDTO[] | undefined;

function Loader() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-[9999]">
      <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function estadoClass(v: string) {
  const s = (v || "").toLowerCase();
  if (s.includes("aprob")) return "text-green-600";
  if (s.includes("anul") || s.includes("cancel")) return "text-green-600";
  if (s.includes("pend")) return "text-yellow-600";
  if (s.includes("activo")) return "text-green-600";
  return "text-gray-700";
}

function parseMaybeId(s: string) {
  const n = Number(s);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function tipoToBackend(t: "Mantenimiento" | "Instalacion" | undefined): ServiceTypeApi {
  if (!t) return "MANTENIMIENTO";
  return t.toUpperCase() as ServiceTypeApi;
}

function getBackendMessage(err: unknown) {
  const apiErr = err as ApiErrorLike | null;
  const msg = apiErr?.response?.data?.message ?? apiErr?.message ?? "";
  if (Array.isArray(msg)) return msg.filter(Boolean).join(" | ");
  return String(msg || "");
}

function extractTechnicianIds(r: ServiceRequestDTO): number[] {
  const row = r as ServiceRequestRowLike;
  const raw = row?.techniciansMap as NonNullable<ServiceRequestRowLike["techniciansMap"]> | undefined;
  if (!Array.isArray(raw)) return [];
  return raw
    .map((m: NonNullable<ServiceRequestRowLike["techniciansMap"]>[number]) =>
      Number(
        m?.technicianId ??
          m?.technician?.technicianid ??
          m?.technician?.id ??
          m?.id
      )
    )
    .filter((n) => Number.isFinite(n) && n > 0);
}

function extractTechnicianNames(r: ServiceRequestDTO): string[] {
  const row = r as ServiceRequestRowLike;
  const raw = row?.techniciansMap as NonNullable<ServiceRequestRowLike["techniciansMap"]> | undefined;
  if (!Array.isArray(raw)) return [];
  const names = raw
    .map((m: NonNullable<ServiceRequestRowLike["techniciansMap"]>[number]) => {
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

function mapServiceRequestToRow(r: ServiceRequestDTO): Row {
  const row = r as ServiceRequestRowLike;
  const id = row?.serviceRequestId ?? row?.id ?? "";
  const servicio = row?.service?.name ?? row?.serviceType ?? "";
  const serviceId =
    row?.service?.serviceid ?? row?.serviceId ?? row?.service?.id ?? undefined;

  const clienteId =
    row?.clientId ?? row?.customer?.customerid ?? row?.customer?.id ?? "";
  const nombre = row?.customer?.users?.name ?? row?.customer?.name ?? "";
  const apellido =
    row?.customer?.users?.lastname ?? row?.customer?.lastname ?? "";
  const cliente = [nombre, apellido].filter(Boolean).join(" ");

  const descripcion = row?.description ?? "";
  const direccion =
    row?.direccion ?? row?.customer?.customercity ?? row?.address ?? "";

  const tipoRaw = row?.serviceType ?? row?.service?.category ?? "";
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

  const estado = row?.state?.name ?? row?.status ?? "";
  const stateId = row?.stateId ?? row?.state?.stateid ?? undefined;

  const fecha = row?.createdAt
    ? new Date(row.createdAt).toLocaleDateString("es-CO")
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
}

function normalizeRoleName(role: unknown) {
  return String(role ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function toPositiveId(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function extractAuthClientId(user: AuthRecord | null, profile: AuthRecord | null): number | null {
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

function extractAuthTechnicianId(
  user: AuthRecord | null,
  profile: AuthRecord | null
): number | null {
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
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [search, setSearch] = useState("");
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

  const normalizedRole = useMemo(() => {
    const userRecord = user as AuthRecord | null;
    const profileRecord = profile as AuthRecord | null;
    const candidates = [
      userRecord?.rolename,
      userRecord?.role,
      typeof userRecord?.role === "object" ? userRecord.role?.name : undefined,
      userRecord?.roles?.name,
      profileRecord?.rolename,
      profileRecord?.role,
      typeof profileRecord?.role === "object" ? profileRecord.role?.name : undefined,
      profileRecord?.roles?.name,
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
    return extractAuthClientId(user as AuthRecord | null, profile as AuthRecord | null);
  }, [isClientRole, user, profile]);

  const technicianIdFromAuth = useMemo(() => {
    if (!isTechnicianRole) return null;
    return extractAuthTechnicianId(user as AuthRecord | null, profile as AuthRecord | null);
  }, [isTechnicianRole, user, profile]);

  const requestQuery = useMemo(
    () => ({
      page,
      limit,
      search,
      clientId: isClientRole ? clientIdFromAuth ?? undefined : undefined,
      technicianId: isTechnicianRole ? technicianIdFromAuth ?? undefined : undefined,
    }),
    [clientIdFromAuth, isClientRole, isTechnicianRole, limit, page, search, technicianIdFromAuth]
  );

  const { data, isLoading, isFetching, error } = useServiceRequests(requestQuery);
  const createMut = useCreateServiceRequest();
  const updateMut = useUpdateServiceRequest();

  const rows: Row[] = useMemo(() => {
    const list = Array.isArray(data?.data) ? data.data : [];
    return list.map(mapServiceRequestToRow);
  }, [data]);

  const totalPages = data?.meta?.totalPages ?? 1;

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

  const createPending = createMut.isPending;
  const updatePending = updateMut.isPending;

  const initialLoading = isLoading;
  const tableLoading = isFetching && !isLoading;
  const busy = actionLoading || createPending || updatePending;
  const canViewRequests = canView(MODULE_KEY);
  const canCreateRequests = canCreate(MODULE_KEY);
  const canUpdateRequests = canUpdate(MODULE_KEY);
  const canCancelRequests = canDelete(MODULE_KEY) || has(MODULE_KEY, "deactivate");
  const canPrintRequests = canViewRequests || has(MODULE_KEY, "print");
  const canExportRequests =
    has(MODULE_KEY, "download_report") || has(MODULE_KEY, "export");

  const handleDownloadReport = useCallback(async () => {
    const response = await listServiceRequests({
      search,
      clientId: isClientRole ? clientIdFromAuth ?? undefined : undefined,
      technicianId: isTechnicianRole ? technicianIdFromAuth ?? undefined : undefined,
    });
    const reportRows = (Array.isArray(response) ? response : response.data)
      .map(mapServiceRequestToRow)
      .map((r) => ({
        Id: r.id,
        Cliente: r.cliente,
        Descripcion: r.descripcion,
        Servicio: r.servicio,
        Tipo: r.tipo,
        Direccion: r.direccion,
        Fecha: r.fecha,
        Estado: r.estado,
        Programada: r.programada ?? "",
        "Programada Fin": r.programadaEnd ?? "",
        Tecnicos:
          (r.technicianNames || []).join(", ") ||
          (r.technicians || []).join(", "),
      }))
      .sort((a, b) => Number(b.Id) - Number(a.Id));

    if (!reportRows.length) {
      showError("No hay solicitudes para descargar.");
      return;
    }

    await exportXlsx(reportRows, "reporte_solicitudes.xlsx", "Solicitudes");
  }, [
    clientIdFromAuth,
    isClientRole,
    isTechnicianRole,
    search,
    technicianIdFromAuth,
  ]);

  const optimisticPatch = useCallback((id: number, patch: Partial<Row>) => {
    queryClient.setQueryData<RequestListCache>(["service-requests"], (old) => {
      if (!Array.isArray(old)) return old;
      return old.map((it) => {
        const itId = it?.serviceRequestId ?? it?.id;
        if (Number(itId) !== Number(id)) return it;

        const merged: ServiceRequestDTO = { ...it };

        const nextStateId =
          patch.stateId !== undefined && patch.stateId !== null
            ? Number(patch.stateId)
            : undefined;

        if (nextStateId !== undefined && Number.isFinite(nextStateId)) {
          merged.stateId = nextStateId;
        }
        if (patch.estado !== undefined)
          merged.state = {
            ...(it.state || {}),
            name: patch.estado,
            stateid:
              nextStateId !== undefined && Number.isFinite(nextStateId)
                ? nextStateId
                : it?.state?.stateid,
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

        const nextServiceId =
          patch.serviceId !== undefined && patch.serviceId !== null
            ? Number(patch.serviceId)
            : undefined;

        if (patch.servicio !== undefined)
          merged.service = {
            ...(it.service || {}),
            name: patch.servicio,
            serviceid:
              nextServiceId !== undefined && Number.isFinite(nextServiceId)
                ? nextServiceId
                : it?.service?.serviceid,
          };

        if (patch.direccion !== undefined) merged.direccion = patch.direccion;

        return merged;
      });
    });

    setSelected((prev) =>
      prev && Number(prev.id) === Number(id) ? { ...prev, ...patch } : prev
    );
  }, [queryClient]);

  async function handleCreate(values: CreateRequestPayload) {
    setActionLoading(true);
    try {
      const technicians = Array.isArray(values.technicians) ? values.technicians : [];
      const hasFullAssignment = Boolean(
        values.scheduledAt && values.scheduledEndAt && technicians.length > 0
      );
      const stateIdToSend =
        (hasFullAssignment &&
          scheduledStateId &&
          Number.isFinite(scheduledStateId) &&
          scheduledStateId > 0 &&
          scheduledStateId) ||
        (pendingStateId && Number.isFinite(pendingStateId) && pendingStateId > 0 && pendingStateId) ||
        5;

      const dto: CreateServiceRequestInput = {
        scheduledAt: values.scheduledAt ?? null,
        scheduledEndAt: values.scheduledEndAt ?? null,
        serviceType:
          values.serviceType === "INSTALACION" || values.serviceType === "MANTENIMIENTO"
            ? values.serviceType
            : tipoToBackend(undefined),
        description: values.description.trim(),
        direccion: values.direccion.trim(),
        stateId: stateIdToSend,
        serviceId: Number(values.serviceId),
        clientId: Number(values.clientId),
        technicians,
      };

      await createMut.mutateAsync(dto);
      await queryClient.invalidateQueries({ queryKey: ["service-requests"] });
      setOpenCreate(false);

      showSuccess("Solicitud creada correctamente.");
    } catch (err: unknown) {
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

      const scheduledAt =
        values.scheduledAt ??
        buildScheduledAt(null, null, selected.programada ? new Date(selected.programada) : null);

      const scheduledEndAt =
        values.scheduledEndAt ??
        buildScheduledAt(
          null,
          null,
          selected.programadaEnd ? new Date(selected.programadaEnd) : null
        );

      const direccion = String(values.direccion ?? selected.direccion ?? "").trim();

      const serviceType =
        values.serviceType === "INSTALACION" || values.serviceType === "MANTENIMIENTO"
          ? values.serviceType
          : tipoToBackend(undefined);

      const description = String(values.description ?? "").trim();

      const serviceId = Number(
        values.serviceId ?? parseMaybeId(String(selected.serviceId ?? ""))
      );

      const clientId = Number(
        values.clientId ?? parseMaybeId(String(selected.clienteId ?? ""))
      );

      const technicians = Array.isArray(values.technicians)
        ? values.technicians
        : Array.isArray(selected.technicians)
        ? selected.technicians
        : [];

      const payload: UpdateServiceRequestInput = {
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
        values.stateId && Number.isFinite(Number(values.stateId))
          ? Number(values.stateId)
          : values.estado
          ? parseMaybeId(String(values.estado))
          : 0;

      const hasFullAssignment = Boolean(scheduledAt && scheduledEndAt && technicians.length > 0);
      if (hasFullAssignment) {
        const fallbackState =
          (scheduledStateId && Number.isFinite(scheduledStateId) && scheduledStateId > 0 && scheduledStateId) ||
          (pendingStateId && Number.isFinite(pendingStateId) && pendingStateId > 0 && pendingStateId) ||
          0;
        if (fallbackState > 0) stateIdNum = fallbackState;
      }

      if (stateIdNum > 0) payload.stateId = stateIdNum;
      const forcedScheduled =
        hasFullAssignment &&
        scheduledStateId &&
        Number.isFinite(scheduledStateId) &&
        scheduledStateId > 0 &&
        Number(stateIdNum) === Number(scheduledStateId);
      const resolvedEstadoLabel = forcedScheduled
        ? "Agendada"
        : stateIdNum
        ? String(values.estadoLabel ?? selected.estado)
        : selected.estado;

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
        estado: resolvedEstadoLabel,
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
    } catch (err: unknown) {
      const msg = getBackendMessage(err);
      showError(msg || "No se pudo actualizar la solicitud.");
      await queryClient.invalidateQueries({ queryKey: ["service-requests"] });
    } finally {
      setActionLoading(false);
    }
  }

  const handleCancel = useCallback(async (row: Row) => {
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

      const payload: UpdateServiceRequestInput = {
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
    } catch (err: unknown) {
      const msg = getBackendMessage(err);
      showError(msg || "No se pudo cancelar la solicitud.");
      await queryClient.invalidateQueries({ queryKey: ["service-requests"] });
    } finally {
      setActionLoading(false);
    }
  }, [canCancelRequests, optimisticPatch, queryClient, updateMut]);

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
  }, [searchParams, isLoading, actionLoading, rows, router, pathname, canCancelRequests, handleCancel]);

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
        {(initialLoading || busy) && <Loader />}

        {error ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-green-600">Error cargando solicitudes</div>
          </div>
        ) : (
          <DataTable<Row>
            module={MODULE_KEY}
            data={rows}
            columns={columns}
            pageSize={5}
            loading={tableLoading}
            serverPagination={{
              page,
              limit,
              totalPages,
              onPageChange: setPage,
              onPageSizeChange: (nextLimit) => {
                setLimit(nextLimit);
                setPage(1);
              },
            }}
            serverSearch={{
              value: search,
              onChange: (value) => {
                setSearch(value);
                setPage(1);
              },
            }}
            disableInternalScroll
            searchPlaceholder="Buscar solicitudes"
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
                <button
                  onClick={handleDownloadReport}
                  className="hidden md:inline-flex h-9 items-center rounded-md bg-[#04652c] px-4 text-sm font-semibold text-white shadow-sm hover:opacity-90"
                  type="button"
                >
                  Descargar Reporte
                </button>
                <div className="hidden">
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
                  onClick={handleDownloadReport}
                  className="fixed bottom-20 right-6 z-50 flex md:hidden items-center justify-center w-12 h-12 rounded-full shadow-lg text-white transition-transform hover:scale-105"
                  style={{ background: "#04652c" }}
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
                      className="p-1 rounded-full cursor-pointer transition-all duration-300 hover:scale-110 hover:bg-green-300/60"
                      title="Imprimir"
                      onClick={() => printRequest(row)}
                    >
                      <img src={ICONS.print} alt="Imprimir solicitud" className="h-4 w-4 mx-auto" />
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

            const initialData: Partial<EditRequestPayload> = {
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
                initial={initialData}
                servicios={serviceOptions}
                clientes={customerOptions}
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

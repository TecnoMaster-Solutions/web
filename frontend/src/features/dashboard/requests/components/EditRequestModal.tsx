"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Modal from "@/features/dashboard/components/Modal";
import type { Option } from "@/features/dashboard/requests/types/option.types";
import { showError, showInfo, showWarning } from "@/shared/utils/notifications";
import {
  getServiceOptions,
  getCustomerOptions,
} from "@/features/dashboard/requests/services/lookups.service";
import { useRequestStates } from "@/features/dashboard/requests/hooks/useRequestStates";
import { api } from "@/lib/api";
import {
  buildWindowFromLocalSchedule,
  getBusyTechnicianIdsForWindow,
} from "@/features/dashboard/shared/technicianAvailability";

export type EditRequestPayload = {
  serviceId: number;
  clientId: number;
  serviceType: string;
  description: string;
  direccion: string;
  scheduledAt: string | null;
  scheduledEndAt: string | null;
  estado?: string;
  stateId?: number;
  estadoLabel?: string;
  technicians: number[];
};

type ServiceOption = Option & {
  typeofserviceid?: number | null;
};

type ServiceTypeApi = {
  typeofserviceid: number;
  name: string;
};

type ServiceTypeOption = {
  id: number;
  label: string;
};

type TechnicianOption = {
  technicianid: number;
  label: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: EditRequestPayload) => void | Promise<void>;
  title?: string;
  requestId?: number | null;
  servicios?: ServiceOption[] | null;
  clientes?: Option[] | null;
  initial?:
    | (Partial<EditRequestPayload> &
        Partial<{
          servicio: string;
          cliente: string;
          descripcion: string;
          programada: string | null;
          horaProgramada: string | null;
          horaFinal: string | null;
        }> & { technicians?: number[] })
    | null;
};

type ErrorKey =
  | "tipo"
  | "servicio"
  | "cliente"
  | "descripcion"
  | "direccion"
  | "programada"
  | "horaProgramada"
  | "horaFinal"
  | "technicians";

type Errors = Partial<Record<ErrorKey, string | null>>;
type Touched = Partial<Record<ErrorKey, boolean>>;

function parseYMD(ymd: string) {
  const [y, m, d] = (ymd || "").split("-").map((x) => Number(x));
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return null;
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}

function timeToMinutes(hm: string) {
  const [h, m] = (hm || "").split(":").map((x) => Number(x));
  if (!Number.isFinite(h) || !Number.isFinite(m)) return NaN;
  return h * 60 + m;
}

function todayStartLocal() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
}

function isPastDateLocal(ymd: string) {
  const d = parseYMD(ymd);
  if (!d) return false;
  return d.getTime() < todayStartLocal().getTime();
}

function isPastDateTimeLocal(ymd: string, hm: string) {
  const d = parseYMD(ymd);
  if (!d) return false;
  const mins = timeToMinutes(hm);
  if (!Number.isFinite(mins)) return false;

  const hh = Math.floor(mins / 60);
  const mm = mins % 60;
  const dt = new Date(d.getFullYear(), d.getMonth(), d.getDate(), hh, mm, 0, 0);
  return dt.getTime() < Date.now();
}

function ymdTodayString() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const SCHEDULE_MIN = 7 * 60;
const SCHEDULE_MAX = 17 * 60;

function isAllowedDate(ymd: string) {
  const d = parseYMD(ymd);
  if (!d) return false;
  const day = d.getDay();
  return day >= 1 && day <= 6;
}

function isAllowedTime(hm: string) {
  const mins = timeToMinutes(hm);
  if (!Number.isFinite(mins)) return false;
  return mins >= SCHEDULE_MIN && mins <= SCHEDULE_MAX;
}

function addMinutesToTime(hm: string, add: number) {
  const base = timeToMinutes(hm);
  if (!Number.isFinite(base)) return hm;
  let total = base + add;
  total = ((total % 1440) + 1440) % 1440;
  const hh = String(Math.floor(total / 60)).padStart(2, "0");
  const mm = String(total % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

function getBackendMessage(err: any) {
  const msg = err?.response?.data?.message ?? err?.message ?? "";
  if (Array.isArray(msg)) return msg.filter(Boolean).join(" | ");
  return String(msg || "");
}

function normalizeText(v: string) {
  return String(v ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function initials(name: string) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const a = parts[0]?.[0] ?? "";
  const b = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
  return (a + b).toUpperCase() || "T";
}

function parseISOToLocalParts(iso: string | null | undefined) {
  if (!iso) return { date: null as string | null, time: null as string | null };
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return { date: null, time: null };
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return { date: `${y}-${m}-${day}`, time: `${hh}:${mm}` };
}

function combineDateTimeLocal(ymd: string, hm: string) {
  const d = parseYMD(ymd);
  if (!d) return null;
  const mins = timeToMinutes(hm);
  if (!Number.isFinite(mins)) return null;
  const hh = Math.floor(mins / 60);
  const mm = mins % 60;
  const dt = new Date(d.getFullYear(), d.getMonth(), d.getDate(), hh, mm, 0, 0);
  return dt.toISOString();
}

function inferTypeIdFromServiceType(serviceTypes: ServiceTypeOption[], serviceType: string) {
  const st = normalizeText(serviceType);
  if (!st) return null;

  const exact = serviceTypes.find((t) => normalizeText(t.label) === st);
  if (exact) return exact.id;

  const hasInst = st.includes("instal");
  const hasMant = st.includes("manten");

  if (hasInst) {
    const m = serviceTypes.find((t) => normalizeText(t.label).includes("instal"));
    if (m) return m.id;
  }
  if (hasMant) {
    const m = serviceTypes.find((t) => normalizeText(t.label).includes("manten"));
    if (m) return m.id;
  }

  const partial = serviceTypes.find((t) => normalizeText(t.label).includes(st));
  return partial ? partial.id : null;
}

export default function EditRequestModal({
  isOpen,
  onClose,
  onSave,
  title = "Editar Solicitud",
  requestId = null,
  servicios,
  clientes,
  initial = null,
}: Props) {
  const [serviceTypeId, setServiceTypeId] = useState<number | null>(null);

  const [servicio, setServicio] = useState<string>("");
  const [cliente, setCliente] = useState<string>("");

  const [descripcion, setDescripcion] = useState("");
  const [direccion, setDireccion] = useState("");

  const [programada, setProgramada] = useState<string | null>(null);
  const [horaProgramada, setHoraProgramada] = useState<string | null>(null);
  const [horaFinal, setHoraFinal] = useState<string | null>(null);

  const [estado, setEstado] = useState<string>(
    String((initial as any)?.estado ?? (initial as any)?.stateId ?? "").trim()
  );
  const { stateOptions, isLoading: statesLoading } = useRequestStates();

  const [touched, setTouched] = useState<Touched>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const [saving, setSaving] = useState(false);

  const [loadingLookups, setLoadingLookups] = useState(false);
  const [serviciosLocal, setServiciosLocal] = useState<ServiceOption[]>([]);
  const [clientesLocal, setClientesLocal] = useState<Option[]>([]);

  const [serviceTypes, setServiceTypes] = useState<ServiceTypeOption[]>([]);
  const [serviceTypesLoading, setServiceTypesLoading] = useState(false);

  const finalServicios = useMemo<ServiceOption[]>(() => {
    const fromProps = (Array.isArray(servicios) ? servicios : []) as ServiceOption[];
    return fromProps.length ? fromProps : serviciosLocal;
  }, [servicios, serviciosLocal]);

  const finalClientes = useMemo<Option[]>(() => {
    const fromProps = Array.isArray(clientes) ? clientes : [];
    return fromProps.length ? fromProps : clientesLocal;
  }, [clientes, clientesLocal]);

  const selectedType = useMemo(
    () => (serviceTypeId ? serviceTypes.find((t) => t.id === serviceTypeId) || null : null),
    [serviceTypeId, serviceTypes]
  );

  const filteredServicios = useMemo<ServiceOption[]>(() => {
    const list = finalServicios || [];
    if (!serviceTypeId) return list;
    return list.filter((s) => Number(s.typeofserviceid) === Number(serviceTypeId));
  }, [finalServicios, serviceTypeId]);

  const [techniciansRaw, setTechniciansRaw] = useState<any[]>([]);
  const [techLoading, setTechLoading] = useState(false);
  const [techError, setTechError] = useState<string | null>(null);
  const [scheduledOrdersRaw, setScheduledOrdersRaw] = useState<any[]>([]);
  const [scheduledRequestsRaw, setScheduledRequestsRaw] = useState<any[]>([]);

  const technicians = useMemo<TechnicianOption[]>(() => {
    return (techniciansRaw || [])
      .map((t: any) => {
        const u = t?.users || t?.user || t?.Users || {};
        const name = [u?.name, u?.lastname].filter(Boolean).join(" ").trim();
        const label = name || `TÃ©cnico #${t?.technicianid ?? t?.id ?? "?"}`;
        return { technicianid: Number(t?.technicianid ?? t?.id), label } as TechnicianOption;
      })
      .filter((x) => Number.isFinite(x.technicianid) && x.technicianid > 0);
  }, [techniciansRaw]);

  const [selectedTechnicians, setSelectedTechnicians] = useState<number[]>([]);
  const selectedTechSet = useMemo(() => new Set(selectedTechnicians), [selectedTechnicians]);
  const selectedClient = useMemo(
    () => finalClientes.find((c) => Number(c.id) === Number(cliente)) ?? null,
    [finalClientes, cliente]
  );

  const selectedTechniciansFull = useMemo(() => {
    const map = new Map(technicians.map((t) => [t.technicianid, t]));
    return selectedTechnicians.map((id) => map.get(id)).filter(Boolean) as TechnicianOption[];
  }, [technicians, selectedTechnicians]);

  const selectedWindow = useMemo(
    () => buildWindowFromLocalSchedule(programada, horaProgramada, programada, horaFinal),
    [programada, horaProgramada, horaFinal]
  );

  const busyTechnicianIds = useMemo(
    () =>
      getBusyTechnicianIdsForWindow(scheduledOrdersRaw, scheduledRequestsRaw, selectedWindow, {
        excludeRequestId: requestId,
      }),
    [scheduledOrdersRaw, scheduledRequestsRaw, selectedWindow, requestId]
  );

  const availableTechnicians = useMemo(
    () => technicians.filter((t) => !busyTechnicianIds.has(t.technicianid)),
    [technicians, busyTechnicianIds]
  );

  const selectedBusyTechnicianIds = useMemo(
    () => selectedTechnicians.filter((id) => busyTechnicianIds.has(id)),
    [selectedTechnicians, busyTechnicianIds]
  );

  const [clientQuery, setClientQuery] = useState("");
  const [clientOpen, setClientOpen] = useState(false);
  const [clientActiveIndex, setClientActiveIndex] = useState(0);
  const clientBoxRef = useRef<HTMLDivElement>(null);
  const clientInputRef = useRef<HTMLInputElement>(null);

  const [techQuery, setTechQuery] = useState("");
  const [techOpen, setTechOpen] = useState(false);
  const [techActiveIndex, setTechActiveIndex] = useState(0);
  const techBoxRef = useRef<HTMLDivElement>(null);
  const techInputRef = useRef<HTMLInputElement>(null);

  const [hasAppliedInitialType, setHasAppliedInitialType] = useState(false);

  function markTouched(key: ErrorKey) {
    setTouched((prev) => (prev[key] ? prev : { ...prev, [key]: true }));
  }

  function shouldShowError(key: ErrorKey) {
    return Boolean(submitAttempted || touched[key]);
  }

  function validateDireccion(v: string) {
    const dir = (v ?? "").trim();
    if (dir.length < 3) return "MÃ­nimo 3 caracteres.";
    if (dir.length > 255) return "MÃ¡ximo 255 caracteres.";
    return null;
  }

  function validateDescripcion(v: string) {
    const d = (v ?? "").trim();
    return d.length >= 3 ? null : "MÃ­nimo 3 caracteres.";
  }

  function validateServicio(v: string) {
    return String(v || "").trim() ? null : "Selecciona un servicio.";
  }

  function validateCliente(v: string) {
    return String(v || "").trim() ? null : "Selecciona un cliente.";
  }

  function validateDateRequired(date: string | null) {
    if (!date) return "Selecciona la fecha.";
    const d = parseYMD(date);
    if (!d) return "Fecha invÃ¡lida.";
    if (isPastDateLocal(date)) return "No puedes seleccionar una fecha pasada.";
    if (!isAllowedDate(date)) return "No se puede agendar los domingos (solo lunes a sÃ¡bado).";
    return null;
  }

  function validateStartTimeRequired(date: string | null, start: string | null) {
    if (!start) return "Selecciona la hora inicial.";
    if (!isAllowedTime(start)) return "Horario permitido: 07:00â€“17:00.";
    if (timeToMinutes(start) === SCHEDULE_MAX) return "La hora de inicio no puede ser 17:00.";
    if (date && !isPastDateLocal(date) && isPastDateTimeLocal(date, start)) {
      return "La hora inicial no puede estar en el pasado.";
    }
    return null;
  }

  function validateEndTimeRequired(date: string | null, start: string | null, end: string | null) {
    if (!end) return "Selecciona la hora final.";
    if (!isAllowedTime(end)) return "Horario permitido: 07:00â€“17:00.";
    if (date && !isPastDateLocal(date) && isPastDateTimeLocal(date, end)) {
      return "La hora final no puede estar en el pasado.";
    }
    if (!start) return null;
    const s = timeToMinutes(start);
    const e = timeToMinutes(end);
    if (Number.isFinite(s) && Number.isFinite(e) && e <= s) {
      return "La hora final debe ser mayor que la hora inicial.";
    }
    return null;
  }

  const errors = useMemo<Errors>(() => {
    const e: Errors = {};

    e.tipo = serviceTypeId ? null : "Selecciona un tipo.";
    e.servicio = validateServicio(servicio);
    e.cliente = validateCliente(cliente);
    e.direccion = validateDireccion(direccion);
    e.descripcion = validateDescripcion(descripcion);

    e.programada = validateDateRequired(programada);

    const needsTime = !e.programada;
    e.horaProgramada = needsTime ? validateStartTimeRequired(programada, horaProgramada) : null;
    e.horaFinal = needsTime ? validateEndTimeRequired(programada, horaProgramada, horaFinal) : null;

    if (!selectedTechnicians.length) {
      e.technicians = "Selecciona al menos un tÃ©cnico.";
    } else if (selectedBusyTechnicianIds.length > 0) {
      e.technicians = "Hay tÃ©cnicos seleccionados que ya estÃ¡n ocupados en ese horario.";
    } else {
      e.technicians = null;
    }

    return e;
  }, [
    serviceTypeId,
    servicio,
    cliente,
    direccion,
    descripcion,
    programada,
    horaProgramada,
    horaFinal,
    selectedTechnicians,
    selectedBusyTechnicianIds,
  ]);

  function isValidNow() {
    return Object.values(errors).every((x) => !x);
  }

  const techOptions = useMemo(() => {
    const q = normalizeText(techQuery);
    const list = availableTechnicians.filter((t) => !selectedTechSet.has(t.technicianid));
    if (!q) return list.slice(0, 10);
    const scored = list
      .map((t) => {
        const label = normalizeText(t.label);
        const idStr = String(t.technicianid);
        let score = 0;
        if (idStr.startsWith(q)) score += 3;
        if (label.includes(q)) score += 2;
        if (label.startsWith(q)) score += 1;
        return { t, score };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score || a.t.label.localeCompare(b.t.label));
    return scored.slice(0, 10).map((x) => x.t);
  }, [availableTechnicians, techQuery, selectedTechSet]);

  const clientOptions = useMemo(() => {
    const q = normalizeText(clientQuery);
    const list = finalClientes || [];
    if (!q) return list.slice(0, 10);
    const scored = list
      .map((c) => {
        const label = normalizeText(c.label);
        const document = normalizeText(String(c.documentnumber ?? ""));
        const searchText = normalizeText(c.searchText ?? "");
        let score = 0;
        if (document && document.startsWith(q)) score += 4;
        if (label.includes(q)) score += 2;
        if (label.startsWith(q)) score += 1;
        if (searchText.includes(q)) score += 1;
        return { c, score };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score || a.c.label.localeCompare(b.c.label));
    return scored.slice(0, 10).map((x) => x.c);
  }, [finalClientes, clientQuery]);

  function pickClient(id: number) {
    if (!Number.isFinite(id) || id <= 0) return;
    markTouched("cliente");
    setCliente(String(id));
    setClientQuery("");
    setClientOpen(false);
  }

  function clearClient() {
    markTouched("cliente");
    setCliente("");
    setClientQuery("");
    setClientOpen(false);
    clientInputRef.current?.focus();
  }

  function addTechnician(id: number) {
    if (!Number.isFinite(id) || id <= 0) return;
    if (busyTechnicianIds.has(id)) {
      showWarning("Este técnico ya está ocupado en el horario seleccionado.");
      return;
    }
    markTouched("technicians");
    setSelectedTechnicians((prev) => (prev.includes(id) ? prev : [...prev, id]));
    setTechQuery("");
    setTechOpen(false);
    techInputRef.current?.focus();
  }

  function removeTechnician(id: number) {
    markTouched("technicians");
    setSelectedTechnicians((prev) => prev.filter((x) => x !== id));
  }

  function clearTechnicians() {
    markTouched("technicians");
    setSelectedTechnicians([]);
  }

  useEffect(() => {
    if (!isOpen) return;

    let alive = true;

    (async () => {
      const hasServicios = Array.isArray(servicios) && servicios.length > 0;
      const hasClientes = Array.isArray(clientes) && clientes.length > 0;

      if (hasServicios) setServiciosLocal(servicios as ServiceOption[]);
      if (hasClientes) setClientesLocal(clientes!);

      if (hasServicios && hasClientes) return;

      setLoadingLookups(true);

      const [sr, cr] = await Promise.allSettled([
        hasServicios ? Promise.resolve(servicios as ServiceOption[]) : getServiceOptions(),
        hasClientes ? Promise.resolve(clientes!) : getCustomerOptions(),
      ]);

      if (!alive) return;

      if (sr.status === "fulfilled") setServiciosLocal(sr.value as ServiceOption[]);
      else {
        setServiciosLocal([]);
        const status = (sr.reason as any)?.response?.status;
        showError(
          status
            ? `No se pudieron cargar los servicios (${status}).`
            : "No se pudieron cargar los servicios."
        );
      }

      if (cr.status === "fulfilled") setClientesLocal(cr.value as Option[]);
      else {
        setClientesLocal([]);
        const status = (cr.reason as any)?.response?.status;
        showError(
          status
            ? `No se pudieron cargar los clientes (${status}).`
            : "No se pudieron cargar los clientes."
        );
      }

      setLoadingLookups(false);
    })();

    return () => {
      alive = false;
    };
  }, [isOpen, servicios, clientes]);

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;

    async function run() {
      setServiceTypesLoading(true);
      try {
        const { data } = await api.get("services/types");
        const list: ServiceTypeApi[] = Array.isArray(data)
          ? data
          : Array.isArray((data as any)?.data)
          ? (data as any).data
          : [];
        const mapped = list
          .map((x) => ({
            id: Number(x.typeofserviceid),
            label: String(x.name || "").trim(),
          }))
          .filter((x) => Number.isFinite(x.id) && x.id > 0 && x.label);

        mapped.sort((a, b) => a.label.localeCompare(b.label));

        if (!cancelled) setServiceTypes(mapped);
      } catch (e: any) {
        if (!cancelled) {
          setServiceTypes([]);
          showError("No se pudieron cargar los tipos de servicio.");
        }
      } finally {
        if (!cancelled) setServiceTypesLoading(false);
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;

    async function run() {
      const [ordersRes, requestsRes] = await Promise.allSettled([
        api.get("orders-services"),
        api.get("service-requests"),
      ]);

      if (cancelled) return;

      const ordersData =
        ordersRes.status === "fulfilled" && Array.isArray((ordersRes.value as any)?.data)
          ? (ordersRes.value as any).data
          : [];
      const requestsData =
        requestsRes.status === "fulfilled" && Array.isArray((requestsRes.value as any)?.data)
          ? (requestsRes.value as any).data
          : [];

      setScheduledOrdersRaw(ordersData);
      setScheduledRequestsRaw(requestsData);
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;

    async function run() {
      setTechLoading(true);
      setTechError(null);
      try {
        const { data } = await api.get("technicians");
        const list = Array.isArray(data)
          ? data
          : Array.isArray((data as any)?.data)
          ? (data as any).data
          : Array.isArray((data as any)?.technicians)
          ? (data as any).technicians
          : [];
        if (!cancelled) setTechniciansRaw(list);
      } catch (e: any) {
        const msg = (e as any)?.response?.data?.message || (e as any)?.message || "Error cargando tÃ©cnicos.";
        if (!cancelled) {
          setTechError(String(msg));
          setTechniciansRaw([]);
        }
      } finally {
        if (!cancelled) setTechLoading(false);
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const init = initial as any;

    const initServiceId = String(
      init?.servicio ?? init?.serviceId ?? ""
    ).trim();
    const initClientId = String(
      init?.cliente ?? init?.clientId ?? ""
    ).trim();

    setServicio(initServiceId);
    setCliente(initClientId);

    setDescripcion(String(init?.descripcion ?? init?.description ?? ""));
    setDireccion(String(init?.direccion ?? ""));

    const partsStart =
      init?.programada || init?.horaProgramada
        ? { date: init?.programada ?? null, time: init?.horaProgramada ?? null }
        : parseISOToLocalParts(init?.scheduledAt ?? null);

    const partsEnd =
      init?.horaFinal
        ? { date: partsStart.date, time: init?.horaFinal ?? null }
        : parseISOToLocalParts(init?.scheduledEndAt ?? null);

    setProgramada(partsStart.date);
    setHoraProgramada(partsStart.time);
    setHoraFinal(partsEnd.time);

    const initTechs = Array.isArray(init?.technicians) ? init.technicians : [];
    setSelectedTechnicians(
      initTechs.map((x: any) => Number(x)).filter((x: number) => Number.isFinite(x) && x > 0)
    );

    setClientQuery("");
    setClientOpen(false);
    setClientActiveIndex(0);
    setTechQuery("");
    setTechOpen(false);
    setTechActiveIndex(0);

    setTouched({});
    setSubmitAttempted(false);

    setSaving(false);
    setTechError(null);
    setEstado(String(init?.estado ?? init?.stateId ?? "").trim());

    setHasAppliedInitialType(false);
  }, [isOpen, initial]);

  useEffect(() => {
    if (!isOpen) return;
    if (hasAppliedInitialType) return;
    if (serviceTypesLoading) return;
    if (!serviceTypes.length) return;

    const init = initial as any;

    const initServiceId = String(init?.servicio ?? init?.serviceId ?? "").trim();
    const svc = initServiceId ? finalServicios.find((s) => String(s.id) === initServiceId) : null;

    const fromService =
      svc?.typeofserviceid != null && Number.isFinite(Number(svc.typeofserviceid))
        ? Number(svc.typeofserviceid)
        : null;

    const fromServiceTypeStr = init?.serviceType
      ? inferTypeIdFromServiceType(serviceTypes, String(init.serviceType))
      : null;

    const desired = fromService ?? fromServiceTypeStr ?? null;

    if (desired && serviceTypes.some((t) => t.id === desired)) {
      setServiceTypeId(desired);
      setHasAppliedInitialType(true);
      return;
    }

    setServiceTypeId(serviceTypes[0].id);
    setHasAppliedInitialType(true);
  }, [isOpen, hasAppliedInitialType, serviceTypesLoading, serviceTypes, finalServicios, initial]);

  useEffect(() => {
    if (!isOpen) return;
    if (!hasAppliedInitialType) return;
    if (!serviceTypeId) return;
    if (!servicio) return;

    if (!filteredServicios.some((s) => String(s.id) === String(servicio))) {
      setServicio("");
      markTouched("servicio");
    }
  }, [isOpen, hasAppliedInitialType, serviceTypeId, filteredServicios, servicio]);

  useEffect(() => {
    setClientActiveIndex(0);
  }, [clientQuery, clientOpen]);

  useEffect(() => {
    if (!clientOpen) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!clientBoxRef.current) return;
      if (!clientBoxRef.current.contains(t)) setClientOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [clientOpen]);

  useEffect(() => {
    if (!cliente) return;
    if (!finalClientes.some((c) => Number(c.id) === Number(cliente))) {
      setCliente("");
      markTouched("cliente");
    }
  }, [finalClientes, cliente]);

  useEffect(() => {
    setTechActiveIndex(0);
  }, [techQuery, techOpen]);

  useEffect(() => {
    if (!techOpen) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!techBoxRef.current) return;
      if (!techBoxRef.current.contains(t)) setTechOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [techOpen]);

  function handleProgramadaChange(next: string) {
    markTouched("programada");
    const v = next || null;

    if (!v) {
      setProgramada(null);
      setHoraProgramada(null);
      setHoraFinal(null);
      return;
    }

    if (!parseYMD(v)) {
      setProgramada(v);
      return;
    }

    if (isPastDateLocal(v)) {
      showWarning("No puedes seleccionar una fecha pasada.");
      return;
    }

    if (!isAllowedDate(v)) {
      showWarning("No se puede agendar los domingos. Solo lunes a sÃ¡bado.");
      return;
    }

    setProgramada(v);

    if (horaProgramada && isPastDateTimeLocal(v, horaProgramada)) setHoraProgramada(null);
    if (horaFinal && isPastDateTimeLocal(v, horaFinal)) setHoraFinal(null);
  }

  function handleHoraProgramadaChange(next: string) {
    markTouched("horaProgramada");
    const v = next || null;

    if (!v) {
      setHoraProgramada(null);
      return;
    }

    if (!isAllowedTime(v)) {
      showWarning("Horario permitido: 07:00â€“17:00.");
      return;
    }

    if (timeToMinutes(v) === SCHEDULE_MAX) {
      showWarning("La hora de inicio no puede ser 17:00.");
      return;
    }

    if (programada && !isPastDateLocal(programada) && isPastDateTimeLocal(programada, v)) {
      showWarning("La hora inicial no puede estar en el pasado.");
      return;
    }

    setHoraProgramada(v);

    if (programada && v && !horaFinal) {
      const suggested = addMinutesToTime(v, 60);
      if (!isPastDateTimeLocal(programada, suggested) && isAllowedTime(suggested)) {
        setHoraFinal(suggested);
      }
    }
  }

  function handleHoraFinalChange(next: string) {
    markTouched("horaFinal");
    const v = next || null;

    if (!v) {
      setHoraFinal(null);
      return;
    }

    if (!isAllowedTime(v)) {
      showWarning("Horario permitido: 07:00â€“17:00.");
      return;
    }

    if (programada && !isPastDateLocal(programada) && isPastDateTimeLocal(programada, v)) {
      showWarning("La hora final no puede estar en el pasado.");
      return;
    }

    setHoraFinal(v);
  }

  async function submit() {
    if (saving) return;

    setSubmitAttempted(true);

    if (loadingLookups) {
      showInfo("Espera a que carguen los servicios y clientes.");
      return;
    }

    if (serviceTypesLoading) {
      showInfo("Espera a que carguen los tipos de servicio.");
      return;
    }

    if (techLoading) {
      showInfo("Espera a que carguen los tÃ©cnicos.");
      return;
    }

    if (!isValidNow()) return;

    if (selectedBusyTechnicianIds.length > 0) {
      showError("Hay tÃ©cnicos ocupados en ese horario. Ajusta horario o tÃ©cnicos.");
      return;
    }

    if (!selectedType) {
      showError("Selecciona un tipo de servicio.");
      return;
    }

    if (!programada || !horaProgramada || !horaFinal) {
      showError("Completa fecha y horas.");
      return;
    }

    const scheduledAtISO = combineDateTimeLocal(programada, horaProgramada);
    const scheduledEndAtISO = combineDateTimeLocal(programada, horaFinal);

    if (!scheduledAtISO || !scheduledEndAtISO) {
      showError("Fecha u horas invÃ¡lidas.");
      return;
    }

    const payload: EditRequestPayload = {
      serviceId: Number(servicio),
      clientId: Number(cliente),
      serviceType: String(selectedType.label).trim(),
      description: String(descripcion ?? "").trim(),
      direccion: String(direccion ?? "").trim().slice(0, 255),
      scheduledAt: scheduledAtISO,
      scheduledEndAt: scheduledEndAtISO,
      estado: estado || undefined,
      stateId: estado ? Number(estado) : undefined,
      estadoLabel: stateOptions.find((s) => String(s.id) === String(estado))?.label,
      technicians: selectedTechnicians,
    };

    setSaving(true);
    try {
      await onSave(payload);
      onClose();
    } catch (err: any) {
      const msg = getBackendMessage(err);
      showError(msg || "No se pudo actualizar la solicitud.");
    } finally {
      setSaving(false);
    }
  }

  const timeMin = "07:00";
  const timeStartMax = "16:59";
  const timeMax = "17:00";

  return (
    <Modal
      title={title}
      isOpen={isOpen}
      onClose={onClose}
      footer={
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            disabled={saving}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={submit}
            className="rounded-lg bg-black px-3 py-2 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-60"
            disabled={saving || loadingLookups || techLoading || serviceTypesLoading}
            title={
              loadingLookups
                ? "Cargando servicios/clientes..."
                : serviceTypesLoading
                ? "Cargando tipos..."
                : techLoading
                ? "Cargando tÃ©cnicos..."
                : undefined
            }
          >
            {saving ? "Actualizando..." : "Actualizar"}
          </button>
        </div>
      }
    >
      <div className="grid gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-3">
          <div className="mb-1 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Tipo de servicio</h3>
            <span className="text-[11px] text-gray-500">
              {serviceTypesLoading
                ? "Cargando tipos..."
                : serviceTypes.length
                ? "Selecciona uno"
                : "No hay tipos disponibles"}
            </span>
          </div>

          {serviceTypes.length ? (
            <div className="inline-grid grid-cols-2 gap-2">
              {serviceTypes.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    markTouched("tipo");
                    setServiceTypeId(t.id);
                    setHasAppliedInitialType(true);
                    if (servicio && !finalServicios.some((s) => String(s.id) === String(servicio))) {
                      setServicio("");
                    } else {
                      const ok = finalServicios.some(
                        (s) =>
                          String(s.id) === String(servicio) &&
                          Number(s.typeofserviceid) === Number(t.id)
                      );
                      if (servicio && !ok) setServicio("");
                    }
                  }}
                  className={[
                    "inline-flex items-center justify-center rounded-full px-3 py-1.5 text-xs border transition min-w-36",
                    serviceTypeId === t.id
                      ? "bg-black text-white border-black"
                      : "bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-200",
                  ].join(" ")}
                  disabled={saving || serviceTypesLoading}
                >
                  {t.label}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-500">No hay tipos de servicio configurados.</p>
          )}

          {shouldShowError("tipo") && errors.tipo && (
            <p className="mt-1 text-xs text-red-600">{errors.tipo}</p>
          )}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-3">
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Datos basicos
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-900">Servicio</label>
            <div className="relative">
              <select
                value={servicio || ""}
                onChange={(e) => {
                  markTouched("servicio");
                  setServicio(e.target.value);
                }}
                onBlur={() => markTouched("servicio")}
                disabled={saving || loadingLookups || serviceTypesLoading}
                className={[
                  "w-full appearance-none rounded-lg border bg-gray-50 h-10 px-3 pr-8 text-sm focus:bg-white focus:ring-2 focus:ring-black/15 disabled:opacity-60",
                  shouldShowError("servicio") && errors.servicio ? "border-red-500" : "border-gray-300",
                ].join(" ")}
              >
                <option value="">
                  {loadingLookups
                    ? "Cargando servicios..."
                    : filteredServicios.length
                    ? "Selecciona el servicio"
                    : serviceTypeId
                    ? "No hay servicios para este tipo"
                    : "No hay servicios"}
                </option>
                {filteredServicios.map((s) => (
                  <option key={s.id} value={String(s.id)}>
                    {s.label}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-500">
                v
              </span>
            </div>
            {shouldShowError("servicio") && errors.servicio && (
              <p className="mt-1 text-xs text-red-600">{errors.servicio}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-900">Cliente</label>
            <div
              ref={clientBoxRef}
              className={[
                "rounded-lg border bg-gray-50 p-2",
                shouldShowError("cliente") && errors.cliente ? "border-red-500" : "border-gray-300",
              ].join(" ")}
            >
              {selectedClient ? (
                <div className="mb-2 flex items-center justify-between gap-2 rounded-md border border-gray-200 bg-white p-2">
                  <div className="min-w-0 flex items-center gap-2">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border bg-gray-50 text-[11px] font-semibold text-gray-700">
                      {initials(selectedClient.label)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900">{selectedClient.label}</p>
                      <p className="truncate text-[11px] text-gray-500">
                        Cliente #{selectedClient.id}
                        {selectedClient.documentnumber ? ` - Doc ${selectedClient.documentnumber}` : ""}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={clearClient}
                    className="rounded-md border border-gray-300 bg-white px-2 py-1 text-[11px] text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                    disabled={saving || loadingLookups}
                  >
                    Quitar
                  </button>
                </div>
              ) : null}

              <div className="relative">
                <input
                  ref={clientInputRef}
                  value={clientQuery}
                  onChange={(e) => {
                    setClientQuery(e.target.value);
                    setClientOpen(true);
                    markTouched("cliente");
                  }}
                  onFocus={() => {
                    setClientOpen(true);
                    markTouched("cliente");
                  }}
                  onBlur={() => markTouched("cliente")}
                  onKeyDown={(e) => {
                    if (!clientOpen) return;
                    if (e.key === "ArrowDown") {
                      e.preventDefault();
                      setClientActiveIndex((i) => Math.min(i + 1, Math.max(0, clientOptions.length - 1)));
                    } else if (e.key === "ArrowUp") {
                      e.preventDefault();
                      setClientActiveIndex((i) => Math.max(i - 1, 0));
                    } else if (e.key === "Enter") {
                      if (clientOptions[clientActiveIndex]) {
                        e.preventDefault();
                        pickClient(clientOptions[clientActiveIndex].id);
                      }
                    } else if (e.key === "Escape") {
                      setClientOpen(false);
                    }
                  }}
                  placeholder={
                    loadingLookups
                      ? "Cargando clientes..."
                      : finalClientes.length
                      ? "Buscar por nombre o documento"
                      : "No hay clientes"
                  }
                  disabled={saving || loadingLookups || finalClientes.length === 0}
                  className="w-full rounded-lg border border-gray-300 bg-white h-10 px-3 text-sm focus:ring-2 focus:ring-black/15 disabled:opacity-60"
                  aria-expanded={clientOpen}
                  aria-controls="client-suggest-edit"
                  aria-autocomplete="list"
                />

                {clientOpen && !loadingLookups && !saving && (
                  <div
                    id="client-suggest-edit"
                    className="absolute z-20 mt-2 w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm"
                  >
                    {clientOptions.length === 0 ? (
                      <div className="px-3 py-2 text-xs text-gray-500">No hay coincidencias.</div>
                    ) : (
                      <ul className="max-h-56 overflow-auto">
                        {clientOptions.map((c, idx) => (
                          <li key={c.id}>
                            <button
                              type="button"
                              onMouseDown={(ev) => ev.preventDefault()}
                              onClick={() => pickClient(c.id)}
                              onMouseEnter={() => setClientActiveIndex(idx)}
                              className={[
                                "w-full px-3 py-2 text-left text-sm flex items-center gap-2",
                                idx === clientActiveIndex ? "bg-gray-100" : "bg-white",
                              ].join(" ")}
                            >
                              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border bg-gray-50 text-[11px] font-semibold text-gray-700">
                                {initials(c.label)}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block truncate font-medium text-gray-900">{c.label}</span>
                                <span className="block truncate text-[11px] text-gray-500">
                                  Cliente #{c.id}
                                  {c.documentnumber ? ` - Doc ${c.documentnumber}` : ""}
                                </span>
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            </div>
            {shouldShowError("cliente") && errors.cliente && (
              <p className="mt-1 text-xs text-red-600">{errors.cliente}</p>
            )}
          </div>
        </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-3">
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Programacion y estado
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-4">
            <label className="mb-1 block text-xs font-medium text-gray-900">DirecciÃ³n</label>
            <input
              value={direccion}
              onChange={(e) => {
                markTouched("direccion");
                setDireccion(e.target.value);
              }}
              onBlur={() => markTouched("direccion")}
              placeholder="Ej. Calle 123 #45-67"
              className={[
                "w-full rounded-lg border bg-gray-50 h-10 px-3 text-sm focus:bg-white focus:ring-2 focus:ring-black/15",
                shouldShowError("direccion") && errors.direccion ? "border-red-500" : "border-gray-300",
              ].join(" ")}
            />
            {shouldShowError("direccion") && errors.direccion && (
              <p className="mt-1 text-xs text-red-600">{errors.direccion}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-900">Programada</label>
            <input
              type="date"
              min={ymdTodayString()}
              value={programada ?? ""}
              onChange={(e) => handleProgramadaChange(e.target.value)}
              onBlur={() => markTouched("programada")}
              className={[
                "w-full rounded-lg border bg-gray-50 h-10 px-3 text-sm focus:bg-white focus:ring-2 focus:ring-black/15",
                shouldShowError("programada") && errors.programada ? "border-red-500" : "border-gray-300",
              ].join(" ")}
              required
            />
            {shouldShowError("programada") && errors.programada && (
              <p className="mt-1 text-xs text-red-600">{errors.programada}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-900">Hora (inicio)</label>
            <input
              type="time"
              min={timeMin}
              max={timeStartMax}
              value={horaProgramada ?? ""}
              onChange={(e) => handleHoraProgramadaChange(e.target.value)}
              onBlur={() => markTouched("horaProgramada")}
              className={[
                "w-full rounded-lg border bg-gray-50 h-10 px-3 text-sm focus:bg-white focus:ring-2 focus:ring-black/15 disabled:opacity-60",
                shouldShowError("horaProgramada") && errors.horaProgramada ? "border-red-500" : "border-gray-300",
              ].join(" ")}
              disabled={!programada}
              required
            />
            {shouldShowError("horaProgramada") && errors.horaProgramada && (
              <p className="mt-1 text-xs text-red-600">{errors.horaProgramada}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-900">Hora final</label>
            <input
              type="time"
              min={timeMin}
              max={timeMax}
              value={horaFinal ?? ""}
              onChange={(e) => handleHoraFinalChange(e.target.value)}
              onBlur={() => markTouched("horaFinal")}
              className={[
                "w-full rounded-lg border bg-gray-50 h-10 px-3 text-sm focus:bg-white focus:ring-2 focus:ring-black/15 disabled:opacity-60",
                shouldShowError("horaFinal") && errors.horaFinal ? "border-red-500" : "border-gray-300",
              ].join(" ")}
              disabled={!programada}
              required
            />
            {shouldShowError("horaFinal") && errors.horaFinal && (
              <p className="mt-1 text-xs text-red-600">{errors.horaFinal}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-900">Estado</label>
            <div className="relative">
              <select
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
                disabled={saving || statesLoading}
                className="w-full appearance-none rounded-lg border bg-gray-50 h-10 px-3 pr-8 text-sm focus:bg-white focus:ring-2 focus:ring-black/15 disabled:opacity-60 border-gray-300"
              >
                <option value="">{statesLoading ? "Cargando estados..." : "Selecciona estado"}</option>
                {stateOptions.map((s) => (
                  <option key={s.id} value={String(s.id)}>
                    {s.label}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-500">
                v
              </span>
            </div>
          </div>
        </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-3">
          <div className="mb-1 flex items-center justify-between">
            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
              Tecnicos
            </label>
            <button
              type="button"
              onClick={clearTechnicians}
              className="rounded-md border border-gray-300 bg-white px-2 py-1 text-[11px] text-gray-700 hover:bg-gray-50 disabled:opacity-60"
              disabled={saving || techLoading || selectedTechnicians.length === 0}
            >
              Limpiar
            </button>
          </div>

          <div
            className={[
              "rounded-lg border bg-gray-50 p-2",
              shouldShowError("technicians") && errors.technicians
                ? "border-red-500 ring-1 ring-red-500"
                : "border-gray-300",
            ].join(" ")}
          >
            {selectedTechniciansFull.length === 0 ? (
              <div className="text-xs text-gray-500 px-1 py-1">No has seleccionado tÃ©cnicos.</div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {selectedTechniciansFull.map((t) => (
                  <span
                    key={t.technicianid}
                    className="inline-flex items-center gap-2 rounded-full border bg-white px-2 py-1 text-xs"
                  >
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border bg-gray-50 text-[10px] font-semibold">
                      {initials(t.label)}
                    </span>
                    <span className="max-w-[220px] truncate">
                      #{t.technicianid} â€” {t.label}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeTechnician(t.technicianid)}
                      className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full hover:bg-gray-200"
                      disabled={saving || techLoading}
                    >
                      âœ•
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div ref={techBoxRef} className="relative mt-2">
            <input
              ref={techInputRef}
              value={techQuery}
              onChange={(e) => {
                setTechQuery(e.target.value);
                setTechOpen(true);
              }}
              onFocus={() => setTechOpen(true)}
              onKeyDown={(e) => {
                if (!techOpen) return;
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setTechActiveIndex((i) => Math.min(i + 1, Math.max(0, techOptions.length - 1)));
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setTechActiveIndex((i) => Math.max(i - 1, 0));
                } else if (e.key === "Enter") {
                  if (techOptions[techActiveIndex]) {
                    e.preventDefault();
                    addTechnician(techOptions[techActiveIndex].technicianid);
                  }
                } else if (e.key === "Escape") {
                  setTechOpen(false);
                }
              }}
              placeholder={techLoading ? "Cargando tÃ©cnicos..." : "Buscar por nombre o ID..."}
              className={[
                "w-full rounded-lg border bg-gray-50 h-10 px-3 text-sm focus:bg-white focus:ring-2 focus:ring-black/15 disabled:opacity-60",
                shouldShowError("technicians") && errors.technicians
                  ? "border-red-500 ring-1 ring-red-500"
                  : "border-gray-300",
              ].join(" ")}
              disabled={saving || techLoading}
              onBlur={() => markTouched("technicians")}
            />

            {techOpen && !techLoading && (
              <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-lg border bg-white shadow-sm">
                {techOptions.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-gray-500">
                    {selectedTechnicians.length === availableTechnicians.length
                      ? "Ya seleccionaste todos los tÃ©cnicos."
                      : "No hay coincidencias."}
                  </div>
                ) : (
                  <ul className="max-h-60 overflow-auto">
                    {techOptions.map((t, idx) => (
                      <li key={t.technicianid}>
                        <button
                          type="button"
                          onMouseDown={(ev) => ev.preventDefault()}
                          onClick={() => addTechnician(t.technicianid)}
                          onMouseEnter={() => setTechActiveIndex(idx)}
                          className={[
                            "w-full px-3 py-2 text-left text-sm flex items-center gap-2",
                            idx === techActiveIndex ? "bg-gray-100" : "bg-white",
                          ].join(" ")}
                        >
                          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border bg-gray-50 text-xs font-semibold">
                            {initials(t.label)}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-medium">{t.label}</span>
                            <span className="block text-xs text-gray-500">TÃ©cnico #{t.technicianid}</span>
                          </span>
                          <span className="text-xs text-gray-400">Agregar</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {techError && <p className="mt-1 text-xs text-red-600">{techError}</p>}
          {shouldShowError("technicians") && errors.technicians && (
            <p className="mt-1 text-xs text-red-600">{errors.technicians}</p>
          )}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-3">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Descripcion
          </h4>
          <label className="mb-1 block text-xs font-medium text-gray-900">DescripciÃ³n</label>
          <textarea
            value={descripcion}
            onChange={(e) => {
              markTouched("descripcion");
              setDescripcion(e.target.value);
            }}
            onBlur={() => markTouched("descripcion")}
            rows={3}
            placeholder="Describe brevemente la solicitud"
            className={[
              "w-full rounded-lg border bg-gray-50 px-3 py-2 text-sm focus:bg-white focus:ring-2 focus:ring-black/15",
              shouldShowError("descripcion") && errors.descripcion ? "border-red-500" : "border-gray-300",
            ].join(" ")}
          />
          {shouldShowError("descripcion") && errors.descripcion && (
            <p className="mt-1 text-xs text-red-600">{errors.descripcion}</p>
          )}
        </div>
      </div>
    </Modal>
  );
}


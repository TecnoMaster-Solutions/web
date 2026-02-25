"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Modal from "@/features/dashboard/components/Modal";
import type { Option } from "@/features/dashboard/requests/types/option.types";
import { showError, showInfo, showWarning } from "@/shared/utils/notifications";
import {
  getServiceOptions,
  getCustomerOptions,
} from "@/features/dashboard/requests/services/lookups.service";
import { api } from "@/lib/api";
import {
  buildWindowFromLocalSchedule,
  getBusyTechnicianIdsForWindow,
} from "@/features/dashboard/shared/technicianAvailability";

export type CreateRequestPayload = {
  scheduledAt?: string | null;
  scheduledEndAt?: string | null;
  serviceType: string;
  description: string;
  direccion: string;
  stateId?: number;
  serviceId: number;
  clientId: number;
  technicians: number[];
};

type ServiceOption = Option & {
  typeofserviceid?: number | null;
  typeofservicename?: string | null;
  serviceTypeCode?: string | null;
};

type ServiceTypeOption = {
  id: number;
  label: string;
  code: string;
};

type TechnicianOption = {
  technicianid: number;
  label: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateRequestPayload) => void | Promise<void>;
  title?: string;
  servicios?: ServiceOption[] | null;
  clientes?: Option[] | null;
  initialDate?: string | null;
  initialTime?: string | null;
  initialEndTime?: string | null;
  pendingStateId?: number | null;
  scheduledStateId?: number | null;
};

type ErrorKey =
  | "tipo"
  | "serviceId"
  | "clientId"
  | "description"
  | "direccion"
  | "programada"
  | "horaProgramada"
  | "horaFinal"
  | "technicians";

type Errors = Partial<Record<ErrorKey, string | null>>;
type Touched = Partial<Record<ErrorKey, boolean>>;

function toIsoFromLocalDateTime(date: string, time: string) {
  const [y, m, d] = date.split("-").map((n) => Number(n));
  const [hh, mm] = time.split(":").map((n) => Number(n));
  const dt = new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0, 0, 0);
  return dt.toISOString();
}

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

export default function CreateRequestModal({
  isOpen,
  onClose,
  onSave,
  title = "Crear Solicitud",
  servicios,
  clientes,
  initialDate = null,
  initialTime = null,
  initialEndTime = null,
  pendingStateId = null,
  scheduledStateId = null,
}: Props) {
  const [serviceTypeId, setServiceTypeId] = useState<number | null>(null);
  const [serviceId, setServiceId] = useState<number | "">("");
  const [clientId, setClientId] = useState<number | "">("");

  const [description, setDescription] = useState("");
  const [direccion, setDireccion] = useState("");

  const [programada, setProgramada] = useState<string | null>(initialDate);
  const [horaProgramada, setHoraProgramada] = useState<string | null>(initialTime);
  const [horaFinal, setHoraFinal] = useState<string | null>(initialEndTime);

  const [touched, setTouched] = useState<Touched>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const [saving, setSaving] = useState(false);

  const [loadingLookups, setLoadingLookups] = useState(false);
  const [serviciosLocal, setServiciosLocal] = useState<ServiceOption[]>([]);
  const [clientesLocal, setClientesLocal] = useState<Option[]>([]);

  const finalServicios = useMemo<ServiceOption[]>(() => {
    const fromProps = (Array.isArray(servicios) ? servicios : []) as ServiceOption[];
    return fromProps.length ? fromProps : serviciosLocal;
  }, [servicios, serviciosLocal]);

  const finalClientes = useMemo<Option[]>(() => {
    const fromProps = Array.isArray(clientes) ? clientes : [];
    return fromProps.length ? fromProps : clientesLocal;
  }, [clientes, clientesLocal]);

  const serviceTypes = useMemo<ServiceTypeOption[]>(() => {
    const map = new Map<number, ServiceTypeOption>();

    (finalServicios || []).forEach((s) => {
      const typeId = s.typeofserviceid;
      const typeName = s.typeofservicename;
      if (!typeId || !typeName) return;
      if (map.has(typeId)) return;

      let code = (s.serviceTypeCode || "").trim();
      if (!code) {
        const norm = typeName
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase();
        if (norm.startsWith("mantenimiento")) code = "MANTENIMIENTO";
        else if (norm.startsWith("instal")) code = "INSTALACION";
        else code = typeName;
      }

      map.set(typeId, { id: typeId, label: typeName, code });
    });

    return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [finalServicios]);

  const selectedType = useMemo(
    () => (serviceTypeId ? serviceTypes.find((t) => t.id === serviceTypeId) || null : null),
    [serviceTypeId, serviceTypes]
  );

  const filteredServicios = useMemo<ServiceOption[]>(() => {
    const list = finalServicios || [];
    if (!serviceTypeId) return list;
    const hasTypeInfo = list.some((s) => s.typeofserviceid != null);
    if (!hasTypeInfo) return list;
    return list.filter((s) => s.typeofserviceid === serviceTypeId);
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
        const label = name || `Técnico #${t?.technicianid ?? t?.id ?? "?"}`;
        return { technicianid: Number(t?.technicianid ?? t?.id), label } as TechnicianOption;
      })
      .filter((x) => Number.isFinite(x.technicianid) && x.technicianid > 0);
  }, [techniciansRaw]);

  const [selectedTechnicians, setSelectedTechnicians] = useState<number[]>([]);
  const selectedTechSet = useMemo(() => new Set(selectedTechnicians), [selectedTechnicians]);
  const selectedClient = useMemo(
    () => finalClientes.find((c) => Number(c.id) === Number(clientId)) ?? null,
    [finalClientes, clientId]
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
      getBusyTechnicianIdsForWindow(
        scheduledOrdersRaw,
        scheduledRequestsRaw,
        selectedWindow
      ),
    [scheduledOrdersRaw, scheduledRequestsRaw, selectedWindow]
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

  function markTouched(key: ErrorKey) {
    setTouched((prev) => (prev[key] ? prev : { ...prev, [key]: true }));
  }

  function shouldShowError(key: ErrorKey) {
    return Boolean(submitAttempted || touched[key]);
  }

  function validateDireccion(v: string) {
    const dir = (v ?? "").trim();
    if (dir.length < 3) return "Mínimo 3 caracteres.";
    if (dir.length > 255) return "Máximo 255 caracteres.";
    return null;
  }

  function validateDescription(v: string) {
    const d = (v ?? "").trim();
    return d.length >= 3 ? null : "Mínimo 3 caracteres.";
  }

  function validateServiceId(v: number | "") {
    return v !== "" ? null : "Selecciona un servicio.";
  }

  function validateClientId(v: number | "") {
    return v !== "" ? null : "Selecciona un cliente.";
  }

  function validateDateRequired(date: string | null) {
    if (!date) return "Selecciona la fecha.";
    const d = parseYMD(date);
    if (!d) return "Fecha inválida.";
    if (isPastDateLocal(date)) return "No puedes seleccionar una fecha pasada.";
    if (!isAllowedDate(date)) return "No se puede agendar los domingos (solo lunes a sábado).";
    return null;
  }

  function validateStartTimeRequired(date: string | null, start: string | null) {
    if (!start) return "Selecciona la hora inicial.";
    if (!isAllowedTime(start)) return "Horario permitido: 07:00–17:00.";
    if (timeToMinutes(start) === SCHEDULE_MAX) return "La hora de inicio no puede ser 17:00.";
    if (date && !isPastDateLocal(date) && isPastDateTimeLocal(date, start)) {
      return "La hora inicial no puede estar en el pasado.";
    }
    return null;
  }

  function validateEndTimeRequired(date: string | null, start: string | null, end: string | null) {
    if (!end) return "Selecciona la hora final.";
    if (!isAllowedTime(end)) return "Horario permitido: 07:00–17:00.";

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
    e.serviceId = validateServiceId(serviceId);
    e.clientId = validateClientId(clientId);
    e.direccion = validateDireccion(direccion);
    e.description = validateDescription(description);

    e.programada = validateDateRequired(programada);

    const needsTime = !e.programada;
    e.horaProgramada = needsTime ? validateStartTimeRequired(programada, horaProgramada) : null;
    e.horaFinal = needsTime ? validateEndTimeRequired(programada, horaProgramada, horaFinal) : null;

    if (!selectedTechnicians.length) {
      e.technicians = "Selecciona al menos un técnico.";
    } else if (selectedBusyTechnicianIds.length > 0) {
      e.technicians = "Hay técnicos seleccionados que ya están ocupados en ese horario.";
    } else {
      e.technicians = null;
    }

    return e;
  }, [
    serviceTypeId,
    serviceId,
    clientId,
    direccion,
    description,
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
    markTouched("clientId");
    setClientId(id);
    setClientQuery("");
    setClientOpen(false);
  }

  function clearClient() {
    markTouched("clientId");
    setClientId("");
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
        console.error("LOOKUP services ERROR →", sr.reason);
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
        console.error("LOOKUP customers ERROR →", cr.reason);
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
      setTechLoading(true);
      setTechError(null);
      try {
        const { data } = await api.get("technicians");
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data?.technicians)
          ? data.technicians
          : [];
        if (!cancelled) setTechniciansRaw(list);
      } catch (e: any) {
        const msg = e?.response?.data?.message || e?.message || "Error cargando técnicos.";
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

    setServiceTypeId(null);
    setServiceId("");
    setClientId("");
    setDescription("");
    setDireccion("");
    setProgramada(initialDate ?? null);
    setHoraProgramada(initialTime ?? null);
    setHoraFinal(initialEndTime ?? null);

    setSelectedTechnicians([]);
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
  }, [isOpen, initialDate, initialTime, initialEndTime]);

  useEffect(() => {
    if (!serviceTypes.length) {
      setServiceTypeId(null);
      return;
    }
    if (serviceTypeId && serviceTypes.some((t) => t.id === serviceTypeId)) return;
    setServiceTypeId(serviceTypes[0].id);
  }, [serviceTypes, serviceTypeId]);

  useEffect(() => {
    if (!isOpen) return;
    if (serviceId === "") return;
    if (!filteredServicios.some((s) => Number(s.id) === Number(serviceId))) {
      setServiceId("");
      markTouched("serviceId");
    }
  }, [isOpen, filteredServicios, serviceId]);

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
    if (clientId === "") return;
    if (!finalClientes.some((c) => Number(c.id) === Number(clientId))) {
      setClientId("");
      markTouched("clientId");
    }
  }, [finalClientes, clientId]);

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
      showWarning("No se puede agendar los domingos. Solo lunes a sábado.");
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
      showWarning("Horario permitido: 07:00–17:00.");
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
  }

  function handleHoraFinalChange(next: string) {
    markTouched("horaFinal");
    const v = next || null;

    if (!v) {
      setHoraFinal(null);
      return;
    }

    if (!isAllowedTime(v)) {
      showWarning("Horario permitido: 07:00–17:00.");
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

    if (techLoading) {
      showInfo("Espera a que carguen los técnicos.");
      return;
    }

    if (!isValidNow()) return;

    if (selectedBusyTechnicianIds.length > 0) {
      showError("Hay técnicos ocupados en ese horario. Ajusta horario o técnicos.");
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

    const scheduledAt = toIsoFromLocalDateTime(programada, horaProgramada);
    const scheduledEndAt = toIsoFromLocalDateTime(programada, horaFinal);

    const stateIdToSend =
      scheduledStateId && Number.isFinite(scheduledStateId) && scheduledStateId > 0
        ? scheduledStateId
        : pendingStateId && Number.isFinite(pendingStateId) && pendingStateId > 0
        ? pendingStateId
        : 5;

    const payload: CreateRequestPayload = {
      serviceType: selectedType.code,
      serviceId: Number(serviceId),
      clientId: Number(clientId),
      description: String(description ?? "").trim(),
      direccion: String(direccion ?? "").trim().slice(0, 255),
      scheduledAt,
      scheduledEndAt,
      stateId: stateIdToSend,
      technicians: selectedTechnicians,
    };

    setSaving(true);
    try {
      await onSave(payload);
      onClose();
    } catch (err: any) {
      const msg = getBackendMessage(err);
      showError(msg || "No se pudo crear la solicitud.");
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
            disabled={saving || loadingLookups || techLoading}
            title={
              loadingLookups
                ? "Cargando servicios/clientes..."
                : techLoading
                ? "Cargando técnicos..."
                : undefined
            }
          >
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      }
    >
      <div className="grid gap-3">
        <div>
          <div className="mb-1 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Tipo de servicio</h3>
            <span className="text-[11px] text-gray-500">
              {loadingLookups
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
                  }}
                  className={[
                    "inline-flex items-center justify-center rounded-full px-3 py-1.5 text-xs border transition min-w-36",
                    serviceTypeId === t.id
                      ? "bg-black text-white border-black"
                      : "bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-200",
                  ].join(" ")}
                  disabled={saving || loadingLookups}
                >
                  {t.label}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-500">
              Configura tipos de servicio en el catálogo de servicios.
            </p>
          )}

          {shouldShowError("tipo") && errors.tipo && (
            <p className="mt-1 text-xs text-red-600">{errors.tipo}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-900">Servicio</label>
            <div className="relative">
              <select
                value={serviceId === "" ? "" : String(serviceId)}
                onChange={(e) => {
                  markTouched("serviceId");
                  setServiceId(e.target.value ? Number(e.target.value) : "");
                }}
                onBlur={() => markTouched("serviceId")}
                disabled={saving || loadingLookups}
                className={[
                  "w-full appearance-none rounded-lg border bg-gray-50 h-10 px-3 pr-8 text-sm focus:bg-white focus:ring-2 focus:ring-black/15 disabled:opacity-60",
                  shouldShowError("serviceId") && errors.serviceId
                    ? "border-red-500"
                    : "border-gray-300",
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
                ▾
              </span>
            </div>
            {shouldShowError("serviceId") && errors.serviceId && (
              <p className="mt-1 text-xs text-red-600">{errors.serviceId}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-900">Cliente</label>
            <div
              ref={clientBoxRef}
              className={[
                "rounded-lg border bg-gray-50 p-2",
                shouldShowError("clientId") && errors.clientId ? "border-red-500" : "border-gray-300",
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
                    markTouched("clientId");
                  }}
                  onFocus={() => {
                    setClientOpen(true);
                    markTouched("clientId");
                  }}
                  onBlur={() => markTouched("clientId")}
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
                  aria-controls="client-suggest"
                  aria-autocomplete="list"
                />

                {clientOpen && !loadingLookups && !saving && (
                  <div
                    id="client-suggest"
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
            {shouldShowError("clientId") && errors.clientId && (
              <p className="mt-1 text-xs text-red-600">{errors.clientId}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-900">Dirección</label>
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
                shouldShowError("direccion") && errors.direccion
                  ? "border-red-500"
                  : "border-gray-300",
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
                shouldShowError("programada") && errors.programada
                  ? "border-red-500"
                  : "border-gray-300",
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
                shouldShowError("horaProgramada") && errors.horaProgramada
                  ? "border-red-500"
                  : "border-gray-300",
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
                shouldShowError("horaFinal") && errors.horaFinal
                  ? "border-red-500"
                  : "border-gray-300",
              ].join(" ")}
              disabled={!programada}
              required
            />
            {shouldShowError("horaFinal") && errors.horaFinal && (
              <p className="mt-1 text-xs text-red-600">{errors.horaFinal}</p>
            )}
          </div>
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="block text-xs font-medium text-gray-900">Técnicos</label>
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
              <div className="text-xs text-gray-500 px-1 py-1">
                No has seleccionado técnicos.
              </div>
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
                      #{t.technicianid} — {t.label}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeTechnician(t.technicianid)}
                      className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full hover:bg-gray-200"
                      disabled={saving || techLoading}
                    >
                      ✕
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
              placeholder={techLoading ? "Cargando técnicos..." : "Buscar por nombre o ID..."}
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
                      ? "Ya seleccionaste todos los técnicos."
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
                            <span className="block text-xs text-gray-500">
                              Técnico #{t.technicianid}
                            </span>
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

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-900">Descripción</label>
          <textarea
            value={description}
            onChange={(e) => {
              markTouched("description");
              setDescription(e.target.value);
            }}
            onBlur={() => markTouched("description")}
            rows={3}
            placeholder="Describe brevemente la solicitud"
            className={[
              "w-full rounded-lg border bg-gray-50 px-3 py-2 text-sm focus:bg-white focus:ring-2 focus:ring-black/15",
              shouldShowError("description") && errors.description
                ? "border-red-500"
                : "border-gray-300",
            ].join(" ")}
          />
          {shouldShowError("description") && errors.description && (
            <p className="mt-1 text-xs text-red-600">{errors.description}</p>
          )}
        </div>
      </div>
    </Modal>
  );
}

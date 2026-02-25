"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import RequireAuth from "@/features/auth/requireauth";
import { uploadImageToCloudinary } from "@/shared/utils/cloudinary";
import { useOrdersServicesLookups } from "../hooks/useOrdersServicesLookups";
import { showError, showSuccess, showWarning } from "@/shared/utils/notifications";
import { api } from "@/lib/api";
import {
  buildWindowFromLocalSchedule,
  getBusyTechnicianIdsForWindow,
} from "@/features/dashboard/shared/technicianAvailability";
import type { UpdateOrdersServiceDto } from "../types/ordersServices.types";

type ServiceLineItem = {
  id: string;
  tipoId: number;
  nombre: string;
  cantidad: number;
  precio: number;
};

type MaterialLineItem = {
  id: string;
  nombre: string;
  cantidad: number;
  precio: number;
};

type CustomerOption = {
  customerid: number;
  label: string;
  city?: string | null;
  zipcode?: string | null;
  phone?: string | null;
  email?: string | null;
};

type TechnicianOption = {
  technicianid: number;
  label: string;
};

type ProductOption = {
  productid: number;
  productname: string;
  productpriceofsale: number;
};

type ServiceTypeOption = {
  typeofserviceid: number;
  name: string;
  label: string;
};

type ServiceOption = {
  serviceid: number;
  name: string;
  typeofserviceid: number;
  typeofservicename?: string | null;
  stateid?: number | null;
  statename?: string | null;
};

type OrderStateOption = {
  stateid: number;
  name: string;
  label: string;
};

const IVA_PCT = 19;

const DESC_MIN = 5;
const DESC_MAX = 500;

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function formatCOP(n?: number) {
  return n == null
    ? "—"
    : n.toLocaleString("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0,
      });
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function toLocalYMD(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function toLocalHM(d: Date) {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function titleCase(s: string) {
  const x = String(s ?? "").trim();
  if (!x) return "";
  return x.charAt(0).toUpperCase() + x.slice(1);
}

type Errors = Partial<{
  clientId: string;
  tipo: string;
  schedule: string;
  technicians: string;
  viaticos: string;
  direccion: string;
  servicios: string;
  materiales: string;
  description: string;
}>;

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

function initials(name: string) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const a = parts[0]?.[0] ?? "";
  const b = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
  return (a + b).toUpperCase() || "T";
}

function normalizeText(v: string) {
  return String(v ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
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

function minutesToTime(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${pad2(h)}:${pad2(m)}`;
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

function asNumber(v: unknown) {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function pickNumber(...vals: unknown[]) {
  for (const v of vals) {
    const n = asNumber(v);
    if (n != null) return n;
  }
  return undefined;
}

function pickString(...vals: unknown[]) {
  for (const v of vals) {
    const s = typeof v === "string" ? v : v == null ? "" : String(v);
    const t = s.trim();
    if (t) return t;
  }
  return "";
}

function coerceAllowedDateOrNext(ymd: string) {
  if (isAllowedDate(ymd)) return ymd;
  const d = parseYMD(ymd);
  if (!d) return toLocalYMD(new Date());
  for (let i = 0; i < 10; i++) {
    d.setDate(d.getDate() + 1);
    const next = toLocalYMD(d);
    if (isAllowedDate(next)) return next;
  }
  return toLocalYMD(new Date());
}

function coerceAllowedTime(hm: string, fallback: string) {
  if (isAllowedTime(hm)) return hm;
  return fallback;
}

type OrderNormalized = {
  ordersservicesid?: number;
  clientid?: number;
  typeofserviceid?: number | null;
  fechainicio?: string;
  fechafin?: string;
  horainicio?: string;
  horafin?: string;
  viaticos?: number;
  technicians?: number[];
  direccion?: string;
  description?: string;
  services?: Array<{ serviceid: number; cantidad: number; unitprice: number }>;
  products?: Array<{ productid: number; cantidad: number }>;
  files?: string[];
  stateid?: number;
};

function normalizeOrder(order: any): OrderNormalized {
  const root = order || {};

  const clientid = pickNumber(
    root?.client?.customerid,
    root?.client?.customer_id,
    root?.clientid,
    root?.customerid
  );

  const fechainicio = pickString(root?.fechainicio);
  const fechafin = pickString(root?.fechafin);
  const horainicio = pickString(root?.horainicio);
  const horafin = pickString(root?.horafin);
  const viaticos = pickNumber(root?.viaticos) ?? 0;
  const direccion = pickString(root?.direccion);
  const description = pickString(root?.description);
  const files = Array.isArray(root?.files) ? root.files.map((x: any) => String(x || "")).filter(Boolean) : [];
  const stateid = pickNumber(root?.state?.stateid, root?.stateid);

  const servicesArr = Array.isArray(root?.services) ? root.services : [];
  const productsArr = Array.isArray(root?.products) ? root.products : [];
  const techniciansArr = Array.isArray(root?.technicians) ? root.technicians : [];

  const services = servicesArr
    .map((s: any) => {
      const serviceid = pickNumber(s?.service?.serviceid, s?.serviceid, s?.id);
      const cantidad = pickNumber(s?.cantidad, s?.quantity, s?.qty) ?? 1;
      const unitprice = pickNumber(s?.unitprice, s?.price, s?.unitPrice) ?? 0;
      if (!serviceid) return null;
      return {
        serviceid,
        cantidad: Math.max(1, Math.round(cantidad)),
        unitprice: Math.max(0, Math.round(unitprice)),
      };
    })
    .filter(Boolean) as Array<{ serviceid: number; cantidad: number; unitprice: number }>;

  const products = productsArr
    .map((p: any) => {
      const productid = pickNumber(p?.product?.productid, p?.productid, p?.id);
      const cantidad = pickNumber(p?.cantidad, p?.quantity, p?.qty) ?? 1;
      if (!productid) return null;
      return { productid, cantidad: Math.max(1, Math.round(cantidad)) };
    })
    .filter(Boolean) as Array<{ productid: number; cantidad: number }>;

  const technicians = techniciansArr
    .map((t: any) => pickNumber(t?.technicianid, t?.id))
    .filter((id): id is number => typeof id === "number" && Number.isFinite(id) && id > 0);

  const typeofserviceid =
    pickNumber(
      root?.typeofserviceid,
      root?.services?.[0]?.service?.typeofserviceid,
      root?.services?.[0]?.service?.typeofservice?.typeofserviceid
    ) ?? null;

  return {
    ordersservicesid: pickNumber(root?.ordersservicesid, root?.id),
    clientid,
    typeofserviceid,
    fechainicio,
    fechafin,
    horainicio,
    horafin,
    viaticos,
    technicians,
    direccion,
    description,
    services,
    products,
    files,
    stateid,
  };
}

export default function OrderEditPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo") || "/dashboard/orders-services";
  const idParam =
    searchParams.get("id") ||
    searchParams.get("ordersservicesid") ||
    searchParams.get("orderId") ||
    searchParams.get("orderid");

  const orderId = useMemo(() => {
    const n = Number(idParam);
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [idParam]);

const {
    loading: lookupsLoading,
    error: lookupsError,
    customers: customersRaw,
    technicians: techniciansRaw,
    products: productsRaw,
    services: servicesRaw,
    serviceTypes: serviceTypesRaw,
    states: statesRaw,
    pendingStateId,
    scheduledStateId,
  } = useOrdersServicesLookups();

  const customers = useMemo<CustomerOption[]>(() => {
    return (customersRaw || [])
      .map((c: any) => {
        const base = c?.customer || c?.client || c;
        const u = base?.users || base?.user || base?.Users || c?.users || c?.user || {};

        const id = Number(
          base?.customerid ??
            base?.clientid ??
            base?.customer_id ??
            base?.client_id ??
            base?.id ??
            c?.customerid ??
            c?.clientid ??
            c?.id
        );

        const nameFromBase = [base?.name, base?.lastname].filter(Boolean).join(" ").trim();
        const nameFromUser = [u?.name, u?.lastname].filter(Boolean).join(" ").trim();
        const altName = String(
          base?.fullname ??
            base?.fullName ??
            base?.customername ??
            base?.customerName ??
            base?.clientname ??
            base?.clientName ??
            c?.fullname ??
            c?.customername ??
            ""
        ).trim();

        const label = nameFromBase || nameFromUser || altName || `Cliente #${id || "?"}`;

        return {
          customerid: id,
          label,
          city: base?.customercity ?? base?.city ?? c?.customercity ?? c?.city ?? null,
          zipcode: base?.customerzipcode ?? base?.zipcode ?? c?.customerzipcode ?? c?.zipcode ?? null,
          phone: u?.phone ?? base?.phone ?? c?.phone ?? null,
          email: u?.email ?? base?.email ?? c?.email ?? null,
        } as CustomerOption;
      })
      .filter((x) => Number.isFinite(x.customerid) && x.customerid > 0);
  }, [customersRaw]);

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

  const productsCatalog = useMemo<ProductOption[]>(() => {
    return (productsRaw || [])
      .map((p: any) => {
        const productid = Number(p?.productid ?? p?.id);
        const productname = (p?.productname ?? p?.name ?? `Producto #${productid}`).toString();
        const productpriceofsale = Number(p?.productpriceofsale ?? p?.priceofsale ?? p?.price ?? 0);
        return { productid, productname, productpriceofsale } as ProductOption;
      })
      .filter((x) => Number.isFinite(x.productid) && x.productid > 0);
  }, [productsRaw]);

  const serviceTypes = useMemo<ServiceTypeOption[]>(() => {
    return (serviceTypesRaw || [])
      .map((t: any) => {
        const id = Number(t?.typeofserviceid ?? t?.id);
        const name = String(t?.name ?? t?.typeofservicename ?? t?.label ?? "").trim();
        return { typeofserviceid: id, name, label: titleCase(name) || `Tipo #${id}` } as ServiceTypeOption;
      })
      .filter((x) => Number.isFinite(x.typeofserviceid) && x.typeofserviceid > 0);
  }, [serviceTypesRaw]);

  const orderStates = useMemo<OrderStateOption[]>(() => {
    return (statesRaw || [])
      .map((s: any) => {
        const stateid = Number(s?.stateid ?? s?.id);
        const name = String(s?.name ?? s?.state ?? s?.label ?? s?.statename ?? "").trim();
        return { stateid, name, label: titleCase(name) || `Estado #${stateid}` } as OrderStateOption;
      })
      .filter((x) => Number.isFinite(x.stateid) && x.stateid > 0);
  }, [statesRaw]);

  const servicesCatalog = useMemo<ServiceOption[]>(() => {
    return (servicesRaw || [])
      .map((s: any) => {
        const serviceid = Number(s?.serviceid ?? s?.id);
        const name = String(s?.name ?? s?.servicename ?? `Servicio #${serviceid}`).trim();
        const typeofserviceid = Number(s?.typeofserviceid ?? s?.typeOfServiceId ?? s?.typeofservice?.typeofserviceid);
        const typeofservicename = (s?.typeofservicename ?? s?.typeofservicename ?? s?.typeName ?? null) as any;
        const stateid = s?.stateid != null ? Number(s.stateid) : null;
        const statename = s?.statename != null ? String(s.statename) : null;
        return { serviceid, name, typeofserviceid, typeofservicename, stateid, statename } as ServiceOption;
      })
      .filter(
        (x) =>
          Number.isFinite(x.serviceid) &&
          x.serviceid > 0 &&
          Number.isFinite(x.typeofserviceid) &&
          x.typeofserviceid > 0
      );
  }, [servicesRaw]);

  const [orderLoading, setOrderLoading] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [orderNormalized, setOrderNormalized] = useState<OrderNormalized | null>(null);

  useEffect(() => {
    if (!orderId) {
      setOrderError("ID de orden inválido.");
      return;
    }
    let cancelled = false;
    async function run() {
      setOrderLoading(true);
      setOrderError(null);
      try {
        const { data } = await api.get(`orders-services/${orderId}`);
        if (cancelled) return;
        const n = normalizeOrder(data);
        setOrderNormalized(n);
      } catch (e: any) {
        if (!cancelled) {
          const msg = e?.response?.data?.message || e?.message || "Error cargando la orden.";
          setOrderError(String(msg));
          showError(String(msg));
        }
      } finally {
        if (!cancelled) setOrderLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  // -------- Cliente (tipo técnico: buscador + dropdown, 1 solo) --------
  const [clientId, setClientId] = useState<number | "">("");
  const selectedCustomer = useMemo(
    () => customers.find((c) => c.customerid === clientId),
    [customers, clientId]
  );

  const [clientQuery, setClientQuery] = useState("");
  const [clientOpen, setClientOpen] = useState(false);
  const [clientActiveIndex, setClientActiveIndex] = useState(0);
  const clientBoxRef = useRef<HTMLDivElement>(null);
  const clientInputRef = useRef<HTMLInputElement>(null);

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

  const clientOptions = useMemo(() => {
    const q = normalizeText(clientQuery);
    const list = customers;
    if (!q) return list.slice(0, 10);
    const scored = list
      .map((c) => {
        const label = normalizeText(c.label);
        const idStr = String(c.customerid);
        let score = 0;
        if (idStr.startsWith(q)) score += 3;
        if (label.includes(q)) score += 2;
        if (label.startsWith(q)) score += 1;
        return { c, score };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score || a.c.label.localeCompare(b.c.label));
    return scored.slice(0, 10).map((x) => x.c);
  }, [customers, clientQuery]);

  useEffect(() => {
    setClientActiveIndex(0);
  }, [clientQuery, clientOpen]);

  function pickClient(id: number) {
    if (!Number.isFinite(id) || id <= 0) return;
    setClientId(id as any);
    setErrors((p) => ({ ...p, clientId: undefined }));
    setClientQuery("");
    setClientOpen(false);
  }

  function clearClient() {
    setClientId("");
    setClientQuery("");
    setErrors((p) => ({ ...p, clientId: "Selecciona un cliente." }));
    clientInputRef.current?.focus();
  }

  const [tipoId, setTipoId] = useState<number | null>(null);
  const [orderStateId, setOrderStateId] = useState<number | null>(null);

  const [descripcion, setDescripcion] = useState("");
  const [direccion, setDireccion] = useState("");

  const [viaticosInput, setViaticosInput] = useState<string>("0");
  const viaticosValue = useMemo(() => {
    const raw = String(viaticosInput ?? "").trim();
    if (raw === "") return 0;
    const n = Number(raw);
    if (!Number.isFinite(n)) return NaN;
    return Math.max(0, Math.round(n));
  }, [viaticosInput]);

  const [dateStart, setDateStart] = useState(() => toLocalYMD(new Date()));
  const [timeStart, setTimeStart] = useState(() => {
    const now = new Date();
    const hm = toLocalHM(now);
    const mins = timeToMinutes(hm);
    if (!Number.isFinite(mins)) return "07:00";
    if (mins < SCHEDULE_MIN) return "07:00";
    if (mins > SCHEDULE_MAX) return "17:00";
    return hm;
  });
  const [dateEnd, setDateEnd] = useState(() => toLocalYMD(new Date()));
  const [timeEnd, setTimeEnd] = useState(() => {
    const now = new Date();
    const hm = toLocalHM(now);
    const mins = timeToMinutes(hm);
    if (!Number.isFinite(mins)) return "08:00";
    const end = Math.min(SCHEDULE_MAX, Math.max(SCHEDULE_MIN, mins) + 60);
    return minutesToTime(end);
  });

  const [selectedTechnicians, setSelectedTechnicians] = useState<number[]>([]);
  const selectedTechSet = useMemo(() => new Set(selectedTechnicians), [selectedTechnicians]);

  const [techQuery, setTechQuery] = useState("");
  const [techOpen, setTechOpen] = useState(false);
  const [techActiveIndex, setTechActiveIndex] = useState(0);
  const techBoxRef = useRef<HTMLDivElement>(null);
  const techInputRef = useRef<HTMLInputElement>(null);
  const [scheduledOrdersRaw, setScheduledOrdersRaw] = useState<any[]>([]);
  const [scheduledRequestsRaw, setScheduledRequestsRaw] = useState<any[]>([]);

  const [servicios, setServicios] = useState<ServiceLineItem[]>([]);
  const [materiales, setMateriales] = useState<MaterialLineItem[]>([]);
  const [materialOpenId, setMaterialOpenId] = useState<string | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [existingFiles, setExistingFiles] = useState<string[]>([]);

  const [errors, setErrors] = useState<Errors>({});
  const summaryRef = useRef<HTMLDivElement>(null);

  const [saving, setSaving] = useState(false);

  const isDesktop = useDesktopQuery();
  const sidebarW = useSidebarWidth("#app-sidebar");

  const inputBase =
    "w-full h-10 rounded-md border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-200";
  const selectBase = `${inputBase} appearance-none pr-8`;
  const chevron = "pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400";
  const errorText = "mt-1 text-xs text-red-600";
  const errorRing = "border-red-500 ring-1 ring-red-500";

  const hasErrors = useMemo(
    () => Object.values(errors).some((v) => typeof v === "string" && v.trim().length > 0),
    [errors]
  );

  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [files]);

  const shownLookupErr = useRef<string | null>(null);
  useEffect(() => {
    if (!lookupsError) return;
    if (shownLookupErr.current === lookupsError) return;
    shownLookupErr.current = lookupsError;
    showError(lookupsError);
  }, [lookupsError]);

  useEffect(() => {
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
  }, []);

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

  // -------- Servicios disponibles por tipo (excluye los ya agregados para ese tipo) --------
  const getServicesForTipo = useMemo(() => {
    return (tid: number, keepName?: string) => {
      if (!tid) return [];
      const list = servicesCatalog.filter((s) => s.typeofserviceid === tid);
      const active = list.filter(
        (s) => (s.stateid == null ? true : s.stateid === 1) || String(s.statename || "").toLowerCase() === "activo"
      );
      const base = active.length ? active : list;

      const used = new Set(
        servicios
          .filter((x) => x.tipoId === tid)
          .map((x) => x.nombre)
          .filter(Boolean)
      );

      if (keepName) used.delete(keepName);

      return base.filter((s) => !used.has(s.name));
    };
  }, [servicesCatalog, servicios]);

  const servicesForSelectedTipo = useMemo(() => {
    return tipoId ? getServicesForTipo(tipoId) : [];
  }, [tipoId, getServicesForTipo]);

  const tipoLabelById = useMemo(() => {
    const m = new Map<number, string>();
    serviceTypes.forEach((t) => m.set(t.typeofserviceid, t.label || t.name || `Tipo #${t.typeofserviceid}`));
    return m;
  }, [serviceTypes]);

  const stateOptionsForSelect = useMemo(() => {
    if (orderStateId == null) return orderStates;
    if (orderStates.some((s) => s.stateid === orderStateId)) return orderStates;
    return [{ stateid: orderStateId, name: "", label: `Estado #${orderStateId}` }, ...orderStates];
  }, [orderStates, orderStateId]);

  const selectedTechniciansFull = useMemo(() => {
    const map = new Map(technicians.map((t) => [t.technicianid, t]));
    return selectedTechnicians.map((id) => map.get(id)).filter(Boolean) as TechnicianOption[];
  }, [technicians, selectedTechnicians]);

  const selectedWindow = useMemo(
    () => buildWindowFromLocalSchedule(dateStart, timeStart, dateEnd, timeEnd),
    [dateStart, timeStart, dateEnd, timeEnd]
  );

  const busyTechnicianIds = useMemo(
    () =>
      getBusyTechnicianIdsForWindow(scheduledOrdersRaw, scheduledRequestsRaw, selectedWindow, {
        excludeOrderId: orderId,
      }),
    [scheduledOrdersRaw, scheduledRequestsRaw, selectedWindow, orderId]
  );

  const availableTechnicians = useMemo(
    () => technicians.filter((t) => !busyTechnicianIds.has(t.technicianid)),
    [technicians, busyTechnicianIds]
  );

  const selectedBusyTechnicianIds = useMemo(
    () => selectedTechnicians.filter((id) => busyTechnicianIds.has(id)),
    [selectedTechnicians, busyTechnicianIds]
  );

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

  useEffect(() => {
    setTechActiveIndex(0);
  }, [techQuery, techOpen]);

  function addTechnician(id: number) {
    if (!Number.isFinite(id) || id <= 0) return;
    if (busyTechnicianIds.has(id)) {
      showWarning("Ese técnico ya está ocupado en el horario seleccionado.");
      return;
    }
    setSelectedTechnicians((prev) => (prev.includes(id) ? prev : [...prev, id]));
    setErrors((p) => ({ ...p, technicians: undefined }));
    setTechQuery("");
    setTechOpen(false);
    techInputRef.current?.focus();
  }

  function removeTechnician(id: number) {
    setSelectedTechnicians((prev) => prev.filter((x) => x !== id));
  }

  function clearTechnicians() {
    setSelectedTechnicians([]);
    setErrors((p) => ({ ...p, technicians: undefined }));
  }

  function addServiceRow() {
    if (!tipoId) {
      setErrors((p) => ({ ...p, tipo: "Selecciona el tipo de servicio para añadir un servicio." }));
      showWarning("Selecciona un tipo de servicio para añadir un servicio.");
      return;
    }
    const options = getServicesForTipo(tipoId);
    const first = options[0];
    if (!first) {
      setErrors((p) => ({ ...p, servicios: "No hay servicios disponibles para este tipo (ya fueron agregados o no existen)." }));
      showWarning("No hay servicios disponibles para este tipo.");
      return;
    }
    setServicios((prev) => [...prev, { id: uid(), tipoId, nombre: first.name, cantidad: 1, precio: 0 }]);
    setErrors((prev) => ({ ...prev, servicios: undefined }));
  }

  // -------- Productos disponibles (excluye los ya agregados) --------
  const usedProductNames = useMemo(() => new Set(materiales.map((m) => m.nombre).filter(Boolean)), [materiales]);

  function availableProducts(keepName?: string) {
    const used = new Set(Array.from(usedProductNames));
    if (keepName) used.delete(keepName);
    return productsCatalog.filter((p) => !used.has(p.productname));
  }

  function precioMaterialPorNombre(nombre: string) {
    return productsCatalog.find((x) => x.productname === nombre)?.productpriceofsale ?? 0;
  }

  function addMaterialRow() {
    const opts = availableProducts();
    const first = opts[0];
    if (!first) {
      setErrors((p) => ({ ...p, materiales: "No hay productos disponibles (ya fueron agregados o no existen)." }));
      showWarning("No hay productos disponibles para agregar.");
      return;
    }
    setMateriales((prev) => [
      ...prev,
      { id: uid(), nombre: first.productname, cantidad: 1, precio: first.productpriceofsale },
    ]);
    setErrors((prev) => ({ ...prev, materiales: undefined }));
  }

  function patchItem<T extends { id: string }>(
    id: string,
    patch: Partial<T>,
    setList: React.Dispatch<React.SetStateAction<T[]>>
  ) {
    setList((prev) => prev.map((x) => (x.id === id ? ({ ...x, ...patch } as T) : x)));
  }

  function removeItem<T extends { id: string }>(id: string, setList: React.Dispatch<React.SetStateAction<T[]>>) {
    setList((prev) => prev.filter((x) => x.id !== id));
  }

  function dedupeAppend(newFs: File[]) {
    setFiles((prev) => {
      const map = new Map(prev.map((f) => [`${f.name}_${f.size}_${f.lastModified}`, f]));
      newFs.forEach((f) => {
        const k = `${f.name}_${f.size}_${f.lastModified}`;
        if (!map.has(k)) map.set(k, f);
      });
      return Array.from(map.values());
    });
  }

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const fs = Array.from(e.target.files || []);
    if (!fs.length) return;

    const MAX_FILES = 12;
    const MAX_SIZE = 5 * 1024 * 1024;

    const accepteds: File[] = [];
    const rejected: string[] = [];

    fs.forEach((f) => {
      const isImg = f.type.startsWith("image/");
      const okSize = f.size <= MAX_SIZE;
      if (isImg && okSize) accepteds.push(f);
      else rejected.push(`${f.name}${!isImg ? " (no es imagen)" : ""}${!okSize ? " (más de 5MB)" : ""}`);
    });

    const totalCount = accepteds.length + files.length;

    if (totalCount > MAX_FILES) {
      const allowed = Math.max(0, MAX_FILES - files.length);
      if (allowed > 0) dedupeAppend(accepteds.slice(0, allowed));
      showWarning(`Máximo ${MAX_FILES} imágenes. ${rejected.length ? "Algunas fueron rechazadas." : ""}`.trim());
    } else {
      dedupeAppend(accepteds);
      if (rejected.length) showWarning("Algunas imágenes fueron rechazadas (tipo/tamaño).");
    }

    e.currentTarget.value = "";
  }

  function removeFile(file: File) {
    setFiles((prev) =>
      prev.filter((f) => !(f.name === file.name && f.size === file.size && f.lastModified === file.lastModified))
    );
  }

  const subtotalServicios = useMemo(
    () => servicios.reduce((a, i) => a + (Number(i.cantidad) || 0) * (Number(i.precio) || 0), 0),
    [servicios]
  );

  const subtotalMateriales = useMemo(
    () => materiales.reduce((a, i) => a + (Number(i.cantidad) || 0) * (Number(i.precio) || 0), 0),
    [materiales]
  );

  const subtotal = subtotalServicios + subtotalMateriales;

  const baseGravable = useMemo(() => {
    const v = Number.isFinite(viaticosValue) ? viaticosValue : 0;
    return Math.max(0, Math.round(subtotal + v));
  }, [subtotal, viaticosValue]);

  const impuestos = useMemo(() => Math.max(0, Math.round((baseGravable * IVA_PCT) / 100)), [baseGravable]);
  const totalPagar = useMemo(() => Math.max(0, Math.round(baseGravable + impuestos)), [baseGravable, impuestos]);

  const serviciosMiniLista = useMemo(() => {
    const map = new Map<string, { nombre: string; cantidad: number; total: number; tipoId: number }>();
    servicios.forEach((s) => {
      if (!s.nombre) return;
      const t = (Number(s.cantidad) || 0) * (Number(s.precio) || 0);
      const key = `${s.tipoId}::${s.nombre}`;
      const prev = map.get(key);
      if (prev) {
        prev.cantidad += Number(s.cantidad) || 0;
        prev.total += t;
      } else {
        map.set(key, { nombre: s.nombre, cantidad: Number(s.cantidad) || 0, total: t, tipoId: s.tipoId });
      }
    });
    return Array.from(map.values());
  }, [servicios]);

  const materialesMiniLista = useMemo(() => {
    const map = new Map<string, { nombre: string; cantidad: number; total: number }>();
    materiales.forEach((m) => {
      if (!m.nombre) return;
      const t = (Number(m.cantidad) || 0) * (Number(m.precio) || 0);
      const prev = map.get(m.nombre);
      if (prev) {
        prev.cantidad += Number(m.cantidad) || 0;
        prev.total += t;
      } else {
        map.set(m.nombre, { nombre: m.nombre, cantidad: Number(m.cantidad) || 0, total: t });
      }
    });
    return Array.from(map.values());
  }, [materiales]);

  function validateForm(): Errors {
    const errs: Errors = {};

    if (!clientId) errs.clientId = "Selecciona un cliente.";

    if (!dateStart || !timeStart || !dateEnd || !timeEnd) {
      errs.schedule = "Completa fecha y hora de inicio y fin.";
    } else {
      if (!isAllowedDate(dateStart) || !isAllowedDate(dateEnd)) {
        errs.schedule = "Solo se permite agendar de lunes a sábado.";
      } else if (!isAllowedTime(timeStart) || !isAllowedTime(timeEnd)) {
        errs.schedule = "Horario permitido: 07:00–17:00.";
      } else {
        const sDate = parseYMD(dateStart);
        const eDate = parseYMD(dateEnd);
        if (sDate && eDate) {
          const s = new Date(sDate);
          const e = new Date(eDate);
          const sMin = timeToMinutes(timeStart);
          const eMin = timeToMinutes(timeEnd);
          s.setHours(Math.floor(sMin / 60), sMin % 60, 0, 0);
          e.setHours(Math.floor(eMin / 60), eMin % 60, 0, 0);
          if (!(e.getTime() > s.getTime())) errs.schedule = "La fecha/hora fin debe ser mayor que la de inicio.";
        } else {
          errs.schedule = "Fecha inválida.";
        }
      }
    }

    if (!selectedTechnicians.length) errs.technicians = "Selecciona al menos un técnico.";
    else if (selectedBusyTechnicianIds.length > 0)
      errs.technicians = "Hay técnicos ocupados en ese horario.";

    if (!Number.isFinite(viaticosValue)) errs.viaticos = "Viaticos debe ser un numero valido.";
    if (Number.isFinite(viaticosValue) && viaticosValue < 0) errs.viaticos = "Viaticos no puede ser negativo.";

    const dir = String(direccion || "").trim();
    if (!dir) errs.direccion = "La direccion es obligatoria.";
    else if (dir.length < 3) errs.direccion = "La direccion debe tener al menos 3 caracteres.";
    else if (dir.length > 255) errs.direccion = "La direccion no puede superar 255 caracteres.";

    const desc = String(descripcion || "").trim();
    if (!desc) errs.description = "La descripción es obligatoria.";
    else if (desc.length < DESC_MIN) errs.description = `La descripción debe tener al menos ${DESC_MIN} caracteres.`;
    else if (desc.length > DESC_MAX) errs.description = `La descripción no puede superar ${DESC_MAX} caracteres.`;

    if (servicios.length === 0) {
      errs.servicios = "Debes añadir al menos un servicio.";
      if (!tipoId) errs.tipo = "Selecciona el tipo de servicio para añadir servicios.";
    }

    const invalidSvc =
      servicios.length > 0 &&
      servicios.some((s) => {
        if (!s.tipoId || !Number.isFinite(s.tipoId)) return true;
        return !servicesCatalog.some((x) => x.name === s.nombre && x.typeofserviceid === s.tipoId);
      });

    if (invalidSvc)
      errs.servicios = (errs.servicios ? errs.servicios + " " : "") + "Hay servicios inválidos. Vuelve a seleccionarlos.";

    const badQtySvc = servicios.some((s) => !s.cantidad || s.cantidad < 1);
    const badPriceSvc = servicios.some((s) => !Number.isFinite(Number(s.precio)) || Number(s.precio) < 0);
    if (badQtySvc) errs.servicios = (errs.servicios ? errs.servicios + " " : "") + "Corrige cantidades de servicios.";
    if (badPriceSvc) errs.servicios = (errs.servicios ? errs.servicios + " " : "") + "Corrige precios de servicios.";

    if (!productsCatalog.length) errs.materiales = "No hay productos cargados desde la BD.";
    if (materiales.length === 0) errs.materiales = errs.materiales ? errs.materiales : "Debes añadir al menos un producto (material).";
    if (materiales.some((m) => !productsCatalog.some((p) => p.productname === m.nombre))) {
      errs.materiales = (errs.materiales ? errs.materiales + " " : "") + "Hay productos inválidos. Vuelve a seleccionarlos.";
    }
    const badQtyMat = materiales.some((m) => !m.cantidad || m.cantidad < 1);
    if (badQtyMat) errs.materiales = (errs.materiales ? errs.materiales + " " : "") + "Corrige cantidades de materiales.";

    return errs;
  }

  function focusFirstError(er: Errors) {
    const order = ["clientId", "tipo", "schedule", "technicians", "viaticos", "direccion", "description", "materiales", "servicios"] as const;
    const key = order.find((k) => (er as any)[k]);
    if (!key) return;
    const el = document.getElementById(`field-${key}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      (el as HTMLElement).focus?.();
    } else {
      summaryRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  async function uploadFilesToCloudinary(fs: File[]) {
    const urls: string[] = [];
    for (const f of fs) {
      const res: any = await uploadImageToCloudinary(f);
      if (typeof res === "string") urls.push(res);
      else if (res?.secure_url) urls.push(res.secure_url);
      else if (res?.url) urls.push(res.url);
    }
    return urls;
  }

  function clampAutoEnd(date: string, startHm: string) {
    const s = timeToMinutes(startHm);
    const end = Math.min(SCHEDULE_MAX, (Number.isFinite(s) ? s : SCHEDULE_MIN) + 60);
    return { date, time: minutesToTime(end) };
  }

  const appliedOrderRef = useRef(false);
  useEffect(() => {
    if (appliedOrderRef.current) return;
    if (lookupsLoading) return;
    if (!orderNormalized) return;
    if (!customers.length || !technicians.length || !productsCatalog.length || !serviceTypes.length) return;

    const n = orderNormalized;

    let nextClient: number | "" = "";
    if (n.clientid && customers.some((c) => c.customerid === n.clientid)) nextClient = n.clientid;
    setClientId(nextClient as any);

    const inferredTypeFromServices =
      n.services && n.services.length
        ? servicesCatalog.find((x) => x.serviceid === n.services![0].serviceid)?.typeofserviceid ?? null
        : null;

    const candidateType = n.typeofserviceid ?? inferredTypeFromServices;
    const typeId = candidateType && serviceTypes.some((t) => t.typeofserviceid === candidateType) ? candidateType : null;
    setTipoId(typeId);
    setOrderStateId(n.stateid ?? pendingStateId ?? null);

    const techIds = (n.technicians || []).filter((id) => technicians.some((t) => t.technicianid === id));
    setSelectedTechnicians(techIds);

    const v = Number.isFinite(Number(n.viaticos)) ? Math.max(0, Math.round(Number(n.viaticos))) : 0;
    setViaticosInput(String(v));

    const ds = coerceAllowedDateOrNext(n.fechainicio || toLocalYMD(new Date()));
    const de = coerceAllowedDateOrNext(n.fechafin || ds);

    const baseTs = coerceAllowedTime(String((n.horainicio || "07:00")).slice(0, 5), "07:00");
    let baseTe = coerceAllowedTime(
      String((n.horafin || "08:00")).slice(0, 5),
      minutesToTime(Math.min(SCHEDULE_MAX, timeToMinutes(baseTs) + 60))
    );

    const sMin = timeToMinutes(baseTs);
    const eMin = timeToMinutes(baseTe);
    if (Number.isFinite(sMin) && Number.isFinite(eMin) && eMin <= sMin) {
      baseTe = minutesToTime(Math.min(SCHEDULE_MAX, sMin + 60));
    }

    setDateStart(ds);
    setTimeStart(baseTs);
    setDateEnd(de);
    setTimeEnd(baseTe);

    // Importante: NO extraer ni reconstruir. Se deja tal cual viene (texto libre del usuario).
    setDireccion(n.direccion || "");
    setDescripcion(n.description || "");

    const svcItems: ServiceLineItem[] = [];
    if (Array.isArray(n.services) && n.services.length) {
      for (const s of n.services) {
        const rec = servicesCatalog.find((x) => x.serviceid === s.serviceid) || null;
        const nombre = rec?.name || `Servicio #${s.serviceid}`;
        const cantidad = Math.max(1, Math.round(Number(s.cantidad || 1)));
        const precio = Math.max(0, Math.round(Number(s.unitprice || 0)));
        const rowTipoId = rec?.typeofserviceid ?? (typeId || 0);
        svcItems.push({ id: uid(), tipoId: rowTipoId, nombre, cantidad, precio });
      }
    }
    setServicios(svcItems);

    const matItems: MaterialLineItem[] = [];
    if (Array.isArray(n.products) && n.products.length) {
      for (const p of n.products) {
        const rec = productsCatalog.find((x) => x.productid === p.productid) || null;
        const nombre = rec?.productname || `Producto #${p.productid}`;
        const cantidad = Math.max(1, Math.round(Number(p.cantidad || 1)));
        const precio = rec?.productpriceofsale ?? 0;
        matItems.push({ id: uid(), nombre, cantidad, precio });
      }
    }
    setMateriales(matItems);

    const urls = Array.isArray(n.files) ? n.files.map((u) => String(u || "").trim()).filter((u) => !!u) : [];
    setExistingFiles(urls);

    setErrors({});
    appliedOrderRef.current = true;
  }, [lookupsLoading, orderNormalized, customers, technicians, productsCatalog, serviceTypes, servicesCatalog, pendingStateId]);

  // -------- Validación en tiempo real (sin auto-ajustes “silenciosos”) --------
  useEffect(() => {
    if (clientId) setErrors((p) => ({ ...p, clientId: undefined }));
  }, [clientId]);

  useEffect(() => {
    if (!selectedTechnicians.length) return;
    if (selectedBusyTechnicianIds.length > 0) {
      setErrors((p) => ({ ...p, technicians: "Hay técnicos ocupados en ese horario." }));
      return;
    }
    setErrors((p) => ({ ...p, technicians: undefined }));
  }, [selectedTechnicians, selectedBusyTechnicianIds]);

  useEffect(() => {
    if (materiales.length) setErrors((p) => ({ ...p, materiales: undefined }));
  }, [materiales]);

  useEffect(() => {
    if (servicios.length) setErrors((p) => ({ ...p, servicios: undefined }));
  }, [servicios]);

  useEffect(() => {
    const t = String(descripcion || "").trim();
    if (!t) return;
    if (t.length >= DESC_MIN && t.length <= DESC_MAX) setErrors((p) => ({ ...p, description: undefined }));
  }, [descripcion]);

  useEffect(() => {
    const t = String(direccion || "").trim();
    if (t.length >= 3 && t.length <= 255) setErrors((p) => ({ ...p, direccion: undefined }));
  }, [direccion]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!orderId) {
      showError("ID de orden inválido.");
      return;
    }

    const er = validateForm();
    setErrors(er);
    if (Object.keys(er).length > 0) {
      showWarning("Revisa los campos marcados en rojo.");
      focusFirstError(er);
      return;
    }

    const productMap = new Map<number, { productid: number; cantidad: number }>();
    for (const m of materiales) {
      const rec = productsCatalog.find((p) => p.productname === m.nombre);
      if (!rec) {
        const next = { ...er, materiales: `El producto "${m.nombre}" no existe en la BD. Vuelve a seleccionarlo.` };
        setErrors(next);
        showError(next.materiales || "Producto inválido.");
        focusFirstError(next);
        return;
      }
      const qty = Math.max(1, Number(m.cantidad || 1));
      const prev = productMap.get(rec.productid);
      if (prev) prev.cantidad += qty;
      else productMap.set(rec.productid, { productid: rec.productid, cantidad: qty });
    }
    const products = Array.from(productMap.values());

    const serviceMap = new Map<string, { serviceid: number; cantidad: number; unitprice: number }>();
    for (const s of servicios) {
      const rec = servicesCatalog.find((x) => x.name === s.nombre && x.typeofserviceid === s.tipoId) || null;
      if (!rec) {
        const next = { ...er, servicios: `El servicio "${s.nombre}" no existe o no corresponde al tipo asignado.` };
        setErrors(next);
        showError(next.servicios || "Servicio inválido.");
        focusFirstError(next);
        return;
      }
      const cantidad = Math.max(1, Number(s.cantidad || 1));
      const unitprice = Math.max(0, Math.round(Number(s.precio || 0)));
      const key = `${rec.serviceid}_${unitprice}`;
      const prev = serviceMap.get(key);
      if (prev) prev.cantidad += cantidad;
      else serviceMap.set(key, { serviceid: rec.serviceid, cantidad, unitprice });
    }
    const services = Array.from(serviceMap.values());

    // Importante: NO se arma descripción estructurada. Se envía SOLO lo que escribió el usuario.
    const finalDescription = String(descripcion || "").trim();
    const hasSchedule = !!(dateStart && dateEnd && timeStart && timeEnd);
    const shouldUseScheduled =
      hasSchedule &&
      scheduledStateId != null &&
      (orderNormalized?.stateid == null ||
        (pendingStateId != null && orderNormalized?.stateid === pendingStateId));
    const autoStateid = shouldUseScheduled ? scheduledStateId : orderNormalized?.stateid ?? pendingStateId ?? 1;
    const stateid = orderStateId ?? autoStateid;

    setSaving(true);
    try {
      const uploadedUrls = files.length ? await uploadFilesToCloudinary(files) : [];
      const mergedFiles = uploadedUrls.length > 0 ? [...existingFiles, ...uploadedUrls] : existingFiles;

      const viaticosPayload = Number.isFinite(viaticosValue) ? viaticosValue : 0;

      const updateDto: UpdateOrdersServiceDto = {
        description: finalDescription,
        direccion: String(direccion || "").trim(),
        clientid: Number(clientId),
        stateid,
        fechainicio: dateStart,
        fechafin: dateEnd,
        horainicio: timeStart,
        horafin: timeEnd,
        technicians: selectedTechnicians,
        files: mergedFiles,
        viaticos: viaticosPayload,
      };

      await api.patch(`orders-services/${orderId}`, updateDto);

      const existingProducts = orderNormalized?.products ?? [];
      const existingServices = orderNormalized?.services ?? [];

      const desiredProductMap = new Map<number, number>();
      for (const p of products) desiredProductMap.set(Number(p.productid), Number(p.cantidad));

      for (const ex of existingProducts) {
        if (!desiredProductMap.has(Number(ex.productid))) {
          await api.delete(`orders-services/${orderId}/products/${Number(ex.productid)}`);
        }
      }

      for (const [productid, cantidad] of desiredProductMap.entries()) {
        const ex = existingProducts.find((x) => Number(x.productid) === Number(productid));
        if (!ex) {
          await api.post(`orders-services/${orderId}/products`, { productid, cantidad });
        } else if (Number(ex.cantidad) !== Number(cantidad)) {
          await api.patch(`orders-services/${orderId}/products/${productid}`, { cantidad });
        }
      }

      const desiredServiceMap = new Map<number, { cantidad: number; unitprice: number }>();
      for (const sLine of services) {
        const sid = Number((sLine as any).serviceid);
        const cantidad = Number((sLine as any).cantidad);
        const unitprice = Number((sLine as any).unitprice ?? 0);
        desiredServiceMap.set(sid, { cantidad, unitprice });
      }

      for (const ex of existingServices) {
        if (!desiredServiceMap.has(Number(ex.serviceid))) {
          await api.delete(`orders-services/${orderId}/services/${Number(ex.serviceid)}`);
        }
      }

      for (const [serviceid, payload] of desiredServiceMap.entries()) {
        const ex = existingServices.find((x) => Number(x.serviceid) === Number(serviceid));
        if (!ex) {
          await api.post(`orders-services/${orderId}/services`, {
            serviceid,
            cantidad: payload.cantidad,
            unitprice: payload.unitprice,
          });
        } else {
          const changed =
            Number(ex.cantidad) !== Number(payload.cantidad) || Number(ex.unitprice) !== Number(payload.unitprice);
          if (changed) {
            await api.patch(`orders-services/${orderId}/services/${serviceid}`, {
              cantidad: payload.cantidad,
              unitprice: payload.unitprice,
            });
          }
        }
      }

      const { data: updated } = await api.get(`orders-services/${orderId}`);
      setOrderNormalized(normalizeOrder(updated));
      setExistingFiles(Array.isArray(updated?.files) ? updated.files : []);

      showSuccess("Orden actualizada");
      router.push(returnTo);
    } catch (e: any) {
      showError(e?.response?.data?.message || e?.message || "Error inesperado.");
    } finally {
      setSaving(false);
    }
  }

  function handleDateStartChange(next: string) {
    if (!isAllowedDate(next)) {
      showWarning("Solo se permite agendar de lunes a sábado.");
      setErrors((p) => ({ ...p, schedule: "Solo se permite agendar de lunes a sábado." }));
      return;
    }
    setDateStart(next);
    setErrors((p) => ({ ...p, schedule: undefined }));
    if (!isAllowedDate(dateEnd)) setDateEnd(next);
  }

  function handleDateEndChange(next: string) {
    if (!isAllowedDate(next)) {
      showWarning("Solo se permite agendar de lunes a sábado.");
      setErrors((p) => ({ ...p, schedule: "Solo se permite agendar de lunes a sábado." }));
      return;
    }
    setDateEnd(next);
    setErrors((p) => ({ ...p, schedule: undefined }));
  }

  function handleTimeStartChange(next: string) {
    if (!isAllowedTime(next)) {
      showWarning("Horario permitido: 07:00–17:00.");
      setErrors((p) => ({ ...p, schedule: "Horario permitido: 07:00–17:00." }));
      return;
    }
    const sMin = timeToMinutes(next);
    if (Number.isFinite(sMin) && sMin === SCHEDULE_MAX) {
      showWarning("La hora de inicio no puede ser 17:00.");
      setErrors((p) => ({ ...p, schedule: "La hora de inicio no puede ser 17:00." }));
      return;
    }
    setTimeStart(next);
    const auto = clampAutoEnd(dateStart, next);
    setDateEnd(auto.date);
    setTimeEnd(auto.time);
    setErrors((p) => ({ ...p, schedule: undefined }));
  }

  function handleTimeEndChange(next: string) {
    if (!isAllowedTime(next)) {
      showWarning("Horario permitido: 07:00–17:00.");
      setErrors((p) => ({ ...p, schedule: "Horario permitido: 07:00–17:00." }));
      return;
    }
    setTimeEnd(next);
    setErrors((p) => ({ ...p, schedule: undefined }));
  }

  const StickyFooter = () => (
    <div className="fixed bottom-0 left-0 right-0 z-40">
      <div className="bg-white/85 backdrop-blur border-t">
        <div className="mx-auto max-w-7xl px-4 py-3" style={{ paddingLeft: isDesktop ? sidebarW + 16 : 16 }}>
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="text-sm">
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => router.push(returnTo)}
                className="h-10 rounded-md border border-gray-300 bg-white px-4 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                disabled={saving}
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="order-form"
                className="h-10 rounded-md bg-red-700 px-4 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-60"
                disabled={saving || lookupsLoading || orderLoading || !orderId}
              >
                {saving ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const timeStartMax = "16:59";
  const timeMin = "07:00";
  const timeMax = "17:00";

  return (
    <RequireAuth>
      <div className="relative" style={{ paddingLeft: isDesktop ? sidebarW : 0 }}>
        <main className="min-h-[100dvh] bg-gray-100 pb-36 md:pb-40">
          <div className="px-4 pt-4 max-w-7xl w-full mx-auto">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h1 className="text-xl font-semibold text-gray-900 truncate">
                  {orderId ? `Editar orden de servicio #${orderId}` : "Editar orden de servicio"}
                </h1>
                <p className="text-xs text-gray-500 mt-1">Actualiza el cliente, programación y detalles del servicio.</p>
              </div>
            </div>

            {orderError && (
              <div className="mb-4 rounded-md border border-red-300 bg-red-50 text-red-800 p-3 text-sm">
                {orderError}
              </div>
            )}

            {hasErrors && (
              <div ref={summaryRef} className="mb-4 rounded-md border border-red-300 bg-red-50 text-red-800 p-3 text-sm">
                <strong className="block mb-1">Hay errores en el formulario:</strong>
                <ul className="list-disc pl-5 space-y-1">
                  {errors.clientId && <li>{errors.clientId}</li>}
                  {errors.tipo && <li>{errors.tipo}</li>}
                  {errors.schedule && <li>{errors.schedule}</li>}
                  {errors.technicians && <li>{errors.technicians}</li>}
                  {errors.viaticos && <li>{errors.viaticos}</li>}
                  {errors.description && <li>{errors.description}</li>}
                  {errors.materiales && <li>{errors.materiales}</li>}
                  {errors.servicios && <li>{errors.servicios}</li>}
                </ul>
              </div>
            )}

            <form id="order-form" onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[2fr_1fr]">
              <div className="space-y-6">
                <section className="rounded-xl border bg-white shadow-sm">
                  <header className="border-b px-3 py-2.5 flex items-center justify-between">
                    <div className="text-sm font-semibold text-gray-800">Cliente</div>
                    <div className="text-xs text-gray-500">
                      {customers.length ? `${customers.length} disponibles` : "-"}
                    </div>
                  </header>

                  <div className="p-4 grid grid-cols-1 gap-3" id="field-clientId">
                    <div className={`rounded-lg border bg-gray-50 p-3 ${errors.clientId ? errorRing : ""}`}>
                      {!selectedCustomer ? (
                        <div className="text-xs text-gray-500">No has seleccionado cliente.</div>
                      ) : (
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border bg-white text-xs font-semibold">
                              {initials(selectedCustomer.label)}
                            </span>
                            <div className="min-w-0">
                              <div className="text-sm font-semibold text-gray-900 truncate">{selectedCustomer.label}</div>
                              <div className="text-xs text-gray-600 truncate">
                                {`Cliente #${selectedCustomer.customerid}`}
                                {selectedCustomer.phone || selectedCustomer.email ? ` - ${selectedCustomer.phone || selectedCustomer.email}` : ""}
                                {[selectedCustomer.city, selectedCustomer.zipcode].filter(Boolean).length
                                  ? ` - ${[selectedCustomer.city, selectedCustomer.zipcode].filter(Boolean).join(" * ")}`
                                  : ""}
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={clearClient}
                            className="h-9 px-3 rounded-md border bg-white text-xs hover:bg-gray-50 disabled:opacity-60"
                            aria-label="Quitar cliente"
                            title="Quitar"
                            disabled={lookupsLoading}
                          >
                            Quitar
                          </button>
                        </div>
                      )}
                    </div>

                    <div ref={clientBoxRef} className="relative">
                      <label htmlFor="field-clientId-input" className="block text-xs text-gray-700 mb-1">
                        Buscar y seleccionar cliente
                      </label>
                      <input
                        id="field-clientId-input"
                        ref={clientInputRef}
                        value={clientQuery}
                        onChange={(e) => {
                          setClientQuery(e.target.value);
                          setClientOpen(true);
                          setErrors((p) => ({ ...p, clientId: undefined }));
                        }}
                        onFocus={() => setClientOpen(true)}
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
                              pickClient(clientOptions[clientActiveIndex].customerid);
                            }
                          } else if (e.key === "Escape") {
                            setClientOpen(false);
                          }
                        }}
                        placeholder={lookupsLoading ? "Cargando..." : "Nombre, apellido o ID..."}
                        className={`${inputBase} ${errors.clientId ? errorRing : ""}`}
                        disabled={lookupsLoading}
                        aria-expanded={clientOpen}
                        aria-controls="client-suggest"
                        aria-autocomplete="list"
                      />

                      {clientOpen && !lookupsLoading && (
                        <div id="client-suggest" className="absolute z-20 mt-2 w-full overflow-hidden rounded-lg border bg-white shadow-sm">
                          {clientOptions.length === 0 ? (
                            <div className="px-3 py-2 text-xs text-gray-500">No hay coincidencias.</div>
                          ) : (
                            <ul className="max-h-60 overflow-auto">
                              {clientOptions.map((c, idx) => (
                                <li key={c.customerid}>
                                  <button
                                    type="button"
                                    onMouseDown={(ev) => ev.preventDefault()}
                                    onClick={() => pickClient(c.customerid)}
                                    onMouseEnter={() => setClientActiveIndex(idx)}
                                    className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 ${
                                      idx === clientActiveIndex ? "bg-gray-100" : "bg-white"
                                    }`}
                                  >
                                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border bg-gray-50 text-xs font-semibold">
                                      {initials(c.label)}
                                    </span>
                                    <span className="min-w-0 flex-1">
                                      <span className="block truncate font-medium">{c.label}</span>
                                      <span className="block text-xs text-gray-500">Cliente #{c.customerid}</span>
                                    </span>
                                    <span className="text-xs text-gray-400">Seleccionar</span>
                                  </button>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}
                    </div>

                    {errors.clientId && <p className={errorText}>{errors.clientId}</p>}
                  </div>
                </section>

                <section className="rounded-xl border bg-white shadow-sm">
                  <header className="border-b px-3 py-2 flex items-center justify-between">
                    <div className="text-sm font-semibold text-gray-800">Programación</div>
                    <div className="text-xs text-gray-500">Lun–Sáb · 07:00–17:00</div>
                  </header>

                  <div className="p-4 grid grid-cols-1 md:grid-cols-12 gap-4" id="field-schedule">
                    <div className="md:col-span-3">
                      <label className="block text-xs text-gray-700 mb-1" htmlFor="field-order-state">
                        Estado
                      </label>
                      <div className="relative">
                        <select
                          id="field-order-state"
                          value={orderStateId ?? ""}
                          onChange={(e) => {
                            const v = Number(e.target.value);
                            setOrderStateId(Number.isFinite(v) && v > 0 ? v : null);
                          }}
                          className={selectBase}
                          disabled={lookupsLoading || stateOptionsForSelect.length === 0}
                        >
                          {stateOptionsForSelect.map((s) => (
                            <option key={s.stateid} value={s.stateid}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                        <svg className={chevron} width="16" height="16" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                          <path
                            fillRule="evenodd"
                            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.513a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    </div>

                    <div className="md:col-span-3">
                      <label className="block text-xs text-gray-700 mb-1" htmlFor="field-dateStart">
                        Fecha inicio
                      </label>
                      <input
                        id="field-dateStart"
                        type="date"
                        value={dateStart}
                        onChange={(e) => handleDateStartChange(e.target.value)}
                        className={`${inputBase} ${errors.schedule ? errorRing : ""}`}
                      />
                    </div>

                    <div className="md:col-span-3">
                      <label className="block text-xs text-gray-700 mb-1" htmlFor="field-timeStart">
                        Hora inicio
                      </label>
                      <input
                        id="field-timeStart"
                        type="time"
                        min={timeMin}
                        max={timeStartMax}
                        value={timeStart}
                        onChange={(e) => handleTimeStartChange(e.target.value)}
                        className={`${inputBase} ${errors.schedule ? errorRing : ""}`}
                      />
                    </div>

                    <div className="md:col-span-3">
                      <label className="block text-xs text-gray-700 mb-1" htmlFor="field-dateEnd">
                        Fecha fin
                      </label>
                      <input
                        id="field-dateEnd"
                        type="date"
                        value={dateEnd}
                        onChange={(e) => handleDateEndChange(e.target.value)}
                        className={`${inputBase} ${errors.schedule ? errorRing : ""}`}
                      />
                    </div>

                    <div className="md:col-span-3">
                      <label className="block text-xs text-gray-700 mb-1" htmlFor="field-timeEnd">
                        Hora fin
                      </label>
                      <input
                        id="field-timeEnd"
                        type="time"
                        min={timeMin}
                        max={timeMax}
                        value={timeEnd}
                        onChange={(e) => handleTimeEndChange(e.target.value)}
                        className={`${inputBase} ${errors.schedule ? errorRing : ""}`}
                      />
                    </div>

                    {errors.schedule && (
                      <div className="md:col-span-12">
                        <p className={errorText}>{errors.schedule}</p>
                      </div>
                    )}
                  </div>
                </section>

                <section className="rounded-xl border bg-white shadow-sm" id="field-technicians">
                  <header className="border-b px-4 py-3 flex items-center justify-between">
                    <div className="text-sm font-semibold text-gray-800">Técnicos</div>
                    <div className="flex items-center gap-2">
                      <div className="text-xs text-gray-500">
                        Seleccionados: <span className="font-semibold text-gray-900">{selectedTechnicians.length}</span>
                      </div>
                      <button
                        type="button"
                        onClick={clearTechnicians}
                        className="h-8 rounded-md border bg-white px-3 text-xs hover:bg-gray-50 disabled:opacity-60"
                        disabled={lookupsLoading || selectedTechnicians.length === 0}
                      >
                        Limpiar
                      </button>
                    </div>
                  </header>

                  <div className="p-4 grid grid-cols-1 gap-3">
                    <div className={`rounded-lg border bg-gray-50 p-3 ${errors.technicians ? errorRing : ""}`}>
                      {selectedTechniciansFull.length === 0 ? (
                        <div className="text-xs text-gray-500">No has seleccionado técnicos.</div>
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
                                aria-label="Quitar técnico"
                                title="Quitar"
                                disabled={lookupsLoading}
                              >
                                <Image
                                  src="/icons/delete.svg"
                                  alt="Quitar tecnico"
                                  width={12}
                                  height={12}
                                  className="h-3 w-3 opacity-80"
                                />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div ref={techBoxRef} className="relative">
                      <label className="block text-xs text-gray-700 mb-1" htmlFor="field-tech-search">
                        Buscar y agregar técnico
                      </label>
                      <input
                        id="field-tech-search"
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
                        placeholder="Nombre, apellido o ID..."
                        className={`${inputBase} ${errors.technicians ? errorRing : ""}`}
                        disabled={lookupsLoading}
                        aria-expanded={techOpen}
                        aria-controls="tech-suggest"
                        aria-autocomplete="list"
                      />

                      {techOpen && !lookupsLoading && (
                        <div
                          id="tech-suggest"
                          className="absolute z-20 mt-2 w-full overflow-hidden rounded-lg border bg-white shadow-sm"
                        >
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
                                    className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 ${
                                      idx === techActiveIndex ? "bg-gray-100" : "bg-white"
                                    }`}
                                  >
                                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border bg-gray-50 text-xs font-semibold">
                                      {initials(t.label)}
                                    </span>
                                    <span className="min-w-0 flex-1">
                                      <span className="block truncate font-medium">{t.label}</span>
                                      <span className="block text-xs text-gray-500">Técnico #{t.technicianid}</span>
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

                    {errors.technicians && <p className={errorText}>{errors.technicians}</p>}
                  </div>
                </section>

                <section className="rounded-xl border bg-white shadow-sm" id="field-tipo">
                  <header className="border-b px-4 py-3 flex items-center justify-between">
                    <div className="text-sm font-semibold text-gray-800">Detalles del servicio</div>
                    <div className="text-xs text-gray-500">El tipo de arriba solo aplica para “Añadir servicio”</div>
                  </header>

                  <div className="p-4 grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="md:col-span-12">
                      <span className="block text-xs text-gray-700 mb-2">Tipo para añadir un nuevo servicio</span>
                      <div
                        className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 ${
                          errors.tipo ? "rounded-lg p-3 border " + errorRing : ""
                        }`}
                      >
                        {serviceTypes.length === 0 ? (
                          <div className="text-xs text-gray-500">No hay tipos cargados desde la API.</div>
                        ) : (
                          serviceTypes.map((t) => (
                            <label
                              key={t.typeofserviceid}
                              className={`flex items-center gap-2 rounded-lg border bg-white px-3 py-2 cursor-pointer hover:bg-gray-50 ${
                                tipoId === t.typeofserviceid ? "ring-2 ring-red-200 border-red-200" : ""
                              }`}
                            >
                              <input
                                type="radio"
                                name="tipo-servicio"
                                value={String(t.typeofserviceid)}
                                checked={tipoId === t.typeofserviceid}
                                onChange={(e) => {
                                  const v = Number(e.target.value);
                                  setTipoId(Number.isFinite(v) ? v : null);
                                  setErrors((prev) => ({ ...prev, tipo: undefined }));
                                }}
                                className="h-4 w-4"
                              />
                              <span className="text-sm font-medium text-gray-900">{t.label}</span>
                            </label>
                          ))
                        )}
                      </div>
                      {errors.tipo && <p className={errorText}>{errors.tipo}</p>}
                    </div>

                    <div className="md:col-span-12" id="field-servicios">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div>
                          <div className="text-xs text-gray-700">Servicios</div>
                          <div className="text-xs text-gray-500">
                            Cada fila conserva su tipo. Además, un servicio ya agregado no vuelve a aparecer en la lista.
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={addServiceRow}
                          className="h-8 rounded-md border bg-white px-3 text-xs hover:bg-gray-50 disabled:opacity-60"
                          disabled={!tipoId || lookupsLoading || servicesForSelectedTipo.length === 0}
                        >
                          Añadir servicio
                        </button>
                      </div>

                      <div className={`rounded-lg border overflow-hidden bg-white ${errors.servicios ? errorRing : ""}`}>
                        <table className="w-full text-xs md:text-sm">
                          <thead className="bg-gray-50">
                            <tr className="text-gray-700">
                              <th className="px-3 py-2 text-left">Servicio</th>
                              <th className="px-3 py-2 text-right w-20">Cant.</th>
                              <th className="px-3 py-2 text-right w-32">Precio</th>
                              <th className="px-3 py-2 text-right w-32">Importe</th>
                              <th className="px-3 py-2 w-10"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {servicios.map((it) => {
                              const options = getServicesForTipo(it.tipoId, it.nombre);
                              const tipoLabel = tipoLabelById.get(it.tipoId) || `Tipo #${it.tipoId}`;
                              const fallbackCurrent =
                                !options.some((o) => o.name === it.nombre) && it.nombre
                                  ? [{ serviceid: -1, name: it.nombre, typeofserviceid: it.tipoId } as any, ...options]
                                  : options;

                              return (
                                <tr key={it.id} className="border-t">
                                  <td className="px-3 py-2">
                                    <div className="text-[11px] text-gray-500 mb-1">{tipoLabel}</div>
                                    <select
                                      value={it.nombre}
                                      onChange={(e) => {
                                        const n = e.target.value;
                                        patchItem<ServiceLineItem>(it.id, { nombre: n }, setServicios);
                                        setErrors((prev) => ({ ...prev, servicios: undefined }));
                                      }}
                                      className="w-full h-9 rounded-md border px-2"
                                      disabled={fallbackCurrent.length === 0 || lookupsLoading}
                                    >
                                      {fallbackCurrent.map((opt) => (
                                        <option key={`${it.id}-${opt.serviceid}-${opt.name}`} value={opt.name}>
                                          {opt.name}
                                        </option>
                                      ))}
                                    </select>
                                  </td>

                                  <td className="px-3 py-2 text-right">
                                    <input
                                      type="number"
                                      min={1}
                                      value={it.cantidad}
                                      onChange={(e) => {
                                        patchItem<ServiceLineItem>(
                                          it.id,
                                          { cantidad: Math.max(1, Number(e.target.value || 1)) },
                                          setServicios
                                        );
                                        setErrors((prev) => ({ ...prev, servicios: undefined }));
                                      }}
                                      className="h-9 w-20 rounded-md border px-2 text-right"
                                      disabled={lookupsLoading}
                                    />
                                  </td>

                                  <td className="px-3 py-2 text-right">
                                    <input
                                      type="number"
                                      min={0}
                                      step={1000}
                                      value={it.precio}
                                      onChange={(e) => {
                                        const n = Number(e.target.value || 0);
                                        patchItem<ServiceLineItem>(
                                          it.id,
                                          { precio: Number.isFinite(n) ? Math.max(0, Math.round(n)) : 0 },
                                          setServicios
                                        );
                                        setErrors((prev) => ({ ...prev, servicios: undefined }));
                                      }}
                                      className="h-9 w-32 rounded-md border px-2 text-right"
                                      disabled={lookupsLoading}
                                    />
                                  </td>

                                  <td className="px-3 py-2 text-right font-medium">
                                    {formatCOP((Number(it.cantidad) || 0) * (Number(it.precio) || 0))}
                                  </td>

                                  <td className="px-3 py-2 text-right">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        removeItem<ServiceLineItem>(it.id, setServicios);
                                        setErrors((prev) => ({ ...prev, servicios: undefined }));
                                      }}
                                      className="h-9 w-9 rounded-md hover:bg-gray-100"
                                      disabled={lookupsLoading}
                                      aria-label="Quitar servicio"
                                      title="Quitar"
                                    >
                                      <Image
                                        src="/icons/delete.svg"
                                        alt="Quitar servicio"
                                        width={16}
                                        height={16}
                                        className="mx-auto h-4 w-4 opacity-80"
                                      />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}

                            {servicios.length === 0 && (
                              <tr>
                                <td colSpan={5} className="px-3 py-6 text-center text-gray-500">
                                  Aún no has añadido servicios.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>

                      {errors.servicios && <p className={errorText}>{errors.servicios}</p>}
                    </div>

                    <div className="md:col-span-12" id="field-direccion">
                      <label className="block text-xs text-gray-700 mb-1" htmlFor="field-direccion-input">
                        Direccion del servicio
                      </label>
                      <input
                        id="field-direccion-input"
                        type="text"
                        value={direccion}
                        onChange={(e) => {
                          setDireccion(e.target.value);
                          if (errors.direccion) setErrors((p) => ({ ...p, direccion: undefined }));
                        }}
                        onBlur={() => {
                          const t = String(direccion || "").trim();
                          if (!t) setErrors((p) => ({ ...p, direccion: "La direccion es obligatoria." }));
                          else if (t.length < 3)
                            setErrors((p) => ({ ...p, direccion: "La direccion debe tener al menos 3 caracteres." }));
                          else if (t.length > 255)
                            setErrors((p) => ({ ...p, direccion: "La direccion no puede superar 255 caracteres." }));
                          else setErrors((p) => ({ ...p, direccion: undefined }));
                        }}
                        className={`${inputBase} ${errors.direccion ? errorRing : ""}`}
                        placeholder="Ej: Calle 123 #45-67, Barrio..."
                      />
                      {errors.direccion && <p className={errorText}>{errors.direccion}</p>}
                    </div>

                    <div className="md:col-span-12" id="field-description">
                      <label className="block text-xs text-gray-700 mb-1" htmlFor="field-desc">
                        Descripción
                      </label>
                      <textarea
                        id="field-desc"
                        value={descripcion}
                        onChange={(e) => {
                          const v = e.target.value;
                          setDescripcion(v);
                          const t = String(v || "").trim();
                          if (!t) setErrors((p) => ({ ...p, description: "La descripción es obligatoria." }));
                          else if (t.length < DESC_MIN)
                            setErrors((p) => ({ ...p, description: `La descripción debe tener al menos ${DESC_MIN} caracteres.` }));
                          else if (t.length > DESC_MAX)
                            setErrors((p) => ({ ...p, description: `La descripción no puede superar ${DESC_MAX} caracteres.` }));
                          else setErrors((p) => ({ ...p, description: undefined }));
                        }}
                        onBlur={() => {
                          const t = String(descripcion || "").trim();
                          if (!t) setErrors((p) => ({ ...p, description: "La descripción es obligatoria." }));
                          else if (t.length < DESC_MIN)
                            setErrors((p) => ({ ...p, description: `La descripción debe tener al menos ${DESC_MIN} caracteres.` }));
                          else if (t.length > DESC_MAX)
                            setErrors((p) => ({ ...p, description: `La descripción no puede superar ${DESC_MAX} caracteres.` }));
                          else setErrors((p) => ({ ...p, description: undefined }));
                        }}
                        rows={3}
                        className={`w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-200 ${
                          errors.description ? errorRing : ""
                        }`}
                        placeholder="Describe el servicio, alcance, observaciones, etc."
                      />
                      <div className="mt-1 flex items-center justify-between gap-3 text-[11px] text-gray-500">
                        <span>Se guardará exactamente el texto que escribas aquí (no se construye una descripción automática).</span>
                        <span>
                          {String(descripcion || "").trim().length}/{DESC_MAX}
                        </span>
                      </div>
                      {errors.description && <p className={errorText}>{errors.description}</p>}
                    </div>


                    <div className="md:col-span-12" id="field-files">
                      <div className="flex items-center justify-between gap-2">
                        <label className="block text-xs text-gray-700">Imágenes del servicio</label>
                        <button
                          type="button"
                          onClick={() => fileRef.current?.click()}
                          className="h-8 px-3 rounded-md border bg-white text-xs hover:bg-gray-50 disabled:opacity-60"
                          title="Subir imágenes"
                          disabled={lookupsLoading}
                        >
                          Subir imágenes
                        </button>
                        <input
                          ref={fileRef}
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={handleFiles}
                        />
                      </div>

                      <div className="mt-1 text-xs text-gray-500">
                        {files.length ? `${files.length} nuevas seleccionadas` : "Ninguna imagen nueva seleccionada"}
                      </div>

                      {existingFiles.length > 0 && (
                        <div className="mt-3">
                          <div className="text-xs text-gray-600 mb-1">Imágenes existentes</div>
                          <div className="flex flex-wrap gap-2">
                            {existingFiles.map((url, idx) => (
                              <div key={`${url}_${idx}`} className="relative w-20 h-20 rounded-lg overflow-hidden border bg-white">
                                <a href={url} target="_blank" rel="noreferrer" className="block w-full h-full" title="Abrir imagen">
                                  <img
                                    src={url}
                                    alt={`Imagen existente ${idx + 1}`}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                  />
                                </a>

                                <button
                                  type="button"
                                  onClick={() => setExistingFiles((prev) => prev.filter((u) => u !== url))}
                                  className="absolute right-1 top-1 rounded-md bg-white/90 px-1.5 py-0.5 text-[10px] font-semibold text-red-700 shadow-sm ring-1 ring-red-200 hover:bg-white"
                                  title="Eliminar imagen"
                                >
                                  <Image
                                    src="/icons/delete.svg"
                                    alt="Eliminar imagen"
                                    width={12}
                                    height={12}
                                    className="h-3 w-3 opacity-80"
                                  />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="mt-3 flex flex-wrap gap-2">
                        {files.length === 0 ? (
                          <div className="text-xs text-gray-500">No hay imágenes nuevas aún.</div>
                        ) : (
                          files.map((f, idx) => (
                            <div
                              key={`${f.name}_${f.lastModified}_${idx}`}
                              className="relative w-20 h-20 rounded-lg overflow-hidden border bg-white"
                            >
                              <img src={previews[idx]} alt={f.name} className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => removeFile(f)}
                                className="absolute top-1 right-1 bg-white/90 hover:bg-white text-xs rounded-full px-1"
                                aria-label="Quitar imagen"
                                title="Quitar"
                                disabled={lookupsLoading}
                              >
                                <Image
                                  src="/icons/delete.svg"
                                  alt="Quitar imagen"
                                  width={12}
                                  height={12}
                                  className="h-3 w-3 opacity-80"
                                />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              <aside className="space-y-6">
                <section className="rounded-xl border bg-white shadow-sm" id="field-materiales">
                  <header className="border-b px-4 py-3 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold text-gray-800">Productos (Materiales)</div>
                      <div className="text-xs text-gray-500">Agrega los materiales consumidos.</div>
                    </div>
                    <div className="text-xs text-gray-500">Subtotal: {formatCOP(subtotalMateriales)}</div>
                  </header>
                  <div className="p-4">
                    <div className={`space-y-2 rounded-lg border bg-white p-2.5 ${errors.materiales ? errorRing : ""}`}>
                      {materiales.length === 0 ? (
                        <div className="px-2 py-3 text-xs text-gray-500">Aún no has añadido productos.</div>
                      ) : (
                        materiales.map((m) => {
                          const opts = availableProducts(m.nombre);
                          const fallbackCurrent =
                            !opts.some((o) => o.productname === m.nombre) && m.nombre
                              ? [{ productid: -1, productname: m.nombre, productpriceofsale: m.precio } as any, ...opts]
                              : opts;

                          return (
                            <div key={m.id} className="rounded-md border bg-gray-50 p-2.5">
                              <div className="mb-2 flex items-center justify-between gap-2">
                                <div className="text-[11px] text-gray-600">Producto</div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    removeItem<MaterialLineItem>(m.id, setMateriales);
                                    setErrors((prev) => ({ ...prev, materiales: undefined }));
                                    setMaterialOpenId((curr) => (curr === m.id ? null : curr));
                                  }}
                                  className="inline-flex h-7 w-7 items-center justify-center rounded-md border bg-white hover:bg-gray-100"
                                  disabled={lookupsLoading}
                                  aria-label="Quitar producto"
                                  title="Quitar"
                                >
                                  <Image
                                    src="/icons/delete.svg"
                                    alt="Quitar producto"
                                    width={12}
                                    height={12}
                                    className="h-3 w-3 opacity-80"
                                  />
                                </button>
                              </div>

                              <div className="relative">
                                <button
                                  type="button"
                                  onClick={() => setMaterialOpenId((curr) => (curr === m.id ? null : m.id))}
                                  className="flex h-9 w-full items-center justify-between rounded-md border bg-white px-2.5 text-xs"
                                  disabled={!productsCatalog.length || lookupsLoading}
                                  title={m.nombre || "Seleccionar producto"}
                                >
                                  <span className="truncate pr-2">{m.nombre || "Seleccionar producto"}</span>
                                  <span className="text-[10px] text-gray-400">{materialOpenId === m.id ? "^" : "v"}</span>
                                </button>

                                {materialOpenId === m.id && (
                                  <div className="absolute left-0 right-0 z-20 mt-1 max-h-56 overflow-auto rounded-md border bg-white shadow-sm">
                                    {fallbackCurrent.length === 0 ? (
                                      <div className="px-3 py-2 text-[11px] text-gray-500">No hay más productos disponibles.</div>
                                    ) : (
                                      fallbackCurrent.map((opt) => (
                                        <button
                                          key={`${m.id}-${opt.productid}-${opt.productname}`}
                                          type="button"
                                          onClick={() => {
                                            patchItem<MaterialLineItem>(
                                              m.id,
                                              { nombre: opt.productname, precio: precioMaterialPorNombre(opt.productname) },
                                              setMateriales
                                            );
                                            setErrors((prev) => ({ ...prev, materiales: undefined }));
                                            setMaterialOpenId(null);
                                          }}
                                          className="block w-full border-b px-3 py-2 text-left text-xs last:border-b-0 hover:bg-gray-50"
                                        >
                                          <span className="block truncate font-medium">{opt.productname}</span>
                                          <span className="block text-[11px] text-gray-500">{formatCOP(opt.productpriceofsale)}</span>
                                        </button>
                                      ))
                                    )}
                                  </div>
                                )}
                              </div>

                              <div className="mt-2 flex items-end gap-1.5">
                                <div className="w-20 shrink-0">
                                  <label className="mb-1 block text-[10px] text-gray-600">Cant.</label>
                                  <input
                                    type="number"
                                    min={1}
                                    step={1}
                                    value={m.cantidad}
                                    onChange={(e) => {
                                      const n = Number(e.target.value || 1);
                                      patchItem<MaterialLineItem>(
                                        m.id,
                                        { cantidad: Number.isFinite(n) ? Math.max(1, Math.round(n)) : 1 },
                                        setMateriales
                                      );
                                      setErrors((prev) => ({ ...prev, materiales: undefined }));
                                    }}
                                    className="h-9 w-full rounded-md border bg-white px-2 text-xs text-center"
                                    disabled={lookupsLoading}
                                  />
                                </div>

                                <div className="flex-1 min-w-0">
                                  <span className="mb-1 block text-[10px] text-gray-600">Precio</span>
                                  <div className="flex h-9 items-center justify-end rounded-md border bg-white px-2.5 text-xs font-medium text-gray-900">
                                    {formatCOP(m.precio)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {errors.materiales && <p className={errorText}>{errors.materiales}</p>}

                    <div className="mt-2">
                      <button
                        type="button"
                        onClick={addMaterialRow}
                        className="w-full h-9 rounded-md bg-gray-100 border hover:bg-gray-50 text-xs disabled:opacity-60"
                        disabled={!productsCatalog.length || lookupsLoading || availableProducts().length === 0}
                        title={availableProducts().length === 0 ? "Ya agregaste todos los productos disponibles." : undefined}
                      >
                        {availableProducts().length === 0 ? "No hay más productos disponibles" : "Añadir producto"}
                      </button>
                    </div>
                  </div>
                </section>

                <section className="rounded-xl border bg-white shadow-sm" id="field-viaticos">
                  <header className="border-b px-4 py-3 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold text-gray-800">Viáticos</div>
                      <div className="text-xs text-gray-500">Afecta base e IVA.</div>
                    </div>
                  </header>
                  <div className="p-4 space-y-2">
                    <label className="block text-xs text-gray-700" htmlFor="field-viaticos-input">
                      Valor (COP)
                    </label>
                    <input
                      id="field-viaticos-input"
                      type="number"
                      min={0}
                      step={1000}
                      value={viaticosInput}
                      onChange={(e) => {
                        setViaticosInput(e.target.value);
                        setErrors((prev) => ({ ...prev, viaticos: undefined }));
                      }}
                      className={`${inputBase} text-right ${errors.viaticos ? errorRing : ""}`}
                      disabled={lookupsLoading || saving}
                      aria-invalid={!!errors.viaticos}
                      placeholder="0"
                    />
                    {errors.viaticos && <p className={errorText}>{errors.viaticos}</p>}
                    <div className="pt-3 border-t text-sm flex justify-between">
                      <span className="text-gray-600">Total viáticos</span>
                      <span className="font-medium">{formatCOP(Number.isFinite(viaticosValue) ? viaticosValue : 0)}</span>
                    </div>
                  </div>
                </section>

                <section className="rounded-xl border bg-white shadow-sm">
                  <header className="border-b px-4 py-3 flex items-center justify-between">
                    <div className="text-sm font-semibold text-gray-800">Totales</div>
                    <div className="text-xs text-gray-500">Estimación</div>
                  </header>

                  <div className="p-4 space-y-3 text-sm">
                    <div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Subtotal servicios</span>
                        <span className="font-medium">{formatCOP(subtotalServicios)}</span>
                      </div>
                      {serviciosMiniLista.length > 0 && (
                        <ul className="mt-2 space-y-1 text-xs text-gray-600">
                          {serviciosMiniLista.map((s) => (
                            <li key={`${s.tipoId}-${s.nombre}`} className="flex justify-between gap-2">
                              <span className="truncate">
                                [{tipoLabelById.get(s.tipoId) || `Tipo #${s.tipoId}`}] {s.nombre} × {s.cantidad}
                              </span>
                              <span>{formatCOP(s.total)}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Subtotal productos</span>
                        <span className="font-medium">{formatCOP(subtotalMateriales)}</span>
                      </div>
                      {materialesMiniLista.length > 0 && (
                        <ul className="mt-2 space-y-1 text-xs text-gray-600">
                          {materialesMiniLista.map((m) => (
                            <li key={m.nombre} className="flex justify-between gap-2">
                              <span className="truncate">
                                {m.nombre} × {m.cantidad}
                              </span>
                              <span>{formatCOP(m.total)}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-600">Viáticos</span>
                      <span className="font-medium">{formatCOP(Number.isFinite(viaticosValue) ? viaticosValue : 0)}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-600">IVA ({IVA_PCT}%)</span>
                      <span className="font-medium">{formatCOP(impuestos)}</span>
                    </div>

                    <div className="flex justify-between text-base font-semibold pt-3 border-t">
                      <span>Total (estimado)</span>
                      <span>{formatCOP(totalPagar)}</span>
                    </div>
                  </div>
                </section>
              </aside>
            </form>
          </div>
        </main>

        <StickyFooter />
      </div>
    </RequireAuth>
  );
}






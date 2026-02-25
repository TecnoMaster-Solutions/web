"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Image from "next/image";
import RequireAuth from "@/features/auth/requireauth";
import { createOrderService } from "../api/ordersServices.api";
import type { CreateOrdersServiceDto } from "../types/ordersServices.types";
import { uploadImageToCloudinary } from "@/shared/utils/cloudinary";
import { useOrdersServicesLookups } from "../hooks/useOrdersServicesLookups";
import { showError, showSuccess, showWarning } from "@/shared/utils/notifications";
import { api } from "@/lib/api";
import {
  SCHEDULE_MAX,
  SCHEDULE_MIN,
  coerceAllowedDateOrNext,
  coerceAllowedTime,
  dedupeById,
  extractFreeTextFromDescription,
  formatCOP,
  initials,
  minutesToTime,
  normalizeKey,
  normalizeQuote,
  normalizeText,
  parseQuoteParam,
  pickNumber,
  timeToMinutes,
  titleCase,
  toLocalHM,
  toLocalYMD,
  uid,
  unwrapList,
  type QuoteNormalized,
} from "./CreateOrderService.utils";
import {
  DESC_MAX,
  type OrderServiceFormErrors as Errors,
  validateDescription,
  validateField,
  validateForm,
} from "./CreateOrderService.validations";
import {
  buildWindowFromLocalSchedule,
  getBusyTechnicianIdsForWindow,
} from "@/features/dashboard/shared/technicianAvailability";

type ServiceLineItem = { id: string; nombre: string; precio: number; tipoId: number };
type MaterialLineItem = { id: string; nombre: string; precio: number; cantidad: number };

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

const IVA_PCT = 19;

type Touched = Partial<Record<keyof Errors, boolean>>;

type CreateClientField =
  | "name"
  | "lastname"
  | "email"
  | "phone"
  | "documentnumber"
  | "typeid"
  | "customercity"
  | "customerzipcode";

type CreateClientForm = {
  name: string;
  lastname: string;
  email: string;
  phone: string;
  documentnumber: string;
  typeid: string;
  customercity: string;
  customerzipcode: string;
};

type CreateClientErrors = Partial<Record<CreateClientField, string>>;

const EMPTY_CREATE_CLIENT_FORM: CreateClientForm = {
  name: "",
  lastname: "",
  email: "",
  phone: "",
  documentnumber: "",
  typeid: "",
  customercity: "",
  customerzipcode: "",
};

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

export default function OrderCreatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const returnTo = searchParams.get("returnTo") || "/dashboard/orders-services";

  const quotesIdParam =
    searchParams.get("saleId") ||
    searchParams.get("salesId") ||
    searchParams.get("ventaId") ||
    searchParams.get("ventaid") ||
    searchParams.get("quotesId") ||
    searchParams.get("quotationId") ||
    searchParams.get("cotizacionId") ||
    searchParams.get("cotizacionid") ||
    searchParams.get("quotesid");

  const quoteDataParam =
    searchParams.get("saleData") ||
    searchParams.get("saleJson") ||
    searchParams.get("venta") ||
    searchParams.get("quoteData") ||
    searchParams.get("quoteJson") ||
    searchParams.get("cotizacion") ||
    searchParams.get("quotation");

  const quotesIdFromUrl = (() => {
    const n = Number(quotesIdParam);
    return Number.isFinite(n) && n > 0 ? n : null;
  })();

  const [servicesAll, setServicesAll] = useState<any[]>([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await api.get<any>("/services");
        if (!alive) return;
        const list = unwrapList((res as any)?.data);
        setServicesAll(list);
      } catch {
        if (!alive) return;
        setServicesAll([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

const {
    loading: lookupsLoading,
    error: lookupsError,
    customers: customersRaw,
    technicians: techniciansRaw,
    products: productsRaw,
    services: servicesRaw,
    serviceTypes: serviceTypesRaw,
    pendingStateId,
    scheduledStateId,
    refresh: refreshLookups,
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
        const label = name || `Tecnico #${t?.technicianid ?? t?.id ?? "?"}`;
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

  
  const servicesCatalog = useMemo<ServiceOption[]>(() => {
    const merged = dedupeById<any>([...(servicesAll || []), ...(servicesRaw || [])]);
    return merged
      .map((s: any) => {
        const serviceid = Number(s?.serviceid ?? s?.id);
        const name = String(s?.name ?? s?.servicename ?? `Servicio #${serviceid}`).trim();
        const typeofserviceid = Number(
          s?.typeofserviceid ?? s?.typeOfServiceId ?? s?.typeofservice?.typeofserviceid
        );
        const typeofservicename = (s?.typeofservicename ?? s?.typeName ?? s?.typeofservice?.name ?? null) as any;
        const stateid = s?.stateid != null ? Number(s.stateid) : null;
        const statename =
          s?.statename != null
            ? String(s.statename)
            : s?.state?.name != null
              ? String(s.state.name)
              : null;

        return { serviceid, name, typeofserviceid, typeofservicename, stateid, statename } as ServiceOption;
      })
      .filter(
        (x) =>
          Number.isFinite(x.serviceid) &&
          x.serviceid > 0 &&
          Number.isFinite(x.typeofserviceid) &&
          x.typeofserviceid > 0
      );
  }, [servicesAll, servicesRaw]);

  function getServicesForTipo(tid: number | null) {
    if (!tid) return [];
    const list = servicesCatalog.filter((s) => s.typeofserviceid === tid);
    const active = list.filter(
      (s) => (s.stateid == null ? true : s.stateid === 1) || String(s.statename || "").toLowerCase() === "activo"
    );
    return active.length ? active : list;
  }

  const [quotesRaw, setQuotesRaw] = useState<any[]>([]);
  const [quotesLoading, setQuotesLoading] = useState(false);
  const [quotesError, setQuotesError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setQuotesLoading(true);
      setQuotesError(null);
      try {
        const { data } = await api.get("sales");
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data?.sales)
          ? data.sales
          : Array.isArray(data?.quotes)
          ? data.quotes
          : [];
        if (!cancelled) setQuotesRaw(list);
      } catch (e: any) {
        const msg = e?.response?.data?.message || e?.message || "Error cargando ventas.";
        if (!cancelled) {
          setQuotesError(String(msg));
          setQuotesRaw([]);
        }
      } finally {
        if (!cancelled) setQuotesLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  const approvedQuotes = useMemo(() => {
    return (quotesRaw || []).filter((q) => {
      const statusRaw =
        q?.salestatus ??
        q?.status ??
        q?.state?.name ??
        q?.state?.statename ??
        q?.stateName ??
        q?.statename ??
        (typeof q?.state === "string" ? q.state : "");
      const normalized = normalizeText(statusRaw || "");
      if (!normalized) return true;
      return !normalized.includes("cancel") && !normalized.includes("anulad");
    });
  }, [quotesRaw]);

  const quoteMapById = useMemo(() => {
    const m = new Map<number, any>();
    for (const q of approvedQuotes || []) {
      const id = pickNumber(q?.saleid, q?.salesid, q?.quotesid, q?.quotationid, q?.cotizacionid, q?.id);
      if (id) m.set(id, q);
    }
    return m;
  }, [approvedQuotes]);

  const quoteOptions = useMemo(() => {
    const opts: Array<{ id: number; label: string }> = [];
    for (const q of approvedQuotes || []) {
      const nq = normalizeQuote(q);
      const id =
        nq.saleid ??
        nq.quotesid ??
        pickNumber(q?.saleid, q?.salesid, q?.quotesid, q?.quotationid, q?.cotizacionid, q?.id);
      if (!id) continue;

      const clientLabel =
        (nq.clientid && customers.find((c) => c.customerid === nq.clientid)?.label) ||
        (nq.clientid ? `Cliente #${nq.clientid}` : "Sin cliente");

      const saleCode = String(q?.salecode ?? "").trim();
      const statusLabel = String(q?.salestatus ?? q?.status ?? "").trim();
      const total = pickNumber(q?.totalamount, q?.total, q?.grandtotal);

      const typeLabel =
        (nq.typeofserviceid && serviceTypes.find((t) => t.typeofserviceid === nq.typeofserviceid)?.label) || "";
      const addressLabel = String(nq.direccion || "").trim();

      const parts = [saleCode ? `${saleCode} (#${id})` : `#${id}`, clientLabel];
      if (typeLabel) parts.push(typeLabel);
      if (addressLabel) parts.push(`Dir: ${addressLabel}`);
      if (statusLabel) parts.push(statusLabel);
      if (Number.isFinite(total)) parts.push(formatCOP(Number(total)));

      const hasServices = Array.isArray(nq.services) && nq.services.length > 0;
      const hasProducts = Array.isArray(nq.products) && nq.products.length > 0;
      const extra = [hasServices ? "con servicios" : "", hasProducts ? "con productos" : ""].filter(Boolean).join(" - ");
      if (extra) parts.push(extra);

      opts.push({ id, label: parts.join(" - ") });
    }
    opts.sort((a, b) => b.id - a.id);
    return opts;
  }, [approvedQuotes, customers, serviceTypes]);

  const [selectedQuotesId, setSelectedQuotesId] = useState<number | "">("");
  const [quoteQuery, setQuoteQuery] = useState("");
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [quoteActiveIndex, setQuoteActiveIndex] = useState(0);
  const quoteBoxRef = useRef<HTMLDivElement>(null);
  const quoteInputRef = useRef<HTMLInputElement>(null);

  const [quoteLoadingApply, setQuoteLoadingApply] = useState(false);
  const [quoteAppliedKey, setQuoteAppliedKey] = useState<string | null>(null);
  const [quoteApplyError, setQuoteApplyError] = useState<string | null>(null);
  const saleToServiceRequestCacheRef = useRef<Map<number, number | null>>(new Map());
  const quotesForLinkingRef = useRef<any[] | null>(null);

  const [clientId, setClientId] = useState<number | "">("");
  const selectedCustomer = useMemo(() => customers.find((c) => c.customerid === clientId), [customers, clientId]);
  const [createClientInlineEnabled, setCreateClientInlineEnabled] = useState(false);
  const [clientIdBeforeInlineCreate, setClientIdBeforeInlineCreate] = useState<number | "">("");
  const clientLockedByQuote = !!quoteAppliedKey && !!clientId && !createClientInlineEnabled;
  const [createClientLoading, setCreateClientLoading] = useState(false);
  const [createClientBootstrapping, setCreateClientBootstrapping] = useState(false);
  const [createClientRoleId, setCreateClientRoleId] = useState<number | null>(null);
  const [createClientDocTypes, setCreateClientDocTypes] = useState<Array<{ id: number; name: string }>>([]);
  const [createClientForm, setCreateClientForm] = useState<CreateClientForm>(EMPTY_CREATE_CLIENT_FORM);
  const [createClientErrors, setCreateClientErrors] = useState<CreateClientErrors>({});

  const [tipoId, setTipoId] = useState<number | null>(null);
  const tipoSeleccionado = useMemo(
    () => serviceTypes.find((t) => t.typeofserviceid === tipoId) || null,
    [serviceTypes, tipoId]
  );

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

  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState<Touched>({});
  const summaryRef = useRef<HTMLDivElement>(null);

  const [saving, setSaving] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const submitLockRef = useRef(false);

  const isDesktop = useDesktopQuery();
  const sidebarW = useSidebarWidth("#app-sidebar");

  const inputBase =
    "w-full h-10 rounded-md border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-200";
  const errorText = "mt-1 text-xs text-red-600";
  const errorRing = "border-red-500 ring-1 ring-red-500";

  const hasErrors = useMemo(
    () => Object.values(errors).some((v) => typeof v === "string" && v.trim().length > 0),
    [errors]
  );

  function showFieldError(key: keyof Errors) {
    return !!errors[key] && (submitAttempted || !!touched[key]);
  }

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

  const shownQuotesErr = useRef<string | null>(null);
  useEffect(() => {
    if (!quotesError) return;
    if (shownQuotesErr.current === quotesError) return;
    shownQuotesErr.current = quotesError;
    showError(quotesError);
  }, [quotesError]);

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

  const skipClearOnTipoChangeRef = useRef(false);

  useEffect(() => {
    if (skipClearOnTipoChangeRef.current) {
      skipClearOnTipoChangeRef.current = false;
      return;
    }
    setErrors((prev) => ({ ...prev, tipo: undefined }));
  }, [tipoId]);

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
      showWarning("Ese tecnico ya esta ocupado en el horario seleccionado.");
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

  function serviceOptionsForRow(tipo: number, currentName: string) {
    const base = getServicesForTipo(tipo);
    if (!base.length) return [];
    const used = new Set(
      servicios
        .filter((s) => s.tipoId === tipo)
        .map((s) => String(s.nombre || "").trim())
        .filter(Boolean)
    );
    if (currentName) used.delete(currentName);
    return base.filter((opt) => !used.has(opt.name));
  }

  function addServiceRow() {
    if (!tipoId) return;
    const opts = serviceOptionsForRow(tipoId, "");
    const first = opts[0];
    if (!first) {
      showWarning("Ya agregaste todos los servicios disponibles para este tipo.");
      return;
    }
    setServicios((prev) => [...prev, { id: uid(), nombre: first.name, precio: 0, tipoId }]);
    setErrors((prev) => ({ ...prev, servicios: undefined }));
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
      else rejected.push(`${f.name}${!isImg ? " (no es imagen)" : ""}${!okSize ? " (mas de 5MB)" : ""}`);
    });

    const totalCount = accepteds.length + files.length;

    if (totalCount > MAX_FILES) {
      const allowed = Math.max(0, MAX_FILES - files.length);
      if (allowed > 0) dedupeAppend(accepteds.slice(0, allowed));
      showWarning(`Maximo ${MAX_FILES} imagenes. ${rejected.length ? "Algunas fueron rechazadas." : ""}`.trim());
    } else {
      dedupeAppend(accepteds);
      if (rejected.length) showWarning("Algunas imagenes fueron rechazadas (tipo/tamano).");
    }

    e.currentTarget.value = "";
  }

  function removeFile(file: File) {
    setFiles((prev) =>
      prev.filter((f) => !(f.name === file.name && f.size === file.size && f.lastModified === file.lastModified))
    );
  }

  const subtotalServicios = useMemo(() => servicios.reduce((a, i) => a + 1 * (Number(i.precio) || 0), 0), [servicios]);

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
    const map = new Map<string, { nombre: string; cantidad: number; total: number }>();
    servicios.forEach((s) => {
      if (!s.nombre) return;
      const t = 1 * (Number(s.precio) || 0);
      const labelTipo = serviceTypes.find((t) => t.typeofserviceid === s.tipoId)?.label || `Tipo #${s.tipoId}`;
      const key = `[${labelTipo}] ${s.nombre}`;
      const prev = map.get(key);
      if (prev) {
        prev.cantidad += 1;
        prev.total += t;
      } else {
        map.set(key, { nombre: key, cantidad: 1, total: t });
      }
    });
    return Array.from(map.values());
  }, [servicios, serviceTypes]);

  const materialesMiniLista = useMemo(() => {
    const map = new Map<string, { nombre: string; cantidad: number; total: number }>();
    materiales.forEach((m) => {
      if (!m.nombre) return;
      const qty = Math.max(0, Math.round(Number(m.cantidad) || 0));
      if (!qty) return;
      const t = qty * (Number(m.precio) || 0);
      const prev = map.get(m.nombre);
      if (prev) {
        prev.cantidad += qty;
        prev.total += t;
      } else {
        map.set(m.nombre, { nombre: m.nombre, cantidad: qty, total: t });
      }
    });
    return Array.from(map.values());
  }, [materiales]);

  const materialesSelectedNames = useMemo(
    () => new Set(materiales.map((m) => String(m.nombre || "").trim()).filter(Boolean)),
    [materiales]
  );

  const availableProducts = useMemo(() => {
    return productsCatalog.filter((p) => !materialesSelectedNames.has(p.productname));
  }, [productsCatalog, materialesSelectedNames]);

  function findProductByName(nombre: string) {
    const q = normalizeText(nombre);
    if (!q) return null;
    return productsCatalog.find((x) => normalizeText(x.productname) === q) || null;
  }

  function isProductAlreadyAdded(rowId: string, productName: string) {
    const nameNorm = normalizeText(productName);
    if (!nameNorm) return false;
    return materiales.some((m) => m.id !== rowId && normalizeText(String(m.nombre || "")) === nameNorm);
  }

  function materialOptionsForRow(currentName: string, query = "") {
    const used = new Set(materiales.map((m) => String(m.nombre || "").trim()).filter(Boolean));
    if (currentName) used.delete(currentName);
    const base = productsCatalog.filter((p) => !used.has(p.productname));
    const q = normalizeText(query);
    // If the input currently matches an existing product exactly, show full list.
    // This keeps the dropdown useful after selecting an item.
    if (q && findProductByName(query)) return base.slice(0, 15);
    if (!q) return base.slice(0, 15);
    const scored = base
      .map((p) => {
        const label = normalizeText(p.productname);
        let score = 0;
        if (label.startsWith(q)) score += 2;
        if (label.includes(q)) score += 1;
        return { p, score };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score || a.p.productname.localeCompare(b.p.productname));
    return scored.slice(0, 15).map((x) => x.p);
  }

  function selectMaterialForRow(rowId: string, product: ProductOption) {
    if (isProductAlreadyAdded(rowId, product.productname)) {
      showWarning(`El producto "${product.productname}" ya esta agregado.`);
      return;
    }
    patchItem<MaterialLineItem>(
      rowId,
      { nombre: product.productname, precio: product.productpriceofsale },
      setMateriales
    );
    setErrors((prev) => ({ ...prev, materiales: undefined }));
    setMaterialOpenId(null);
  }

  function addMaterialRow() {
    const first = availableProducts[0];
    if (!first) {
      showWarning("Ya agregaste todos los productos disponibles.");
      return;
    }
    setMateriales((prev) => [
      ...prev,
      { id: uid(), nombre: first.productname, precio: first.productpriceofsale, cantidad: 1 },
    ]);
    setErrors((prev) => ({ ...prev, materiales: undefined }));
  }

  const validationContext = useMemo(
    () => ({
      clientId,
      tipoId,
      dateStart,
      timeStart,
      dateEnd,
      timeEnd,
      selectedTechnicians,
      viaticosValue,
      direccion,
      descripcion,
      servicios,
      servicesCatalog,
      materiales,
      productsCatalog,
    }),
    [
      clientId,
      tipoId,
      dateStart,
      timeStart,
      dateEnd,
      timeEnd,
      selectedTechnicians,
      viaticosValue,
      direccion,
      descripcion,
      servicios,
      servicesCatalog,
      materiales,
      productsCatalog,
    ]
  );

  function runBlurValidation(key: keyof Errors) {
    setTouched((t) => ({ ...t, [key]: true }));
    const msg = validateField(key, validationContext);
    setErrors((p) => ({ ...p, [key]: msg }));
  }

  useEffect(() => {
    if (!(submitAttempted || touched.tipo)) return;
    setErrors((p) => ({ ...p, tipo: validateField("tipo", validationContext) }));
  }, [submitAttempted, touched.tipo, tipoId, servicios.length, validationContext]);

  useEffect(() => {
    if (!(submitAttempted || touched.servicios)) return;
    setErrors((p) => ({ ...p, servicios: validateField("servicios", validationContext) }));
  }, [submitAttempted, touched.servicios, servicios, servicesCatalog, validationContext]);

  useEffect(() => {
    if (!(submitAttempted || touched.materiales)) return;
    setErrors((p) => ({ ...p, materiales: validateField("materiales", validationContext) }));
  }, [submitAttempted, touched.materiales, materiales, productsCatalog, validationContext]);

  useEffect(() => {
    if (!(submitAttempted || touched.technicians)) return;
    if (!selectedTechnicians.length) {
      setErrors((p) => ({ ...p, technicians: "Selecciona al menos un tecnico." }));
      return;
    }
    if (selectedBusyTechnicianIds.length > 0) {
      setErrors((p) => ({ ...p, technicians: "Hay tecnicos ocupados en ese horario." }));
      return;
    }
    setErrors((p) => ({ ...p, technicians: undefined }));
  }, [submitAttempted, touched.technicians, selectedTechnicians, selectedBusyTechnicianIds]);

  function focusFirstError(er: Errors) {
    const order = ["quote", "clientId", "tipo", "schedule", "technicians", "viaticos", "direccion", "description", "materiales", "servicios"] as const;
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

  const [customerQuery, setCustomerQuery] = useState("");
  const [customerOpen, setCustomerOpen] = useState(false);
  const [customerActiveIndex, setCustomerActiveIndex] = useState(0);
  const customerBoxRef = useRef<HTMLDivElement>(null);
  const customerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!quoteOpen) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!quoteBoxRef.current) return;
      if (!quoteBoxRef.current.contains(t)) setQuoteOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [quoteOpen]);

  const selectedQuoteOption = useMemo(() => {
    if (!selectedQuotesId) return null;
    return quoteOptions.find((q) => q.id === Number(selectedQuotesId)) || null;
  }, [quoteOptions, selectedQuotesId]);

  const quoteSearchOptions = useMemo(() => {
    const q = normalizeText(quoteQuery);
    if (!q) return quoteOptions.slice(0, 10);
    const scored = quoteOptions
      .map((opt) => {
        const label = normalizeText(opt.label);
        const idStr = String(opt.id);
        let score = 0;
        if (idStr.startsWith(q)) score += 3;
        if (label.includes(q)) score += 2;
        if (label.startsWith(q)) score += 1;
        return { opt, score };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score || b.opt.id - a.opt.id);
    return scored.slice(0, 10).map((x) => x.opt);
  }, [quoteOptions, quoteQuery]);

  useEffect(() => {
    setQuoteActiveIndex(0);
  }, [quoteQuery, quoteOpen]);

  function pickQuote(id: number) {
    if (!Number.isFinite(id) || id <= 0) return;
    setSelectedQuotesId(id as any);
    setErrors((p) => ({ ...p, quote: undefined }));
    setTouched((t) => ({ ...t, quote: true }));
    setQuoteQuery("");
    setQuoteOpen(false);
    setQuoteApplyError(null);
  }

  function clearQuoteSelection() {
    setSelectedQuotesId("");
    setQuoteQuery("");
    setQuoteOpen(false);
    setQuoteApplyError(null);
    setQuoteAppliedKey(null);
    quoteInputRef.current?.focus();
  }

  useEffect(() => {
    if (!customerOpen) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!customerBoxRef.current) return;
      if (!customerBoxRef.current.contains(t)) setCustomerOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [customerOpen]);

  const customerOptions = useMemo(() => {
    const q = normalizeText(customerQuery);
    if (!q) return customers.slice(0, 10);
    const scored = customers
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
  }, [customers, customerQuery]);

  useEffect(() => {
    setCustomerActiveIndex(0);
  }, [customerQuery, customerOpen]);

  function pickCustomer(id: number) {
    if (!Number.isFinite(id) || id <= 0) return;
    setClientId(id as any);
    setErrors((p) => ({ ...p, clientId: undefined }));
    setCustomerQuery("");
    setCustomerOpen(false);
  }

  function clearCustomer() {
    setClientId("");
    setCustomerQuery("");
    setCustomerOpen(false);
    customerInputRef.current?.focus();
  }

  function resetCreateClientForm() {
    setCreateClientForm(EMPTY_CREATE_CLIENT_FORM);
    setCreateClientErrors({});
  }

  function validateCreateClientForm(form: CreateClientForm) {
    const next: CreateClientErrors = {};
    const name = String(form.name || "").trim();
    const lastname = String(form.lastname || "").trim();
    const email = String(form.email || "").trim();
    const phone = String(form.phone || "").trim();
    const documentnumber = String(form.documentnumber || "").trim();
    const typeid = Number(form.typeid);
    const city = String(form.customercity || "").trim();
    const zipcode = String(form.customerzipcode || "").trim();

    if (name.length < 2) next.name = "El nombre es obligatorio (minimo 2 caracteres).";
    if (lastname.length > 0 && lastname.length < 2) next.lastname = "El apellido debe tener minimo 2 caracteres.";
    if (!email) next.email = "El correo es obligatorio.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = "Correo invalido.";
    if (!/^\d{7,15}$/.test(phone)) next.phone = "Telefono invalido (7 a 15 digitos).";
    if (!documentnumber) next.documentnumber = "El numero de documento es obligatorio.";
    if (!Number.isFinite(typeid) || typeid <= 0) next.typeid = "Selecciona el tipo de documento.";
    if (city && city.length > 120) next.customercity = "La ciudad no puede superar 120 caracteres.";
    if (zipcode && zipcode.length > 20) next.customerzipcode = "El codigo postal no puede superar 20 caracteres.";

    return next;
  }

  async function ensureCreateClientLookups() {
    if (createClientRoleId && createClientDocTypes.length) return;
    setCreateClientBootstrapping(true);
    try {
      const [rolesRes, docsRes] = await Promise.all([
        api.get("/roles/list"),
        api.get("/typeofdocuments"),
      ]);

      const roles = unwrapList((rolesRes as any)?.data);
      const clienteRole = roles.find((r: any) => normalizeText(r?.name ?? r?.role?.name) === "cliente");
      const roleId = Number(clienteRole?.roleid ?? clienteRole?.id ?? clienteRole?.role?.roleid ?? clienteRole?.role?.id);

      const docsRaw = unwrapList((docsRes as any)?.data);
      const docs = (docsRaw || [])
        .map((d: any) => ({
          id: Number(d?.typeofdocumentid ?? d?.id),
          name: String(d?.name ?? d?.nombre ?? d?.label ?? "").trim(),
        }))
        .filter((d) => Number.isFinite(d.id) && d.id > 0 && d.name);

      setCreateClientRoleId(Number.isFinite(roleId) && roleId > 0 ? roleId : null);
      setCreateClientDocTypes(docs);
      if (!createClientForm.typeid && docs.length) {
        setCreateClientForm((prev) => ({ ...prev, typeid: String(docs[0].id) }));
      }
    } catch (e: any) {
      showError(e?.response?.data?.message || e?.message || "No se pudieron cargar roles y tipos de documento.");
    } finally {
      setCreateClientBootstrapping(false);
    }
  }

  async function createClientFromInlineForm() {
    if (!createClientRoleId) {
      await ensureCreateClientLookups();
    }
    if (!createClientRoleId) {
      throw new Error("No se encontro el rol Cliente para crear el usuario.");
    }

    setCreateClientLoading(true);
    try {
      const payload = {
        name: String(createClientForm.name || "").trim(),
        lastname: String(createClientForm.lastname || "").trim() || null,
        email: String(createClientForm.email || "").trim(),
        phone: String(createClientForm.phone || "").trim(),
        documentnumber: String(createClientForm.documentnumber || "").trim(),
        typeid: Number(createClientForm.typeid),
        stateid: 1,
        roleid: createClientRoleId,
        customercity: String(createClientForm.customercity || "").trim() || null,
        customerzipcode: String(createClientForm.customerzipcode || "").trim() || null,
      };

      const userRes: any = await api.post("/users", payload);
      const newUserId = pickNumber(
        userRes?.data?.userid,
        userRes?.data?.id,
        userRes?.data?.data?.userid,
        userRes?.data?.data?.id
      );

      let createdCustomerId = 0;
      if (newUserId) {
        try {
          const customerByUserRes: any = await api.get(`/customers/user/${newUserId}`, {
            params: { includeRelations: true },
          });
          const byUser = customerByUserRes?.data;
          createdCustomerId = Number(byUser?.customerid ?? byUser?.id ?? 0);
        } catch {}
      }

      if (!createdCustomerId) {
        const customerListRes: any = await api.get("/customers", { params: { includeRelations: true } });
        const list = unwrapList(customerListRes?.data);
        const emailNeedle = normalizeText(payload.email);
        const docNeedle = normalizeText(payload.documentnumber);

        const found = (list || []).find((c: any) => {
          const base = c?.customer || c?.client || c;
          const u = base?.users || base?.user || c?.users || c?.user || {};
          const mail = normalizeText(u?.email ?? base?.email ?? c?.email ?? "");
          const doc = normalizeText(u?.documentnumber ?? base?.documentnumber ?? c?.documentnumber ?? "");
          return (emailNeedle && mail === emailNeedle) || (docNeedle && doc === docNeedle);
        });

        createdCustomerId = Number(found?.customerid ?? found?.id ?? 0);
      }

      await refreshLookups();

      if (!(Number.isFinite(createdCustomerId) && createdCustomerId > 0)) {
        throw new Error("Se creo el usuario, pero no se pudo obtener el cliente asociado.");
      }

      pickCustomer(createdCustomerId);
      showSuccess("Cliente creado y asociado a la orden.");
      return createdCustomerId;
    } finally {
      setCreateClientLoading(false);
    }
  }

  function resetPrefill() {
    setSubmitAttempted(false);
    setQuoteApplyError(null);
    setSelectedQuotesId("");
    setClientId("");
    setCreateClientInlineEnabled(false);
    resetCreateClientForm();
    skipClearOnTipoChangeRef.current = true;
    setTipoId(null);
    setDescripcion("");
    setDireccion("");
    setSelectedTechnicians([]);
    setServicios([]);
    setMateriales([]);
    setFiles([]);
    setViaticosInput("0");
    const now = new Date();
    const ds = coerceAllowedDateOrNext(toLocalYMD(now));
    const ts = coerceAllowedTime(toLocalHM(now), "07:00");
    const autoEnd = clampAutoEnd(ds, ts);
    setDateStart(ds);
    setTimeStart(ts);
    setDateEnd(autoEnd.date);
    setTimeEnd(autoEnd.time);
    setErrors({});
    setTouched({});
    setQuoteAppliedKey(null);
    setQuoteQuery("");
    setQuoteOpen(false);
    setCustomerQuery("");
    setCustomerOpen(false);
  }

  function applyNormalizedQuote(nq: QuoteNormalized, key: string) {
    const nextClient = nq.clientid && customers.some((c) => c.customerid === nq.clientid) ? nq.clientid : "";
    setClientId(nextClient as any);

    const typeMatchByName =
      nq.typeofservicename && serviceTypes.length
        ? serviceTypes.find((t) => normalizeKey(t.name) === normalizeKey(nq.typeofservicename))?.typeofserviceid ??
          null
        : null;

    const inferredTypeFromServices =
      nq.services && nq.services.length
        ? servicesCatalog.find((x) => x.serviceid === nq.services![0].serviceid)?.typeofserviceid ?? null
        : null;

    const candidateType = nq.typeofserviceid ?? inferredTypeFromServices ?? typeMatchByName;

    const typeId =
      candidateType && serviceTypes.some((t) => t.typeofserviceid === candidateType) ? candidateType : null;

    skipClearOnTipoChangeRef.current = true;
    setTipoId(typeId);
    // Si la venta/cotizacion viene asociada a una solicitud, precarga el servicio de esa solicitud
    if (nq?.serviceRequestId) {
      api
        .get<any>(`/service-requests/${nq.serviceRequestId}`)
        .then((srRes) => {
          const sr = (srRes as any)?.data ?? null;
          const srv = sr?.service ?? null;
          const srvId = pickNumber(sr?.serviceId, sr?.serviceid, srv?.serviceid);
          const srvTypeId = pickNumber(srv?.typeofserviceid, srv?.typeOfServiceId, srv?.typeofserviceId);

          if (typeof srvTypeId === "number") setTipoId(srvTypeId);

          const name = String(srv?.name ?? "").trim();
          const price = pickNumber(srv?.servicepriceofsale, srv?.serviceprice, srv?.price, srv?.precio) ?? 0;

          if (srvId && name) {
            setServicios((prev) => {
              const exists = prev.some((x: any) => pickNumber(x?.serviceid, x?.id) === srvId);
              if (exists) return prev;
              return [
                ...prev,
                { id: `sr-${srvId}`, nombre: name, precio: price, tipoId: srvTypeId ?? typeId },
              ];
            });
          }
        })
        .catch(() => {});
    }



    const techSet = new Set<number>();
    for (const id of nq.technicians || []) {
      if (technicians.some((t) => t.technicianid === id)) techSet.add(id);
    }
    if (Number.isFinite(nq.technicianid) && technicians.some((t) => t.technicianid === nq.technicianid)) {
      techSet.add(Number(nq.technicianid));
    }
    setSelectedTechnicians(Array.from(techSet));

    const v = Number.isFinite(Number(nq.viaticos)) ? Math.max(0, Math.round(Number(nq.viaticos))) : 0;
    setViaticosInput(String(v));

    const ds = coerceAllowedDateOrNext(nq.fechainicio || toLocalYMD(new Date()));
    const de = coerceAllowedDateOrNext(nq.fechafin || ds);

    const baseTs = coerceAllowedTime(String((nq.horainicio || "07:00")).slice(0, 5), "07:00");
    let baseTe = coerceAllowedTime(
      String((nq.horafin || "08:00")).slice(0, 5),
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

    const freeText = extractFreeTextFromDescription(nq.description || "");
    setDescripcion(freeText);
    setDireccion(String(nq.direccion || "").trim());

    const svcItems: ServiceLineItem[] = [];
    if (Array.isArray(nq.services) && nq.services.length) {
      for (const s of nq.services) {
        const rec = servicesCatalog.find((x) => x.serviceid === s.serviceid) || null;
        const nombre = rec?.name || `Servicio #${s.serviceid}`;
        const precio = Math.max(0, Math.round(Number(s.unitprice || 0)));
        const tid = rec?.typeofserviceid ?? typeId ?? 0;
        if (!tid) continue;
        svcItems.push({ id: uid(), nombre, precio, tipoId: tid });
      }
    }
    setServicios(svcItems);

    const matItems: MaterialLineItem[] = [];
    if (Array.isArray(nq.products) && nq.products.length) {
      const used = new Set<number>();
      for (const p of nq.products) {
        const pid = Number(p.productid);
        if (!Number.isFinite(pid) || pid <= 0) continue;
        if (used.has(pid)) continue;
        used.add(pid);
        const rec = productsCatalog.find((x) => x.productid === pid) || null;
        if (!rec) continue;
        const precio = p.unitprice != null ? Math.max(0, Math.round(Number(p.unitprice))) : rec.productpriceofsale ?? 0;
        const cantidad = Math.max(1, Math.round(Number(p.cantidad ?? 1)));
        matItems.push({ id: uid(), nombre: rec.productname, precio, cantidad });
      }
    }
    setMateriales(matItems);

    setSubmitAttempted(false);
    setErrors({});
    setTouched({});
    setQuoteAppliedKey(key);
    setCustomerQuery("");
    setCustomerOpen(false);
  }

  function getServiceRequestIdFromQuoteLike(q: any): number | null {
    if (!q) return null;
    return (
      pickNumber(
        q?.serviceRequest?.serviceRequestId,
        q?.serviceRequest?.id,
        q?.serviceRequestId,
        q?.servicerequestid,
        q?.servicerequestId
      ) ?? null
    );
  }

  function getQuoteIdFromSaleLike(sale: any): number | null {
    if (!sale) return null;
    const direct =
      pickNumber(
        sale?.quoteid,
        sale?.quoteId,
        sale?.quotesid,
        sale?.quotationid,
        sale?.cotizacionid,
        sale?.quote?.quotesid,
        sale?.quote?.quoteid,
        sale?.quotation?.quotesid
      ) ?? null;
    if (direct) return direct;

    const notes = String(sale?.notes ?? sale?.observation ?? "").trim();
    if (!notes) return null;
    const m =
      notes.match(/(?:quote|cotizacion)\s*#?\s*(\d+)/i) ||
      notes.match(/\bquoteid\b\s*[:=]\s*(\d+)/i) ||
      notes.match(/\bquotesid\b\s*[:=]\s*(\d+)/i);
    if (!m?.[1]) return null;
    const n = Number(m[1]);
    return Number.isFinite(n) && n > 0 ? n : null;
  }

  function productsSignatureFromNormalized(products: Array<{ productid: number; cantidad: number }> = []) {
    const normalized = products
      .map((p) => ({
        productid: Number(p.productid),
        cantidad: Math.max(1, Math.round(Number(p.cantidad || 1))),
      }))
      .filter((p) => Number.isFinite(p.productid) && p.productid > 0)
      .sort((a, b) => a.productid - b.productid || a.cantidad - b.cantidad);
    return normalized.map((p) => `${p.productid}:${p.cantidad}`).join("|");
  }

  function productsSignatureFromQuoteLike(quote: any) {
    const details = Array.isArray(quote?.details) ? quote.details : [];
    const items = details
      .map((d: any) => ({
        productid: Number(d?.productid),
        cantidad: Math.max(1, Math.round(Number(d?.quantity ?? d?.cantidad ?? 1))),
      }))
      .filter((p: any) => Number.isFinite(p.productid) && p.productid > 0);
    return productsSignatureFromNormalized(items as any);
  }

  async function getQuotesForLinking(): Promise<any[]> {
    if (quotesForLinkingRef.current) return quotesForLinkingRef.current;
    const { data } = await api.get("quotes");
    const list = Array.isArray(data)
      ? data
      : Array.isArray(data?.data)
      ? data.data
      : Array.isArray(data?.quotes)
      ? data.quotes
      : [];
    quotesForLinkingRef.current = list;
    return list;
  }

  async function resolveServiceRequestIdFromSale(rawSale: any, nq: QuoteNormalized): Promise<number | null> {
    const current = pickNumber(
      nq?.serviceRequestId,
      nq?.servicerequestid,
      rawSale?.serviceRequest?.serviceRequestId,
      rawSale?.serviceRequest?.id,
      rawSale?.serviceRequestId,
      rawSale?.servicerequestid
    );
    if (current) return current;

    const saleId = pickNumber(rawSale?.saleid, rawSale?.salesid, rawSale?.id);
    if (saleId && saleToServiceRequestCacheRef.current.has(saleId)) {
      return saleToServiceRequestCacheRef.current.get(saleId) ?? null;
    }

    const quoteId = getQuoteIdFromSaleLike(rawSale);
    if (quoteId) {
      try {
        const { data } = await api.get(`quotes/${quoteId}`);
        const sr = getServiceRequestIdFromQuoteLike(data);
        if (saleId) saleToServiceRequestCacheRef.current.set(saleId, sr ?? null);
        if (sr) return sr;
      } catch {}
    }

    try {
      const quotes = await getQuotesForLinking();
      if (!quotes.length) {
        if (saleId) saleToServiceRequestCacheRef.current.set(saleId, null);
        return null;
      }

      const saleClientId = pickNumber(rawSale?.customerid, rawSale?.clientid, nq?.clientid);
      const saleTotal = pickNumber(rawSale?.totalamount, rawSale?.total, rawSale?.grandtotal);
      const saleProductsSig = productsSignatureFromNormalized((nq?.products || []) as any);

      let best: any = null;
      let bestScore = -1;

      for (const q of quotes) {
        let score = 0;
        const qClientId = pickNumber(q?.customerid, q?.clientid, q?.customer?.customerid, q?.client?.clientid);
        if (saleClientId && qClientId && saleClientId === qClientId) score += 3;

        const qTotal = pickNumber(q?.total, q?.totalamount, q?.grandtotal);
        if (saleTotal != null && qTotal != null && Math.abs(Number(saleTotal) - Number(qTotal)) <= 1) score += 3;

        const qProductsSig = productsSignatureFromQuoteLike(q);
        if (saleProductsSig && qProductsSig && saleProductsSig === qProductsSig) score += 4;

        if (score > bestScore) {
          best = q;
          bestScore = score;
        }
      }

      const matched = bestScore >= 5 ? best : null;
      const sr = getServiceRequestIdFromQuoteLike(matched);
      if (saleId) saleToServiceRequestCacheRef.current.set(saleId, sr ?? null);
      return sr ?? null;
    } catch {
      if (saleId) saleToServiceRequestCacheRef.current.set(saleId, null);
      return null;
    }
  }

  useEffect(() => {
    if (lookupsLoading) return;
    if (!customers.length || !technicians.length || !productsCatalog.length || !serviceTypes.length) return;

    const keyFromUrl = quotesIdFromUrl
      ? `url:id:${quotesIdFromUrl}`
      : quoteDataParam
      ? `url:param:${String(quoteDataParam).slice(0, 32)}`
      : null;
    if (!keyFromUrl) return;
    if (quoteAppliedKey === keyFromUrl) return;

    let cancelled = false;

    async function run() {
      setQuoteApplyError(null);
      setQuoteLoadingApply(true);
      try {
        let raw: any = null;

        if (quotesIdFromUrl) {
          raw = quoteMapById.get(quotesIdFromUrl) ?? null;
          if (!raw) throw new Error(`No se encontro la venta #${quotesIdFromUrl} en /sales`);
        } else if (quoteDataParam) {
          raw = parseQuoteParam(String(quoteDataParam || ""));
          if (!raw) throw new Error("No se pudo leer la venta desde la URL.");
        }

        const nq = normalizeQuote(raw);
        const srId = await resolveServiceRequestIdFromSale(raw, nq);
        if (srId) {
          nq.serviceRequestId = srId;
          nq.servicerequestid = srId;
        }
        if (cancelled) return;

        applyNormalizedQuote(nq, keyFromUrl);
        if (quotesIdFromUrl) setSelectedQuotesId(quotesIdFromUrl);
      } catch (e: any) {
        const msg = e?.response?.data?.message || e?.message || "Error cargando venta.";
        setQuoteApplyError(String(msg));
        showError(String(msg));
      } finally {
        if (!cancelled) setQuoteLoadingApply(false);
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [
    lookupsLoading,
    customers,
    technicians,
    productsCatalog,
    serviceTypes,
    servicesCatalog,
    quotesIdFromUrl,
    quoteDataParam,
    quoteAppliedKey,
    quoteMapById,
  ]);

  useEffect(() => {
    if (!selectedQuotesId) return;
    if (lookupsLoading) return;
    if (!customers.length || !technicians.length || !productsCatalog.length || !serviceTypes.length) return;

    const id = Number(selectedQuotesId);
    if (!Number.isFinite(id) || id <= 0) return;

    const key = `select:id:${id}`;
    if (quoteAppliedKey === key) return;

    const raw = quoteMapById.get(id);
    if (!raw) {
      const msg = `La venta #${id} no esta disponible en el listado de ventas.`;
      setQuoteApplyError(msg);
      showError(msg);
      return;
    }

    let cancelled = false;
    async function run() {
      setQuoteApplyError(null);
      setQuoteLoadingApply(true);
      try {
        const nq = normalizeQuote(raw);
        const srId = await resolveServiceRequestIdFromSale(raw, nq);
        if (srId) {
          nq.serviceRequestId = srId;
          nq.servicerequestid = srId;
        }
        if (cancelled) return;
        applyNormalizedQuote(nq, key);
      } catch (e: any) {
        if (cancelled) return;
        const msg = e?.response?.data?.message || e?.message || "Error aplicando venta.";
        setQuoteApplyError(String(msg));
        showError(String(msg));
      } finally {
        if (!cancelled) setQuoteLoadingApply(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [
    selectedQuotesId,
    lookupsLoading,
    customers,
    technicians,
    productsCatalog,
    serviceTypes,
    servicesCatalog,
    quoteAppliedKey,
    quoteMapById,
  ]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (submitLockRef.current) return;
    if (saving || navigating) return;
    submitLockRef.current = true;

    setSubmitAttempted(true);
    setTouched({
      quote: true,
      clientId: true,
      tipo: true,
      schedule: true,
      technicians: true,
      viaticos: true,
      direccion: true,
      materiales: true,
      servicios: true,
    });

    const shouldCreateInlineClient = createClientInlineEnabled && !clientId;
    const erRaw = validateForm(validationContext);
    if (selectedBusyTechnicianIds.length > 0) {
      erRaw.technicians = "Hay tecnicos ocupados en ese horario.";
    }
    const er = shouldCreateInlineClient
      ? (Object.fromEntries(Object.entries(erRaw).filter(([k]) => k !== "clientId")) as Errors)
      : erRaw;
    setErrors(er);
    if (Object.keys(er).length > 0) {
      showWarning("Revisa los campos marcados en rojo.");
      focusFirstError(er);
      submitLockRef.current = false;
      return;
    }

    let finalClientId = Number(clientId);
    if (shouldCreateInlineClient) {
      const inlineErrs = validateCreateClientForm(createClientForm);
      setCreateClientErrors(inlineErrs);
      if (Object.keys(inlineErrs).length) {
        showWarning("Completa correctamente los datos del cliente nuevo.");
        submitLockRef.current = false;
        return;
      }

      try {
        finalClientId = await createClientFromInlineForm();
      } catch (e: any) {
        showError(e?.response?.data?.message || e?.message || "No se pudo crear el cliente.");
        submitLockRef.current = false;
        return;
      }
    }

    if (!Number.isFinite(finalClientId) || finalClientId <= 0) {
      showError("Selecciona un cliente valido.");
      submitLockRef.current = false;
      return;
    }

    const findProductRecord = (name: string) => {
      const normalizedName = normalizeText(name);
      if (!normalizedName) return null;
      return productsCatalog.find((p) => normalizeText(p.productname) === normalizedName) || null;
    };

    const productQtyById = new Map<number, number>();
    for (const m of materiales) {
      const rec = findProductRecord(m.nombre);
      if (!rec) {
        const next = { ...er, materiales: `El producto "${m.nombre}" no existe en la BD. Vuelve a seleccionarlo.` };
        setErrors(next);
        showError(next.materiales || "Producto invalido.");
        focusFirstError(next);
        submitLockRef.current = false;
        return;
      }
      const qty = Math.max(1, Math.round(Number(m.cantidad || 1)));
      productQtyById.set(rec.productid, (productQtyById.get(rec.productid) || 0) + qty);
    }

    const products = Array.from(productQtyById.entries()).map(([productid, cantidad]) => ({
      productid,
      cantidad,
    }));

    const serviceMap = new Map<string, { serviceid: number; cantidad: number; unitprice: number }>();
    for (const s of servicios) {
      const serviceName = normalizeText(s.nombre);
      const rec =
        servicesCatalog.find(
          (x) => normalizeText(x.name) === serviceName && x.typeofserviceid === s.tipoId
        ) || null;
      if (!rec) {
        const next = {
          ...er,
          servicios: `El servicio "${s.nombre}" no existe o no corresponde al tipo con el que fue agregado.`,
        };
        setErrors(next);
        showError(next.servicios || "Servicio invalido.");
        focusFirstError(next);
        submitLockRef.current = false;
        return;
      }
      const unitprice = Math.max(0, Math.round(Number(s.precio || 0)));
      const key = `${rec.serviceid}_${unitprice}`;
      const prev = serviceMap.get(key);
      if (prev) prev.cantidad += 1;
      else serviceMap.set(key, { serviceid: rec.serviceid, cantidad: 1, unitprice });
    }

    const services = Array.from(serviceMap.values());
    const finalDescription = String(descripcion || "").trim();
    const hasSchedule = !!(dateStart && dateEnd && timeStart && timeEnd);
    const stateid = hasSchedule ? scheduledStateId ?? pendingStateId ?? 1 : pendingStateId ?? 1;

    setSaving(true);
    try {
      const uploadedUrls = files.length ? await uploadFilesToCloudinary(files) : [];

      const dto: CreateOrdersServiceDto = {
        description: finalDescription,
        direccion: String(direccion || "").trim(),
        clientid: finalClientId,
        stateid,
        fechainicio: dateStart,
        fechafin: dateEnd,
        horainicio: timeStart,
        horafin: timeEnd,
        technicians: selectedTechnicians,
        products,
        services,
        files: uploadedUrls,
        viaticos: Number.isFinite(viaticosValue) ? viaticosValue : 0,
      };

      const created: any = await createOrderService(dto);

      try {
        if (typeof window !== "undefined") {
          const createdId = Number(
            created?.ordersservicesid ??
              created?.id ??
              created?.data?.ordersservicesid ??
              created?.data?.id
          );
          const message = Number.isFinite(createdId) && createdId > 0 ? `Orden #${createdId} creada correctamente.` : "Orden creada correctamente.";
          sessionStorage.setItem("flash_toast", JSON.stringify({ type: "success", message }));
        }
      } catch {}
setNavigating(true);

      if (returnTo === pathname) {
        setNavigating(false);
        setSaving(false);
        submitLockRef.current = false;
        router.refresh();
        return;
      }

      router.push(returnTo);
      return;
    } catch (e: any) {
      showError(e?.response?.data?.message || e?.message || "Error inesperado.");
      setNavigating(false);
      setSaving(false);
      submitLockRef.current = false;
    }
  }

  function handleDateStartChange(next: string) {
    setDateStart(next);
    if (errors.schedule) setErrors((p) => ({ ...p, schedule: undefined }));
  }

  function handleDateEndChange(next: string) {
    setDateEnd(next);
    if (errors.schedule) setErrors((p) => ({ ...p, schedule: undefined }));
  }

  function handleTimeStartChange(next: string) {
    setTimeStart(next);
    if (errors.schedule) setErrors((p) => ({ ...p, schedule: undefined }));
  }

  function handleTimeEndChange(next: string) {
    setTimeEnd(next);
    if (errors.schedule) setErrors((p) => ({ ...p, schedule: undefined }));
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
                disabled={saving || navigating}
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="order-form"
                className="h-10 rounded-md bg-red-700 px-4 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-60"
                disabled={saving || navigating || lookupsLoading}
              >
                {saving ? (navigating ? "Redirigiendo..." : "Guardando...") : "Guardar"}
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
  const showPrefillBanner = !!quoteAppliedKey;

  return (
    <RequireAuth>
      <div className="relative" style={{ paddingLeft: isDesktop ? sidebarW : 0 }}>
        <main className="min-h-[100dvh] bg-gray-100 pb-36 md:pb-40">
          <div className="px-4 pt-4 max-w-7xl w-full mx-auto">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h1 className="text-xl font-semibold text-gray-900 truncate">Crear orden de servicio</h1>
                <p className="text-xs text-gray-500 mt-1">Completa el cliente, programacion y detalles del servicio.</p>
              </div>
            </div>

            <section className="mb-4 rounded-xl border bg-white shadow-sm" id="field-quote">
              <header className="border-b px-4 py-3 flex items-center justify-between">
                <div className="text-sm font-semibold text-gray-800">Venta (opcional)</div>
                <div className="text-xs text-gray-500">
                  {quotesLoading ? "Cargando..." : quoteOptions.length ? `${quoteOptions.length} disponibles` : "-"}
                </div>
              </header>

              <div className="p-4 grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-9">
                  {selectedQuoteOption && (
                    <div className="mb-2 flex items-center justify-between gap-2 rounded-lg border bg-gray-50 px-3 py-2">
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">{selectedQuoteOption.label}</div>
                        <div className="text-xs text-gray-500">{`Venta #${selectedQuoteOption.id}`}</div>
                      </div>
                      <button
                        type="button"
                        onClick={clearQuoteSelection}
                        className="h-8 px-2.5 rounded-md border bg-white text-xs hover:bg-gray-50 disabled:opacity-60"
                        disabled={quotesLoading || lookupsLoading || saving || navigating}
                      >
                        Quitar
                      </button>
                    </div>
                  )}

                  <div ref={quoteBoxRef} className="relative">
                    <label className="block text-xs text-gray-700 mb-1" htmlFor="field-quote-search">
                      Buscar y seleccionar venta para precargar
                    </label>
                    <input
                      id="field-quote-search"
                      ref={quoteInputRef}
                      value={quoteQuery}
                      onChange={(e) => {
                        setQuoteQuery(e.target.value);
                        setQuoteOpen(true);
                        if (errors.quote) setErrors((p) => ({ ...p, quote: undefined }));
                      }}
                      onFocus={() => setQuoteOpen(true)}
                      onBlur={() => runBlurValidation("quote")}
                      onKeyDown={(e) => {
                        if (!quoteOpen) return;
                        if (e.key === "ArrowDown") {
                          e.preventDefault();
                          setQuoteActiveIndex((i) => Math.min(i + 1, Math.max(0, quoteSearchOptions.length - 1)));
                        } else if (e.key === "ArrowUp") {
                          e.preventDefault();
                          setQuoteActiveIndex((i) => Math.max(i - 1, 0));
                        } else if (e.key === "Enter") {
                          if (quoteSearchOptions[quoteActiveIndex]) {
                            e.preventDefault();
                            pickQuote(quoteSearchOptions[quoteActiveIndex].id);
                          }
                        } else if (e.key === "Escape") {
                          setQuoteOpen(false);
                        }
                      }}
                      placeholder={
                        quotesLoading ? "Cargando ventas..." : quoteOptions.length ? "Codigo, cliente o #ID..." : "No hay ventas"
                      }
                      className={`${inputBase} ${showFieldError("quote") ? errorRing : ""}`}
                      disabled={quotesLoading || lookupsLoading || quoteOptions.length === 0 || saving || navigating}
                      aria-invalid={showFieldError("quote")}
                      aria-expanded={quoteOpen}
                      aria-controls="quote-suggest"
                      aria-autocomplete="list"
                    />

                    {quoteOpen && !quotesLoading && !lookupsLoading && !(saving || navigating) && (
                      <div id="quote-suggest" className="absolute z-20 mt-2 w-full overflow-hidden rounded-lg border bg-white shadow-sm">
                        {quoteSearchOptions.length === 0 ? (
                          <div className="px-3 py-2 text-xs text-gray-500">No hay coincidencias.</div>
                        ) : (
                          <ul className="max-h-60 overflow-auto">
                            {quoteSearchOptions.map((q, idx) => (
                              <li key={q.id}>
                                <button
                                  type="button"
                                  onMouseDown={(ev) => ev.preventDefault()}
                                  onClick={() => pickQuote(q.id)}
                                  onMouseEnter={() => setQuoteActiveIndex(idx)}
                                  className={`w-full px-3 py-2 text-left text-sm ${idx === quoteActiveIndex ? "bg-gray-100" : "bg-white"}`}
                                >
                                  <span className="block truncate font-medium">{q.label}</span>
                                  <span className="block text-xs text-gray-500">{`Venta #${q.id}`}</span>
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>
                  {quotesError && <p className={errorText}>{quotesError}</p>}
                  {quoteApplyError && <p className={errorText}>{quoteApplyError}</p>}
                  {quoteLoadingApply && <div className="mt-2 text-xs text-gray-500">Aplicando venta al formulario...</div>}
                  {showPrefillBanner && !quoteLoadingApply && <div className="mt-2 text-xs text-emerald-700">Venta aplicada al formulario.</div>}
                </div>

                <div className="md:col-span-3">
                  <label className="block text-xs mb-1 opacity-0 select-none">Accion</label>
                  <button
                    type="button"
                    onClick={resetPrefill}
                    className="w-full h-10 rounded-md border bg-white text-sm hover:bg-gray-50 disabled:opacity-60"
                    disabled={saving || navigating || lookupsLoading}
                  >
                    Limpiar formulario
                  </button>
                </div>
              </div>
            </section>

            {submitAttempted && hasErrors && (
              <div ref={summaryRef} className="mb-4 rounded-md border border-red-300 bg-red-50 text-red-800 p-3 text-sm">
                <strong className="block mb-1">Hay errores en el formulario:</strong>
                <ul className="list-disc pl-5 space-y-1">
                  {errors.quote && <li>{errors.quote}</li>}
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
                    <div className="flex items-center gap-3">
                      <div className="text-xs text-gray-500">{customers.length ? `${customers.length} disponibles` : "-"}</div>
                      {!clientLockedByQuote && (
                        <label className="inline-flex items-center gap-1.5 text-xs text-gray-700">
                          <input
                            type="checkbox"
                            checked={createClientInlineEnabled}
                            onChange={async (e) => {
                              if (clientLockedByQuote) return;
                              const checked = e.target.checked;
                              setCreateClientInlineEnabled(checked);
                              if (checked) {
                                setClientIdBeforeInlineCreate(clientId);
                                clearCustomer();
                                setErrors((p) => ({ ...p, clientId: undefined }));
                                await ensureCreateClientLookups();
                              } else {
                                resetCreateClientForm();
                                const previousId = Number(clientIdBeforeInlineCreate);
                                if (
                                  !clientId &&
                                  Number.isFinite(previousId) &&
                                  previousId > 0 &&
                                  customers.some((c) => c.customerid === previousId)
                                ) {
                                  setClientId(previousId as any);
                                  setErrors((p) => ({ ...p, clientId: undefined }));
                                }
                                setClientIdBeforeInlineCreate("");
                              }
                            }}
                            className="h-3.5 w-3.5 rounded border-gray-300 accent-red-700"
                            disabled={saving || navigating || lookupsLoading || createClientLoading || clientLockedByQuote}
                          />
                          Crear cliente
                        </label>
                      )}
                    </div>
                  </header>

                  <div className="p-4 grid grid-cols-1 gap-3" id="field-clientId">
                    <div className={`rounded-lg border bg-gray-50 p-3 ${showFieldError("clientId") ? errorRing : ""}`}>
                      {createClientInlineEnabled ? (
                        <div className="text-xs text-gray-500">
                          Se creara un cliente nuevo al guardar la orden.
                        </div>
                      ) : !selectedCustomer ? (
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
                            onClick={() => {
                              if (clientLockedByQuote) return;
                              clearCustomer();
                            }}
                            className="h-9 px-3 rounded-md border bg-white text-xs hover:bg-gray-50 disabled:opacity-60"
                            aria-label="Quitar cliente"
                            title="Quitar"
                            disabled={lookupsLoading || saving || navigating || clientLockedByQuote}
                          >
                            Quitar
                          </button>
                        </div>
                      )}
                    </div>

                    {!createClientInlineEnabled && !clientLockedByQuote && (
                      <div ref={customerBoxRef} className="relative">
                        <label className="block text-xs text-gray-700 mb-1" htmlFor="field-customer-search">
                          Buscar y seleccionar cliente
                        </label>
                        <input
                          id="field-customer-search"
                          ref={customerInputRef}
                          value={customerQuery}
                          onChange={(e) => {
                            setCustomerQuery(e.target.value);
                            setCustomerOpen(true);
                            if (errors.clientId) setErrors((p) => ({ ...p, clientId: undefined }));
                          }}
                          onFocus={() => setCustomerOpen(true)}
                          onBlur={() => runBlurValidation("clientId")}
                          onKeyDown={(e) => {
                            if (!customerOpen) return;
                            if (e.key === "ArrowDown") {
                              e.preventDefault();
                              setCustomerActiveIndex((i) => Math.min(i + 1, Math.max(0, customerOptions.length - 1)));
                            } else if (e.key === "ArrowUp") {
                              e.preventDefault();
                              setCustomerActiveIndex((i) => Math.max(i - 1, 0));
                            } else if (e.key === "Enter") {
                              if (customerOptions[customerActiveIndex]) {
                                e.preventDefault();
                                pickCustomer(customerOptions[customerActiveIndex].customerid);
                              }
                            } else if (e.key === "Escape") {
                              setCustomerOpen(false);
                            }
                          }}
                          placeholder="Nombre, apellido o ID..."
                          className={`${inputBase} ${showFieldError("clientId") ? errorRing : ""}`}
                          disabled={lookupsLoading || saving || navigating || createClientLoading || clientLockedByQuote}
                          aria-expanded={customerOpen}
                          aria-controls="customer-suggest"
                          aria-autocomplete="list"
                        />

                        {customerOpen && !lookupsLoading && !(saving || navigating) && (
                          <div id="customer-suggest" className="absolute z-20 mt-2 w-full overflow-hidden rounded-lg border bg-white shadow-sm">
                            {customerOptions.length === 0 ? (
                              <div className="px-3 py-2 text-xs text-gray-500">No hay coincidencias.</div>
                            ) : (
                              <ul className="max-h-60 overflow-auto">
                                {customerOptions.map((c, idx) => (
                                  <li key={c.customerid}>
                                    <button
                                      type="button"
                                      onMouseDown={(ev) => ev.preventDefault()}
                                      onClick={() => pickCustomer(c.customerid)}
                                      onMouseEnter={() => setCustomerActiveIndex(idx)}
                                      className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 ${
                                        idx === customerActiveIndex ? "bg-gray-100" : "bg-white"
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
                    )}

                    {clientLockedByQuote && (
                      <p className="text-xs text-gray-500">Cliente bloqueado por la venta seleccionada. Quita la venta para cambiarlo.</p>
                    )}

                    {createClientInlineEnabled && (
                      <>
                        {createClientBootstrapping ? (
                          <div className="text-xs text-gray-500">Cargando tipos de documento...</div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 rounded-lg border bg-gray-50 p-3">
                            <div>
                              <label className="mb-1 block text-xs font-medium text-gray-900">Nombre</label>
                              <input
                                value={createClientForm.name}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  setCreateClientForm((prev) => ({ ...prev, name: value }));
                                  if (createClientErrors.name) setCreateClientErrors((prev) => ({ ...prev, name: undefined }));
                                }}
                                className={`w-full rounded-lg border bg-white h-10 px-3 text-sm ${createClientErrors.name ? "border-red-500" : "border-gray-300"}`}
                                placeholder="Nombres"
                                disabled={createClientLoading || saving || navigating}
                              />
                              {createClientErrors.name && <p className="mt-1 text-xs text-red-600">{createClientErrors.name}</p>}
                            </div>

                            <div>
                              <label className="mb-1 block text-xs font-medium text-gray-900">Apellido</label>
                              <input
                                value={createClientForm.lastname}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  setCreateClientForm((prev) => ({ ...prev, lastname: value }));
                                  if (createClientErrors.lastname) setCreateClientErrors((prev) => ({ ...prev, lastname: undefined }));
                                }}
                                className={`w-full rounded-lg border bg-white h-10 px-3 text-sm ${createClientErrors.lastname ? "border-red-500" : "border-gray-300"}`}
                                placeholder="Apellidos"
                                disabled={createClientLoading || saving || navigating}
                              />
                              {createClientErrors.lastname && <p className="mt-1 text-xs text-red-600">{createClientErrors.lastname}</p>}
                            </div>

                            <div>
                              <label className="mb-1 block text-xs font-medium text-gray-900">Correo</label>
                              <input
                                type="email"
                                value={createClientForm.email}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  setCreateClientForm((prev) => ({ ...prev, email: value }));
                                  if (createClientErrors.email) setCreateClientErrors((prev) => ({ ...prev, email: undefined }));
                                }}
                                className={`w-full rounded-lg border bg-white h-10 px-3 text-sm ${createClientErrors.email ? "border-red-500" : "border-gray-300"}`}
                                placeholder="correo@dominio.com"
                                disabled={createClientLoading || saving || navigating}
                              />
                              {createClientErrors.email && <p className="mt-1 text-xs text-red-600">{createClientErrors.email}</p>}
                            </div>

                            <div>
                              <label className="mb-1 block text-xs font-medium text-gray-900">Telefono</label>
                              <input
                                value={createClientForm.phone}
                                onChange={(e) => {
                                  const value = e.target.value.replace(/[^\d]/g, "");
                                  setCreateClientForm((prev) => ({ ...prev, phone: value }));
                                  if (createClientErrors.phone) setCreateClientErrors((prev) => ({ ...prev, phone: undefined }));
                                }}
                                className={`w-full rounded-lg border bg-white h-10 px-3 text-sm ${createClientErrors.phone ? "border-red-500" : "border-gray-300"}`}
                                placeholder="Solo numeros"
                                disabled={createClientLoading || saving || navigating}
                              />
                              {createClientErrors.phone && <p className="mt-1 text-xs text-red-600">{createClientErrors.phone}</p>}
                            </div>

                            <div>
                              <label className="mb-1 block text-xs font-medium text-gray-900">Tipo de documento</label>
                              <select
                                value={createClientForm.typeid}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  setCreateClientForm((prev) => ({ ...prev, typeid: value }));
                                  if (createClientErrors.typeid) setCreateClientErrors((prev) => ({ ...prev, typeid: undefined }));
                                }}
                                className={`w-full rounded-lg border bg-white h-10 px-3 text-sm ${createClientErrors.typeid ? "border-red-500" : "border-gray-300"}`}
                                disabled={createClientLoading || saving || navigating}
                              >
                                <option value="">Selecciona...</option>
                                {createClientDocTypes.map((d) => (
                                  <option key={d.id} value={String(d.id)}>
                                    {d.name}
                                  </option>
                                ))}
                              </select>
                              {createClientErrors.typeid && <p className="mt-1 text-xs text-red-600">{createClientErrors.typeid}</p>}
                            </div>

                            <div>
                              <label className="mb-1 block text-xs font-medium text-gray-900">Numero de documento</label>
                              <input
                                value={createClientForm.documentnumber}
                                onChange={(e) => {
                                  const value = e.target.value.replace(/[^\d]/g, "");
                                  setCreateClientForm((prev) => ({ ...prev, documentnumber: value }));
                                  if (createClientErrors.documentnumber) setCreateClientErrors((prev) => ({ ...prev, documentnumber: undefined }));
                                }}
                                className={`w-full rounded-lg border bg-white h-10 px-3 text-sm ${createClientErrors.documentnumber ? "border-red-500" : "border-gray-300"}`}
                                placeholder="Solo numeros"
                                disabled={createClientLoading || saving || navigating}
                              />
                              {createClientErrors.documentnumber && <p className="mt-1 text-xs text-red-600">{createClientErrors.documentnumber}</p>}
                            </div>

                            <div>
                              <label className="mb-1 block text-xs font-medium text-gray-900">Ciudad</label>
                              <input
                                value={createClientForm.customercity}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  setCreateClientForm((prev) => ({ ...prev, customercity: value }));
                                  if (createClientErrors.customercity) setCreateClientErrors((prev) => ({ ...prev, customercity: undefined }));
                                }}
                                className={`w-full rounded-lg border bg-white h-10 px-3 text-sm ${createClientErrors.customercity ? "border-red-500" : "border-gray-300"}`}
                                placeholder="Ciudad (opcional)"
                                disabled={createClientLoading || saving || navigating}
                              />
                              {createClientErrors.customercity && <p className="mt-1 text-xs text-red-600">{createClientErrors.customercity}</p>}
                            </div>

                            <div>
                              <label className="mb-1 block text-xs font-medium text-gray-900">Codigo postal</label>
                              <input
                                value={createClientForm.customerzipcode}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  setCreateClientForm((prev) => ({ ...prev, customerzipcode: value }));
                                  if (createClientErrors.customerzipcode) setCreateClientErrors((prev) => ({ ...prev, customerzipcode: undefined }));
                                }}
                                className={`w-full rounded-lg border bg-white h-10 px-3 text-sm ${createClientErrors.customerzipcode ? "border-red-500" : "border-gray-300"}`}
                                placeholder="Opcional"
                                disabled={createClientLoading || saving || navigating}
                              />
                              {createClientErrors.customerzipcode && (
                                <p className="mt-1 text-xs text-red-600">{createClientErrors.customerzipcode}</p>
                              )}
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {showFieldError("clientId") && errors.clientId && <p className={errorText}>{errors.clientId}</p>}
                  </div>
                </section>

                <section className="rounded-xl border bg-white shadow-sm">
                  <header className="border-b px-3 py-2 flex items-center justify-between">
                    <div className="text-sm font-semibold text-gray-800">Programacion</div>
                    <div className="text-xs text-gray-500">Lun-Sab - 07:00-17:00</div>
                  </header>

                  <div className="p-4 grid grid-cols-1 md:grid-cols-12 gap-4" id="field-schedule">
                    <div className="md:col-span-3">
                      <label className="block text-xs text-gray-700 mb-1" htmlFor="field-dateStart">
                        Fecha inicio
                      </label>
                      <input
                        id="field-dateStart"
                        type="date"
                        value={dateStart}
                        onChange={(e) => handleDateStartChange(e.target.value)}
                        onBlur={() => runBlurValidation("schedule")}
                        className={`${inputBase} ${showFieldError("schedule") ? errorRing : ""}`}
                        disabled={saving || navigating}
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
                        onBlur={() => runBlurValidation("schedule")}
                        className={`${inputBase} ${showFieldError("schedule") ? errorRing : ""}`}
                        disabled={saving || navigating}
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
                        onBlur={() => runBlurValidation("schedule")}
                        className={`${inputBase} ${showFieldError("schedule") ? errorRing : ""}`}
                        disabled={saving || navigating}
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
                        onBlur={() => runBlurValidation("schedule")}
                        className={`${inputBase} ${showFieldError("schedule") ? errorRing : ""}`}
                        disabled={saving || navigating}
                      />
                    </div>

                    {showFieldError("schedule") && errors.schedule && (
                      <div className="md:col-span-12">
                        <p className={errorText}>{errors.schedule}</p>
                      </div>
                    )}
                  </div>
                </section>

                <section className="rounded-xl border bg-white shadow-sm" id="field-technicians">
                  <header className="border-b px-4 py-3 flex items-center justify-between">
                    <div className="text-sm font-semibold text-gray-800">Tecnicos</div>
                    <div className="flex items-center gap-2">
                      <div className="text-xs text-gray-500">
                        Seleccionados: <span className="font-semibold text-gray-900">{selectedTechnicians.length}</span>
                      </div>
                      <button
                        type="button"
                        onClick={clearTechnicians}
                        className="h-8 rounded-md border bg-white px-3 text-xs hover:bg-gray-50 disabled:opacity-60"
                        disabled={lookupsLoading || selectedTechnicians.length === 0 || saving || navigating}
                      >
                        Limpiar
                      </button>
                    </div>
                  </header>

                  <div className="p-4 grid grid-cols-1 gap-3">
                    <div className={`rounded-lg border bg-gray-50 p-3 ${showFieldError("technicians") ? errorRing : ""}`}>
                      {selectedTechniciansFull.length === 0 ? (
                        <div className="text-xs text-gray-500">No has seleccionado tecnicos.</div>
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
                                #{t.technicianid} - {t.label}
                              </span>
                              <button
                                type="button"
                                onClick={() => removeTechnician(t.technicianid)}
                                className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full hover:bg-gray-200"
                                aria-label="Quitar tecnico"
                                title="Quitar"
                                disabled={lookupsLoading || saving || navigating}
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
                        Buscar y agregar tecnico
                      </label>
                      <input
                        id="field-tech-search"
                        ref={techInputRef}
                        value={techQuery}
                        onChange={(e) => {
                          setTechQuery(e.target.value);
                          setTechOpen(true);
                          if (errors.technicians) setErrors((p) => ({ ...p, technicians: undefined }));
                        }}
                        onFocus={() => setTechOpen(true)}
                        onBlur={() => runBlurValidation("technicians")}
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
                        className={`${inputBase} ${showFieldError("technicians") ? errorRing : ""}`}
                        disabled={lookupsLoading || saving || navigating}
                        aria-expanded={techOpen}
                        aria-controls="tech-suggest"
                        aria-autocomplete="list"
                      />

                      {techOpen && !lookupsLoading && !(saving || navigating) && (
                        <div id="tech-suggest" className="absolute z-20 mt-2 w-full overflow-hidden rounded-lg border bg-white shadow-sm">
                          {techOptions.length === 0 ? (
                            <div className="px-3 py-2 text-xs text-gray-500">
                              {selectedTechnicians.length === availableTechnicians.length ? "Ya seleccionaste todos los tecnicos." : "No hay coincidencias."}
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
                                      <span className="block text-xs text-gray-500">Tecnico #{t.technicianid}</span>
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

                    {showFieldError("technicians") && errors.technicians && <p className={errorText}>{errors.technicians}</p>}
                  </div>
                </section>

                <section
                  className="rounded-xl border bg-white shadow-sm"
                  id="field-tipo"
                  onBlurCapture={(e) => {
                    const next = e.relatedTarget as Node | null;
                    if (next && (e.currentTarget as HTMLElement).contains(next)) return;
                    runBlurValidation("tipo");
                    runBlurValidation("servicios");
                  }}
                >
                  <header className="border-b px-4 py-3 flex items-center justify-between">
                    <div className="text-sm font-semibold text-gray-800">Detalles del servicio</div>
                    <div className="text-xs text-gray-500">Tipo, servicios, descripcion e imagenes</div>
                  </header>

                  <div className="p-4 grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="md:col-span-12">
                      <span className="block text-xs text-gray-700 mb-2">Tipo de servicio</span>
                      <div
                        className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 ${
                          showFieldError("tipo") ? "rounded-lg p-3 border " + errorRing : ""
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
                                onBlur={() => runBlurValidation("tipo")}
                                className="h-4 w-4"
                                disabled={saving || navigating || lookupsLoading}
                              />
                              <span className="text-sm font-medium text-gray-900">{t.label}</span>
                            </label>
                          ))
                        )}
                      </div>
                      {showFieldError("tipo") && errors.tipo && <p className={errorText}>{errors.tipo}</p>}
                    </div>

                    <div className="md:col-span-12" id="field-servicios">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div>
                          <div className="text-xs text-gray-700">Servicios</div>
                          <div className="text-xs text-gray-500">Agrega los servicios a realizar. La cantidad es 1 fija.</div>
                        </div>
                        <button
                          type="button"
                          onClick={addServiceRow}
                          className="h-8 rounded-md border bg-white px-3 text-xs hover:bg-gray-50 disabled:opacity-60"
                          disabled={!tipoId || lookupsLoading || saving || navigating || serviceOptionsForRow(tipoId, "").length === 0}
                        >
                          Anadir servicio
                        </button>
                      </div>

                      <div className={`rounded-lg border overflow-hidden bg-white ${showFieldError("servicios") ? errorRing : ""}`}>
                        <table className="w-full text-xs md:text-sm">
                          <thead className="bg-gray-50">
                            <tr className="text-gray-700">
                              <th className="px-3 py-2 text-left">Servicio</th>
                              <th className="px-3 py-2 text-right w-32">Precio</th>
                              <th className="px-3 py-2 w-10"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {servicios.map((it) => {
                              const opts = serviceOptionsForRow(it.tipoId, it.nombre);
                              const hasCurrent = it.nombre && getServicesForTipo(it.tipoId).some((o) => o.name === it.nombre);
                              const safeOpts = hasCurrent ? [{ serviceid: -1, name: it.nombre, typeofserviceid: it.tipoId } as any, ...opts] : opts;

                              return (
                                <tr key={it.id} className="border-t">
                                  <td className="px-3 py-2">
                                    <select
                                      value={it.nombre}
                                      onChange={(e) => {
                                        const n = e.target.value;
                                        patchItem<ServiceLineItem>(it.id, { nombre: n }, setServicios);
                                        if (errors.servicios) setErrors((prev) => ({ ...prev, servicios: undefined }));
                                      }}
                                      onBlur={() => runBlurValidation("servicios")}
                                      className="w-full h-9 rounded-md border px-2"
                                      disabled={lookupsLoading || saving || navigating || safeOpts.length === 0}
                                    >
                                      {safeOpts.map((opt: any, idx: number) => (
                                        <option key={`${it.id}-${opt.serviceid}-${idx}`} value={opt.name}>
                                          {opt.name}
                                        </option>
                                      ))}
                                    </select>
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
                                        if (errors.servicios) setErrors((prev) => ({ ...prev, servicios: undefined }));
                                      }}
                                      onBlur={() => runBlurValidation("servicios")}
                                      className="h-9 w-32 rounded-md border px-2 text-right"
                                      disabled={lookupsLoading || saving || navigating}
                                    />
                                  </td>

                                  <td className="px-3 py-2 text-right">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        removeItem<ServiceLineItem>(it.id, setServicios);
                                        setErrors((p) => ({ ...p, servicios: undefined }));
                                      }}
                                      className="h-9 w-9 rounded-md hover:bg-gray-100"
                                      disabled={lookupsLoading || saving || navigating}
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
                                <td colSpan={3} className="px-3 py-6 text-center text-gray-500">
                                  {tipoId ? "Aun no has anadido servicios." : "Selecciona primero el tipo de servicio."}
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>

                      {showFieldError("servicios") && errors.servicios && <p className={errorText}>{errors.servicios}</p>}
                    </div>

                    <div className="md:col-span-12" id="field-direccion">
                      <label className="block text-xs text-gray-700 mb-1" htmlFor="field-direccion">
                        Direccion del servicio
                      </label>
                      <input
                        id="field-direccion"
                        type="text"
                        value={direccion}
                        onChange={(e) => {
                          setDireccion(e.target.value);
                          if (errors.direccion) setErrors((p) => ({ ...p, direccion: undefined }));
                        }}
                        onBlur={() => runBlurValidation("direccion")}
                        className={`${inputBase} ${showFieldError("direccion") ? errorRing : ""}`}
                        placeholder="Ej: Calle 123 #45-67, Barrio..."
                        disabled={saving || navigating}
                      />
                      {showFieldError("direccion") && errors.direccion && <p className={errorText}>{errors.direccion}</p>}
                    </div>

                    <div className="md:col-span-12" id="field-description">
                      <label className="block text-xs text-gray-700 mb-1" htmlFor="field-desc">
                        Descripcion
                      </label>
                      <textarea
                        id="field-desc"
                        value={descripcion}
                        onChange={(e) => {
                          const v = e.target.value;
                          setDescripcion(v);
                          setErrors((p) => ({ ...p, description: validateDescription(v) }));
                        }}
                        onBlur={() => {
                          setErrors((p) => ({ ...p, description: validateDescription(descripcion) }));
                        }}
                        rows={3}
                        className={`w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-200 ${
                          errors.description ? errorRing : ""
                        }`}
                        placeholder="Describe el servicio, alcance, observaciones, etc."
                        disabled={saving || navigating}
                      />
                      {errors.description && <p className={errorText}>{errors.description}</p>}
                      <div className="mt-1 flex items-center justify-between text-[11px] text-gray-500">
                        <span>{`Opcional / Maximo ${DESC_MAX}`}</span>
                        <span className={String(descripcion || "").trim().length > DESC_MAX ? "text-red-600" : ""}>
                          {String(descripcion || "").trim().length}/{DESC_MAX}
                        </span>
                      </div>
                    </div>

                    <div className="md:col-span-12" id="field-files">
                      <div className="flex items-center justify-between gap-2">
                        <label className="block text-xs text-gray-700">Imagenes del servicio</label>
                        <button
                          type="button"
                          onClick={() => fileRef.current?.click()}
                          className="h-8 px-3 rounded-md border bg-white text-xs hover:bg-gray-50 disabled:opacity-60"
                          title="Subir imagenes"
                          disabled={lookupsLoading || saving || navigating}
                        >
                          Subir imagenes
                        </button>
                        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />
                      </div>

                      <div className="mt-1 text-xs text-gray-500">{files.length ? `${files.length} seleccionadas` : "Ninguna seleccionada"}</div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {files.length === 0 ? (
                          <div className="text-xs text-gray-500">No hay imagenes aun.</div>
                        ) : (
                          files.map((f, idx) => (
                            <div key={`${f.name}_${f.lastModified}_${idx}`} className="relative w-20 h-20 rounded-lg overflow-hidden border bg-white">
                              <img src={previews[idx]} alt={f.name} className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => removeFile(f)}
                                className="absolute top-1 right-1 bg-white/90 hover:bg-white text-xs rounded-full px-1"
                                aria-label="Quitar imagen"
                                title="Quitar"
                                disabled={lookupsLoading || saving || navigating}
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
                <section
                  className="rounded-xl border bg-white shadow-sm"
                  id="field-materiales"
                  onBlurCapture={(e) => {
                    const next = e.relatedTarget as Node | null;
                    if (next && (e.currentTarget as HTMLElement).contains(next)) return;
                    runBlurValidation("materiales");
                  }}
                >
                  <header className="border-b px-3 py-2 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold text-gray-800">Productos (Materiales)</div>
                      <div className="text-xs text-gray-500">Agrega los materiales consumidos. Puedes ajustar la cantidad.</div>
                    </div>
                    <div className="text-xs text-gray-500">Subtotal: {formatCOP(subtotalMateriales)}</div>
                  </header>

                  <div className="p-3">
                    <div className={`rounded-lg border bg-white p-2.5 space-y-2 ${showFieldError("materiales") ? errorRing : ""}`}>
                      {materiales.length === 0 ? (
                        <div className="rounded-md border border-dashed px-3 py-4 text-center text-xs text-gray-500">
                          Aun no has anadido productos.
                        </div>
                      ) : (
                        materiales.map((m) => {
                          const rowMaterialOptions = materialOptionsForRow(m.nombre, m.nombre);
                          return (
                            <div key={m.id} className="rounded-md border bg-gray-50 p-2 space-y-1.5">
                              <label className="block text-[10px] text-gray-600">Producto</label>
                              <div
                                className="relative"
                                onBlurCapture={(e) => {
                                  const next = e.relatedTarget as Node | null;
                                  if (next && (e.currentTarget as HTMLElement).contains(next)) return;
                                  const match = findProductByName(m.nombre);
                                  if (match && isProductAlreadyAdded(m.id, match.productname)) {
                                    showWarning(`El producto "${match.productname}" ya esta agregado.`);
                                    patchItem<MaterialLineItem>(m.id, { nombre: "", precio: 0 }, setMateriales);
                                    setMaterialOpenId((curr) => (curr === m.id ? null : curr));
                                    runBlurValidation("materiales");
                                    return;
                                  }
                                  patchItem<MaterialLineItem>(
                                    m.id,
                                    {
                                      nombre: match?.productname ?? String(m.nombre || "").trim(),
                                      precio: match?.productpriceofsale ?? 0,
                                    },
                                    setMateriales
                                  );
                                  setMaterialOpenId((curr) => (curr === m.id ? null : curr));
                                  runBlurValidation("materiales");
                                }}
                              >
                                <input
                                  type="text"
                                  value={m.nombre}
                                  onFocus={() => setMaterialOpenId(m.id)}
                                  onChange={(e) => {
                                    const n = e.target.value;
                                    patchItem<MaterialLineItem>(m.id, { nombre: n }, setMateriales);
                                    setMaterialOpenId(m.id);
                                    if (errors.materiales) setErrors((prev) => ({ ...prev, materiales: undefined }));
                                  }}
                                  className="w-full h-9 rounded-md border bg-white px-2.5 pr-8 text-xs"
                                  placeholder="Buscar producto por nombre"
                                  disabled={!productsCatalog.length || lookupsLoading || saving || navigating}
                                />
                                <button
                                  type="button"
                                  onClick={() => setMaterialOpenId((curr) => (curr === m.id ? null : m.id))}
                                  className="absolute inset-y-0 right-0 px-2 text-gray-500"
                                  title="Mostrar productos"
                                  aria-label="Mostrar productos"
                                  disabled={!productsCatalog.length || lookupsLoading || saving || navigating}
                                >
                                  v
                                </button>

                                {materialOpenId === m.id && (
                                  <div className="absolute left-0 right-0 z-30 mt-1 max-h-44 overflow-auto rounded-md border bg-white shadow-lg">
                                    {rowMaterialOptions.length === 0 ? (
                                      <div className="px-3 py-2 text-xs text-gray-500">No hay productos disponibles.</div>
                                    ) : (
                                      rowMaterialOptions.map((opt) => (
                                        <button
                                          key={opt.productid}
                                          type="button"
                                          onMouseDown={(e) => e.preventDefault()}
                                          onClick={() => selectMaterialForRow(m.id, opt)}
                                          className="w-full border-b border-gray-100 px-2.5 py-1.5 text-left last:border-b-0 hover:bg-gray-50"
                                        >
                                          <span className="block truncate text-xs text-gray-900">{opt.productname}</span>
                                          <span className="block text-[11px] text-gray-500">{formatCOP(opt.productpriceofsale)}</span>
                                        </button>
                                      ))
                                    )}
                                  </div>
                                )}
                              </div>

                              <div className="flex items-end gap-1.5">
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
                                      if (errors.materiales) setErrors((prev) => ({ ...prev, materiales: undefined }));
                                    }}
                                    onBlur={() => runBlurValidation("materiales")}
                                    className="h-9 w-full rounded-md border bg-white px-2 text-xs text-center"
                                    disabled={lookupsLoading || saving || navigating}
                                  />
                                </div>

                                <div className="flex-1 min-w-0">
                                  <span className="mb-1 block text-[10px] text-gray-600">Precio</span>
                                  <div className="flex h-9 items-center justify-end rounded-md border bg-white px-2.5 text-xs font-medium text-gray-900">
                                    {formatCOP(m.precio)}
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => {
                                    removeItem<MaterialLineItem>(m.id, setMateriales);
                                    setErrors((p) => ({ ...p, materiales: undefined }));
                                  }}
                                  className="h-9 w-9 shrink-0 rounded-md border bg-white hover:bg-gray-100"
                                  disabled={lookupsLoading || saving || navigating}
                                  aria-label="Quitar producto"
                                  title="Quitar"
                                >
                                  <Image
                                    src="/icons/delete.svg"
                                    alt="Quitar producto"
                                    width={16}
                                    height={16}
                                    className="mx-auto h-4 w-4 opacity-80"
                                  />
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {showFieldError("materiales") && errors.materiales && <p className={errorText}>{errors.materiales}</p>}

                    <div className="mt-2">
                      <button
                        type="button"
                        onClick={addMaterialRow}
                        className="w-full h-9 rounded-md bg-gray-100 border hover:bg-gray-50 text-xs disabled:opacity-60"
                        disabled={!availableProducts.length || lookupsLoading || saving || navigating}
                        title={!availableProducts.length ? "Ya agregaste todos los productos disponibles." : undefined}
                      >
                        {!availableProducts.length ? "No hay mas productos disponibles" : "Anadir producto"}
                      </button>
                    </div>
                  </div>
                </section>

                <section className="rounded-xl border bg-white shadow-sm" id="field-viaticos">
                  <header className="border-b px-4 py-3 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold text-gray-800">Viaticos</div>
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
                        if (errors.viaticos) setErrors((p) => ({ ...p, viaticos: undefined }));
                      }}
                      onBlur={() => runBlurValidation("viaticos")}
                      className={`${inputBase} text-right ${showFieldError("viaticos") ? errorRing : ""}`}
                      disabled={lookupsLoading || saving || navigating}
                      aria-invalid={showFieldError("viaticos")}
                      placeholder="0"
                    />
                    {showFieldError("viaticos") && errors.viaticos && <p className={errorText}>{errors.viaticos}</p>}
                    <div className="pt-3 border-t text-sm flex justify-between">
                      <span className="text-gray-600">Total viaticos</span>
                      <span className="font-medium">{formatCOP(Number.isFinite(viaticosValue) ? viaticosValue : 0)}</span>
                    </div>
                  </div>
                </section>

                <section className="rounded-xl border bg-white shadow-sm">
                  <header className="border-b px-4 py-3 flex items-center justify-between">
                    <div className="text-sm font-semibold text-gray-800">Totales</div>
                    <div className="text-xs text-gray-500">Estimacion</div>
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
                            <li key={s.nombre} className="flex justify-between gap-2">
                              <span className="truncate">
                                {s.nombre} x {s.cantidad}
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
                                {m.nombre} x {m.cantidad}
                              </span>
                              <span>{formatCOP(m.total)}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-600">Viaticos</span>
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

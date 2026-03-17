"use client";

import { useCallback, useEffect, useState } from "react";
import type { AxiosRequestConfig } from "axios";
import { api } from "@/lib/api";

type LookupItem = Record<string, unknown>;
type LookupList = LookupItem[];
type LookupEnvelope = {
  data?: unknown;
  items?: unknown;
  results?: unknown;
  rows?: unknown;
};

type LookupsResponse = {
  customers?: unknown;
  clients?: unknown;
  technicians?: unknown;
  products?: unknown;
  services?: unknown;
  serviceTypes?: unknown;
  tiposServicio?: unknown;
  types?: unknown;
  pendingStateId?: number | null;
  pendingState?: LookupItem;
  scheduledStateId?: number | null;
  scheduledState?: LookupItem;
};

type ApiErrorShape = {
  response?: { status?: number; data?: { message?: string | string[] } };
  message?: string;
};

async function tryGet<T = unknown>(paths: string[], config?: AxiosRequestConfig) {
  let lastErr: unknown = null;
  for (const p of paths) {
    try {
      const res = await api.get<T>(p, config);
      return res;
    } catch (e: unknown) {
      lastErr = e;
    }
  }
  throw lastErr;
}

function pickErrorMessage(e: unknown) {
  const error = e as ApiErrorShape | null;
  return error?.response?.data?.message || error?.message || "Error cargando datos.";
}

function isNumericStringExpectedError(e: unknown) {
  const msg = String(pickErrorMessage(e)).toLowerCase();
  return msg.includes("numeric string is expected");
}

function normalizeKey(v: unknown) {
  return String(v ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function unwrapList(x: unknown): LookupList {
  if (Array.isArray(x)) return x;
  if (x && typeof x === "object") {
    const envelope = x as LookupEnvelope;
    if (Array.isArray(envelope.data)) return envelope.data as LookupList;
    if (Array.isArray(envelope.items)) return envelope.items as LookupList;
    if (Array.isArray(envelope.results)) return envelope.results as LookupList;
    if (Array.isArray(envelope.rows)) return envelope.rows as LookupList;
  }
  return [];
}

function findPendingStateId(statesLike: unknown) {
  const states = unwrapList(statesLike);
  const pending = states.find((s) => {
    const state = s as LookupItem;
    const name = normalizeKey(state.name ?? state.state ?? state.label ?? "");
    return name === "pendiente" || name.includes("pendiente");
  });
  const pendingState = pending as LookupItem | undefined;
  const id = pendingState?.stateid ?? pendingState?.id;
  return typeof id === "number" ? id : null;
}

function findScheduledStateId(statesLike: unknown) {
  const states = unwrapList(statesLike);
  const scheduled = states.find((s) => {
    const state = s as LookupItem;
    const name = normalizeKey(state.name ?? state.state ?? state.label ?? "");
    return name.includes("agend");
  });
  const scheduledState = scheduled as LookupItem | undefined;
  const id = scheduledState?.stateid ?? scheduledState?.id;
  return typeof id === "number" ? id : null;
}

export function useOrdersServicesLookups() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [customers, setCustomers] = useState<LookupList>([]);
  const [technicians, setTechnicians] = useState<LookupList>([]);
  const [products, setProducts] = useState<LookupList>([]);
  const [services, setServices] = useState<LookupList>([]);
  const [serviceTypes, setServiceTypes] = useState<LookupList>([]);
  const [pendingStateId, setPendingStateId] = useState<number | null>(null);
  const [scheduledStateId, setScheduledStateId] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    const fallback = async () => {
      const [cRes, tRes, pRes, sRes, typesRes] = await Promise.all([
        tryGet<unknown>(["api/customers", "/api/customers", "customers", "/customers"], {
          params: { includeRelations: true },
        }),
        tryGet<unknown>(["api/technicians", "/api/technicians", "technicians", "/technicians"]),
        tryGet<unknown>(["api/products", "/api/products", "products", "/products"]),
        tryGet<unknown>([
          "api/services",
          "/api/services",
          "services",
          "/services",
          "api/servicios",
          "/api/servicios",
          "servicios",
          "/servicios",
        ]),
        tryGet<unknown>([
          "services/types",
          "/services/types",
          "api/services/types",
          "/api/services/types",
          "api/services-types",
          "/api/services-types",
          "services-types",
          "/services-types",
          "api/service-types",
          "/api/service-types",
          "service-types",
          "/service-types",
        ]),
      ]);

      let pending: number | null = null;
      try {
        const statesRes = await tryGet<unknown>(["api/states", "/api/states", "states", "/states"]);
        pending = findPendingStateId(statesRes.data);
        setScheduledStateId(findScheduledStateId(statesRes.data));
      } catch {
        pending = null;
        setScheduledStateId(null);
      }

      setCustomers(unwrapList(cRes.data));
      setTechnicians(unwrapList(tRes.data));
      setProducts(unwrapList(pRes.data));
      setServices(unwrapList(sRes.data));
      setServiceTypes(unwrapList(typesRes.data));
      setPendingStateId(pending);
      setError(null);
    };

    try {
      const res = await tryGet<LookupsResponse>([
        "api/orders-services/lookups",
        "/api/orders-services/lookups",
        "orders-services/lookups",
        "/orders-services/lookups",
      ]);

      const data: LookupsResponse = res.data ?? {};

      const cs = data.customers ?? data.clients ?? [];
      const ts = data.technicians ?? [];
      const ps = data.products ?? [];
      const sv = data.services ?? [];
      const typesRaw = data.serviceTypes ?? data.tiposServicio ?? data.types ?? [];

      let pending: number | null = null;
      let scheduled: number | null = null;
      if (typeof data.pendingStateId === "number") pending = data.pendingStateId;
      else if (typeof data.pendingState?.stateid === "number") pending = data.pendingState.stateid;
      else if (typeof data.pendingState?.id === "number") pending = data.pendingState.id;

      if (typeof data.scheduledStateId === "number") scheduled = data.scheduledStateId;
      else if (typeof data.scheduledState?.stateid === "number") scheduled = data.scheduledState.stateid;
      else if (typeof data.scheduledState?.id === "number") scheduled = data.scheduledState.id;

      setCustomers(unwrapList(cs));
      setTechnicians(unwrapList(ts));
      setProducts(unwrapList(ps));

      const svList = unwrapList(sv);
      if (svList.length) {
        setServices(svList);
      } else {
        try {
          const sRes = await tryGet<unknown>([
            "api/services",
            "/api/services",
            "services",
            "/services",
            "api/servicios",
            "/api/servicios",
            "servicios",
            "/servicios",
          ]);
          setServices(unwrapList(sRes.data));
        } catch {
          setServices([]);
        }
      }

      const typesList = unwrapList(typesRaw);
      if (typesList.length) {
        setServiceTypes(typesList);
      } else {
        try {
          const tr = await tryGet<unknown>([
            "services/types",
            "/services/types",
            "api/services/types",
            "/api/services/types",
            "api/services-types",
            "/api/services-types",
            "services-types",
            "/services-types",
            "api/service-types",
            "/api/service-types",
            "service-types",
            "/service-types",
          ]);
          setServiceTypes(unwrapList(tr.data));
        } catch {
          setServiceTypes([]);
        }
      }

      setPendingStateId(pending ?? null);
      setScheduledStateId(scheduled ?? findScheduledStateId(data));
      setError(null);
    } catch (e: unknown) {
      const status = (e as ApiErrorShape | null)?.response?.status;
      if (status === 404 || isNumericStringExpectedError(e) || status === 400) {
        try {
          await fallback();
        } catch (e2: unknown) {
          setError(String(pickErrorMessage(e2)));
          setCustomers([]);
          setTechnicians([]);
          setProducts([]);
          setServices([]);
          setServiceTypes([]);
          setPendingStateId(null);
          setScheduledStateId(null);
        }
      } else {
        setError(String(pickErrorMessage(e)));
        setCustomers([]);
        setTechnicians([]);
        setProducts([]);
        setServices([]);
        setServiceTypes([]);
        setPendingStateId(null);
        setScheduledStateId(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    loading,
    error,
    customers,
    technicians,
    products,
    services,
    serviceTypes,
    pendingStateId,
    scheduledStateId,
    refresh,
  };
}

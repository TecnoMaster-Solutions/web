"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";

type LookupRecord = Record<string, unknown>;
type LookupEnvelope = LookupRecord & {
  data?: unknown[];
  items?: unknown[];
  rows?: unknown[];
  results?: unknown[];
};

function asList(payload: unknown): LookupRecord[] {
  if (Array.isArray(payload)) return payload;
  const source = payload as LookupEnvelope | null | undefined;
  if (Array.isArray(source?.data)) return source.data as LookupRecord[];
  if (Array.isArray(source?.items)) return source.items as LookupRecord[];
  if (Array.isArray(source?.rows)) return source.rows as LookupRecord[];
  if (Array.isArray(source?.results)) return source.results as LookupRecord[];
  return [];
}

function getMeta(payload: unknown): { page: number; totalPages: number } | null {
  const source = payload as { meta?: { page?: unknown; totalPages?: unknown } } | null | undefined;
  const page = Number(source?.meta?.page);
  const totalPages = Number(source?.meta?.totalPages);
  if (!Number.isFinite(page) || !Number.isFinite(totalPages)) return null;
  return { page, totalPages };
}

function dedupeByProductId(list: LookupRecord[]) {
  const byId = new Map<number, LookupRecord>();
  for (const item of list) {
    const id = Number(item.productid ?? item.id);
    if (!Number.isFinite(id) || id <= 0) continue;
    if (!byId.has(id)) byId.set(id, item);
  }
  return Array.from(byId.values());
}

async function fetchAllProducts(signal: AbortSignal): Promise<LookupRecord[]> {
  const limit = 200;
  const maxPages = 200;
  const all: LookupRecord[] = [];
  let page = 1;

  while (page <= maxPages) {
    const res = await api.get("/products", {
      signal,
      params: {
        page,
        limit,
        status: "all",
      },
    });
    const chunk = asList(res.data);
    all.push(...chunk);

    const meta = getMeta(res.data);
    if (meta) {
      if (meta.page >= meta.totalPages) break;
      page += 1;
      continue;
    }

    if (chunk.length < limit) break;
    page += 1;
  }

  return dedupeByProductId(all);
}

function pickErrorMessage(e: unknown) {
  const err = e as { response?: { data?: { message?: string } }; message?: string } | null;
  return err?.response?.data?.message || err?.message || "Error cargando datos.";
}

function normalizeKey(v: unknown) {
  return String(v ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function findPendingStateId(statesPayload: unknown) {
  const states = asList(statesPayload);
  const pending = states.find((s) => {
    const name = normalizeKey(s.name ?? s.state ?? s.label ?? s.statename ?? "");
    return name === "pendiente" || name.includes("pendiente");
  });
  const id = pending?.stateid ?? pending?.id;
  const n = Number(id);
  return Number.isFinite(n) ? n : null;
}

function findScheduledStateId(statesPayload: unknown) {
  const states = asList(statesPayload);
  const scheduled = states.find((s) => {
    const name = normalizeKey(s.name ?? s.state ?? s.label ?? s.statename ?? "");
    return name.includes("agend");
  });
  const id = scheduled?.stateid ?? scheduled?.id;
  const n = Number(id);
  return Number.isFinite(n) ? n : null;
}

export function useOrdersServicesLookups() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [customers, setCustomers] = useState<LookupRecord[]>([]);
  const [technicians, setTechnicians] = useState<LookupRecord[]>([]);
  const [products, setProducts] = useState<LookupRecord[]>([]);
  const [services, setServices] = useState<LookupRecord[]>([]);
  const [serviceTypes, setServiceTypes] = useState<LookupRecord[]>([]);
  const [states, setStates] = useState<LookupRecord[]>([]);
  const [pendingStateId, setPendingStateId] = useState<number | null>(null);
  const [scheduledStateId, setScheduledStateId] = useState<number | null>(null);

  const controllerRef = useRef<AbortController | null>(null);

  const refresh = useCallback(async () => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setLoading(true);
    setError(null);

    const reqs = await Promise.allSettled([
      api.get("/customers", {
        signal: controller.signal,
        params: { includeRelations: true },
      }),
      api.get("/technicians", { signal: controller.signal }),
      fetchAllProducts(controller.signal),
      api.get("/services", { signal: controller.signal }),
      api.get("/services/types", { signal: controller.signal }),
      api.get("/service-requests/states/all", { signal: controller.signal }),
    ]);

    if (controller.signal.aborted) return;

    const failed: string[] = [];

    const cRes = reqs[0];
    if (cRes.status === "fulfilled") setCustomers(asList(cRes.value.data));
    else {
      setCustomers([]);
      failed.push("clientes");
    }

    const tRes = reqs[1];
    if (tRes.status === "fulfilled") setTechnicians(asList(tRes.value.data));
    else {
      setTechnicians([]);
      failed.push("técnicos");
    }

    const pRes = reqs[2];
    if (pRes.status === "fulfilled") setProducts(pRes.value);
    else {
      setProducts([]);
      failed.push("productos");
    }

    const sRes = reqs[3];
    if (sRes.status === "fulfilled") setServices(asList(sRes.value.data));
    else {
      setServices([]);
      failed.push("servicios");
    }

    const typesRes = reqs[4];
    if (typesRes.status === "fulfilled") setServiceTypes(asList(typesRes.value.data));
    else {
      setServiceTypes([]);
      failed.push("tipos de servicio");
    }

    const statesRes = reqs[5];
    if (statesRes.status === "fulfilled") {
      setStates(asList(statesRes.value.data));
      setPendingStateId(findPendingStateId(statesRes.value.data));
      setScheduledStateId(findScheduledStateId(statesRes.value.data));
    } else {
      setStates([]);
      setPendingStateId(null);
      setScheduledStateId(null);
    }

    if (failed.length) {
      const firstErr =
        cRes.status === "rejected"
          ? cRes.reason
          : tRes.status === "rejected"
          ? tRes.reason
          : pRes.status === "rejected"
          ? pRes.reason
          : sRes.status === "rejected"
          ? sRes.reason
          : typesRes.status === "rejected"
          ? typesRes.reason
          : null;

      setError(
        `No se pudieron cargar: ${failed.join(", ")}. ${firstErr ? String(pickErrorMessage(firstErr)) : ""}`.trim()
      );
    } else {
      setError(null);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    return () => controllerRef.current?.abort();
  }, [refresh]);

  return {
    loading,
    error,
    customers,
    technicians,
    products,
    services,
    serviceTypes,
    states,
    pendingStateId,
    scheduledStateId,
    refresh,
  };
}

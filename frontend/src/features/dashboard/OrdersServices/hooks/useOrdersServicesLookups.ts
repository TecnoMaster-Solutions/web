"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";

function asList(payload: any): any[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.rows)) return payload.rows;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
}

function pickErrorMessage(e: any) {
  return e?.response?.data?.message || e?.message || "Error cargando datos.";
}

function normalizeKey(v: any) {
  return String(v ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function findPendingStateId(statesPayload: any) {
  const states = asList(statesPayload);
  const pending = states.find((s: any) => {
    const name = normalizeKey(s?.name ?? s?.state ?? s?.label ?? s?.statename ?? "");
    return name === "pendiente" || name.includes("pendiente");
  });
  const id = pending?.stateid ?? pending?.id;
  const n = Number(id);
  return Number.isFinite(n) ? n : null;
}

function findScheduledStateId(statesPayload: any) {
  const states = asList(statesPayload);
  const scheduled = states.find((s: any) => {
    const name = normalizeKey(s?.name ?? s?.state ?? s?.label ?? s?.statename ?? "");
    return name.includes("agend");
  });
  const id = scheduled?.stateid ?? scheduled?.id;
  const n = Number(id);
  return Number.isFinite(n) ? n : null;
}

export function useOrdersServicesLookups() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [customers, setCustomers] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [serviceTypes, setServiceTypes] = useState<any[]>([]);
  const [states, setStates] = useState<any[]>([]);
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
      api.get("/products", { signal: controller.signal }),
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
    if (pRes.status === "fulfilled") setProducts(asList(pRes.value.data));
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

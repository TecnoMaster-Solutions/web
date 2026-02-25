import { useQuery } from "@tanstack/react-query";
import { listStates  } from "../services/servicerequests.service";

function normalizeKey(v: any) {
  return String(v ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function findStateId(states: any[] | undefined, matcher: (name: string) => boolean) {
  const found = (states ?? []).find((s) => matcher(normalizeKey(s?.name)));
  const n = Number(found?.stateid);
  return Number.isFinite(n) ? n : null;
}

export function useRequestStates() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["request-states"],
    queryFn: listStates,
    staleTime: 5 * 60 * 1000,
  });
  const stateOptions = (data ?? []).map(s => ({ id: String(s.stateid), label: s.name }));
  const pendingStateId = findStateId(data, (name) => name === "pendiente" || name.includes("pendiente"));
  const scheduledStateId = findStateId(data, (name) => name.includes("agend"));

  return { data, isLoading, error, stateOptions, pendingStateId, scheduledStateId };
}

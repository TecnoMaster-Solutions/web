import { useQuery } from "@tanstack/react-query";
import { listStates  } from "../services/servicerequests.service";
import { isServiceRequestStateLike } from "../../shared/stateFilters";

type RequestState = {
  stateid?: number;
  name?: string;
};

function normalizeKey(v: unknown) {
  return String(v ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function findStateId(
  states: RequestState[] | undefined,
  matcher: (name: string) => boolean,
) {
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
  const filteredStates = (data ?? []).filter((s) => isServiceRequestStateLike(s?.name));
  const stateOptions = filteredStates.map(s => ({ id: String(s.stateid), label: s.name }));
  const pendingStateId = findStateId(filteredStates, (name) => name === "pendiente" || name.includes("pendiente"));
  const scheduledStateId = findStateId(filteredStates, (name) => name.includes("agend"));

  return { data, isLoading, error, stateOptions, pendingStateId, scheduledStateId };
}

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  fetchAllAppointmentSources,
  fetchAppointmentSources,
} from "../connection/appointmentsApi";

const getMonthKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

export const useAppointmentsQuery = (currentDate: Date, searchTerm?: string) =>
  useQuery({
    // Cuando hay término, hacemos búsqueda global (sin limitar por mes).
    // Cuando está vacío, mantenemos consulta mensual.
    queryKey: [
      "appointments",
      "orders-services-requests",
      (searchTerm ?? "").trim() ? "global-search" : getMonthKey(currentDate),
      (searchTerm ?? "").trim().toLowerCase(),
    ],
    queryFn: ({ signal }) => fetchAppointmentSources(currentDate, searchTerm, { signal }),
    placeholderData: keepPreviousData,
  });

export const useAppointmentsUpcomingTotalQuery = () =>
  useQuery({
    queryKey: ["appointments", "orders-services-requests", "upcoming-total"],
    queryFn: ({ signal }) => fetchAllAppointmentSources(undefined, { signal }),
    staleTime: 60000,
  });

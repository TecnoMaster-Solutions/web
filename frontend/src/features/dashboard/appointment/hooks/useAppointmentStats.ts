"use client";

import { useMemo } from "react";
import type { AppointmentEvent } from "../types/typeAppointment";
import { getEventTechnicians } from "../helpers/appointment.helpers";

export type AppointmentStat = {
  label: string;
  value: number;
  helper?: string;
};

type UseAppointmentStatsArgs = {
  events: AppointmentEvent[];
  filteredEvents: AppointmentEvent[];
  tokenRoleNormalized: string | null;
  hasActiveFilters: boolean;
  upcomingCountOverride?: number;
};

export const useAppointmentStats = ({
  events,
  filteredEvents,
  tokenRoleNormalized,
  hasActiveFilters,
  upcomingCountOverride,
}: UseAppointmentStatsArgs) =>
  useMemo(() => {
    const isClient = tokenRoleNormalized === "cliente";
    const isTechnician = tokenRoleNormalized === "tecnico";

    const statsSource = isClient || isTechnician ? filteredEvents : events;

    const visibleHelper = isClient
      ? hasActiveFilters
        ? "Filtradas segun los filtros"
        : "Eventos del cliente"
      : isTechnician
      ? hasActiveFilters
        ? "Filtradas segun los filtros"
        : "Eventos del tecnico"
      : hasActiveFilters
      ? "Filtradas segun los filtros"
      : "Eventos sincronizados";

    const technicianIds = new Set(
      statsSource.flatMap((event) =>
        getEventTechnicians(event)
          .map((tech) => Number(tech?.technicianid ?? tech?.technicianId))
          .filter((id) => Number.isFinite(id) && id > 0)
      )
    );

    const now = Date.now();
    const defaultUpcomingCount = statsSource.filter(
      (event) => event.start.getTime() >= now
    ).length;
    const upcomingCount =
      typeof upcomingCountOverride === "number"
        ? upcomingCountOverride
        : defaultUpcomingCount;

    return [
      {
        label: "Citas visibles",
        value: statsSource.length,
        helper: visibleHelper,
      },
      {
        label: "Citas proximas",
        value: upcomingCount,
        helper: "Ordenadas por fecha",
      },
      {
        label: "Tecnicos en agenda",
        value: technicianIds.size,
        helper: "Asignaciones unicas",
      },
    ];
  }, [events, filteredEvents, hasActiveFilters, tokenRoleNormalized, upcomingCountOverride]);

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
  tokenRole: string | null;
  tokenRoleNormalized: string | null;
  hasActiveFilters: boolean;
};

export const useAppointmentStats = ({
  events,
  filteredEvents,
  tokenRole,
  tokenRoleNormalized,
  hasActiveFilters,
}: UseAppointmentStatsArgs) =>
  useMemo(() => {
    const isClient = tokenRoleNormalized === "cliente";
    const isTechnician = tokenRoleNormalized === "tecnico";

    const statsSource = isClient || isTechnician ? filteredEvents : events;

    const visibleHelper = isClient
      ? hasActiveFilters
        ? "Filtradas según los filtros"
        : "Eventos del cliente"
      : isTechnician
      ? hasActiveFilters
        ? "Filtradas según los filtros"
        : "Eventos del técnico"
      : hasActiveFilters
      ? "Filtradas según los filtros"
      : "Eventos sincronizados";

    const technicianIds = new Set(
      statsSource.flatMap((event) =>
        getEventTechnicians(event)
          .map((tech) => Number(tech?.technicianid ?? tech?.technicianId))
          .filter((id) => Number.isFinite(id) && id > 0)
      )
    );

    return [
      {
        label: "Citas visibles",
        value: statsSource.length,
        helper: visibleHelper,
      },
      {
        label: "Citas próximas",
        value: statsSource.filter((event) => event.start.getTime() >= Date.now()).length,
        helper: "Ordenadas por fecha",
      },
      {
        label: "Técnicos en agenda",
        value: technicianIds.size,
        helper: "Asignaciones únicas",
      },
    ];
  }, [events, filteredEvents, hasActiveFilters, tokenRoleNormalized]);

"use client";

import { useCallback, useMemo, useState } from "react";
import type { AppointmentEvent } from "../types/typeAppointment";
import type { ServiceTypeFilterKey } from "../helpers/appointment.helpers";
import {
  getEventCustomerIds,
  getEventServiceTypeKey,
  getEventTechnicianUserIds,
  getEventTechnicians,
} from "../helpers/appointment.helpers";
import { normalizeStateKey } from "../helpers/appointmentState.helpers";
import { STATE_LEGEND_ITEMS } from "../types/calendar.constants";

export type AppointmentFilterOption = {
  value: string;
  label: string;
};

type UseAppointmentFiltersArgs = {
  events: AppointmentEvent[];
  clientProfileId: number | null;
  technicianProfileUserId: number | null;
};

type SourceFilter = "all" | "order" | "request";

export const useAppointmentFilters = ({
  events,
  clientProfileId,
  technicianProfileUserId,
}: UseAppointmentFiltersArgs) => {
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const [stateFilter, setStateFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [serviceTypeFilter, setServiceTypeFilter] = useState<ServiceTypeFilterKey | "all">("all");
  const [technicianFilter, setTechnicianFilter] = useState<"all" | string>("all");
  const [clientFilter, setClientFilter] = useState<"all" | string>("all");

  const stateOptions = useMemo<AppointmentFilterOption[]>(() => {
    const entries = new Map<string, string>();
    events.forEach((event) => {
      const label = (event.stateLabel ?? "").trim();
      if (!label) return;
      const key = normalizeStateKey(label);
      if (!key) return;
      if (!entries.has(key)) entries.set(key, label);
    });

    STATE_LEGEND_ITEMS.forEach((item) => {
      const key = normalizeStateKey(item.label);
      if (!key) return;
      if (!entries.has(key)) entries.set(key, item.label);
    });

    return Array.from(entries.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [events]);

  const technicianOptions = useMemo<AppointmentFilterOption[]>(() => {
    const entries = new Map<number, string>();
    events.forEach((event) => {
      getEventTechnicians(event).forEach((tech) => {
        const techId = Number(tech?.technicianid ?? tech?.technicianId);
        if (!Number.isFinite(techId) || techId <= 0) return;
        if (entries.has(techId)) return;

        const parts = [tech.users?.name, tech.users?.lastname].filter(Boolean);
        const name = parts.length ? parts.join(" ").trim() : null;
        entries.set(techId, name ? `${name} (${techId})` : `Técnico #${techId}`);
      });
    });

    return Array.from(entries.entries()).map(([value, label]) => ({ value, label }));
  }, [events]);

  const clientOptions = useMemo<AppointmentFilterOption[]>(() => {
    const entries = new Map<string, string>();
    events.forEach((event) => {
      const label = event.clientLabel?.trim();
      if (!label) return;
      if (!entries.has(label)) entries.set(label, label);
    });

    return Array.from(entries.entries()).map(([value, label]) => ({ value, label }));
  }, [events]);

  const filteredEvents = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const techFilterId = technicianFilter === "all" ? null : Number(technicianFilter);

    return events.filter((event) => {
      if (clientProfileId != null) {
        const eventCustomerIds = getEventCustomerIds(event);
        if (!eventCustomerIds.includes(clientProfileId)) return false;
      }

      if (technicianProfileUserId != null) {
        const techIds = getEventTechnicianUserIds(event);
        if (!techIds.includes(technicianProfileUserId)) return false;
      }

      if (sourceFilter !== "all" && event.source !== sourceFilter) return false;

      if (stateFilter !== "all" && normalizeStateKey(event.stateLabel) !== stateFilter) {
        return false;
      }

      if (serviceTypeFilter !== "all") {
        const serviceKey = getEventServiceTypeKey(event);
        if (serviceKey !== serviceTypeFilter) return false;
      }

      if (clientFilter !== "all") {
        const label = event.clientLabel?.trim();
        if (!label || label !== clientFilter) return false;
      }

      if (techFilterId !== null && !Number.isNaN(techFilterId)) {
        const eventTechIds = new Set<number>();
        getEventTechnicians(event).forEach((tech) => {
          const id = Number(tech?.technicianid ?? tech?.technicianId);
          if (Number.isFinite(id) && id > 0) eventTechIds.add(id);
        });
        if (!eventTechIds.has(techFilterId)) return false;
      }

      if (!term) return true;

      const haystack = `${event.title} ${event.clientLabel} ${event.stateLabel}`.toLowerCase();
      return haystack.includes(term);
    });
  }, [
    events,
    searchTerm,
    sourceFilter,
    stateFilter,
    serviceTypeFilter,
    technicianFilter,
    clientFilter,
    clientProfileId,
    technicianProfileUserId,
  ]);

  const filteredCount = filteredEvents.length;

  const hasActiveFilters =
    sourceFilter !== "all" ||
    stateFilter !== "all" ||
    serviceTypeFilter !== "all" ||
    technicianFilter !== "all" ||
    clientFilter !== "all" ||
    searchTerm.trim().length > 0;

  const clearFilters = useCallback(() => {
    setSourceFilter("all");
    setStateFilter("all");
    setSearchTerm("");
    setServiceTypeFilter("all");
    setTechnicianFilter("all");
    setClientFilter("all");
  }, []);

  return {
    filteredEvents,
    filteredCount,
    hasActiveFilters,
    stateOptions,
    technicianOptions,
    clientOptions,
    filters: {
      sourceFilter,
      stateFilter,
      searchTerm,
      serviceTypeFilter,
      technicianFilter,
      clientFilter,
    },
    handlers: {
      setSourceFilter,
      setStateFilter,
      setSearchTerm,
      setServiceTypeFilter,
      setTechnicianFilter,
      setClientFilter,
    },
    clearFilters,
  };
};

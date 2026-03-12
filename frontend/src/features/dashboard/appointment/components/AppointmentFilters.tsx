"use client";

import { SERVICE_TYPE_FILTERS } from "../types/calendar.constants";
import type { AppointmentFilterOption } from "../hooks/useAppointmentFilters";
import type { AppointmentEvent } from "../types/typeAppointment";

export type AppointmentFiltersProps = {
  eventsLength: number;
  filteredCount: number;
  hasActiveFilters: boolean;
  showClientFilter: boolean;
  stateOptions: AppointmentFilterOption[];
  technicianOptions: AppointmentFilterOption[];
  clientOptions: AppointmentFilterOption[];
  sourceFilter: string;
  stateFilter: string;
  searchTerm: string;
  serviceTypeFilter: string;
  technicianFilter: string;
  clientFilter: string;
  searchMatches: AppointmentEvent[];
  selectedEventKey: string | null;
  onSourceChange: (value: string) => void;
  onStateChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  onServiceTypeChange: (value: string) => void;
  onTechnicianChange: (value: string) => void;
  onClientChange: (value: string) => void;
  onSelectSearchMatch: (event: AppointmentEvent) => void;
  onClearFilters: () => void;
};

const baseSelectClass =
  "w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-black focus:bg-white focus:outline-none";
const searchDateFormatter = new Intl.DateTimeFormat("es-CO", {
  dateStyle: "short",
  timeStyle: "short",
});

const AppointmentFilters = ({
  eventsLength,
  filteredCount,
  hasActiveFilters,
  showClientFilter,
  clientOptions,
  technicianOptions,
  stateOptions,
  sourceFilter,
  stateFilter,
  searchTerm,
  serviceTypeFilter,
  technicianFilter,
  clientFilter,
  searchMatches,
  selectedEventKey,
  onSourceChange,
  onStateChange,
  onSearchChange,
  onServiceTypeChange,
  onTechnicianChange,
  onClientChange,
  onSelectSearchMatch,
  onClearFilters,
}: AppointmentFiltersProps) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-semibold text-slate-900">Filtros de citas</p>
        <p className="text-xs text-slate-500">
          Mostrando {filteredCount} de {eventsLength} citas.
        </p>
      </div>
      {hasActiveFilters && (
        <button
          type="button"
          onClick={onClearFilters}
          className="text-xs font-semibold uppercase tracking-wide text-slate-500 hover:text-slate-700"
        >
          Limpiar filtros
        </button>
      )}
    </div>

    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <label className="space-y-1 text-xs font-semibold text-slate-500">
        Tipo de evento
        <select value={sourceFilter} onChange={(e) => onSourceChange(e.target.value)} className={baseSelectClass}>
          <option value="all">Todas las citas</option>
          <option value="order">Órdenes de servicio</option>
          <option value="request">Solicitudes de servicio</option>
        </select>
      </label>
      <label className="space-y-1 text-xs font-semibold text-slate-500">
        Estado
        <select value={stateFilter} onChange={(e) => onStateChange(e.target.value)} className={baseSelectClass}>
          <option value="all">Todos los estados</option>
          {stateOptions.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </label>
      <label className="space-y-1 text-xs font-semibold text-slate-500">
        Buscar
        <input
          type="search"
          placeholder="Cliente, código o estado"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-black focus:bg-white focus:outline-none"
        />
      </label>
    </div>

    {searchTerm.trim().length > 0 && searchMatches.length > 1 && (
      <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-2">
        <div className="px-2 pb-2 text-xs font-semibold text-slate-500">
          Coincidencias: {searchMatches.length}
        </div>
        <div className="max-h-56 space-y-1 overflow-auto">
          {searchMatches.map((event) => {
            const eventKey = `${event.source}-${event.id}`;
            const sourceLabel = event.source === "order" ? "Orden" : "Solicitud";
            const active = selectedEventKey === eventKey;
            return (
              <button
                key={eventKey}
                type="button"
                onClick={() => onSelectSearchMatch(event)}
                className={`w-full rounded-md border px-3 py-2 text-left transition ${
                  active
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                }`}
              >
                <p className={`truncate text-xs font-semibold ${active ? "text-white" : "text-slate-900"}`}>
                  {event.title}
                </p>
                <p className={`truncate text-[11px] ${active ? "text-slate-200" : "text-slate-500"}`}>
                  {sourceLabel} #{event.id} - {searchDateFormatter.format(event.start)} - {event.stateLabel}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    )}

    <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <label className="space-y-1 text-xs font-semibold text-slate-500">
        Tipo de servicio
        <select
          value={serviceTypeFilter}
          onChange={(e) => onServiceTypeChange(e.target.value)}
          className={baseSelectClass}
        >
          <option value="all">Todos los tipos</option>
          {SERVICE_TYPE_FILTERS.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </label>

      <label className="space-y-1 text-xs font-semibold text-slate-500">
        Técnico asignado
        <select
          value={technicianFilter}
          onChange={(e) => onTechnicianChange(e.target.value)}
          className={baseSelectClass}
        >
          <option value="all">Todos los técnicos</option>
          {technicianOptions.map((item) => (
            <option key={item.value} value={String(item.value)}>
              {item.label}
            </option>
          ))}
        </select>
      </label>

      {showClientFilter && (
        <label className="space-y-1 text-xs font-semibold text-slate-500">
          Cliente
          <select value={clientFilter} onChange={(e) => onClientChange(e.target.value)} className={baseSelectClass}>
            <option value="all">Todos los clientes</option>
            {clientOptions.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  </div>
);

export default AppointmentFilters;
